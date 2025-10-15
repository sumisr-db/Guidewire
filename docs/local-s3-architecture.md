# Local S3 Architecture - Visual Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │           Job Configuration Form                                    │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                        │ │
│  │  │  Local S3 Tab    │  │   AWS S3 Tab     │                        │ │
│  │  │  (MinIO)         │  │   (Production)   │                        │ │
│  │  │                  │  │                  │                        │ │
│  │  │ Endpoint: :9000  │  │ Region: us-east-1│                        │ │
│  │  │ User: minioadmin │  │ Key: AKIA...     │                        │ │
│  │  │ Buckets: local   │  │ Buckets: AWS     │                        │ │
│  │  └──────────────────┘  └──────────────────┘                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/guidewire/jobs/start
                                    │ { s3_config: { provider: "local|aws" } }
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       Backend (FastAPI)                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                  GuidewireService                                   │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │            S3Config Model                                     │ │ │
│  │  │  • provider: "local" | "aws"                                 │ │ │
│  │  │  • endpoint_url: Optional[str]                               │ │ │
│  │  │  • access_key_id / secret_access_key                         │ │ │
│  │  │  • manifest_bucket / target_bucket                           │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                           ↓                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │         S3ClientFactory                                       │ │ │
│  │  │  • create_client(s3_config) → boto3.client                   │ │ │
│  │  │  • Configures endpoint_url for MinIO                         │ │ │
│  │  │  • Handles SSL/TLS settings                                  │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                           ↓                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │     Environment Configuration                                 │ │ │
│  │  │  • AWS_ACCESS_KEY_ID                                         │ │ │
│  │  │  • AWS_SECRET_ACCESS_KEY                                     │ │ │
│  │  │  • AWS_ENDPOINT_URL (MinIO only)                             │ │ │
│  │  │  • AWS_REGION                                                │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                           ↓                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │     Guidewire Processor (Ray Parallel)                        │ │ │
│  │  │  • Reads CDA manifests from S3                               │ │ │
│  │  │  • Processes parquet files                                   │ │ │
│  │  │  • Writes Delta tables to S3                                 │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                    │                              │
                    │ provider="local"             │ provider="aws"
                    ↓                              ↓
┌────────────────────────────────┐   ┌────────────────────────────────┐
│     Local S3 (MinIO)           │   │        AWS S3                  │
│  ┌──────────────────────────┐  │   │  ┌──────────────────────────┐ │
│  │  Endpoint                │  │   │  │  Region                  │ │
│  │  http://127.0.0.1:9000   │  │   │  │  us-east-1               │ │
│  └──────────────────────────┘  │   │  └──────────────────────────┘ │
│                                 │   │                                │
│  Buckets:                       │   │  Buckets:                      │
│  • guidewire-cda/               │   │  • sumanmisra/                 │
│    └── cda/                     │   │    └── cda/                    │
│        └── manifest.json        │   │        └── manifest.json       │
│  • guidewire-delta/             │   │  • sumanmisra/                 │
│    └── target/                  │   │    └── target/                 │
│        └── claim_401000005/     │   │        └── claim_401000005/    │
│            └── _delta_log/      │   │            └── _delta_log/     │
└────────────────────────────────┘   └────────────────────────────────┘
```

---

## Configuration Flow

```
Development Mode (.env.local)
┌──────────────────────────────────────────┐
│ S3_PROVIDER=local                        │
│ MINIO_ENDPOINT=http://127.0.0.1:9000    │
│ MINIO_ACCESS_KEY=minioadmin              │
│ MINIO_SECRET_KEY=minioadmin              │
│ S3_MANIFEST_BUCKET=guidewire-cda         │
│ S3_TARGET_BUCKET=guidewire-delta         │
└──────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────┐
│ S3Config(                                │
│   provider="local",                      │
│   endpoint_url="http://127.0.0.1:9000", │
│   access_key_id="minioadmin",            │
│   secret_access_key="minioadmin",        │
│   manifest_bucket="guidewire-cda",       │
│   target_bucket="guidewire-delta",       │
│   use_ssl=False,                         │
│   verify_ssl=False                       │
│ )                                        │
└──────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────┐
│ boto3.client('s3',                       │
│   endpoint_url='http://127.0.0.1:9000', │
│   aws_access_key_id='minioadmin',        │
│   aws_secret_access_key='minioadmin',    │
│   use_ssl=False,                         │
│   verify=False                           │
│ )                                        │
└──────────────────────────────────────────┘
            ↓
        MinIO

---

Production Mode (Databricks env)
┌──────────────────────────────────────────┐
│ S3_PROVIDER=aws                          │
│ AWS_ACCESS_KEY_ID=AKIA...               │
│ AWS_SECRET_ACCESS_KEY=...               │
│ AWS_REGION=us-east-1                     │
│ S3_MANIFEST_BUCKET=sumanmisra            │
│ S3_TARGET_BUCKET=sumanmisra              │
└──────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────┐
│ S3Config(                                │
│   provider="aws",                        │
│   endpoint_url=None,                     │
│   access_key_id="AKIA...",               │
│   secret_access_key="...",               │
│   region="us-east-1",                    │
│   manifest_bucket="sumanmisra",          │
│   target_bucket="sumanmisra",            │
│   use_ssl=True,                          │
│   verify_ssl=True                        │
│ )                                        │
└──────────────────────────────────────────┘
            ↓
┌──────────────────────────────────────────┐
│ boto3.client('s3',                       │
│   aws_access_key_id='AKIA...',           │
│   aws_secret_access_key='...',           │
│   region_name='us-east-1',               │
│   use_ssl=True,                          │
│   verify=True                            │
│ )                                        │
└──────────────────────────────────────────┘
            ↓
        AWS S3
```

---

## Data Flow

```
1. User Submits Job
   Frontend → Backend: POST /api/guidewire/jobs/start
   {
     config: {
       s3_config: {
         provider: "local",
         endpoint_url: "http://127.0.0.1:9000",
         ...
       }
     }
   }

2. Backend Processes Configuration
   GuidewireService.start_job()
   ↓
   S3ClientFactory.create_client(s3_config)
   ↓
   boto3.client('s3', endpoint_url='http://127.0.0.1:9000')

3. Environment Setup
   Set AWS_ENDPOINT_URL=http://127.0.0.1:9000
   Set AWS_ACCESS_KEY_ID=minioadmin
   Set AWS_SECRET_ACCESS_KEY=minioadmin

4. Guidewire Processor Starts
   Processor(target_cloud='aws')  # Works with MinIO via AWS_ENDPOINT_URL
   ↓
   processor.run()
   ↓
   - Lists tables from guidewire-cda/cda/
   - Reads CDA manifests
   - Processes parquet files with Ray
   - Writes Delta tables to guidewire-delta/target/

5. Results Returned
   ProcessingJobStatus with per-table results
```

---

## Component Interactions

```
┌────────────────────┐
│  React Frontend    │
│                    │
│  • Select Provider │─────┐
│  • Configure S3    │     │
│  • Start Job       │     │
└────────────────────┘     │
                           │ HTTP POST
                           ↓
┌──────────────────────────────────────┐
│  FastAPI Backend                     │
│  ┌────────────────────────────────┐  │
│  │  GuidewireRouter               │  │
│  │  • POST /jobs/start            │  │
│  │  • Validates S3Config          │  │
│  └────────────┬───────────────────┘  │
│               │                      │
│  ┌────────────▼───────────────────┐  │
│  │  GuidewireService              │  │
│  │  • Creates job                 │  │
│  │  • Configures environment      │  │
│  │  • Starts background thread    │  │
│  └────────────┬───────────────────┘  │
│               │                      │
│  ┌────────────▼───────────────────┐  │
│  │  S3ClientFactory               │  │
│  │  • Creates boto3 client        │  │
│  │  • Sets endpoint_url (MinIO)   │  │
│  └────────────┬───────────────────┘  │
└───────────────┼──────────────────────┘
                │
                ↓
┌──────────────────────────────────────┐
│  Guidewire Processor (Ray)           │
│  • Reads from S3 (MinIO or AWS)      │
│  • Processes with Ray parallel       │
│  • Writes Delta tables to S3         │
└──────────────┬───────────────────────┘
               │
               ↓
       ┌───────┴────────┐
       │                │
  ┌────▼─────┐    ┌─────▼─────┐
  │  MinIO   │    │   AWS S3   │
  │  :9000   │    │  us-east-1 │
  └──────────┘    └────────────┘
```

---

## Development Workflow

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Start MinIO                                    │
│  $ ./scripts/setup_minio.sh                             │
│  ✅ MinIO running at http://127.0.0.1:9000              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Upload Test Data                               │
│  $ mc cp test-data/*.parquet local/guidewire-cda/cda/   │
│  ✅ Test CDA manifests uploaded                         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: Start Application                              │
│  $ ./watch.sh                                           │
│  ✅ Frontend: http://localhost:5173                     │
│  ✅ Backend: http://localhost:8000                      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Step 4: Configure Job                                  │
│  • Select "Local S3 (MinIO)" tab                        │
│  • Endpoint: http://127.0.0.1:9000 (pre-filled)        │
│  • Credentials: minioadmin (pre-filled)                 │
│  • Buckets: guidewire-cda, guidewire-delta (pre-filled) │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Step 5: Start Job                                      │
│  • Click "Start Processing"                             │
│  ✅ Job runs locally with MinIO                         │
│  ✅ Monitor progress in real-time                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Step 6: Verify Results                                 │
│  • View results in UI                                   │
│  • Check MinIO console at http://127.0.0.1:9001        │
│  • Verify Delta tables in guidewire-delta/target/       │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Comparison

```
Local Development                   Production Deployment
─────────────────                   ─────────────────────

S3 Provider: MinIO                  S3 Provider: AWS S3
Endpoint: http://127.0.0.1:9000     Endpoint: (default AWS)
SSL: Disabled                       SSL: Enabled
Cost: $0                            Cost: Pay per use
Speed: Instant (local)              Speed: Network latency
Setup: Docker container             Setup: AWS account

Buckets:                            Buckets:
• guidewire-cda                     • sumanmisra
• guidewire-delta                   • sumanmisra

Data:                               Data:
• Test data                         • Production data
• Mock CDA manifests                • Real CDA manifests
• Sample tables                     • All Guidewire tables

Environment:                        Environment:
S3_PROVIDER=local                   S3_PROVIDER=aws
MINIO_ENDPOINT=...                  AWS_ACCESS_KEY_ID=...
MINIO_ACCESS_KEY=minioadmin         AWS_SECRET_ACCESS_KEY=...
MINIO_SECRET_KEY=minioadmin         AWS_REGION=us-east-1
```

---

## Key Design Decisions

### 1. **Single S3Config Model**
   - Unified configuration for both providers
   - Provider enum controls behavior
   - Properties adapt based on provider

### 2. **S3ClientFactory Pattern**
   - Abstracts boto3 client creation
   - Handles provider-specific configuration
   - Easy to test and mock

### 3. **Environment Variable Strategy**
   - Different prefixes for different providers
   - MINIO_* for local, AWS_* for production
   - S3_PROVIDER switches behavior

### 4. **Backward Compatibility**
   - Legacy properties in GuidewireConfig
   - Gradual migration path
   - No breaking changes to existing jobs

### 5. **Frontend Tabs**
   - Clear visual separation
   - Provider-specific fields
   - Smart defaults for each provider

---

## Security Considerations

```
Local (MinIO)                       Production (AWS)
─────────────                       ────────────────

✅ No AWS credentials needed         ✅ AWS credentials required
✅ Data stays local                  ✅ Data in AWS account
✅ No network exposure               ⚠️  Network-accessible
✅ Development only                  ✅ Production-ready
⚠️  No authentication by default    ✅ IAM roles/policies
⚠️  HTTP (no TLS)                   ✅ HTTPS (TLS)
```

**Best Practices:**
- Never use MinIO credentials in production
- Never commit `.env.local` with credentials
- Use IAM roles in Databricks for AWS
- Rotate credentials regularly
- Use secrets management for production

---

## Performance Comparison

```
Operation              MinIO (Local)    AWS S3
─────────────────────  ───────────────  ─────────────
List buckets           <10ms            50-200ms
Upload 1MB file        <50ms            200-500ms
Download 1MB file      <50ms            200-500ms
Read manifest (10MB)   <100ms           500-1000ms
Process 50 tables      2-5 min          3-8 min

Network Latency        0ms              50-150ms
Throughput             ~1GB/s           50-100MB/s
Cost                   $0               $0.023/GB
```

**Advantages of Local S3:**
- ⚡ Instant feedback
- 💰 Zero cost
- 🔒 Complete control
- 🧪 Easy testing
- 📦 Reproducible
