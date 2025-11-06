"""Pydantic models for Delta Lake inspection."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DeltaTableInfo(BaseModel):
  """Information about a Delta table."""

  name: str = Field(..., description='Table name')
  path: str = Field(..., description='S3 path to Delta table')
  size_bytes: int = Field(..., description='Total size in bytes')
  num_files: int = Field(..., description='Number of data files')
  last_modified: Optional[datetime] = Field(default=None, description='Last modification time')


class DeltaColumn(BaseModel):
  """Delta table column information."""

  name: str = Field(..., description='Column name')
  type: str = Field(..., description='Data type')
  nullable: bool = Field(default=True, description='Whether column is nullable')
  metadata: Optional[Dict[str, Any]] = Field(default=None, description='Column metadata')


class DeltaTableSchema(BaseModel):
  """Delta table schema information."""

  table_name: str = Field(..., description='Table name')
  columns: List[DeltaColumn] = Field(..., description='List of columns')
  partition_columns: List[str] = Field(default_factory=list, description='Partition columns')


class DeltaHistoryEntry(BaseModel):
  """Delta table history entry."""

  version: int = Field(..., description='Table version number')
  timestamp: datetime = Field(..., description='Operation timestamp')
  operation: str = Field(..., description='Operation type (e.g., WRITE, MERGE)')
  operation_parameters: Optional[Dict[str, Any]] = Field(
    default=None, description='Operation parameters'
  )
  user_identity: Optional[str] = Field(default=None, description='User who made change')
  notebook_id: Optional[str] = Field(default=None, description='Notebook ID')
  cluster_id: Optional[str] = Field(default=None, description='Cluster ID')
  read_version: Optional[int] = Field(default=None, description='Read version')
  isolation_level: Optional[str] = Field(default=None, description='Isolation level')
  is_blind_append: Optional[bool] = Field(
    default=None, description='Whether operation was blind append'
  )


class DeltaTableHistory(BaseModel):
  """Complete history for a Delta table."""

  table_name: str = Field(..., description='Table name')
  current_version: int = Field(..., description='Current version number')
  entries: List[DeltaHistoryEntry] = Field(..., description='History entries')


class DeltaTablePreview(BaseModel):
  """Preview data from a Delta table."""

  table_name: str = Field(..., description='Table name')
  columns: List[str] = Field(..., description='Column names')
  rows: List[Dict[str, Any]] = Field(..., description='Sample rows')
  total_count: Optional[int] = Field(default=None, description='Total row count (if available)')
  limit: int = Field(default=100, description='Number of rows returned')


class DeltaTransactionLog(BaseModel):
  """Delta transaction log entry."""

  version: int = Field(..., description='Transaction version')
  timestamp: datetime = Field(..., description='Transaction timestamp')
  raw_json: str = Field(..., description='Raw JSON content from log file')


class DeltaListTablesRequest(BaseModel):
  """Request to list Delta tables."""

  s3_bucket: str = Field(..., description='S3 bucket name')
  s3_prefix: str = Field(..., description='S3 prefix/path')
  access_key_id: str = Field(..., description='AWS access key ID')
  secret_access_key: str = Field(..., description='AWS secret access key')
  region: str = Field(default='us-east-1', description='AWS region')
