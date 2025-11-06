"""Pydantic models for Guidewire CDA processing."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, computed_field

from server.models.s3_config import S3Config


class GuidewireConfig(BaseModel):
  """Configuration for Guidewire CDA processing.

  This configuration now supports both local S3 (MinIO) and AWS S3
  through the s3_config field.
  """

  # S3 configuration (replaces individual AWS fields)
  s3_config: S3Config = Field(..., description='S3 configuration (MinIO or AWS)')

  # Processing configuration
  ray_dedup_logs: str = Field(default='0', description='Ray dedup logs setting')
  parallel: bool = Field(default=True, description='Use Ray for parallel processing')
  show_progress: bool = Field(default=True, description='Show progress tracking')
  table_names: Optional[List[str]] = Field(
    default=None, description='Specific tables to process (None = all)'
  )
  exceptions: Optional[List[str]] = Field(
    default=None, description='Tables to exclude from processing'
  )
  largest_tables_first_count: Optional[int] = Field(
    default=None, description='Number of largest tables to process first'
  )

  # Legacy property accessors for backward compatibility
  @property
  def aws_access_key_id(self) -> str:
    """Legacy accessor for AWS access key ID."""
    return self.s3_config.access_key_id

  @property
  def aws_secret_access_key(self) -> str:
    """Legacy accessor for AWS secret access key."""
    return self.s3_config.secret_access_key

  @property
  def aws_region(self) -> str:
    """Legacy accessor for AWS region."""
    return self.s3_config.region

  @property
  def aws_manifest_location(self) -> str:
    """Legacy accessor for manifest location."""
    return self.s3_config.manifest_location

  @property
  def aws_s3_bucket(self) -> str:
    """Legacy accessor for S3 bucket (target location)."""
    return self.s3_config.target_location


class ProcessingResult(BaseModel):
  """Result of processing a single table."""

  table: str = Field(..., description='Table name')
  process_start_time: datetime = Field(..., description='Processing start time')
  process_finish_time: Optional[datetime] = Field(
    default=None, description='Processing finish time'
  )
  process_start_watermark: int = Field(..., description='Starting watermark')
  process_finish_watermark: Optional[int] = Field(default=None, description='Ending watermark')
  process_start_version: int = Field(..., description='Starting Delta version')
  process_finish_version: Optional[int] = Field(default=None, description='Ending Delta version')
  manifest_records: int = Field(..., description='Number of records in manifest')
  manifest_watermark: int = Field(..., description='Manifest watermark')
  watermarks: List[int] = Field(default_factory=list, description='List of watermarks')
  schema_timestamps: List[int] = Field(
    default_factory=list, description='List of schema timestamps'
  )
  errors: Optional[List[str]] = Field(default=None, description='List of errors')
  warnings: Optional[List[str]] = Field(default=None, description='List of warnings')

  @property
  def status(self) -> str:
    """Get processing status."""
    if self.errors:
      return 'failed'
    elif self.process_finish_time:
      return 'completed'
    else:
      return 'running'

  @property
  def duration_seconds(self) -> Optional[float]:
    """Get processing duration in seconds."""
    if self.process_finish_time:
      return (self.process_finish_time - self.process_start_time).total_seconds()
    return None


class ProcessingJobStatus(BaseModel):
  """Status of a Guidewire processing job."""

  job_id: str = Field(..., description='Unique job identifier')
  status: str = Field(
    ...,
    description='Job status: pending, running, completed, failed, cancelled',
  )
  start_time: datetime = Field(..., description='Job start time')
  end_time: Optional[datetime] = Field(default=None, description='Job end time')
  config: GuidewireConfig = Field(..., description='Job configuration')
  total_tables: int = Field(default=0, description='Total number of tables to process')
  tables_processed: int = Field(default=0, description='Number of tables processed')
  tables_failed: int = Field(default=0, description='Number of tables that failed')
  current_message: Optional[str] = Field(
    default=None, description='Current status message showing what the job is doing'
  )
  results: List[ProcessingResult] = Field(
    default_factory=list, description='Processing results for each table'
  )
  error_message: Optional[str] = Field(default=None, description='Error message if job failed')

  @computed_field
  @property
  def progress_percent(self) -> float:
    """Get job progress percentage."""
    if self.total_tables == 0:
      return 0.0
    return (self.tables_processed / self.total_tables) * 100

  @computed_field
  @property
  def duration_seconds(self) -> Optional[float]:
    """Get job duration in seconds."""
    if self.end_time:
      return (self.end_time - self.start_time).total_seconds()
    elif self.status == 'running':
      return (datetime.now() - self.start_time).total_seconds()
    return None


class ProcessingJobSummary(BaseModel):
  """Summary of a processing job (without detailed results)."""

  job_id: str
  status: str
  start_time: datetime
  end_time: Optional[datetime] = None
  total_tables: int = 0
  tables_processed: int = 0
  tables_failed: int = 0
  progress_percent: float = 0.0
  duration_seconds: Optional[float] = None
  current_message: Optional[str] = None


class StartJobRequest(BaseModel):
  """Request to start a Guidewire processing job."""

  config: GuidewireConfig = Field(..., description='Processing configuration')


class StartJobResponse(BaseModel):
  """Response after starting a job."""

  job_id: str = Field(..., description='Unique job identifier')
  status: str = Field(..., description='Initial job status')
  message: str = Field(..., description='Success message')
