#!/bin/bash
# Setup MinIO for local S3 development

set -e

echo "🚀 Setting up MinIO for local S3 development..."
echo ""

# Configuration
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"
MINIO_DATA_DIR="${MINIO_DATA_DIR:-$HOME/minio-data}"
MINIO_CONTAINER_NAME="minio"
MINIO_S3_PORT=9000
MINIO_CONSOLE_PORT=9001

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

# Stop and remove existing MinIO container if it exists
if docker ps -a --format '{{.Names}}' | grep -q "^${MINIO_CONTAINER_NAME}$"; then
  echo "🔄 Stopping existing MinIO container..."
  docker stop ${MINIO_CONTAINER_NAME} > /dev/null 2>&1 || true
  docker rm ${MINIO_CONTAINER_NAME} > /dev/null 2>&1 || true
fi

# Create data directory
echo "📁 Creating MinIO data directory: ${MINIO_DATA_DIR}"
mkdir -p "${MINIO_DATA_DIR}"

# Start MinIO container
echo "🐳 Starting MinIO container..."
docker run -d --name ${MINIO_CONTAINER_NAME} \
  -p ${MINIO_S3_PORT}:9000 \
  -p ${MINIO_CONSOLE_PORT}:9001 \
  -v "${MINIO_DATA_DIR}:/data" \
  -e MINIO_ROOT_USER=${MINIO_ROOT_USER} \
  -e MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD} \
  minio/minio server /data --console-address ":9001"

echo "⏳ Waiting for MinIO to start..."
sleep 5

# Check if MinIO is healthy
if curl -sf http://127.0.0.1:${MINIO_S3_PORT}/minio/health/ready > /dev/null; then
  echo "✅ MinIO is running!"
else
  echo "❌ MinIO failed to start. Check logs with: docker logs ${MINIO_CONTAINER_NAME}"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ MinIO is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 S3 API:        http://127.0.0.1:${MINIO_S3_PORT}"
echo "📍 Web Console:   http://127.0.0.1:${MINIO_CONSOLE_PORT}"
echo "🔑 Username:      ${MINIO_ROOT_USER}"
echo "🔑 Password:      ${MINIO_ROOT_PASSWORD}"
echo "📁 Data Location: ${MINIO_DATA_DIR}"
echo ""

# Install MinIO client if needed
if ! command -v mc &> /dev/null; then
  echo "📦 MinIO client (mc) not found. Installing..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install minio/stable/mc
  else
    echo "⚠️  Please install MinIO client manually:"
    echo "   https://min.io/docs/minio/linux/reference/minio-mc.html"
  fi
fi

# Configure MinIO client
if command -v mc &> /dev/null; then
  echo "🔧 Configuring MinIO client..."
  mc alias set local http://127.0.0.1:${MINIO_S3_PORT} ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} --api S3v4 > /dev/null 2>&1 || true

  # Create default buckets
  echo "📦 Creating default buckets..."
  mc mb local/guidewire-cda --ignore-existing 2>/dev/null || true
  mc mb local/guidewire-delta --ignore-existing 2>/dev/null || true

  echo "✅ Created buckets:"
  echo "   • guidewire-cda (for CDA manifests)"
  echo "   • guidewire-delta (for Delta tables)"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 MinIO setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next steps:"
echo "   1. Open web console: http://127.0.0.1:${MINIO_CONSOLE_PORT}"
echo "   2. Configure your .env.local with:"
echo ""
echo "      S3_PROVIDER=local"
echo "      MINIO_ENDPOINT=http://127.0.0.1:${MINIO_S3_PORT}"
echo "      MINIO_ACCESS_KEY=${MINIO_ROOT_USER}"
echo "      MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}"
echo "      S3_MANIFEST_BUCKET=guidewire-cda"
echo "      S3_TARGET_BUCKET=guidewire-delta"
echo ""
echo "   3. Run: ./scripts/copy_test_data_from_aws.sh (to copy sample data)"
echo "   4. Start your app: ./watch.sh"
echo ""
echo "🛑 To stop MinIO:"
echo "   docker stop ${MINIO_CONTAINER_NAME}"
echo ""
echo "🗑️  To remove MinIO and data:"
echo "   docker stop ${MINIO_CONTAINER_NAME} && docker rm ${MINIO_CONTAINER_NAME}"
echo "   rm -rf ${MINIO_DATA_DIR}"
echo ""
