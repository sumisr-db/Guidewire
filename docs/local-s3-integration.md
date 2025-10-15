# Local S3 Integration Design

## Overview

This document outlines the design for supporting **both local S3 (MinIO) for development** and **AWS S3 for production** in the Guidewire Connector Monitor application.

---

## Goals

1. **Development Experience**: Allow developers to run the full application locally without AWS credentials
2. **Production Ready**: Seamlessly switch to AWS S3 for production deployments
3. **Configuration Driven**: Use environment variables and UI toggles to select S3 provider
4. **Zero Code Changes**: Same codebase runs in both environments
5. **Testing**: Enable integration testing without AWS costs

---

## Architecture Changes

### 1. Configuration System

#### New Environment Variables

```bash
# S3 Provider Selection
S3_PROVIDER=local|aws  # Default: aws

# Local MinIO Configuration (when S3_PROVIDER=local)
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1  # MinIO ignores region but required by boto3

# AWS Configuration (when S3_PROVIDER=aws)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=  # Empty for AWS, set for custom endpoints

# Shared Configuration
S3_MANIFEST_BUCKET=cda-manifests
S3_TARGET_BUCKET=delta-tables
S3_MANIFEST_PREFIX=cda/
S3_TARGET_PREFIX=target/
```

#### Configuration Profiles

**Development Profile** (`.env.local`):
```bash
S3_PROVIDER=local
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1
S3_MANIFEST_BUCKET=guidewire-cda
S3_TARGET_BUCKET=guidewire-delta
S3_MANIFEST_PREFIX=cda/
S3_TARGET_PREFIX=target/
```

**Production Profile** (Databricks environment):
```bash
S3_PROVIDER=aws
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_MANIFEST_BUCKET=sumanmisra
S3_TARGET_BUCKET=sumanmisra
S3_MANIFEST_PREFIX=cda/
S3_TARGET_PREFIX=target/
```

---

### 2. Backend Changes

#### A. New S3 Configuration Model

**File**: `server/models/s3_config.py`

```python
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class S3Provider(str, Enum):
    """S3 provider type."""
    LOCAL = "local"
    AWS = "aws"

class S3Config(BaseModel):
    """S3 configuration for local or AWS."""

    provider: S3Provider = Field(
        default=S3Provider.AWS,
        description="S3 provider: local (MinIO) or aws"
    )

    # Endpoint configuration
    endpoint_url: Optional[str] = Field(
        default=None,
        description="S3 endpoint URL (required for MinIO)"
    )

    # Credentials
    access_key_id: str = Field(..., description="Access key ID")
    secret_access_key: str = Field(..., description="Secret access key")
    region: str = Field(default="us-east-1", description="AWS region")

    # Bucket configuration
    manifest_bucket: str = Field(..., description="Bucket for CDA manifests")
    target_bucket: str = Field(..., description="Bucket for Delta tables")
    manifest_prefix: str = Field(default="cda/", description="Prefix for manifests")
    target_prefix: str = Field(default="target/", description="Prefix for Delta tables")

    # MinIO specific
    use_ssl: bool = Field(default=True, description="Use SSL for S3 connections")
    verify_ssl: bool = Field(default=True, description="Verify SSL certificates")

    @property
    def is_local(self) -> bool:
        """Check if using local S3."""
        return self.provider == S3Provider.LOCAL

    @property
    def manifest_location(self) -> str:
        """Get full manifest location."""
        if self.is_local:
            return f"{self.manifest_bucket}/{self.manifest_prefix}"
        return f"s3://{self.manifest_bucket}/{self.manifest_prefix}"

    @property
    def target_location(self) -> str:
        """Get full target location."""
        if self.is_local:
            return f"{self.target_bucket}/{self.target_prefix}"
        return f"s3://{self.target_bucket}/{self.target_prefix}"
```

#### B. S3 Client Factory

**File**: `server/services/s3_client_factory.py`

```python
import boto3
from typing import Optional
from server.models.s3_config import S3Config, S3Provider

class S3ClientFactory:
    """Factory for creating S3 clients based on configuration."""

    @staticmethod
    def create_client(config: S3Config):
        """Create boto3 S3 client based on configuration.

        Args:
            config: S3 configuration

        Returns:
            boto3 S3 client configured for local MinIO or AWS
        """
        client_kwargs = {
            'aws_access_key_id': config.access_key_id,
            'aws_secret_access_key': config.secret_access_key,
            'region_name': config.region,
        }

        if config.is_local:
            # MinIO configuration
            client_kwargs.update({
                'endpoint_url': config.endpoint_url,
                'use_ssl': config.use_ssl,
                'verify': config.verify_ssl,
            })
        else:
            # AWS S3 configuration
            if config.endpoint_url:
                client_kwargs['endpoint_url'] = config.endpoint_url

        return boto3.client('s3', **client_kwargs)

    @staticmethod
    def create_resource(config: S3Config):
        """Create boto3 S3 resource based on configuration.

        Args:
            config: S3 configuration

        Returns:
            boto3 S3 resource configured for local MinIO or AWS
        """
        resource_kwargs = {
            'aws_access_key_id': config.access_key_id,
            'aws_secret_access_key': config.secret_access_key,
            'region_name': config.region,
        }

        if config.is_local:
            # MinIO configuration
            resource_kwargs.update({
                'endpoint_url': config.endpoint_url,
                'use_ssl': config.use_ssl,
                'verify': config.verify_ssl,
            })
        else:
            # AWS S3 configuration
            if config.endpoint_url:
                resource_kwargs['endpoint_url'] = config.endpoint_url

        return boto3.resource('s3', **resource_kwargs)
```

#### C. Updated Guidewire Config Model

**File**: `server/models/guidewire.py` (updated)

```python
from server.models.s3_config import S3Config

class GuidewireConfig(BaseModel):
    """Configuration for Guidewire CDA processing."""

    # S3 configuration (replaces individual AWS fields)
    s3_config: S3Config = Field(..., description="S3 configuration")

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

    # Legacy support (deprecated, use s3_config)
    @property
    def aws_access_key_id(self) -> str:
        return self.s3_config.access_key_id

    @property
    def aws_secret_access_key(self) -> str:
        return self.s3_config.secret_access_key

    @property
    def aws_region(self) -> str:
        return self.s3_config.region

    @property
    def aws_manifest_location(self) -> str:
        return self.s3_config.manifest_location

    @property
    def aws_s3_bucket(self) -> str:
        return self.s3_config.target_location
```

#### D. Updated GuidewireService

**File**: `server/services/guidewire_service.py` (updated)

```python
from server.services.s3_client_factory import S3ClientFactory

class GuidewireService:
    """Service for managing Guidewire CDA processing jobs with Ray parallel mode."""

    def _setup_environment(self, config: GuidewireConfig) -> Dict[str, str]:
        """Set up environment variables for Guidewire processing.

        Returns:
            dict: Original environment values for cleanup
        """
        original_env = {}
        s3_config = config.s3_config

        env_vars = {
            'AWS_ACCESS_KEY_ID': s3_config.access_key_id,
            'AWS_SECRET_ACCESS_KEY': s3_config.secret_access_key,
            'AWS_REGION': s3_config.region,
            'RAY_DEDUP_LOGS': config.ray_dedup_logs,
        }

        # Add MinIO endpoint if using local S3
        if s3_config.is_local:
            env_vars['AWS_ENDPOINT_URL'] = s3_config.endpoint_url
            env_vars['AWS_USE_SSL'] = str(s3_config.use_ssl).lower()
            env_vars['AWS_VERIFY_SSL'] = str(s3_config.verify_ssl).lower()

        # Set environment variables
        for key, value in env_vars.items():
            original_env[key] = os.environ.get(key)
            os.environ[key] = value

        logger.info(
            f'Environment configured for S3 provider: {s3_config.provider}, '
            f'Target: {s3_config.target_location}'
        )
        return original_env

    def _run_processor_sync(self, job_id: str, config: GuidewireConfig) -> None:
        """Run the Guidewire processor synchronously in a background thread."""
        original_env = {}
        try:
            # ... existing code ...

            # Create processor with updated configuration
            processor = Processor(
                target_cloud='aws',  # Use 'aws' mode even for MinIO
                table_names=tuple(config.table_names) if config.table_names else None,
                parallel=config.parallel,
                exceptions=config.exceptions,
                show_progress=config.show_progress,
                largest_tables_first_count=config.largest_tables_first_count,
                # MinIO endpoint passed via AWS_ENDPOINT_URL env var
            )

            # ... rest of existing code ...
```

---

### 3. Frontend Changes

#### A. Updated API Request Model

**Frontend Type** (TypeScript):

```typescript
interface S3Config {
  provider: 'local' | 'aws';
  endpoint_url: string | null;
  access_key_id: string;
  secret_access_key: string;
  region: string;
  manifest_bucket: string;
  target_bucket: string;
  manifest_prefix: string;
  target_prefix: string;
  use_ssl: boolean;
  verify_ssl: boolean;
}

interface StartJobRequest {
  config: {
    s3_config: S3Config;
    ray_dedup_logs: string;
    parallel: boolean;
    show_progress: boolean;
    table_names: string[] | null;
    exceptions: string[] | null;
    largest_tables_first_count: number | null;
  };
}
```

#### B. Updated Job Configuration Form

**File**: `client/src/pages/GuidewireJobsPage.tsx` (updated)

Add provider selection:

```tsx
const [s3Provider, setS3Provider] = useState<'local' | 'aws'>('local');
const [formData, setFormData] = useState({
  // S3 Provider
  s3_provider: 'local' as 'local' | 'aws',

  // MinIO (Local) Settings
  minio_endpoint: 'http://127.0.0.1:9000',
  minio_access_key: 'minioadmin',
  minio_secret_key: 'minioadmin',

  // AWS Settings
  aws_access_key_id: '',
  aws_secret_access_key: '',

  // Common Settings
  region: 'us-east-1',
  manifest_bucket: 'guidewire-cda',
  target_bucket: 'guidewire-delta',
  manifest_prefix: 'cda/',
  target_prefix: 'target/',

  // Processing Settings
  ray_dedup_logs: '0',
  parallel: true,
  show_progress: true,
});

// Form UI with tabs for Local/AWS
<Tabs value={s3Provider} onValueChange={(v) => setS3Provider(v as 'local' | 'aws')}>
  <TabsList>
    <TabsTrigger value="local">Local S3 (MinIO)</TabsTrigger>
    <TabsTrigger value="aws">AWS S3</TabsTrigger>
  </TabsList>

  <TabsContent value="local">
    {/* MinIO configuration fields */}
  </TabsContent>

  <TabsContent value="aws">
    {/* AWS configuration fields */}
  </TabsContent>
</Tabs>
```

---

### 4. Environment-based Auto-Configuration

#### Development Environment Detection

**File**: `server/utils/env_config.py`

```python
import os
from typing import Optional
from server.models.s3_config import S3Config, S3Provider

def get_default_s3_config() -> Optional[S3Config]:
    """Get default S3 configuration from environment variables.

    Returns:
        S3Config if environment variables are set, None otherwise
    """
    provider_str = os.getenv('S3_PROVIDER', 'aws').lower()
    provider = S3Provider.LOCAL if provider_str == 'local' else S3Provider.AWS

    if provider == S3Provider.LOCAL:
        # MinIO configuration
        return S3Config(
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
    else:
        # AWS configuration
        access_key = os.getenv('AWS_ACCESS_KEY_ID')
        secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')

        if not access_key or not secret_key:
            return None

        return S3Config(
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
```

---

### 5. MinIO Setup Script

**File**: `scripts/setup_minio.sh`

```bash
#!/bin/bash
# Setup MinIO for local development

set -e

echo "Setting up MinIO for local S3 development..."

# Create data directory
mkdir -p ~/minio-data

# Start MinIO container
docker run -d --name minio \
  -p 9000:9000 -p 9001:9001 \
  -v ~/minio-data:/data \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

echo "Waiting for MinIO to start..."
sleep 5

# Check if MinIO is healthy
if curl -sf http://127.0.0.1:9000/minio/health/ready > /dev/null; then
  echo "✅ MinIO is running!"
  echo ""
  echo "S3 API: http://127.0.0.1:9000"
  echo "Console: http://127.0.0.1:9001"
  echo "Credentials: minioadmin / minioadmin"
  echo ""
  echo "Creating test buckets..."

  # Install MinIO client if not available
  if ! command -v mc &> /dev/null; then
    echo "Installing MinIO client..."
    brew install minio/stable/mc
  fi

  # Configure MinIO client
  mc alias set local http://127.0.0.1:9000 minioadmin minioadmin

  # Create buckets
  mc mb local/guidewire-cda --ignore-existing
  mc mb local/guidewire-delta --ignore-existing

  echo "✅ Test buckets created!"
else
  echo "❌ MinIO failed to start"
  exit 1
fi
```

---

### 6. Testing Strategy

#### Local Development Workflow

1. **Start MinIO**:
   ```bash
   ./scripts/setup_minio.sh
   ```

2. **Configure Environment** (`.env.local`):
   ```bash
   S3_PROVIDER=local
   MINIO_ENDPOINT=http://127.0.0.1:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   S3_MANIFEST_BUCKET=guidewire-cda
   S3_TARGET_BUCKET=guidewire-delta
   ```

3. **Upload Test Data**:
   ```bash
   mc cp test-data/cda/*.parquet local/guidewire-cda/cda/
   ```

4. **Start Application**:
   ```bash
   ./watch.sh
   ```

5. **Test Processing**:
   - Open UI at http://localhost:5173
   - Select "Local S3 (MinIO)" provider
   - Start processing job
   - Verify results in MinIO console

#### Production Deployment

1. **Configure Environment** (Databricks):
   ```bash
   S3_PROVIDER=aws
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   S3_MANIFEST_BUCKET=sumanmisra
   S3_TARGET_BUCKET=sumanmisra
   ```

2. **Deploy**:
   ```bash
   ./deploy.sh
   ```

---

## Migration Path

### Phase 1: Backend Changes (Week 1)
- [ ] Create S3Config model
- [ ] Create S3ClientFactory
- [ ] Update GuidewireConfig model
- [ ] Update GuidewireService
- [ ] Add environment configuration utility
- [ ] Update API endpoints

### Phase 2: Frontend Changes (Week 2)
- [ ] Add provider selection UI
- [ ] Create tabbed configuration form
- [ ] Update API request types
- [ ] Add environment detection
- [ ] Update job display to show provider

### Phase 3: Testing & Documentation (Week 3)
- [ ] Create MinIO setup script
- [ ] Test local development workflow
- [ ] Test production deployment
- [ ] Update documentation
- [ ] Add integration tests

### Phase 4: Polish & Deployment (Week 4)
- [ ] Add validation for MinIO connectivity
- [ ] Add S3 health check endpoint
- [ ] Add bucket creation utility
- [ ] Deploy to production
- [ ] Monitor and iterate

---

## Benefits

✅ **Zero AWS Costs**: Develop and test without AWS credentials
✅ **Faster Development**: No network latency, instant feedback
✅ **Reproducible**: Consistent local environment for all developers
✅ **CI/CD Ready**: Run integration tests in CI without AWS
✅ **Production Ready**: Same code runs in both environments
✅ **Easy Onboarding**: New developers start immediately

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MinIO behavior differs from AWS S3 | Medium | Test with both providers regularly |
| Developers forget to test AWS | Medium | CI/CD pipeline tests both |
| Configuration complexity | Low | Provide sensible defaults |
| Credential leakage | High | Never commit `.env.local` |

---

## Next Steps

1. **Review this design** with team
2. **Get approval** for architecture changes
3. **Implement Phase 1** (backend changes)
4. **Test locally** with MinIO
5. **Implement Phase 2** (frontend changes)
6. **Deploy to production** with AWS S3

---

**Questions to Address:**

1. Should we support both providers in the same job (e.g., read from AWS, write to MinIO)?
2. Do we need to support other S3-compatible providers (Wasabi, DigitalOcean Spaces)?
3. Should credentials be stored in jobs or passed per-request?
4. Do we need bucket auto-creation for MinIO?
5. Should we add S3 bucket browser/explorer in UI?
