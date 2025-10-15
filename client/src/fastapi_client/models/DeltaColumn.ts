/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Delta table column information.
 */
export type DeltaColumn = {
    /**
     * Column name
     */
    name: string;
    /**
     * Data type
     */
    type: string;
    /**
     * Whether column is nullable
     */
    nullable?: boolean;
    /**
     * Column metadata
     */
    metadata?: (Record<string, any> | null);
};

