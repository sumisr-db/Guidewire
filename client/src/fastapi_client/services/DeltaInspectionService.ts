/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeltaListTablesRequest } from '../models/DeltaListTablesRequest';
import type { DeltaTableHistory } from '../models/DeltaTableHistory';
import type { DeltaTableInfo } from '../models/DeltaTableInfo';
import type { DeltaTablePreview } from '../models/DeltaTablePreview';
import type { DeltaTableSchema } from '../models/DeltaTableSchema';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DeltaInspectionService {
    /**
     * List Delta Tables
     * List all Delta tables in an S3 location.
     *
     * Args:
     * request: S3 credentials and location
     *
     * Returns:
     * List of Delta table information
     *
     * Example:
     * ```
     * POST /api/delta/tables
     * {
         * "s3_bucket": "my-bucket",
         * "s3_prefix": "target/",
         * "access_key_id": "AKIA...",
         * "secret_access_key": "...",
         * "region": "us-east-1"
         * }
         * ```
         * @param requestBody
         * @returns DeltaTableInfo Successful Response
         * @throws ApiError
         */
        public static listDeltaTablesApiDeltaTablesPost(
            requestBody: DeltaListTablesRequest,
        ): CancelablePromise<Array<DeltaTableInfo>> {
            return __request(OpenAPI, {
                method: 'POST',
                url: '/api/delta/tables',
                body: requestBody,
                mediaType: 'application/json',
                errors: {
                    422: `Validation Error`,
                },
            });
        }
        /**
         * Get Table Schema
         * Get schema for a Delta table.
         *
         * Args:
         * request: S3 credentials
         * table_path: Full S3 path to Delta table (e.g., s3://bucket/path/table_name/)
         *
         * Returns:
         * Table schema with columns and partition info
         *
         * Example:
         * ```
         * POST /api/delta/tables/schema?table_path=s3://bucket/target/claim_401000005/
         * {
             * "s3_bucket": "my-bucket",
             * "s3_prefix": "target/",
             * "access_key_id": "AKIA...",
             * "secret_access_key": "...",
             * "region": "us-east-1"
             * }
             * ```
             * @param tablePath S3 path to Delta table
             * @param requestBody
             * @returns DeltaTableSchema Successful Response
             * @throws ApiError
             */
            public static getTableSchemaApiDeltaTablesSchemaPost(
                tablePath: string,
                requestBody: DeltaListTablesRequest,
            ): CancelablePromise<DeltaTableSchema> {
                return __request(OpenAPI, {
                    method: 'POST',
                    url: '/api/delta/tables/schema',
                    query: {
                        'table_path': tablePath,
                    },
                    body: requestBody,
                    mediaType: 'application/json',
                    errors: {
                        422: `Validation Error`,
                    },
                });
            }
            /**
             * Get Table History
             * Get version history for a Delta table.
             *
             * Args:
             * request: S3 credentials
             * table_path: Full S3 path to Delta table
             *
             * Returns:
             * Table history with all versions
             *
             * Example:
             * ```
             * POST /api/delta/tables/history?table_path=s3://bucket/target/claim_401000005/
             * {
                 * "s3_bucket": "my-bucket",
                 * "s3_prefix": "target/",
                 * "access_key_id": "AKIA...",
                 * "secret_access_key": "...",
                 * "region": "us-east-1"
                 * }
                 * ```
                 * @param tablePath S3 path to Delta table
                 * @param requestBody
                 * @returns DeltaTableHistory Successful Response
                 * @throws ApiError
                 */
                public static getTableHistoryApiDeltaTablesHistoryPost(
                    tablePath: string,
                    requestBody: DeltaListTablesRequest,
                ): CancelablePromise<DeltaTableHistory> {
                    return __request(OpenAPI, {
                        method: 'POST',
                        url: '/api/delta/tables/history',
                        query: {
                            'table_path': tablePath,
                        },
                        body: requestBody,
                        mediaType: 'application/json',
                        errors: {
                            422: `Validation Error`,
                        },
                    });
                }
                /**
                 * Get Table Preview
                 * Get preview data from a Delta table.
                 *
                 * Args:
                 * request: S3 credentials
                 * table_path: Full S3 path to Delta table
                 * limit: Number of rows to return (default: 100)
                 *
                 * Returns:
                 * Sample data from table
                 *
                 * Example:
                 * ```
                 * POST /api/delta/tables/preview?table_path=s3://bucket/target/claim_401000005/&limit=50
                 * {
                     * "s3_bucket": "my-bucket",
                     * "s3_prefix": "target/",
                     * "access_key_id": "AKIA...",
                     * "secret_access_key": "...",
                     * "region": "us-east-1"
                     * }
                     * ```
                     * @param tablePath S3 path to Delta table
                     * @param requestBody
                     * @param limit Number of rows to return
                     * @returns DeltaTablePreview Successful Response
                     * @throws ApiError
                     */
                    public static getTablePreviewApiDeltaTablesPreviewPost(
                        tablePath: string,
                        requestBody: DeltaListTablesRequest,
                        limit: number = 100,
                    ): CancelablePromise<DeltaTablePreview> {
                        return __request(OpenAPI, {
                            method: 'POST',
                            url: '/api/delta/tables/preview',
                            query: {
                                'table_path': tablePath,
                                'limit': limit,
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
                     * Health check endpoint for Delta inspection service.
                     * @returns any Successful Response
                     * @throws ApiError
                     */
                    public static healthCheckApiDeltaHealthGet(): CancelablePromise<Record<string, any>> {
                        return __request(OpenAPI, {
                            method: 'GET',
                            url: '/api/delta/health',
                        });
                    }
                }
