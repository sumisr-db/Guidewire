/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { server__models__s3_browser__S3Provider } from './server__models__s3_browser__S3Provider';
/**
 * Simple S3 credentials for browser operations.
 */
export type S3Credentials = {
    /**
     * S3 provider
     */
    provider?: server__models__s3_browser__S3Provider;
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
    /**
     * S3 endpoint URL (for MinIO)
     */
    endpoint_url?: (string | null);
    /**
     * Use SSL for connections
     */
    use_ssl?: boolean;
    /**
     * Verify SSL certificates
     */
    verify_ssl?: boolean;
};

