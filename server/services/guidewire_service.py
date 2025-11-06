"""Service for running Guidewire CDA to Delta Lake processing with Ray."""

import logging
import os
import time
import uuid
from datetime import datetime
from threading import Lock, Thread
from typing import Dict, Optional

from server.models.guidewire import (
  GuidewireConfig,
  ProcessingJobStatus,
  ProcessingResult,
  StartJobResponse,
)
from server.services.s3_client_factory import S3ClientFactory

logger = logging.getLogger(__name__)


class GuidewireService:
  """Service for managing Guidewire CDA processing jobs with Ray parallel mode."""

  def __init__(self):
    """Initialize the Guidewire service."""
    self.jobs: Dict[str, ProcessingJobStatus] = {}
    self._job_threads: Dict[str, Thread] = {}
    self._job_locks: Dict[str, Lock] = {}
    self._processors: Dict[str, any] = {}

  def _setup_environment(self, config: GuidewireConfig) -> Dict[str, str]:
    """Set up environment variables for Guidewire processing.

    Returns:
        dict: Original environment values for cleanup
    """
    original_env = {}
    s3_config = config.s3_config

    # Get manifest location without s3:// prefix (PyArrow requires bucket/key format)
    manifest_location = s3_config.manifest_location
    if manifest_location.startswith('s3://'):
      manifest_location = manifest_location[5:]  # Remove 's3://' prefix

    # Strip trailing slash from target_prefix to avoid double slashes
    # The Guidewire processor adds its own slash when constructing paths
    target_prefix = s3_config.target_prefix.rstrip('/')

    env_vars = {
      'AWS_ACCESS_KEY_ID': s3_config.access_key_id,
      'AWS_SECRET_ACCESS_KEY': s3_config.secret_access_key,
      'AWS_REGION': s3_config.region,
      'RAY_DEDUP_LOGS': config.ray_dedup_logs,
      # Required Guidewire processor environment variables (PyArrow format: bucket/key)
      'AWS_MANIFEST_LOCATION': manifest_location,
      'AWS_TARGET_S3_BUCKET': s3_config.target_bucket,
      'AWS_TARGET_S3_PREFIX': target_prefix,
    }

    # Add MinIO-specific environment variables
    if s3_config.is_local:
      env_vars['AWS_ENDPOINT_URL'] = s3_config.endpoint_url
      # Disable SSL verification for local MinIO
      if not s3_config.use_ssl:
        env_vars['AWS_USE_SSL'] = 'false'
      if not s3_config.verify_ssl:
        env_vars['AWS_VERIFY_SSL'] = 'false'

    # Set environment variables
    for key, value in env_vars.items():
      original_env[key] = os.environ.get(key)
      os.environ[key] = str(value)

    logger.info(
      f'Environment configured for S3 provider: {s3_config.provider.value}, '
      f'Manifest: {s3_config.manifest_location}, Target: {s3_config.target_location}'
    )

    # Debug: Log actual environment variables set
    logger.info(f'AWS_TARGET_S3_BUCKET={os.environ.get("AWS_TARGET_S3_BUCKET")}')
    logger.info(f'AWS_TARGET_S3_PREFIX={os.environ.get("AWS_TARGET_S3_PREFIX")}')
    logger.info(f'AWS_MANIFEST_LOCATION={os.environ.get("AWS_MANIFEST_LOCATION")}')

    return original_env

  def _restore_environment(self, original_env: Dict[str, Optional[str]]) -> None:
    """Restore original environment variables."""
    for key, value in original_env.items():
      if value is None:
        os.environ.pop(key, None)
      else:
        os.environ[key] = value

  def _update_progress_from_processor(self, job_id: str, processor: any) -> None:
    """Update job progress by polling processor results in real-time."""
    job_status = self.jobs.get(job_id)
    if not job_status:
      return

    lock = self._job_locks.get(job_id)
    if not lock:
      return

    try:
      with lock:
        # Process current results
        results = []
        tables_processed = 0
        tables_failed = 0
        failed_tables = []

        for result in processor.results:
          if result is None:
            continue

          # Convert Result dataclass to ProcessingResult Pydantic model
          processing_result = ProcessingResult(
            table=result.table,
            process_start_time=result.process_start_time,
            process_finish_time=result.process_finish_time,
            process_start_watermark=result.process_start_watermark,
            process_finish_watermark=result.process_finish_watermark,
            process_start_version=result.process_start_version,
            process_finish_version=result.process_finish_version,
            manifest_records=result.manifest_records,
            manifest_watermark=result.manifest_watermark,
            watermarks=result.watermarks or [],
            schema_timestamps=result.schema_timestamps or [],
            errors=result.errors,
            warnings=result.warnings,
          )
          results.append(processing_result)

          # Derive status from result data
          if result.errors and len(result.errors) > 0:
            tables_failed += 1
            failed_tables.append(result.table)
            # Log detailed error information for failed tables
            logger.error(
              f'Job {job_id}: Table {result.table} FAILED with errors:\n' + '\n'.join(result.errors)
            )
          elif result.process_finish_time:
            tables_processed += 1

        # Update job status with detailed progress message
        job_status.results = results
        job_status.tables_processed = tables_processed
        job_status.tables_failed = tables_failed

        # Create detailed progress message
        progress_msg = f'Processing: {tables_processed}/{job_status.total_tables} completed'
        if tables_failed > 0:
          progress_msg += f', {tables_failed} failed ({", ".join(failed_tables[:3])}{"..." if len(failed_tables) > 3 else ""})'
        job_status.current_message = progress_msg

    except Exception as e:
      logger.error(f'Job {job_id}: Error updating progress: {e}', exc_info=True)

  def _run_processor_sync(self, job_id: str, config: GuidewireConfig) -> None:
    """Run the Guidewire processor synchronously in a background thread.

    This method runs in a separate thread to avoid blocking the API.
    """
    original_env = {}
    try:
      # Get the job status
      job_status = self.jobs.get(job_id)
      if not job_status:
        logger.error(f'Job {job_id} not found in jobs dict')
        return

      # Set up environment
      original_env = self._setup_environment(config)

      # Update job status to running
      job_status.status = 'running'
      job_status.current_message = 'Initializing Guidewire Processor...'
      logger.info(f'Job {job_id}: Starting Guidewire Processor with Ray parallel mode')

      # Import and create processor
      from guidewire import Processor

      job_status.current_message = 'Loading configuration and preparing Ray...'

      # Create processor with Ray parallel mode
      processor = Processor(
        target_cloud='aws',
        table_names=tuple(config.table_names) if config.table_names else None,
        parallel=config.parallel,  # Ray parallel processing
        exceptions=config.exceptions,
        show_progress=config.show_progress,
        largest_tables_first_count=config.largest_tables_first_count,
      )

      # Get total tables count
      job_status.total_tables = len(processor.table_names)
      job_status.current_message = (
        f'Loading manifest from S3 for {job_status.total_tables} tables...'
      )
      logger.info(f'Job {job_id}: Processing {job_status.total_tables} tables')

      # Store processor and create lock for thread-safe access
      self._processors[job_id] = processor
      self._job_locks[job_id] = Lock()

      # Start a monitoring thread to poll results
      def monitor_progress():
        """Monitor processor progress in a separate thread."""
        while job_status.status == 'running':
          try:
            self._update_progress_from_processor(job_id, processor)
            time.sleep(2)  # Poll every 2 seconds
          except Exception as e:
            logger.error(f'Job {job_id}: Error in progress monitoring: {e}')
            break

      monitor_thread = Thread(target=monitor_progress, daemon=True)
      monitor_thread.start()

      # Run the processor (blocking call)
      job_status.current_message = (
        f'Processing {job_status.total_tables} tables with Ray parallel mode...'
      )
      processor.run()

      # Process results
      job_status.current_message = 'Parsing processing results...'
      logger.info(f'Job {job_id}: Processing completed, parsing results')
      results = []
      tables_processed = 0
      tables_failed = 0
      failed_table_details = []

      for idx, result in enumerate(processor.results, 1):
        if result is None:
          continue

        # Convert Result dataclass to ProcessingResult Pydantic model
        processing_result = ProcessingResult(
          table=result.table,
          process_start_time=result.process_start_time,
          process_finish_time=result.process_finish_time,
          process_start_watermark=result.process_start_watermark,
          process_finish_watermark=result.process_finish_watermark,
          process_start_version=result.process_start_version,
          process_finish_version=result.process_finish_version,
          manifest_records=result.manifest_records,
          manifest_watermark=result.manifest_watermark,
          watermarks=result.watermarks or [],
          schema_timestamps=result.schema_timestamps or [],
          errors=result.errors,
          warnings=result.warnings,
        )
        results.append(processing_result)

        # Derive status from result data
        if result.errors and len(result.errors) > 0:
          tables_failed += 1
          failed_table_details.append(result.table)
          # Log comprehensive error details
          error_summary = '\n'.join(result.errors)
          logger.error(
            f'Job {job_id}: Table {result.table} FAILED\n'
            f'  Manifest Records: {result.manifest_records}\n'
            f'  Start Watermark: {result.process_start_watermark}\n'
            f'  Errors:\n{error_summary}'
          )
        elif result.process_finish_time:
          tables_processed += 1
          logger.info(
            f'Job {job_id}: Table {result.table} completed successfully '
            f'({result.manifest_records} records processed)'
          )

        # Update progress after each result
        job_status.tables_processed = tables_processed
        job_status.tables_failed = tables_failed
        job_status.results = results.copy()
        job_status.current_message = f'Processed {idx}/{job_status.total_tables} tables'

      # Update job status with final results
      job_status.status = 'completed'
      job_status.end_time = datetime.now()
      job_status.current_message = (
        f'Completed successfully - {tables_processed} tables processed, {tables_failed} failed'
      )
      job_status.results = results
      job_status.tables_processed = tables_processed
      job_status.tables_failed = tables_failed

      # Log comprehensive summary
      logger.info(
        f'Job {job_id}: Processing completed\n'
        f'  Total Tables: {job_status.total_tables}\n'
        f'  Successfully Processed: {tables_processed}\n'
        f'  Failed: {tables_failed}\n'
        f'  Duration: {(job_status.end_time - job_status.start_time).total_seconds():.2f}s'
      )

      if tables_failed > 0:
        logger.warning(
          f'Job {job_id}: Failed tables summary:\n  ' + '\n  '.join(failed_table_details)
        )

    except Exception as e:
      logger.error(f'Job {job_id}: Failed with error: {str(e)}', exc_info=True)
      if job_id in self.jobs:
        self.jobs[job_id].status = 'failed'
        self.jobs[job_id].end_time = datetime.now()
        self.jobs[job_id].error_message = str(e)

    finally:
      # Restore environment
      self._restore_environment(original_env)

      # Clean up Ray
      try:
        import ray

        if ray.is_initialized():
          ray.shutdown()
          logger.info(f'Job {job_id}: Ray shutdown completed')
      except Exception as ray_error:
        logger.warning(f'Job {job_id}: Error shutting down Ray: {ray_error}')

      # Clean up thread reference and processor
      self._job_threads.pop(job_id, None)
      self._processors.pop(job_id, None)
      self._job_locks.pop(job_id, None)

  async def start_job(self, config: GuidewireConfig) -> StartJobResponse:
    """Start a new Guidewire processing job.

    Args:
        config: Configuration for the processing job

    Returns:
        StartJobResponse with job ID and status

    Raises:
        ValueError: If S3 configuration is invalid
        Exception: If bucket creation fails
    """
    # Validate S3 connection and ensure buckets exist
    logger.info(f'Validating S3 connection for provider: {config.s3_config.provider.value}')
    success, error_msg = S3ClientFactory.validate_connection(config.s3_config)
    if not success:
      raise ValueError(f'S3 connection failed: {error_msg}')

    # Auto-create buckets if they don't exist
    logger.info('Ensuring S3 buckets exist (auto-create enabled)')
    bucket_status = S3ClientFactory.ensure_buckets_exist(config.s3_config, auto_create=True)

    # Check if all required buckets are available
    missing_buckets = [bucket for bucket, exists in bucket_status.items() if not exists]
    if missing_buckets:
      raise ValueError(f'Failed to create required buckets: {", ".join(missing_buckets)}')

    # Generate job ID
    job_id = str(uuid.uuid4())

    # Create job status
    job_status = ProcessingJobStatus(
      job_id=job_id,
      status='pending',
      start_time=datetime.now(),
      config=config,
      total_tables=0,
      tables_processed=0,
      tables_failed=0,
      results=[],
    )

    # Store job status
    self.jobs[job_id] = job_status

    # Start processing in a background thread
    thread = Thread(target=self._run_processor_sync, args=(job_id, config), daemon=True)
    thread.start()
    self._job_threads[job_id] = thread

    logger.info(f'Job {job_id}: Started in background thread with {config.s3_config.display_name}')

    return StartJobResponse(
      job_id=job_id,
      status='pending',
      message=f'Processing job started with ID: {job_id} using {config.s3_config.display_name}',
    )

  def get_job_status(self, job_id: str) -> Optional[ProcessingJobStatus]:
    """Get the status of a processing job.

    Args:
        job_id: Job identifier

    Returns:
        ProcessingJobStatus or None if not found
    """
    return self.jobs.get(job_id)

  def list_jobs(self) -> list[ProcessingJobStatus]:
    """List all processing jobs.

    Returns:
        list of all ProcessingJobStatus objects
    """
    return list(self.jobs.values())

  def cancel_job(self, job_id: str) -> bool:
    """Cancel a running job (best effort).

    Note: This sets the status to cancelled but may not immediately
    stop the Ray processing tasks.

    Args:
        job_id: Job identifier

    Returns:
        True if cancellation initiated, False if job not found or not running
    """
    job_status = self.jobs.get(job_id)
    if job_status and job_status.status in ['pending', 'running']:
      job_status.status = 'cancelled'
      job_status.end_time = datetime.now()
      logger.info(f'Job {job_id}: Cancellation initiated')
      # TODO: Implement actual Ray task cancellation if needed
      return True
    return False


# Global service instance
guidewire_service = GuidewireService()
