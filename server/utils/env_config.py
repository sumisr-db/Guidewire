"""Environment-based S3 configuration utility."""

import logging
import os
from typing import Optional

from server.models.s3_config import S3Config, S3Provider

logger = logging.getLogger(__name__)


def get_default_s3_config() -> Optional[S3Config]:
  """Get default S3 configuration from environment variables.

  Reads environment variables to determine whether to use local MinIO
  or AWS S3, and configures appropriately.

  Environment Variables:
      S3_PROVIDER: 'local' or 'aws' (default: 'aws')

      For Local MinIO:
          MINIO_ENDPOINT: MinIO endpoint URL (default: 'http://127.0.0.1:9000')
          MINIO_ACCESS_KEY: MinIO access key (default: 'minioadmin')
          MINIO_SECRET_KEY: MinIO secret key (default: 'minioadmin')
          MINIO_REGION: Region for MinIO (default: 'us-east-1')

      For AWS S3:
          AWS_ACCESS_KEY_ID: AWS access key ID (required)
          AWS_SECRET_ACCESS_KEY: AWS secret access key (required)
          AWS_REGION: AWS region (default: 'us-east-1')
          AWS_ENDPOINT_URL: Optional custom endpoint

      Common:
          S3_MANIFEST_BUCKET: Bucket for CDA manifests (default: varies by provider)
          S3_TARGET_BUCKET: Bucket for Delta tables (default: varies by provider)
          S3_MANIFEST_PREFIX: Prefix for manifests (default: 'cda/')
          S3_TARGET_PREFIX: Prefix for Delta tables (default: 'target/')

  Returns:
      S3Config if environment variables are set, None otherwise
  """
  provider_str = os.getenv('S3_PROVIDER', 'aws').lower()
  provider = S3Provider.LOCAL if provider_str == 'local' else S3Provider.AWS

  logger.info(f'Loading S3 configuration for provider: {provider.value}')

  try:
    if provider == S3Provider.LOCAL:
      # MinIO configuration
      config = S3Config(
        provider=S3Provider.LOCAL,
        endpoint_url=os.getenv('MINIO_ENDPOINT', 'http://127.0.0.1:9000'),
        access_key_id=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
        secret_access_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin'),
        region=os.getenv('MINIO_REGION', 'us-east-1'),
        manifest_bucket=os.getenv('S3_MANIFEST_BUCKET', 'guidewire-cda'),
        target_bucket=os.getenv('S3_TARGET_BUCKET', 'guidewire-delta'),
        manifest_prefix=os.getenv('S3_MANIFEST_PREFIX', 'cda/'),
        target_prefix=os.getenv('S3_TARGET_PREFIX', 'target/'),
        use_ssl=False,  # Local MinIO typically doesn't use SSL
        verify_ssl=False,
      )
      logger.info(f'MinIO config loaded: {config.endpoint_url}')
      return config

    else:
      # AWS configuration
      access_key = os.getenv('AWS_ACCESS_KEY_ID')
      secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')

      if not access_key or not secret_key:
        logger.warning('AWS credentials not found in environment variables')
        return None

      config = S3Config(
        provider=S3Provider.AWS,
        endpoint_url=os.getenv('AWS_ENDPOINT_URL'),
        access_key_id=access_key,
        secret_access_key=secret_key,
        region=os.getenv('AWS_REGION', 'us-east-1'),
        manifest_bucket=os.getenv('S3_MANIFEST_BUCKET', 'sumanmisra'),
        target_bucket=os.getenv('S3_TARGET_BUCKET', 'sumanmisra'),
        manifest_prefix=os.getenv('S3_MANIFEST_PREFIX', 'cda/'),
        target_prefix=os.getenv('S3_TARGET_PREFIX', 'target/'),
        use_ssl=True,
        verify_ssl=True,
      )
      logger.info(f'AWS S3 config loaded: {config.region}')
      return config

  except Exception as e:
    logger.error(f'Failed to load S3 configuration: {e}')
    return None


def get_local_minio_config() -> S3Config:
  """Get default local MinIO configuration for development.

  Returns:
      S3Config configured for local MinIO with sensible defaults
  """
  return S3Config(
    provider=S3Provider.LOCAL,
    endpoint_url='http://127.0.0.1:9000',
    access_key_id='minioadmin',
    secret_access_key='minioadmin',
    region='us-east-1',
    manifest_bucket='guidewire-cda',
    target_bucket='guidewire-delta',
    manifest_prefix='cda/',
    target_prefix='target/',
    use_ssl=False,
    verify_ssl=False,
  )


def get_aws_s3_config(
  access_key_id: str, secret_access_key: str, region: str = 'us-east-1'
) -> S3Config:
  """Get AWS S3 configuration for production.

  Args:
      access_key_id: AWS access key ID
      secret_access_key: AWS secret access key
      region: AWS region (default: 'us-east-1')

  Returns:
      S3Config configured for AWS S3
  """
  return S3Config(
    provider=S3Provider.AWS,
    endpoint_url=None,
    access_key_id=access_key_id,
    secret_access_key=secret_access_key,
    region=region,
    manifest_bucket='sumanmisra',
    target_bucket='sumanmisra',
    manifest_prefix='cda/',
    target_prefix='target/',
    use_ssl=True,
    verify_ssl=True,
  )
