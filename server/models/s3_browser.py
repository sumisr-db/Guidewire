"""Pydantic models for S3 browser functionality."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class S3Provider(str, Enum):
  """S3 provider type."""

  aws = 'aws'
  local = 'local'


class S3Credentials(BaseModel):
  """Simple S3 credentials for browser operations."""

  provider: S3Provider = Field(default=S3Provider.aws, description='S3 provider')
  access_key_id: str = Field(..., description='AWS access key ID')
  secret_access_key: str = Field(..., description='AWS secret access key')
  region: str = Field(default='us-east-1', description='AWS region')
  endpoint_url: Optional[str] = Field(default=None, description='S3 endpoint URL (for MinIO)')
  use_ssl: bool = Field(default=True, description='Use SSL for connections')
  verify_ssl: bool = Field(default=True, description='Verify SSL certificates')


class S3Object(BaseModel):
  """Represents an S3 object (file)."""

  key: str = Field(..., description='Object key (full path)')
  name: str = Field(..., description='Object name (basename)')
  size: int = Field(..., description='Object size in bytes')
  last_modified: datetime = Field(..., description='Last modified timestamp')
  etag: Optional[str] = Field(default=None, description='ETag of the object')
  storage_class: Optional[str] = Field(default=None, description='Storage class')


class S3Prefix(BaseModel):
  """Represents an S3 prefix (folder)."""

  prefix: str = Field(..., description='Prefix (folder path)')
  name: str = Field(..., description='Folder name')


class S3ListingResponse(BaseModel):
  """Response for S3 listing operations."""

  bucket: str = Field(..., description='Bucket name')
  prefix: str = Field(..., description='Current prefix/path')
  prefixes: List[S3Prefix] = Field(
    default_factory=list, description='Sub-folders in current path'
  )
  objects: List[S3Object] = Field(
    default_factory=list, description='Objects in current path'
  )
  total_objects: int = Field(default=0, description='Total number of objects')
  total_size: int = Field(default=0, description='Total size in bytes')


class S3BucketInfo(BaseModel):
  """Information about an S3 bucket."""

  name: str = Field(..., description='Bucket name')
  creation_date: Optional[datetime] = Field(
    default=None, description='Bucket creation date'
  )
  region: Optional[str] = Field(default=None, description='Bucket region')


class S3BrowserConfig(BaseModel):
  """Configuration for S3 browser operations."""

  provider: str = Field(..., description='S3 provider (aws or local)')
  access_key_id: str = Field(..., description='AWS access key ID')
  secret_access_key: str = Field(..., description='AWS secret access key')
  region: str = Field(default='us-east-1', description='AWS region')
  endpoint_url: Optional[str] = Field(default=None, description='S3 endpoint URL')
  bucket: str = Field(..., description='Bucket to browse')
  prefix: str = Field(default='', description='Prefix/path to list')
  max_keys: int = Field(default=1000, description='Maximum keys to return')
