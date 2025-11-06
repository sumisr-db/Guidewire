"""S3 configuration models for local (MinIO) and AWS S3 support."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, root_validator


class S3Provider(str, Enum):
  """S3 provider type."""

  LOCAL = 'local'
  AWS = 'aws'


class S3Config(BaseModel):
  """S3 configuration for local (MinIO) or AWS S3.

  This model supports both local MinIO development and AWS S3 production
  environments through a provider flag and conditional configuration.
  """

  provider: S3Provider = Field(
    default=S3Provider.AWS, description='S3 provider: local (MinIO) or aws'
  )

  # Endpoint configuration (required for MinIO)
  endpoint_url: Optional[str] = Field(
    default=None, description='S3 endpoint URL (required for MinIO, e.g., http://127.0.0.1:9000)'
  )

  # Credentials
  access_key_id: str = Field(..., description='Access key ID')
  secret_access_key: str = Field(..., description='Secret access key')
  region: str = Field(default='us-east-1', description='AWS region')

  # Bucket configuration
  manifest_bucket: str = Field(..., description='Bucket for CDA manifests')
  target_bucket: str = Field(..., description='Bucket for Delta tables')
  manifest_prefix: str = Field(default='cda/', description='Prefix for manifests in bucket')
  target_prefix: str = Field(default='target/', description='Prefix for Delta tables in bucket')

  # Connection settings
  use_ssl: bool = Field(
    default=True, description='Use SSL for S3 connections (typically False for local MinIO)'
  )
  verify_ssl: bool = Field(
    default=True, description='Verify SSL certificates (typically False for local MinIO)'
  )

  @property
  def is_local(self) -> bool:
    """Check if using local S3 (MinIO).

    Returns:
        True if provider is local, False if AWS
    """
    return self.provider == S3Provider.LOCAL

  @property
  def manifest_location(self) -> str:
    """Get full S3 manifest location.

    Returns:
        Full S3 path for manifest location
    """
    if self.is_local:
      # MinIO format: bucket/prefix
      return f'{self.manifest_bucket}/{self.manifest_prefix.rstrip("/")}'
    else:
      # AWS S3 format: s3://bucket/prefix
      return f's3://{self.manifest_bucket}/{self.manifest_prefix.rstrip("/")}'

  @property
  def target_location(self) -> str:
    """Get full S3 target location for Delta tables.

    Returns:
        Full S3 path for Delta table storage
    """
    if self.is_local:
      # MinIO format: bucket/prefix
      return f'{self.target_bucket}/{self.target_prefix.rstrip("/")}'
    else:
      # AWS S3 format: s3://bucket/prefix
      return f's3://{self.target_bucket}/{self.target_prefix.rstrip("/")}'

  @property
  def display_name(self) -> str:
    """Get human-readable display name for this configuration.

    Returns:
        Display name for UI
    """
    if self.is_local:
      return f'Local MinIO ({self.endpoint_url})'
    else:
      return f'AWS S3 ({self.region})'

  def get_boto3_kwargs(self) -> dict:
    """Get boto3 client/resource keyword arguments.

    Returns:
        Dictionary of kwargs for boto3.client() or boto3.resource()
    """
    kwargs = {
      'aws_access_key_id': self.access_key_id,
      'aws_secret_access_key': self.secret_access_key,
      'region_name': self.region,
    }

    if self.is_local:
      # MinIO-specific configuration
      kwargs.update(
        {
          'endpoint_url': self.endpoint_url,
          'use_ssl': self.use_ssl,
          'verify': self.verify_ssl,
        }
      )
    else:
      # AWS S3 configuration
      if self.endpoint_url:
        # Support custom AWS endpoints if specified
        kwargs['endpoint_url'] = self.endpoint_url

    return kwargs

  @root_validator(pre=True)
  def _normalize_bucket_and_prefix(cls, values):
    """Normalize manifest/target bucket inputs so callers may provide
    either 'bucket' or 'bucket/prefix'. This validator splits combined
    values and ensures prefix fields are set consistently.
    """

    def split_raw(raw: Optional[str]) -> tuple[Optional[str], Optional[str]]:
      if not raw:
        return raw, None
      if '/' in raw:
        b, p = raw.split('/', 1)
        # ensure prefix ends with a single '/'
        p = p.rstrip('/') + '/'
        return b, p
      return raw, None

    # Normalize manifest
    mb = values.get('manifest_bucket')
    if mb:
      b, p = split_raw(mb)
      values['manifest_bucket'] = b
      if p and not values.get('manifest_prefix'):
        values['manifest_prefix'] = p

    # Normalize target
    tb = values.get('target_bucket')
    if tb:
      b, p = split_raw(tb)
      values['target_bucket'] = b
      if p and not values.get('target_prefix'):
        values['target_prefix'] = p

    return values

  def mask_credentials(self) -> 'S3Config':
    """Return a copy with masked credentials for safe display.

    Returns:
        S3Config with masked access keys
    """
    return self.model_copy(
      update={
        'access_key_id': self.access_key_id[-4:].rjust(len(self.access_key_id), '*'),
        'secret_access_key': '***' + self.secret_access_key[-4:],
      }
    )
