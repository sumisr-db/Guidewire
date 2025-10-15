/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Summary of a processing job (without detailed results).
 */
export type ProcessingJobSummary = {
    job_id: string;
    status: string;
    start_time: string;
    end_time?: (string | null);
    total_tables?: number;
    tables_processed?: number;
    tables_failed?: number;
    progress_percent?: number;
    duration_seconds?: (number | null);
    current_message?: (string | null);
};

