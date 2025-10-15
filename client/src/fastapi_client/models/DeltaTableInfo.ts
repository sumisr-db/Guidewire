/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Information about a Delta table.
 */
export type DeltaTableInfo = {
    /**
     * Table name
     */
    name: string;
    /**
     * S3 path to Delta table
     */
    path: string;
    /**
     * Total size in bytes
     */
    size_bytes: number;
    /**
     * Number of data files
     */
    num_files: number;
    /**
     * Last modification time
     */
    last_modified?: (string | null);
};

