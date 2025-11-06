"""Factory for creating S3 clients with support for MinIO and AWS S3."""

import logging
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from server.models.s3_config import S3Config

logger = logging.getLogger(__name__)


class S3ClientFactory:
  """Factory for creating boto3 S3 clients based on configuration.

  Supports both local MinIO and AWS S3 through provider-specific configuration.
  Handles bucket creation and validation automatically.
  """

  @staticmethod
  def create_client(config: S3Config):
    """Create boto3 S3 client based on configuration.

    Args:
        config: S3 configuration (MinIO or AWS)

    Returns:
        boto3 S3 client configured for the specified provider

    Raises:
        ValueError: If configuration is invalid
        ClientError: If S3 connection fails
    """
    if config.is_local and not config.endpoint_url:
      raise ValueError('endpoint_url is required for local S3 provider')

    kwargs = config.get_boto3_kwargs()

    try:
      client = boto3.client('s3', **kwargs)

      # Validate connection
      if config.is_local:
        logger.info(f'Created MinIO S3 client: {config.endpoint_url}')
      else:
        logger.info(f'Created AWS S3 client: {config.region}')

      return client

    except Exception as e:
      logger.error(f'Failed to create S3 client: {e}')
      raise

  @staticmethod
  def create_resource(config: S3Config):
    """Create boto3 S3 resource based on configuration.

    Args:
        config: S3 configuration (MinIO or AWS)

    Returns:
        boto3 S3 resource configured for the specified provider

    Raises:
        ValueError: If configuration is invalid
        ClientError: If S3 connection fails
    """
    if config.is_local and not config.endpoint_url:
      raise ValueError('endpoint_url is required for local S3 provider')

    kwargs = config.get_boto3_kwargs()

    try:
      resource = boto3.resource('s3', **kwargs)

      if config.is_local:
        logger.info(f'Created MinIO S3 resource: {config.endpoint_url}')
      else:
        logger.info(f'Created AWS S3 resource: {config.region}')

      return resource

    except Exception as e:
      logger.error(f'Failed to create S3 resource: {e}')
      raise

  @staticmethod
  def ensure_buckets_exist(config: S3Config, auto_create: bool = True) -> dict[str, bool]:
    """Ensure required buckets exist, optionally creating them.

    Args:
        config: S3 configuration
        auto_create: If True, create buckets that don't exist

    Returns:
        Dictionary with bucket names as keys and existence status as values
        Example: {'guidewire-cda': True, 'guidewire-delta': True}

    Raises:
        ClientError: If bucket operations fail
    """
    client = S3ClientFactory.create_client(config)
    bucket_status = {}

    # Support inputs that may include a prefix (e.g. "bucket/prefix").
    # Normalize by operating on the bucket name only but keep the original
    # raw value as the key in the returned status map so callers can see
    # which input succeeded/failed.
    buckets_to_check = [config.manifest_bucket, config.target_bucket]

    def _split_raw_bucket(raw: str) -> tuple[str, str]:
      """Split a raw bucket string of the form 'bucket[/prefix]' into
      (bucket, prefix). If no slash is present, prefix will be empty.
      """
      if not raw:
        return raw, ''
      if '/' in raw:
        bucket, prefix = raw.split('/', 1)
        return bucket, prefix
      return raw, ''

    # Deduplicate normalized bucket names but preserve original raw keys
    seen_buckets: set[str] = set()
    for raw_name in buckets_to_check:
      if raw_name is None:
        continue
      bucket_name, _prefix = _split_raw_bucket(raw_name)
      # If we've already checked/created this bucket, reuse the result
      if bucket_name in seen_buckets:
        # Mirror the existing status for this raw input
        existing_status = next(
          (v for k, v in bucket_status.items() if k.startswith(bucket_name)), False
        )
        bucket_status[raw_name] = existing_status
        continue

      seen_buckets.add(bucket_name)

      exists = S3ClientFactory._bucket_exists(client, bucket_name)
      bucket_status[raw_name] = exists

      if not exists and auto_create:
        logger.info(f'Bucket {bucket_name} does not exist, creating...')
        created = S3ClientFactory._create_bucket(client, bucket_name, config)
        bucket_status[raw_name] = created

        if created:
          logger.info(f'✅ Created bucket: {bucket_name}')
        else:
          logger.error(f'❌ Failed to create bucket: {bucket_name}')
      elif exists:
        logger.info(f'✅ Bucket exists: {bucket_name}')
      else:
        logger.warning(f'⚠️  Bucket does not exist: {raw_name}')

    return bucket_status

  @staticmethod
  def _bucket_exists(client, bucket_name: str) -> bool:
    """Check if a bucket exists.

    Args:
        client: boto3 S3 client
        bucket_name: Name of the bucket

    Returns:
        True if bucket exists, False otherwise
    """
    try:
      client.head_bucket(Bucket=bucket_name)
      return True
    except ClientError as e:
      error_code = e.response.get('Error', {}).get('Code', '')
      if error_code in ['404', 'NoSuchBucket']:
        return False
      else:
        # Other error (permissions, etc.)
        logger.warning(f'Error checking bucket {bucket_name}: {e}')
        return False

  @staticmethod
  def _create_bucket(client, bucket_name: str, config: S3Config) -> bool:
    """Create a bucket.

    Args:
        client: boto3 S3 client
        bucket_name: Name of the bucket to create
        config: S3 configuration

    Returns:
        True if bucket was created successfully, False otherwise
    """
    try:
      if config.is_local:
        # MinIO bucket creation (no region constraint)
        client.create_bucket(Bucket=bucket_name)
      else:
        # AWS S3 bucket creation
        if config.region == 'us-east-1':
          # us-east-1 doesn't use LocationConstraint
          client.create_bucket(Bucket=bucket_name)
        else:
          # Other regions require LocationConstraint
          client.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={'LocationConstraint': config.region},
          )

      logger.info(f'Created bucket: {bucket_name}')
      return True

    except ClientError as e:
      error_code = e.response.get('Error', {}).get('Code', '')
      if error_code == 'BucketAlreadyOwnedByYou':
        logger.info(f'Bucket already exists and is owned by you: {bucket_name}')
        return True
      else:
        logger.error(f'Failed to create bucket {bucket_name}: {e}')
        return False

  @staticmethod
  def validate_connection(config: S3Config) -> tuple[bool, Optional[str]]:
    """Validate S3 connection and credentials.

    Args:
        config: S3 configuration to validate

    Returns:
        Tuple of (success: bool, error_message: Optional[str])
    """
    try:
      client = S3ClientFactory.create_client(config)

      # Try to list buckets as a connection test
      client.list_buckets()

      return True, None

    except ClientError as e:
      error_code = e.response.get('Error', {}).get('Code', '')
      error_msg = e.response.get('Error', {}).get('Message', str(e))
      return False, f'{error_code}: {error_msg}'

    except Exception as e:
      return False, str(e)
