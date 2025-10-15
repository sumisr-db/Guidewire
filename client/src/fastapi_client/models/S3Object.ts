/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Represents an S3 object (file).
 */
export type S3Object = {
    /**
     * Object key (full path)
     */
    key: string;
    /**
     * Object name (basename)
     */
    name: string;
    /**
     * Object size in bytes
     */
    size: number;
    /**
     * Last modified timestamp
     */
    last_modified: string;
    /**
     * ETag of the object
     */
    etag?: (string | null);
    /**
     * Storage class
     */
    storage_class?: (string | null);
};

