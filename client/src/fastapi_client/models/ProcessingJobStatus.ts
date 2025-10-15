/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GuidewireConfig_Output } from './GuidewireConfig_Output';
import type { ProcessingResult } from './ProcessingResult';
/**
 * Status of a Guidewire processing job.
 */
export type ProcessingJobStatus = {
    /**
     * Unique job identifier
     */
    job_id: string;
    /**
     * Job status: pending, running, completed, failed, cancelled
     */
    status: string;
    /**
     * Job start time
     */
    start_time: string;
    /**
     * Job end time
     */
    end_time?: (string | null);
    /**
     * Job configuration
     */
    config: GuidewireConfig_Output;
    /**
     * Total number of tables to process
     */
    total_tables?: number;
    /**
     * Number of tables processed
     */
    tables_processed?: number;
    /**
     * Number of tables that failed
     */
    tables_failed?: number;
    /**
     * Current status message showing what the job is doing
     */
    current_message?: (string | null);
    /**
     * Processing results for each table
     */
    results?: Array<ProcessingResult>;
    /**
     * Error message if job failed
     */
    error_message?: (string | null);
    /**
     * Get job progress percentage.
     */
    readonly progress_percent: number;
    /**
     * Get job duration in seconds.
     */
    readonly duration_seconds: (number | null);
};

