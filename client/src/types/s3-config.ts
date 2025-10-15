/**
 * TypeScript types for S3 configuration (MinIO and AWS)
 */

export type S3Provider = 'local' | 'aws';

export interface S3Config {
  provider: S3Provider;
  endpoint_url: string | null;
  access_key_id: string;
  secret_access_key: string;
  region: string;
  manifest_bucket: string;
  target_bucket: string;
  manifest_prefix: string;
  target_prefix: string;
  use_ssl: boolean;
  verify_ssl: boolean;
}

export interface GuidewireConfig {
  s3_config: S3Config;
  ray_dedup_logs: string;
  parallel: boolean;
  show_progress: boolean;
  table_names: string[] | null;
  exceptions: string[] | null;
  largest_tables_first_count: number | null;
}

export interface StartJobRequest {
  config: GuidewireConfig;
}

export interface StartJobResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface ProcessingResult {
  table: string;
  process_start_time: string;
  process_finish_time: string | null;
  process_start_watermark: number;
  process_finish_watermark: number | null;
  process_start_version: number;
  process_finish_version: number | null;
  manifest_records: number;
  manifest_watermark: number;
  watermarks: number[];
  schema_timestamps: number[];
  errors: string[];
  warnings: string[];
  duration_seconds?: number | null;
}

export interface JobStatus {
  job_id: string;
  status: string;
  start_time: string;
  end_time: string | null;
  total_tables: number;
  tables_processed: number;
  tables_failed: number;
  progress_percent: number;
  duration_seconds: number | null;
  current_message: string | null;
  error_message: string | null;
  results: ProcessingResult[];
  config: GuidewireConfig;
}

export interface JobSummary {
  job_id: string;
  status: string;
  start_time: string;
  end_time: string | null;
  total_tables: number;
  tables_processed: number;
  tables_failed: number;
  progress_percent: number;
  duration_seconds: number | null;
  current_message: string | null;
}

// Default configurations for quick setup
export const LOCAL_MINIO_DEFAULTS: S3Config = {
  provider: 'local',
  endpoint_url: 'http://127.0.0.1:9000',
  access_key_id: 'minioadmin',
  secret_access_key: 'minioadmin',
  region: 'us-east-1',
  manifest_bucket: 'guidewire-cda',
  target_bucket: 'guidewire-delta',
  manifest_prefix: 'cda/',
  target_prefix: 'target/',
  use_ssl: false,
  verify_ssl: false,
};

export const AWS_S3_DEFAULTS: Partial<S3Config> = {
  provider: 'aws',
  endpoint_url: null,
  region: 'us-east-1',
  manifest_bucket: 'sumanmisra',
  target_bucket: 'sumanmisra',
  manifest_prefix: 'cda/',
  target_prefix: 'target/',
  use_ssl: true,
  verify_ssl: true,
};

/**
 * Get display name for S3 provider
 */
export function getProviderDisplayName(config: S3Config): string {
  if (config.provider === 'local') {
    return `Local MinIO (${config.endpoint_url})`;
  }
  return `AWS S3 (${config.region})`;
}

/**
 * Validate S3 configuration
 */
export function validateS3Config(config: Partial<S3Config>): string[] {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push('Provider is required');
  }

  if (config.provider === 'local' && !config.endpoint_url) {
    errors.push('Endpoint URL is required for local MinIO');
  }

  if (!config.access_key_id) {
    errors.push('Access Key ID is required');
  }

  if (!config.secret_access_key) {
    errors.push('Secret Access Key is required');
  }

  if (!config.manifest_bucket) {
    errors.push('Manifest bucket is required');
  }

  if (!config.target_bucket) {
    errors.push('Target bucket is required');
  }

  return errors;
}
