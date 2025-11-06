"""Service for S3 browser operations."""

import logging
from typing import List

import boto3

from server.models.s3_browser import (
  S3BucketInfo,
  S3Credentials,
  S3ListingResponse,
  S3Object,
  S3Prefix,
)

logger = logging.getLogger(__name__)


class S3BrowserService:
  """Service for browsing S3 buckets and objects."""

  @staticmethod
  def _create_s3_client(credentials: S3Credentials):
    """Create boto3 S3 client from S3Credentials."""
    client_config = {
      'aws_access_key_id': credentials.access_key_id,
      'aws_secret_access_key': credentials.secret_access_key,
      'region_name': credentials.region,
    }

    if credentials.endpoint_url:
      client_config['endpoint_url'] = credentials.endpoint_url

    if not credentials.verify_ssl:
      import urllib3

      urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
      client_config['verify'] = False

    return boto3.client('s3', **client_config)

  @staticmethod
  def list_buckets(credentials: S3Credentials) -> List[S3BucketInfo]:
    """List all S3 buckets.

    Args:
        s3_config: S3 configuration

    Returns:
        List of S3BucketInfo objects
    """
    try:
      s3_client = S3BrowserService._create_s3_client(credentials)
      response = s3_client.list_buckets()

      buckets = []
      for bucket in response.get('Buckets', []):
        buckets.append(
          S3BucketInfo(
            name=bucket['Name'],
            creation_date=bucket.get('CreationDate'),
            region=credentials.region,
          )
        )

      logger.info(f'Listed {len(buckets)} buckets from {credentials.provider.value} S3')
      return buckets

    except Exception as e:
      logger.error(f'Failed to list buckets: {e}', exc_info=True)
      raise

  @staticmethod
  def list_objects(
    credentials: S3Credentials, bucket: str, prefix: str = '', max_keys: int = 1000
  ) -> S3ListingResponse:
    """List objects in an S3 bucket with optional prefix.

    Args:
        s3_config: S3 configuration
        bucket: Bucket name
        prefix: Prefix to filter objects (folder path)
        max_keys: Maximum number of keys to return

    Returns:
        S3ListingResponse with prefixes and objects
    """
    try:
      s3_client = S3BrowserService._create_s3_client(credentials)

      # Ensure prefix ends with / for folder listing if not empty
      if prefix and not prefix.endswith('/'):
        prefix = prefix + '/'

      # List objects with delimiter to get folder structure
      response = s3_client.list_objects_v2(
        Bucket=bucket, Prefix=prefix, Delimiter='/', MaxKeys=max_keys
      )

      # Process prefixes (folders)
      prefixes = []
      for common_prefix in response.get('CommonPrefixes', []):
        prefix_path = common_prefix['Prefix']
        # Extract folder name from prefix
        folder_name = prefix_path.rstrip('/').split('/')[-1]
        prefixes.append(S3Prefix(prefix=prefix_path, name=folder_name))

      # Process objects (files)
      objects = []
      total_size = 0
      for obj in response.get('Contents', []):
        # Skip the prefix itself if it's a directory marker
        if obj['Key'] == prefix:
          continue

        # Extract file name from key
        file_name = obj['Key'].split('/')[-1]
        if not file_name:  # Skip directory markers
          continue

        obj_size = obj.get('Size', 0)
        total_size += obj_size

        objects.append(
          S3Object(
            key=obj['Key'],
            name=file_name,
            size=obj_size,
            last_modified=obj['LastModified'],
            etag=obj.get('ETag', '').strip('"'),
            storage_class=obj.get('StorageClass'),
          )
        )

      logger.info(
        f'Listed {len(prefixes)} folders and {len(objects)} objects in s3://{bucket}/{prefix}'
      )

      return S3ListingResponse(
        bucket=bucket,
        prefix=prefix,
        prefixes=prefixes,
        objects=objects,
        total_objects=len(objects),
        total_size=total_size,
      )

    except Exception as e:
      logger.error(f'Failed to list objects in s3://{bucket}/{prefix}: {e}', exc_info=True)
      raise

  @staticmethod
  def get_object_url(
    credentials: S3Credentials, bucket: str, key: str, expires_in: int = 3600
  ) -> str:
    """Generate a presigned URL for downloading an S3 object.

    Args:
        s3_config: S3 configuration
        bucket: Bucket name
        key: Object key
        expires_in: URL expiration time in seconds (default: 1 hour)

    Returns:
        Presigned URL string
    """
    try:
      s3_client = S3BrowserService._create_s3_client(credentials)

      url = s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=expires_in,
      )

      logger.info(f'Generated presigned URL for s3://{bucket}/{key}')
      return url

    except Exception as e:
      logger.error(f'Failed to generate presigned URL: {e}', exc_info=True)
      raise


# Global service instance
s3_browser_service = S3BrowserService()
