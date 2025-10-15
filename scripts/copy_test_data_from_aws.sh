#!/bin/bash
# Copy sample CDA data from AWS S3 to local MinIO for development/testing

set -e

echo "📦 Copying sample CDA data from AWS S3 to local MinIO..."
echo ""

# Configuration
AWS_SOURCE_BUCKET="${AWS_SOURCE_BUCKET:-sumanmisra}"
AWS_SOURCE_PREFIX="${AWS_SOURCE_PREFIX:-cda}"
LOCAL_TARGET_BUCKET="guidewire-cda"
LOCAL_TARGET_PREFIX="cda"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI is not installed. Please install it first:"
  echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

# Check if MinIO client is installed
if ! command -v mc &> /dev/null; then
  echo "❌ MinIO client (mc) is not installed. Please run ./scripts/setup_minio.sh first"
  exit 1
fi

# Check if MinIO is running
if ! curl -sf http://127.0.0.1:9000/minio/health/ready > /dev/null 2>&1; then
  echo "❌ MinIO is not running. Please run ./scripts/setup_minio.sh first"
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "❌ AWS credentials not configured. Please run 'aws configure' first"
  exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Create temporary directory for downloading
TEMP_DIR=$(mktemp -d)
echo "📁 Using temporary directory: ${TEMP_DIR}"

# Trap to cleanup temp directory on exit
trap "rm -rf ${TEMP_DIR}" EXIT

# Download sample data from AWS S3
echo "⬇️  Downloading sample CDA data from AWS S3..."
echo "   Source: s3://${AWS_SOURCE_BUCKET}/${AWS_SOURCE_PREFIX}/"
echo ""

# List files first to show what will be copied
echo "📋 Available files in AWS S3:"
aws s3 ls "s3://${AWS_SOURCE_BUCKET}/${AWS_SOURCE_PREFIX}/" --recursive | head -20
echo ""

# Ask for confirmation
read -p "How many sample files to copy? (default: 10, 'all' for everything): " FILE_COUNT
FILE_COUNT=${FILE_COUNT:-10}

if [ "$FILE_COUNT" = "all" ]; then
  echo "📥 Downloading ALL files from AWS S3..."
  aws s3 sync "s3://${AWS_SOURCE_BUCKET}/${AWS_SOURCE_PREFIX}/" "${TEMP_DIR}/${LOCAL_TARGET_PREFIX}/"
else
  echo "📥 Downloading first ${FILE_COUNT} files from AWS S3..."

  # Get list of files and download first N
  aws s3 ls "s3://${AWS_SOURCE_BUCKET}/${AWS_SOURCE_PREFIX}/" --recursive | \
    head -${FILE_COUNT} | \
    awk '{print $4}' | \
    while read file; do
      aws s3 cp "s3://${AWS_SOURCE_BUCKET}/${file}" "${TEMP_DIR}/${file}"
    done
fi

echo "✅ Download complete"
echo ""

# Configure MinIO client if not already done
echo "🔧 Configuring MinIO client..."
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin --api S3v4 > /dev/null 2>&1 || true

# Create bucket if it doesn't exist
echo "📦 Ensuring bucket exists: ${LOCAL_TARGET_BUCKET}"
mc mb local/${LOCAL_TARGET_BUCKET} --ignore-existing 2>/dev/null || true

# Upload to MinIO
echo "⬆️  Uploading to MinIO..."
mc cp --recursive "${TEMP_DIR}/${LOCAL_TARGET_PREFIX}/" "local/${LOCAL_TARGET_BUCKET}/${LOCAL_TARGET_PREFIX}/"

echo "✅ Upload to MinIO complete"
echo ""

# Verify uploaded files
echo "📊 Verifying uploaded files..."
FILE_COUNT=$(mc ls local/${LOCAL_TARGET_BUCKET}/${LOCAL_TARGET_PREFIX}/ --recursive | wc -l | tr -d ' ')
echo "✅ Found ${FILE_COUNT} files in MinIO"
echo ""

# Show sample of uploaded files
echo "📋 Sample of uploaded files:"
mc ls local/${LOCAL_TARGET_BUCKET}/${LOCAL_TARGET_PREFIX}/ --recursive | head -10
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Sample data copy complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "   Source:      s3://${AWS_SOURCE_BUCKET}/${AWS_SOURCE_PREFIX}/"
echo "   Destination: local/${LOCAL_TARGET_BUCKET}/${LOCAL_TARGET_PREFIX}/"
echo "   Files:       ${FILE_COUNT}"
echo ""
echo "📝 Next steps:"
echo "   1. Start your app: ./watch.sh"
echo "   2. Open UI: http://localhost:5173"
echo "   3. Select 'Local S3 (MinIO)' tab"
echo "   4. Start a processing job"
echo ""
echo "💡 Tip: You can view the uploaded files in MinIO console:"
echo "   http://127.0.0.1:9001"
echo ""
