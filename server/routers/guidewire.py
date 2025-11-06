"""FastAPI router for Guidewire CDA processing endpoints."""

import asyncio
import glob
import os
from typing import List

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from server.models.guidewire import (
  ProcessingJobStatus,
  ProcessingJobSummary,
  StartJobRequest,
  StartJobResponse,
)
from server.services.guidewire_service import guidewire_service

router = APIRouter(prefix='/api/guidewire', tags=['guidewire'])


@router.post('/jobs/start', response_model=StartJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_processing_job(request: StartJobRequest) -> StartJobResponse:
  """Start a new Guidewire CDA to Delta Lake processing job.

  This endpoint initiates a new processing job that runs in the background
  using Ray for parallel table processing.

  Args:
      request: Job configuration including AWS credentials and processing options

  Returns:
      StartJobResponse with job ID and initial status

  Example:
      ```
      POST /api/guidewire/jobs/start
      {
        "config": {
          "aws_access_key_id": "AKIA...",
          "aws_secret_access_key": "...",
          "aws_region": "us-east-1",
          "manifest_bucket": "sumanmisra",
          "manifest_prefix": "cda/",
          "target_bucket": "sumanmisra",
          "target_prefix": "target/",
          "parallel": true,
          "show_progress": true
        }
      }
      ```
  """
  try:
    response = await guidewire_service.start_job(request.config)
    return response
  except Exception as e:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail=f'Failed to start processing job: {str(e)}',
    )


@router.get('/jobs', response_model=List[ProcessingJobSummary])
async def list_jobs() -> List[ProcessingJobSummary]:
  """List all Guidewire processing jobs.

  Returns summary information for all jobs (without detailed results).

  Returns:
      List of job summaries
  """
  jobs = guidewire_service.list_jobs()
  return [
    ProcessingJobSummary(
      job_id=job.job_id,
      status=job.status,
      start_time=job.start_time,
      end_time=job.end_time,
      total_tables=job.total_tables,
      tables_processed=job.tables_processed,
      tables_failed=job.tables_failed,
      progress_percent=job.progress_percent,
      duration_seconds=job.duration_seconds,
      current_message=job.current_message,
    )
    for job in jobs
  ]


@router.get('/jobs/{job_id}', response_model=ProcessingJobStatus)
async def get_job_status(job_id: str) -> ProcessingJobStatus:
  """Get detailed status of a specific processing job.

  Args:
      job_id: Unique job identifier

  Returns:
      Complete job status including results for each table

  Raises:
      404: Job not found
  """
  job_status = guidewire_service.get_job_status(job_id)
  if not job_status:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f'Job {job_id} not found')
  return job_status


@router.delete('/jobs/{job_id}', status_code=status.HTTP_204_NO_CONTENT)
async def cancel_job(job_id: str) -> None:
  """Cancel a running processing job.

  Note: This is a best-effort cancellation. The job status will be updated
  to 'cancelled', but some Ray tasks may continue to completion.

  Args:
      job_id: Unique job identifier

  Raises:
      404: Job not found
      400: Job cannot be cancelled (not in pending or running state)
  """
  success = guidewire_service.cancel_job(job_id)
  if not success:
    job_status = guidewire_service.get_job_status(job_id)
    if not job_status:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f'Job {job_id} not found')
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f'Job {job_id} cannot be cancelled (status: {job_status.status})',
    )


@router.get('/health')
async def health_check() -> dict:
  """Health check endpoint for Guidewire service.

  Returns:
      Service health status
  """
  return {
    'service': 'guidewire',
    'status': 'healthy',
    'active_jobs': len([j for j in guidewire_service.list_jobs() if j.status == 'running']),
    'total_jobs': len(guidewire_service.list_jobs()),
  }


@router.get('/jobs/{job_id}/ray-logs')
async def stream_ray_logs(job_id: str):
  """Stream Ray logs for a specific job in real-time.

  This endpoint provides Server-Sent Events (SSE) streaming of Ray logs
  for the specified job. It tails the most recent Ray log files.

  Args:
      job_id: Unique job identifier

  Returns:
      StreamingResponse with text/event-stream content type

  Raises:
      404: Job not found
  """
  job_status = guidewire_service.get_job_status(job_id)
  if not job_status:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f'Job {job_id} not found')

  async def log_stream():
    """Generator for streaming Ray logs."""
    try:
      # Find Ray session directory
      ray_session_dirs = glob.glob('/tmp/ray/session_*/logs')
      if not ray_session_dirs:
        yield 'data: No Ray logs found\\n\\n'
        return

      # Use the most recent session
      ray_log_dir = max(ray_session_dirs, key=os.path.getmtime)

      # Get all log files sorted by modification time
      log_files = glob.glob(f'{ray_log_dir}/*.log')
      if not log_files:
        yield f'data: No log files found in {ray_log_dir}\\n\\n'
        return

      # Focus on driver and worker logs (most relevant for debugging)
      driver_logs = [f for f in log_files if 'driver' in f]
      worker_logs = [f for f in log_files if 'worker' in f]
      relevant_logs = driver_logs + worker_logs[:3]  # Driver + first 3 workers

      if not relevant_logs:
        relevant_logs = sorted(log_files, key=os.path.getmtime)[-5:]  # Last 5 files

      # Send initial metadata
      yield f'data: [Ray Logs] Streaming from {len(relevant_logs)} log files\\n\\n'

      # Track file positions
      file_positions = {log_file: 0 for log_file in relevant_logs}

      # Stream logs with polling
      max_iterations = 300  # 5 minutes at 1 second intervals
      iteration = 0

      while iteration < max_iterations:
        has_new_content = False

        for log_file in relevant_logs:
          if not os.path.exists(log_file):
            continue

          try:
            with open(log_file, 'r') as f:
              # Seek to last position
              f.seek(file_positions[log_file])

              # Read new lines
              new_lines = f.readlines()
              if new_lines:
                has_new_content = True
                log_name = os.path.basename(log_file)

                for line in new_lines:
                  # Filter out noise - only show relevant lines
                  line = line.strip()
                  if any(
                    keyword in line
                    for keyword in [
                      'ERROR',
                      'Exception',
                      'Failed',
                      'Table',
                      'Processing',
                      'manifest',
                      'S3',
                      'Delta',
                      'INFO',
                      'WARNING',
                    ]
                  ):
                    # Send as SSE
                    yield f'data: [{log_name}] {line}\\n\\n'

              # Update position
              file_positions[log_file] = f.tell()

          except Exception as e:
            yield f'data: [Error] Failed to read {log_file}: {str(e)}\\n\\n'

        # Check if job is still running
        current_status = guidewire_service.get_job_status(job_id)
        if current_status and current_status.status not in ['running', 'pending']:
          yield f'data: [Status] Job {current_status.status}. Stopping log stream.\\n\\n'
          break

        # Wait before next iteration
        await asyncio.sleep(1)
        iteration += 1

        # Send keepalive if no new content
        if not has_new_content and iteration % 10 == 0:
          yield f'data: [Keepalive] Monitoring logs... ({iteration}s)\\n\\n'

      yield 'data: [Stream] Log streaming completed\\n\\n'

    except Exception as e:
      yield f'data: [Error] Stream error: {str(e)}\\n\\n'

  return StreamingResponse(log_stream(), media_type='text/event-stream')
