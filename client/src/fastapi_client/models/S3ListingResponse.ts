/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { S3Object } from './S3Object';
import type { S3Prefix } from './S3Prefix';
/**
 * Response for S3 listing operations.
 */
export type S3ListingResponse = {
    /**
     * Bucket name
     */
    bucket: string;
    /**
     * Current prefix/path
     */
    prefix: string;
    /**
     * Sub-folders in current path
     */
    prefixes?: Array<S3Prefix>;
    /**
     * Objects in current path
     */
    objects?: Array<S3Object>;
    /**
     * Total number of objects
     */
    total_objects?: number;
    /**
     * Total size in bytes
     */
    total_size?: number;
};

