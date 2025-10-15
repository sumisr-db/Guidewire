# Output Location Fix for Guidewire Batch Jobs

## Problem

When running Guidewire CDA processing jobs, all Delta tables were being written to the **root of the S3 bucket** instead of the configured `target_prefix` subdirectory (e.g., `target/`).

**Expected behavior**: Tables should be written to `s3://sumanmisra/target/{table_name}/`

**Actual behavior**: Tables were being written to `s3://sumanmisra/{table_name}/`

## Root Cause

The `guidewire_service.py` file was only setting the `AWS_TARGET_S3_BUCKET` environment variable but **NOT** the `AWS_TARGET_S3_PREFIX` environment variable that the Guidewire processor uses to determine the subdirectory.

### How the Guidewire Processor Works

From `guidewire/processor.py`:

```python
elif target_cloud == "aws":
    # Use target-prefixed S3 bucket with fallback
    self.log_storage_account = (os.environ.get("AWS_TARGET_S3_BUCKET") or
                               os.environ.get("AWS_S3_BUCKET"))
    self.log_storage_container = None  # S3 doesn't use containers
    self.subfolder = (os.environ.get("AWS_TARGET_S3_PREFIX") or
                     os.environ.get("AWS_S3_PREFIX"))
```

The processor looks for **two environment variables**:
1. `AWS_TARGET_S3_BUCKET` - The bucket name (e.g., "sumanmisra")
2. `AWS_TARGET_S3_PREFIX` - The prefix/subfolder (e.g., "target/")

**Without the prefix variable set, tables are written to the bucket root.**

## Solution

### Code Fix (server/services/guidewire_service.py:55)

**Before**:
```python
env_vars = {
  'AWS_ACCESS_KEY_ID': s3_config.access_key_id,
  'AWS_SECRET_ACCESS_KEY': s3_config.secret_access_key,
  'AWS_REGION': s3_config.region,
  'RAY_DEDUP_LOGS': config.ray_dedup_logs,
  'AWS_MANIFEST_LOCATION': manifest_location,
  'AWS_TARGET_S3_BUCKET': s3_config.target_bucket,
  # ❌ Missing: AWS_TARGET_S3_PREFIX
}
```

**After**:
```python
env_vars = {
  'AWS_ACCESS_KEY_ID': s3_config.access_key_id,
  'AWS_SECRET_ACCESS_KEY': s3_config.secret_access_key,
  'AWS_REGION': s3_config.region,
  'RAY_DEDUP_LOGS': config.ray_dedup_logs,
  'AWS_MANIFEST_LOCATION': manifest_location,
  'AWS_TARGET_S3_BUCKET': s3_config.target_bucket,
  'AWS_TARGET_S3_PREFIX': s3_config.target_prefix,  # ✅ Added
}
```

## How to Specify Output Location

### Current Default Configuration

The `S3Config` model has these defaults (from `server/models/s3_config.py`):

```python
manifest_prefix: str = Field(default='cda/', ...)  # Default is "cda/"
target_prefix: str = Field(default='target/', ...)  # Default is "target/"
```

This means:
- **Default manifest location**: `s3://bucket/cda/`
- **Default output location**: `s3://bucket/target/`
- Tables will be created at: `s3://bucket/target/{table_name}/`

### UI Configuration (UPDATED)

The job configuration form now includes dedicated fields for both prefixes:

**In the "Start New Job" form:**
1. **Manifest Prefix**: Location where CDA manifest files are stored (default: `cda/`)
2. **Target Prefix**: Output location for Delta tables (default: `target/`)

Both fields are:
- Visible in both Local MinIO and AWS S3 tabs
- Required fields with validation
- Include helpful descriptions below the input
- Pre-filled with sensible defaults

**Example UI values:**
```
Manifest Bucket: sumanmisra
Manifest Prefix: cda/           ← Location of CDA manifest files
Target Bucket:   sumanmisra
Target Prefix:   target/        ← Output location for Delta tables
```

**Result**: Tables will be written to `s3://sumanmisra/target/{table_name}/`

### Customizing Output Location

You can customize the output location in three ways:

#### Option 1: Via UI Form (Recommended)

Simply change the "Target Prefix" field when starting a new job:

**For environment-based separation:**
```
Target Prefix: dev/target/      → s3://bucket/dev/target/
Target Prefix: prod/target/     → s3://bucket/prod/target/
```

**For date-based organization:**
```
Target Prefix: 2025-01-15/      → s3://bucket/2025-01-15/
```

**For project-based structure:**
```
Target Prefix: projects/claims/ → s3://bucket/projects/claims/
```

#### Option 2: Via API Request

When starting a job through the API, specify the `target_prefix` in the S3 configuration:

```typescript
// Frontend (GuidewireJobsPage.tsx)
const jobConfig = {
  s3_config: {
    provider: 'aws',
    access_key_id: '...',
    secret_access_key: '...',
    region: 'us-east-1',
    manifest_bucket: 'sumanmisra',
    target_bucket: 'sumanmisra',
    manifest_prefix: 'cda/',
    target_prefix: 'my-custom-output/',  // <-- Customize here
    use_ssl: true,
    verify_ssl: true
  },
  // ... other config
};
```

**Result**: Tables will be written to `s3://sumanmisra/my-custom-output/{table_name}/`

#### Option 3: Using Combined Bucket/Prefix Format

The `S3Config` model supports specifying prefix directly in the bucket name:

```typescript
const jobConfig = {
  s3_config: {
    target_bucket: 'sumanmisra/my-custom-output',  // <-- Combined format
    // target_prefix will be automatically extracted
  }
};
```

The `_normalize_bucket_and_prefix` validator will automatically split this into:
- `target_bucket`: "sumanmisra"
- `target_prefix`: "my-custom-output/"

**Note**: Using the UI form (Option 1) is recommended for clarity and ease of use.

## Common Output Location Patterns

### Pattern 1: Environment-Based Prefixes
```
target_prefix: 'dev/target/'     → s3://bucket/dev/target/
target_prefix: 'staging/target/' → s3://bucket/staging/target/
target_prefix: 'prod/target/'    → s3://bucket/prod/target/
```

### Pattern 2: Date-Based Prefixes
```
target_prefix: 'target/2025-01-15/' → s3://bucket/target/2025-01-15/
target_prefix: 'target/january/'    → s3://bucket/target/january/
```

### Pattern 3: Project-Based Prefixes
```
target_prefix: 'projects/claims/target/'    → s3://bucket/projects/claims/target/
target_prefix: 'projects/billing/target/'   → s3://bucket/projects/billing/target/
```

## Verification

After starting a job with a custom `target_prefix`, you can verify the output location:

### Method 1: Check Job Configuration
```bash
curl http://localhost:8000/api/guidewire/jobs/{job_id} | jq '.config.s3_config.target_prefix'
```

### Method 2: List S3 Objects
```bash
aws s3 ls s3://sumanmisra/my-custom-output/ --recursive
```

### Method 3: Use Delta Inspector
Navigate to the Delta Inspector page and list tables with the custom prefix location.

## Migration Notes

### Cleaning Up Misplaced Tables

If you have tables that were written to the bucket root before this fix, you'll need to move or delete them:

#### Option A: Move Tables to Correct Location
```bash
# List misplaced tables in bucket root
aws s3 ls s3://sumanmisra/ | grep claim

# Move each table to target/ prefix
aws s3 mv s3://sumanmisra/claim_401000005/ \
          s3://sumanmisra/target/claim_401000005/ \
          --recursive
```

#### Option B: Delete and Reprocess
```bash
# Delete misplaced tables
aws s3 rm s3://sumanmisra/claim_401000005/ --recursive

# Start a new job with correct configuration
# Tables will be written to the right location
```

## Technical Details

### Environment Variables Used by Guidewire Processor

The processor checks environment variables in this order (with fallbacks):

**For target location (where Delta tables are written)**:
1. `AWS_TARGET_S3_BUCKET` (preferred)
2. `AWS_S3_BUCKET` (fallback)

**For target prefix (subdirectory)**:
1. `AWS_TARGET_S3_PREFIX` (preferred)
2. `AWS_S3_PREFIX` (fallback)

**For manifest location (where CDA files are read from)**:
- `AWS_MANIFEST_LOCATION` (required, format: `bucket/prefix`)

### Full Path Construction

The processor constructs the full Delta table path as:
```
s3://{AWS_TARGET_S3_BUCKET}/{AWS_TARGET_S3_PREFIX}/{table_name}/
```

Example:
- `AWS_TARGET_S3_BUCKET` = "sumanmisra"
- `AWS_TARGET_S3_PREFIX` = "target/"
- `table_name` = "claim_401000005"
- **Result**: `s3://sumanmisra/target/claim_401000005/`

### Prefix Normalization

The `S3Config` model automatically normalizes prefixes to ensure they:
1. End with a trailing slash (`/`)
2. Don't have leading slashes
3. Are consistent across API calls

```python
# All of these result in the same normalized prefix:
target_prefix='target'    → 'target/'
target_prefix='target/'   → 'target/'
target_prefix='/target'   → 'target/'
target_prefix='/target/'  → 'target/'
```

## Testing

To test the fix:

1. **Start a new job** with a unique `target_prefix`:
```typescript
{
  s3_config: {
    target_prefix: 'test-output-location/'
  }
}
```

2. **Check the logs** for environment variable confirmation:
```
Environment configured for S3 provider: aws,
Manifest: s3://sumanmisra/cda,
Target: s3://sumanmisra/test-output-location
```

3. **Verify S3 output**:
```bash
aws s3 ls s3://sumanmisra/test-output-location/
```

You should see Delta tables created in the specified location.

## Related Files

### Backend Changes
- **Model Definition**: `server/models/s3_config.py` - S3Config model with target_prefix field
- **Service Implementation**: `server/services/guidewire_service.py` - Environment variable setup (Line 55: added `AWS_TARGET_S3_PREFIX`)
- **Guidewire Processor**: `guidewire/processor.py` (in wheel package) - Reads AWS_TARGET_S3_PREFIX

### Frontend Changes
- **UI Component**: `client/src/pages/GuidewireJobsPage.tsx` - Added manifest_prefix and target_prefix input fields
  - Lines 386-398: Manifest Prefix field (Local MinIO tab)
  - Lines 413-425: Target Prefix field (Local MinIO tab)
  - Lines 492-504: Manifest Prefix field (AWS S3 tab)
  - Lines 519-531: Target Prefix field (AWS S3 tab)

## Summary of Changes

### What Was Fixed
1. **Backend**: Added `AWS_TARGET_S3_PREFIX` environment variable to guidewire_service.py
2. **Frontend**: Added "Manifest Prefix" and "Target Prefix" input fields to job configuration form
3. **Documentation**: Created comprehensive guide for output location configuration

### User Benefits
- ✅ Users can now specify custom output locations through the UI
- ✅ No more tables written to bucket root
- ✅ Support for environment-based, date-based, and project-based organization
- ✅ Clear visual feedback with field descriptions
- ✅ Validated inputs with sensible defaults

### Backward Compatibility
- ✅ Existing jobs continue to work with default `target/` prefix
- ✅ No breaking changes to API or data structures
- ✅ All existing Delta tables remain accessible

---

**Fix Applied**: 2025-10-15
**Impact**: All new jobs will now respect the `target_prefix` configuration
**Breaking Changes**: None (existing jobs use default 'target/' prefix)
**UI Update**: Users can now configure output location directly in the job form
