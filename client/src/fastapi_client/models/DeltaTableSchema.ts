/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeltaColumn } from './DeltaColumn';
/**
 * Delta table schema information.
 */
export type DeltaTableSchema = {
    /**
     * Table name
     */
    table_name: string;
    /**
     * List of columns
     */
    columns: Array<DeltaColumn>;
    /**
     * Partition columns
     */
    partition_columns?: Array<string>;
};

