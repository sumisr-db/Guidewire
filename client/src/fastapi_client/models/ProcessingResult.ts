/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Result of processing a single table.
 */
export type ProcessingResult = {
    /**
     * Table name
     */
    table: string;
    /**
     * Processing start time
     */
    process_start_time: string;
    /**
     * Processing finish time
     */
    process_finish_time?: (string | null);
    /**
     * Starting watermark
     */
    process_start_watermark: number;
    /**
     * Ending watermark
     */
    process_finish_watermark?: (number | null);
    /**
     * Starting Delta version
     */
    process_start_version: number;
    /**
     * Ending Delta version
     */
    process_finish_version?: (number | null);
    /**
     * Number of records in manifest
     */
    manifest_records: number;
    /**
     * Manifest watermark
     */
    manifest_watermark: number;
    /**
     * List of watermarks
     */
    watermarks?: Array<number>;
    /**
     * List of schema timestamps
     */
    schema_timestamps?: Array<number>;
    /**
     * List of errors
     */
    errors?: (Array<string> | null);
    /**
     * List of warnings
     */
    warnings?: (Array<string> | null);
};

