/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Preview data from a Delta table.
 */
export type DeltaTablePreview = {
    /**
     * Table name
     */
    table_name: string;
    /**
     * Column names
     */
    columns: Array<string>;
    /**
     * Sample rows
     */
    rows: Array<Record<string, any>>;
    /**
     * Total row count (if available)
     */
    total_count?: (number | null);
    /**
     * Number of rows returned
     */
    limit?: number;
};

