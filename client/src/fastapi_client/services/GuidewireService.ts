/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProcessingJobStatus } from '../models/ProcessingJobStatus';
import type { ProcessingJobSummary } from '../models/ProcessingJobSummary';
import type { StartJobRequest } from '../models/StartJobRequest';
import type { StartJobResponse } from '../models/StartJobResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GuidewireService {
    /**
     * Start Processing Job
     * Start a new Guidewire CDA to Delta Lake processing job.
     *
     * This endpoint initiates a new processing job that runs in the background
     * using Ray for parallel table processing.
     *
     * Args:
     * request: Job configuration including AWS credentials and processing options
     *
     * Returns:
     * StartJobResponse with job ID and initial status
     *
     * Example:
     * ```
     * POST /api/guidewire/jobs/start
     * {
         * "config": {
             * "aws_access_key_id": "AKIA...",
             * "aws_secret_access_key": "...",
             * "aws_region": "us-east-1",
             * "manifest_bucket": "sumanmisra",
             * "manifest_prefix": "cda/",
             * "target_bucket": "sumanmisra",
             * "target_prefix": "target/",
             * "parallel": true,
             * "show_progress": true
             * }
             * }
             * ```
             * @param requestBody
             * @returns StartJobResponse Successful Response
             * @throws ApiError
             */
            public static startProcessingJobApiGuidewireJobsStartPost(
                requestBody: StartJobRequest,
            ): CancelablePromise<StartJobResponse> {
                return __request(OpenAPI, {
                    method: 'POST',
                    url: '/api/guidewire/jobs/start',
                    body: requestBody,
                    mediaType: 'application/json',
                    errors: {
                        422: `Validation Error`,
                    },
                });
            }
            /**
             * List Jobs
             * List all Guidewire processing jobs.
             *
             * Returns summary information for all jobs (without detailed results).
             *
             * Returns:
             * List of job summaries
             * @returns ProcessingJobSummary Successful Response
             * @throws ApiError
             */
            public static listJobsApiGuidewireJobsGet(): CancelablePromise<Array<ProcessingJobSummary>> {
                return __request(OpenAPI, {
                    method: 'GET',
                    url: '/api/guidewire/jobs',
                });
            }
            /**
             * Get Job Status
             * Get detailed status of a specific processing job.
             *
             * Args:
             * job_id: Unique job identifier
             *
             * Returns:
             * Complete job status including results for each table
             *
             * Raises:
             * 404: Job not found
             * @param jobId
             * @returns ProcessingJobStatus Successful Response
             * @throws ApiError
             */
            public static getJobStatusApiGuidewireJobsJobIdGet(
                jobId: string,
            ): CancelablePromise<ProcessingJobStatus> {
                return __request(OpenAPI, {
                    method: 'GET',
                    url: '/api/guidewire/jobs/{job_id}',
                    path: {
                        'job_id': jobId,
                    },
                    errors: {
                        422: `Validation Error`,
                    },
                });
            }
            /**
             * Cancel Job
             * Cancel a running processing job.
             *
             * Note: This is a best-effort cancellation. The job status will be updated
             * to 'cancelled', but some Ray tasks may continue to completion.
             *
             * Args:
             * job_id: Unique job identifier
             *
             * Raises:
             * 404: Job not found
             * 400: Job cannot be cancelled (not in pending or running state)
             * @param jobId
             * @returns void
             * @throws ApiError
             */
            public static cancelJobApiGuidewireJobsJobIdDelete(
                jobId: string,
            ): CancelablePromise<void> {
                return __request(OpenAPI, {
                    method: 'DELETE',
                    url: '/api/guidewire/jobs/{job_id}',
                    path: {
                        'job_id': jobId,
                    },
                    errors: {
                        422: `Validation Error`,
                    },
                });
            }
            /**
             * Health Check
             * Health check endpoint for Guidewire service.
             *
             * Returns:
             * Service health status
             * @returns any Successful Response
             * @throws ApiError
             */
            public static healthCheckApiGuidewireHealthGet(): CancelablePromise<Record<string, any>> {
                return __request(OpenAPI, {
                    method: 'GET',
                    url: '/api/guidewire/health',
                });
            }
            /**
             * Stream Ray Logs
             * Stream Ray logs for a specific job in real-time.
             *
             * This endpoint provides Server-Sent Events (SSE) streaming of Ray logs
             * for the specified job. It tails the most recent Ray log files.
             *
             * Args:
             * job_id: Unique job identifier
             *
             * Returns:
             * StreamingResponse with text/event-stream content type
             *
             * Raises:
             * 404: Job not found
             * @param jobId
             * @returns any Successful Response
             * @throws ApiError
             */
            public static streamRayLogsApiGuidewireJobsJobIdRayLogsGet(
                jobId: string,
            ): CancelablePromise<any> {
                return __request(OpenAPI, {
                    method: 'GET',
                    url: '/api/guidewire/jobs/{job_id}/ray-logs',
                    path: {
                        'job_id': jobId,
                    },
                    errors: {
                        422: `Validation Error`,
                    },
                });
            }
        }
