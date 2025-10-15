/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to list Delta tables.
 */
export type DeltaListTablesRequest = {
    /**
     * S3 bucket name
     */
    s3_bucket: string;
    /**
     * S3 prefix/path
     */
    s3_prefix: string;
    /**
     * AWS access key ID
     */
    access_key_id: string;
    /**
     * AWS secret access key
     */
    secret_access_key: string;
    /**
     * AWS region
     */
    region?: string;
};

