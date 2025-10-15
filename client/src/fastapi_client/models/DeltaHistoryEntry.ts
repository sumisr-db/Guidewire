/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Delta table history entry.
 */
export type DeltaHistoryEntry = {
    /**
     * Table version number
     */
    version: number;
    /**
     * Operation timestamp
     */
    timestamp: string;
    /**
     * Operation type (e.g., WRITE, MERGE)
     */
    operation: string;
    /**
     * Operation parameters
     */
    operation_parameters?: (Record<string, any> | null);
    /**
     * User who made change
     */
    user_identity?: (string | null);
    /**
     * Notebook ID
     */
    notebook_id?: (string | null);
    /**
     * Cluster ID
     */
    cluster_id?: (string | null);
    /**
     * Read version
     */
    read_version?: (number | null);
    /**
     * Isolation level
     */
    isolation_level?: (string | null);
    /**
     * Whether operation was blind append
     */
    is_blind_append?: (boolean | null);
};

