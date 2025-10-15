/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeltaHistoryEntry } from './DeltaHistoryEntry';
/**
 * Complete history for a Delta table.
 */
export type DeltaTableHistory = {
    /**
     * Table name
     */
    table_name: string;
    /**
     * Current version number
     */
    current_version: number;
    /**
     * History entries
     */
    entries: Array<DeltaHistoryEntry>;
};

