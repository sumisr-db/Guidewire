"""Service for Delta Lake table inspection using notebook execution."""

import json
import logging
import time
from typing import Any, Dict, List

import boto3
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.compute import Language

from server.models.delta import (
  DeltaColumn,
  DeltaHistoryEntry,
  DeltaListTablesRequest,
  DeltaTableHistory,
  DeltaTableInfo,
  DeltaTablePreview,
  DeltaTableSchema,
)

logger = logging.getLogger(__name__)


class DeltaService:
  """Service for inspecting Delta Lake tables using notebook execution."""

  def __init__(self):
    """Initialize Delta service with Databricks connection."""
    self.workspace_client = None
    # Use the cluster that the app service principal has access to
    # This cluster was configured with CAN_RESTART permission for the service principal
    self.cluster_id = '0919-145701-wdep1oev'  # Oliver Koernig's Cluster (shared, not single-user)

  def _get_workspace_client(self) -> WorkspaceClient:
    """Get or create Databricks workspace client."""
    if not self.workspace_client:
      self.workspace_client = WorkspaceClient()
    return self.workspace_client

  def _get_cluster_id(self) -> str:
    """Get the configured cluster ID, ensuring it's running.

    The cluster is pre-configured in __init__ with proper permissions
    for the app service principal.
    """
    if not self.cluster_id:
      raise ValueError('Cluster ID not configured')

    w = self._get_workspace_client()

    # Check cluster state and start if needed
    try:
      cluster_info = w.clusters.get(self.cluster_id)

      if cluster_info.state and cluster_info.state.value == 'RUNNING':
        logger.info(f'Using running cluster: {self.cluster_id}')
        return self.cluster_id

      # Start the cluster if it's not running
      logger.info(f'Starting cluster: {self.cluster_id}')
      w.clusters.start(self.cluster_id)

      # Wait for cluster to start (with timeout)
      for _ in range(60):  # Wait up to 5 minutes
        cluster_info = w.clusters.get(self.cluster_id)
        if cluster_info.state and cluster_info.state.value == 'RUNNING':
          logger.info(f'Cluster {self.cluster_id} is now running')
          return self.cluster_id
        time.sleep(5)

      raise ValueError(f'Cluster {self.cluster_id} failed to start within timeout')

    except Exception as e:
      logger.error(f'Failed to access cluster {self.cluster_id}: {e}')
      raise ValueError(
        f'Cannot access cluster {self.cluster_id}. Ensure the app service principal has CAN_RESTART permission.'
      )

    return self.cluster_id

  def _create_s3_client(self, request: DeltaListTablesRequest):
    """Create boto3 S3 client from credentials."""
    return boto3.client(
      's3',
      aws_access_key_id=request.access_key_id,
      aws_secret_access_key=request.secret_access_key,
      region_name=request.region,
    )

  def _execute_sql(
    self, query: str, s3_credentials: DeltaListTablesRequest
  ) -> List[Dict[str, Any]]:
    """Execute SQL query using notebook command execution on a cluster.

    Args:
        query: SQL query to execute
        s3_credentials: S3 credentials to configure in the notebook

    Returns:
        List of rows as dictionaries
    """
    w = self._get_workspace_client()
    cluster_id = self._get_cluster_id()

    # Create Python code that configures S3 and executes the SQL
    python_code = f"""
# Configure S3 credentials
spark.sparkContext._jsc.hadoopConfiguration().set("fs.s3a.access.key", "{s3_credentials.access_key_id}")
spark.sparkContext._jsc.hadoopConfiguration().set("fs.s3a.secret.key", "{s3_credentials.secret_access_key}")
spark.sparkContext._jsc.hadoopConfiguration().set("fs.s3a.endpoint.region", "{s3_credentials.region}")

# Execute SQL query
df = spark.sql(\"\"\"
{query}
\"\"\")

# Convert to JSON for easy parsing
import json
result = df.toJSON().collect()
print("__RESULT_START__")
print(json.dumps([json.loads(row) for row in result]))
print("__RESULT_END__")
"""

    logger.info(f'Executing SQL query on cluster {cluster_id}')

    # Create execution context
    context_response = w.command_execution.create(
      cluster_id=cluster_id, language=Language.PYTHON
    ).result()
    logger.info(f'Created execution context: {context_response.id}')

    # Execute the command and wait for completion
    result = w.command_execution.execute(
      cluster_id=cluster_id,
      context_id=context_response.id,
      language=Language.PYTHON,
      command=python_code,
    ).result()

    # Check if execution was successful
    if result.status and result.status.value == 'Finished' and result.results:
      # Extract JSON result from output
      output = result.results.data
      if '__RESULT_START__' in output and '__RESULT_END__' in output:
        json_str = output.split('__RESULT_START__')[1].split('__RESULT_END__')[0].strip()
        return json.loads(json_str)
      else:
        logger.error(f'Unexpected output format: {output}')
        return []
    elif result.status and result.status.value == 'Error':
      error_msg = result.results.cause if result.results else 'Unknown error'
      logger.error(f'SQL execution failed: {error_msg}')
      raise Exception(f'SQL execution failed: {error_msg}')
    else:
      raise Exception(
        f'SQL execution failed with status: {result.status.value if result.status else "UNKNOWN"}'
      )

  def list_tables(self, request: DeltaListTablesRequest) -> List[DeltaTableInfo]:
    """List Delta tables in S3 location.

    Args:
        request: Request with S3 credentials and location

    Returns:
        List of DeltaTableInfo objects
    """
    try:
      s3_client = self._create_s3_client(request)

      # List all directories in the prefix (each is a potential Delta table)
      prefix = request.s3_prefix
      if not prefix.endswith('/'):
        prefix += '/'

      paginator = s3_client.get_paginator('list_objects_v2')
      pages = paginator.paginate(Bucket=request.s3_bucket, Prefix=prefix, Delimiter='/')

      tables = []
      for page in pages:
        for common_prefix in page.get('CommonPrefixes', []):
          table_path = common_prefix['Prefix']
          table_name = table_path.rstrip('/').split('/')[-1]

          # Check if this is a Delta table by looking for _delta_log files
          try:
            delta_log_check = s3_client.list_objects_v2(
              Bucket=request.s3_bucket, Prefix=f'{table_path}_delta_log/', MaxKeys=1
            )
            if not delta_log_check.get('Contents'):
              # Not a Delta table, skip
              continue
            # Get table size and file count from Delta transaction log
            table_size = 0
            file_count = 0
            last_modified = None

            # Read the latest transaction log file to get data file stats
            try:
              # Get the latest delta log file (starts with highest number)
              delta_logs = s3_client.list_objects_v2(
                Bucket=request.s3_bucket, Prefix=f'{table_path}_delta_log/', MaxKeys=1000
              )

              # Find the latest checkpoint or transaction log
              latest_log = None
              for log_obj in sorted(
                delta_logs.get('Contents', []), key=lambda x: x['Key'], reverse=True
              ):
                if log_obj['Key'].endswith('.json'):
                  latest_log = log_obj
                  break

              if latest_log:
                last_modified = latest_log.get('LastModified')

                # Read the transaction log to count data files
                log_response = s3_client.get_object(Bucket=request.s3_bucket, Key=latest_log['Key'])
                log_content = log_response['Body'].read().decode('utf-8')

                # Parse newline-delimited JSON
                for line in log_content.strip().split('\n'):
                  try:
                    action = json.loads(line)
                    if 'add' in action:
                      file_count += 1
                      table_size += action['add'].get('size', 0)
                  except Exception:
                    continue
            except Exception as e:
              logger.warning(f'Failed to read Delta log for {table_name}: {e}')

            tables.append(
              DeltaTableInfo(
                name=table_name,
                path=f's3://{request.s3_bucket}/{table_path}',
                size_bytes=table_size,
                num_files=file_count,
                last_modified=last_modified,
              )
            )
            logger.info(f'Found Delta table: {table_name}')
          except Exception:
            # Not a Delta table, skip
            continue

      logger.info(f'Found {len(tables)} Delta tables in {prefix}')
      return tables

    except Exception as e:
      logger.error(f'Failed to list Delta tables: {e}', exc_info=True)
      raise

  def get_table_schema(self, table_path: str, request: DeltaListTablesRequest) -> DeltaTableSchema:
    """Get schema for a Delta table.

    Args:
        table_path: S3 path to Delta table
        request: S3 credentials

    Returns:
        DeltaTableSchema object
    """
    try:
      # Get table schema using DESCRIBE
      query = f'DESCRIBE EXTENDED delta.`{table_path}`'
      results = self._execute_sql(query, request)

      columns = []
      partition_columns = []
      in_partition_info = False

      for row in results:
        col_name = row.get('col_name', '').strip()

        # Skip empty rows and section headers
        if not col_name or col_name.startswith('#'):
          if 'Partition Information' in str(row):
            in_partition_info = True
          continue

        # Stop at detailed table information
        if col_name in [
          'Detailed Table Information',
          'Table Properties',
          'Location',
        ]:
          break

        # Parse column info
        if not in_partition_info:
          columns.append(
            DeltaColumn(
              name=col_name,
              type=row.get('data_type', 'unknown'),
              nullable=True,  # Delta doesn't expose nullable in DESCRIBE
            )
          )
        else:
          partition_columns.append(col_name)

      table_name = table_path.split('/')[-1]
      logger.info(f'Got schema for table {table_name}: {len(columns)} columns')

      return DeltaTableSchema(
        table_name=table_name, columns=columns, partition_columns=partition_columns
      )

    except Exception as e:
      logger.error(f'Failed to get table schema: {e}', exc_info=True)
      raise

  def get_table_history(
    self, table_path: str, request: DeltaListTablesRequest
  ) -> DeltaTableHistory:
    """Get version history for a Delta table.

    Args:
        table_path: S3 path to Delta table
        request: S3 credentials

    Returns:
        DeltaTableHistory object
    """
    try:
      # Get table history
      query = f'DESCRIBE HISTORY delta.`{table_path}`'
      results = self._execute_sql(query, request)

      entries = []
      current_version = 0

      for row in results:
        version = row.get('version', 0)
        if version > current_version:
          current_version = version

        # Parse operation parameters (stored as JSON string)
        op_params = row.get('operationParameters')
        if op_params and isinstance(op_params, str):
          try:
            op_params = json.loads(op_params)
          except Exception:
            op_params = None

        entries.append(
          DeltaHistoryEntry(
            version=version,
            timestamp=row.get('timestamp'),
            operation=row.get('operation', 'UNKNOWN'),
            operation_parameters=op_params,
            user_identity=row.get('userIdentity'),
            notebook_id=row.get('notebookId'),
            cluster_id=row.get('clusterId'),
            read_version=row.get('readVersion'),
            isolation_level=row.get('isolationLevel'),
            is_blind_append=row.get('isBlindAppend'),
          )
        )

      table_name = table_path.split('/')[-1]
      logger.info(f'Got history for table {table_name}: {len(entries)} versions')

      return DeltaTableHistory(
        table_name=table_name, current_version=current_version, entries=entries
      )

    except Exception as e:
      logger.error(f'Failed to get table history: {e}', exc_info=True)
      raise

  def get_table_preview(
    self, table_path: str, request: DeltaListTablesRequest, limit: int = 100
  ) -> DeltaTablePreview:
    """Get preview data from a Delta table.

    Args:
        table_path: S3 path to Delta table
        request: S3 credentials
        limit: Number of rows to return (default: 100)

    Returns:
        DeltaTablePreview object
    """
    try:
      # Get sample data
      query = f'SELECT * FROM delta.`{table_path}` LIMIT {limit}'
      rows = self._execute_sql(query, request)

      columns = list(rows[0].keys()) if rows else []
      table_name = table_path.split('/')[-1]

      logger.info(f'Got preview for table {table_name}: {len(rows)} rows')

      return DeltaTablePreview(table_name=table_name, columns=columns, rows=rows, limit=limit)

    except Exception as e:
      logger.error(f'Failed to get table preview: {e}', exc_info=True)
      raise


# Global service instance
delta_service = DeltaService()
