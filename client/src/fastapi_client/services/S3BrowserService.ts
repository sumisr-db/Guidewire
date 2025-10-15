/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { S3BucketInfo } from '../models/S3BucketInfo';
import type { S3Credentials } from '../models/S3Credentials';
import type { S3ListingResponse } from '../models/S3ListingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class S3BrowserService {
    /**
     * List Buckets
     * List all S3 buckets.
     *
     * Args:
     * s3_config: S3 configuration with credentials
     *
     * Returns:
     * List of S3 bucket information
     *
     * Example:
     * ```
     * POST /api/s3/buckets
     * {
         * "provider": "aws",
         * "access_key_id": "AKIA...",
         * "secret_access_key": "...",
         * "region": "us-east-1"
         * }
         * ```
         * @param requestBody
         * @returns S3BucketInfo Successful Response
         * @throws ApiError
         */
        public static listBucketsApiS3BucketsPost(
            requestBody: S3Credentials,
        ): CancelablePromise<Array<S3BucketInfo>> {
            return __request(OpenAPI, {
                method: 'POST',
                url: '/api/s3/buckets',
                body: requestBody,
                mediaType: 'application/json',
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * List Objects
         * List objects in an S3 bucket.
         *
         * Args:
         * s3_config: S3 configuration with credentials
         * bucket: Bucket name to browse
         * prefix: Prefix/path to filter objects (optional)
         * max_keys: Maximum number of keys to return (default: 1000)
         *
         * Returns:
         * S3ListingResponse with folders (prefixes) and objects
         *
         * Example:
         * ```
         * POST /api/s3/list?bucket=my-bucket&prefix=cda/
         * {
             * "provider": "aws",
             * "access_key_id": "AKIA...",
             * "secret_access_key": "...",
             * "region": "us-east-1"
             * }
             * ```
             * @param bucket Bucket name
             * @param requestBody
             * @param prefix Prefix/path to list
             * @param maxKeys Maximum keys to return
             * @returns S3ListingResponse Successful Response
             * @throws ApiError
             */
            public static listObjectsApiS3ListPost(
                bucket: string,
                requestBody: S3Credentials,
                prefix: string = '',
                maxKeys: number = 1000,
            ): CancelablePromise<S3ListingResponse> {
                return __request(OpenAPI, {
                    method: 'POST',
                    url: '/api/s3/list',
                    query: {
                        'bucket': bucket,
                        'prefix': prefix,
                        'max_keys': maxKeys,
                    },
                    body: requestBody,
                    mediaType: 'application/json',
                    errors: {
                        422: `Validation Error`,
                    },
                });
            }
            /**
             * Get Download Url
             * Generate a presigned URL for downloading an S3 object.
             *
             * Args:
             * s3_config: S3 configuration with credentials
             * bucket: Bucket name
             * key: Object key (full path)
             * expires_in: URL expiration time in seconds (default: 1 hour)
             *
             * Returns:
             * Dictionary with presigned URL
             *
             * Example:
             * ```
             * POST /api/s3/download-url?bucket=my-bucket&key=path/to/file.txt
             * {
                 * "provider": "aws",
                 * "access_key_id": "AKIA...",
                 * "secret_access_key": "...",
                 * "region": "us-east-1"
                 * }
                 * ```
                 * @param bucket Bucket name
                 * @param key Object key
                 * @param requestBody
                 * @param expiresIn URL expiration time in seconds
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static getDownloadUrlApiS3DownloadUrlPost(
                    bucket: string,
                    key: string,
                    requestBody: S3Credentials,
                    expiresIn: number = 3600,
                ): CancelablePromise<Record<string, any>> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/s3/download-url',
                        query: {
                            'bucket': bucket,
                            'key': key,
                            'expires_in': expiresIn,
                        },
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Health Check
                 * Health check endpoint for S3 browser service.
                 * @returns any Successful Response
                 * @throws ApiError
                 */
                public static healthCheckApiS3HealthGet(): CancelablePromise<Record<string, any>> {
                    return __request(OpenAPI, {
                        method: 'GET',
                        url: '/api/s3/health',
                    });
                }
            }
