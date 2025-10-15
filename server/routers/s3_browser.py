"""FastAPI router for S3 browser endpoints."""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional

from server.models.s3_browser import (
  S3BucketInfo,
  S3ListingResponse,
  S3Credentials,
)
from server.services.s3_browser_service import s3_browser_service

router = APIRouter(prefix='/api/s3', tags=['s3-browser'])


@router.post('/buckets', response_model=List[S3BucketInfo])
async def list_buckets(credentials: S3Credentials) -> List[S3BucketInfo]:
  """List all S3 buckets.

  Args:
      s3_config: S3 configuration with credentials

  Returns:
      List of S3 bucket information

  Example:
      ```
      POST /api/s3/buckets
      {
        "provider": "aws",
        "access_key_id": "AKIA...",
        "secret_access_key": "...",
        "region": "us-east-1"
      }
      ```
  """
  try:
    buckets = s3_browser_service.list_buckets(credentials)
    return buckets
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f'Failed to list buckets: {str(e)}',
    )


@router.post('/list', response_model=S3ListingResponse)
async def list_objects(
  credentials: S3Credentials,
  bucket: str = Query(..., description='Bucket name'),
  prefix: str = Query('', description='Prefix/path to list'),
  max_keys: int = Query(1000, description='Maximum keys to return'),
) -> S3ListingResponse:
  """List objects in an S3 bucket.

  Args:
      s3_config: S3 configuration with credentials
      bucket: Bucket name to browse
      prefix: Prefix/path to filter objects (optional)
      max_keys: Maximum number of keys to return (default: 1000)

  Returns:
      S3ListingResponse with folders (prefixes) and objects

  Example:
      ```
      POST /api/s3/list?bucket=my-bucket&prefix=cda/
      {
        "provider": "aws",
        "access_key_id": "AKIA...",
        "secret_access_key": "...",
        "region": "us-east-1"
      }
      ```
  """
  try:
    listing = s3_browser_service.list_objects(
      credentials, bucket, prefix, max_keys
    )
    return listing
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f'Failed to list objects in s3://{bucket}/{prefix}: {str(e)}',
    )


@router.post('/download-url')
async def get_download_url(
  credentials: S3Credentials,
  bucket: str = Query(..., description='Bucket name'),
  key: str = Query(..., description='Object key'),
  expires_in: int = Query(3600, description='URL expiration time in seconds'),
) -> dict:
  """Generate a presigned URL for downloading an S3 object.

  Args:
      s3_config: S3 configuration with credentials
      bucket: Bucket name
      key: Object key (full path)
      expires_in: URL expiration time in seconds (default: 1 hour)

  Returns:
      Dictionary with presigned URL

  Example:
      ```
      POST /api/s3/download-url?bucket=my-bucket&key=path/to/file.txt
      {
        "provider": "aws",
        "access_key_id": "AKIA...",
        "secret_access_key": "...",
        "region": "us-east-1"
      }
      ```
  """
  try:
    url = s3_browser_service.get_object_url(credentials, bucket, key, expires_in)
    return {'url': url, 'expires_in': expires_in}
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f'Failed to generate download URL: {str(e)}',
    )


@router.get('/health')
async def health_check() -> dict:
  """Health check endpoint for S3 browser service."""
  return {'service': 's3-browser', 'status': 'healthy'}
