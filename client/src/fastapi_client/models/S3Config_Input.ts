/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { server__models__s3_config__S3Provider } from './server__models__s3_config__S3Provider';
/**
 * S3 configuration for local (MinIO) or AWS S3.
 *
 * This model supports both local MinIO development and AWS S3 production
 * environments through a provider flag and conditional configuration.
 */
export type S3Config_Input = {
    /**
     * S3 provider: local (MinIO) or aws
     */
    provider?: server__models__s3_config__S3Provider;
    /**
     * S3 endpoint URL (required for MinIO, e.g., http://127.0.0.1:9000)
     */
    endpoint_url?: (string | null);
    /**
     * Access key ID
     */
    access_key_id: string;
    /**
     * Secret access key
     */
    secret_access_key: string;
    /**
     * AWS region
     */
    region?: string;
    /**
     * Bucket for CDA manifests
     */
    manifest_bucket: string;
    /**
     * Bucket for Delta tables
     */
    target_bucket: string;
    /**
     * Prefix for manifests in bucket
     */
    manifest_prefix?: string;
    /**
     * Prefix for Delta tables in bucket
     */
    target_prefix?: string;
    /**
     * Use SSL for S3 connections (typically False for local MinIO)
     */
    use_ssl?: boolean;
    /**
     * Verify SSL certificates (typically False for local MinIO)
     */
    verify_ssl?: boolean;
};

