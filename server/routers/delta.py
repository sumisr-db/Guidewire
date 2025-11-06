"""FastAPI router for Delta Lake inspection endpoints."""

from typing import List

from fastapi import APIRouter, HTTPException, Query, status

from server.models.delta import (
  DeltaListTablesRequest,
  DeltaTableHistory,
  DeltaTableInfo,
  DeltaTablePreview,
  DeltaTableSchema,
)
from server.services.delta_service import delta_service

router = APIRouter(prefix='/api/delta', tags=['delta-inspection'])


@router.post('/tables', response_model=List[DeltaTableInfo])
async def list_delta_tables(request: DeltaListTablesRequest) -> List[DeltaTableInfo]:
  """List all Delta tables in an S3 location.

  Args:
      request: S3 credentials and location

  Returns:
      List of Delta table information

  Example:
      ```
      POST /api/delta/tables
      {
        "s3_bucket": "my-bucket",
        "s3_prefix": "target/",
        "access_key_id": "AKIA...",
        "secret_access_key": "...",
        "region": "us-east-1"
      }
      ```
  """
  try:
    tables = delta_service.list_tables(request)
    return tables
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f'Failed to list Delta tables: {str(e)}',
    )


@router.post('/tables/schema', response_model=DeltaTableSchema)
async def get_table_schema(
  request: DeltaListTablesRequest,
  table_path: str = Query(..., description='S3 path to Delta table'),
) -> DeltaTableSchema:
  """Get schema for a Delta table.

  Args:
      request: S3 credentials
      table_path: Full S3 path to Delta table (e.g., s3://bucket/path/table_name/)

  Returns:
      Table schema with columns and partition info

  Example:
      ```
      POST /api/delta/tables/schema?table_path=s3://bucket/target/claim_401000005/
      {
        "s3_bucket": "my-bucket",
        "s3_prefix": "target/",
        "access_key_id": "AKIA...",
        "secret_access_key": "...",
        "region": "us-east-1"
      }
      ```
  """
  try:
    schema = delta_service.get_table_schema(table_path, request)
    return schema
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f'Failed to get table schema: {str(e)}',
    )


@router.post('/tables/history', response_model=DeltaTableHistory)
async def get_table_history(
  request: DeltaListTablesRequest,
  table_path: str = Query(..., description='S3 path to Delta table'),
) -> DeltaTableHistory:
  """Get version history for a Delta table.

  Args:
      request: S3 credentials
      table_path: Full S3 path to Delta table

  Returns:
      Table history with all versions

  Example:
      ```
      POST /api/delta/tables/history?table_path=s3://bucket/target/claim_401000005/
      {
        "s3_bucket": "my-bucket",
        "s3_prefix": "target/",
        "access_key_id": "AKIA...",
        "secret_access_key": "...",
        "region": "us-east-1"
      }
      ```
  """
  try:
    history = delta_service.get_table_history(table_path, request)
    return history
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f'Failed to get table history: {str(e)}',
    )


@router.post('/tables/preview', response_model=DeltaTablePreview)
async def get_table_preview(
  request: DeltaListTablesRequest,
  table_path: str = Query(..., description='S3 path to Delta table'),
  limit: int = Query(100, description='Number of rows to return'),
) -> DeltaTablePreview:
  """Get preview data from a Delta table.

  Args:
      request: S3 credentials
      table_path: Full S3 path to Delta table
      limit: Number of rows to return (default: 100)

  Returns:
      Sample data from table

  Example:
      ```
      POST /api/delta/tables/preview?table_path=s3://bucket/target/claim_401000005/&limit=50
      {
        "s3_bucket": "my-bucket",
        "s3_prefix": "target/",
        "access_key_id": "AKIA...",
        "secret_access_key": "...",
        "region": "us-east-1"
      }
      ```
  """
  try:
    preview = delta_service.get_table_preview(table_path, request, limit)
    return preview
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f'Failed to get table preview: {str(e)}',
    )


@router.get('/health')
async def health_check() -> dict:
  """Health check endpoint for Delta inspection service."""
  return {'service': 'delta-inspection', 'status': 'healthy'}
