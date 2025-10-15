/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { S3Config_Output } from './S3Config_Output';
/**
 * Configuration for Guidewire CDA processing.
 *
 * This configuration now supports both local S3 (MinIO) and AWS S3
 * through the s3_config field.
 */
export type GuidewireConfig_Output = {
    /**
     * S3 configuration (MinIO or AWS)
     */
    s3_config: S3Config_Output;
    /**
     * Ray dedup logs setting
     */
    ray_dedup_logs?: string;
    /**
     * Use Ray for parallel processing
     */
    parallel?: boolean;
    /**
     * Show progress tracking
     */
    show_progress?: boolean;
    /**
     * Specific tables to process (None = all)
     */
    table_names?: (Array<string> | null);
    /**
     * Tables to exclude from processing
     */
    exceptions?: (Array<string> | null);
    /**
     * Number of largest tables to process first
     */
    largest_tables_first_count?: (number | null);
};

