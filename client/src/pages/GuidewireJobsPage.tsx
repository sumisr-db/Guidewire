import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiClient, ApiError } from '@/lib/api';
import {
  type JobSummary,
  type StartJobRequest,
  type S3Config,
  type S3Provider,
  LOCAL_MINIO_DEFAULTS,
  AWS_S3_DEFAULTS,
  validateS3Config,
} from '@/types/s3-config';
import {
  Folder,
  File,
  ChevronRight,
  Home,
  Download,
  RefreshCw,
  Search,
  FolderOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type S3BrowserProvider = 'aws' | 'local';

interface S3Credentials {
  provider: S3BrowserProvider;
  access_key_id: string;
  secret_access_key: string;
  region: string;
  endpoint_url?: string;
}

export function GuidewireJobsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [s3Provider, setS3Provider] = useState<S3Provider>('local');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // S3 Browser state
  const [showS3Browser, setShowS3Browser] = useState(false);
  const [s3Credentials, setS3Credentials] = useState<S3Credentials>({
    provider: 'aws',
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1',
  });
  const [bucket, setBucket] = useState('sumanmisra');
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for S3 configuration
  const [s3FormData, setS3FormData] = useState<S3Config>({
    ...LOCAL_MINIO_DEFAULTS,
  });

  // Processing configuration
  const [processingConfig, setProcessingConfig] = useState({
    ray_dedup_logs: '0',
    parallel: true,
    show_progress: true,
  });

  // Fetch jobs list
  const { data: jobs, isLoading, error } = useQuery<JobSummary[]>({
    queryKey: ['guidewire-jobs'],
    queryFn: async () => {
      const response = await apiClient.GET('/api/guidewire/jobs');
      return response.data as JobSummary[];
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // S3 Browser queries
  const { data: bucketsData } = useQuery({
    queryKey: ['s3-buckets', s3Credentials],
    queryFn: async () => {
      const response = await apiClient.POST('/api/s3/buckets', {
        body: s3Credentials,
      });
      return response.data;
    },
    enabled: showS3Browser && !!s3Credentials.access_key_id,
  });

  const { data: listing, isLoading: isLoadingListing, refetch: refetchListing } = useQuery({
    queryKey: ['s3-listing', bucket, currentPrefix, s3Credentials],
    queryFn: async () => {
      const response = await apiClient.POST('/api/s3/list', {
        params: {
          query: {
            bucket,
            prefix: currentPrefix,
            max_keys: 1000,
          },
        },
        body: s3Credentials,
      });
      return response.data;
    },
    enabled: showS3Browser && !!bucket && !!s3Credentials.access_key_id,
  });

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async (request: StartJobRequest) => {
      const response = await apiClient.POST('/api/guidewire/jobs/start', {
        body: request,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guidewire-jobs'] });
      setShowForm(false);
      setValidationErrors([]);
    },
    onError: (error: ApiError) => {
      console.error('Failed to start job:', error);
      if (error.body?.detail) {
        setValidationErrors([error.body.detail]);
      } else {
        setValidationErrors([error.message]);
      }
    },
  });

  // Switch provider and load defaults
  const handleProviderChange = (provider: S3Provider) => {
    setS3Provider(provider);
    if (provider === 'local') {
      setS3FormData({ ...LOCAL_MINIO_DEFAULTS });
    } else {
      setS3FormData({
        provider: 'aws',
        endpoint_url: null,
        access_key_id: '',
        secret_access_key: '',
        region: 'us-east-1',
        manifest_bucket: 'sumanmisra',
        target_bucket: 'sumanmisra',
        manifest_prefix: 'cda/',
        target_prefix: 'target/',
        use_ssl: true,
        verify_ssl: true,
      });
    }
    setValidationErrors([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate S3 configuration
    const errors = validateS3Config(s3FormData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Start job
    startJobMutation.mutate({
      config: {
        s3_config: s3FormData,
        ...processingConfig,
        table_names: null,
        exceptions: null,
        largest_tables_first_count: null,
      },
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // S3 Browser helper functions
  const handleFolderClick = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  const handleBreadcrumbClick = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  const goToRoot = () => {
    setCurrentPrefix('');
  };

  const handleDownload = async (key: string) => {
    try {
      const response = await apiClient.POST('/api/s3/download-url', {
        params: {
          query: {
            bucket,
            key,
            expires_in: 3600,
          },
        },
        body: s3Credentials,
      });
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to generate download URL:', error);
      alert('Failed to generate download URL');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const breadcrumbs = currentPrefix ? currentPrefix.split('/').filter(Boolean) : [];
  const filteredObjects = listing?.objects?.filter((obj: any) =>
    obj.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPrefixes = listing?.prefixes?.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Processing Jobs</h1>
          <p className="text-slate-600 text-lg">
            Monitor and manage Guidewire CDA to Delta Lake processing with Ray parallel mode
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/s3-browser')}
            variant="outline"
            size="lg"
            className="border-2 border-slate-300 hover:border-red-500 hover:bg-red-50"
          >
            <FolderOpen className="h-5 w-5 mr-2" />
            S3 Browser
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30"
            size="lg"
          >
            {showForm ? 'Cancel' : '+ Start New Job'}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <CardTitle className="text-2xl text-slate-900">Start Guidewire Processing Job</CardTitle>
            <CardDescription className="text-slate-600">
              Configure S3 storage and processing options for CDA to Delta Lake conversion
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* S3 Provider Selection */}
              <Tabs value={s3Provider} onValueChange={handleProviderChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="local">Local S3 (MinIO)</TabsTrigger>
                  <TabsTrigger value="aws">AWS S3</TabsTrigger>
                </TabsList>

                {/* Local MinIO Configuration */}
                <TabsContent value="local" className="space-y-6 mt-6">
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      <strong>Development Mode:</strong> Using local MinIO for testing. Make sure MinIO
                      is running at http://127.0.0.1:9000
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">MinIO Endpoint</label>
                      <Input
                        type="text"
                        value={s3FormData.endpoint_url || ''}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, endpoint_url: e.target.value })
                        }
                        required
                        placeholder="http://127.0.0.1:9000"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Access Key</label>
                      <Input
                        type="text"
                        value={s3FormData.access_key_id}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, access_key_id: e.target.value })
                        }
                        required
                        placeholder="minioadmin"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Secret Key</label>
                      <Input
                        type="password"
                        value={s3FormData.secret_access_key}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, secret_access_key: e.target.value })
                        }
                        required
                        placeholder="minioadmin"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Region</label>
                      <Input
                        type="text"
                        value={s3FormData.region}
                        onChange={(e) => setS3FormData({ ...s3FormData, region: e.target.value })}
                        required
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Manifest Bucket</label>
                      <Input
                        type="text"
                        value={s3FormData.manifest_bucket}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, manifest_bucket: e.target.value })
                        }
                        required
                        placeholder="guidewire-cda"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Manifest Prefix</label>
                      <Input
                        type="text"
                        value={s3FormData.manifest_prefix}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, manifest_prefix: e.target.value })
                        }
                        required
                        placeholder="cda/"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                      <p className="text-xs text-slate-500">Location of CDA manifest files</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Target Bucket</label>
                      <Input
                        type="text"
                        value={s3FormData.target_bucket}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, target_bucket: e.target.value })
                        }
                        required
                        placeholder="guidewire-delta"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Target Prefix</label>
                      <Input
                        type="text"
                        value={s3FormData.target_prefix}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, target_prefix: e.target.value })
                        }
                        required
                        placeholder="target/"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                      <p className="text-xs text-slate-500">Output location for Delta tables</p>
                    </div>
                  </div>
                </TabsContent>

                {/* AWS S3 Configuration */}
                <TabsContent value="aws" className="space-y-6 mt-6">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-800">
                      <strong>Production Mode:</strong> Using AWS S3 for production data. Ensure your
                      credentials have appropriate permissions.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">AWS Access Key ID</label>
                      <Input
                        type="text"
                        value={s3FormData.access_key_id}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, access_key_id: e.target.value })
                        }
                        required
                        placeholder="AKIA..."
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        AWS Secret Access Key
                      </label>
                      <Input
                        type="password"
                        value={s3FormData.secret_access_key}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, secret_access_key: e.target.value })
                        }
                        required
                        placeholder="Enter secret key"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">AWS Region</label>
                      <Input
                        type="text"
                        value={s3FormData.region}
                        onChange={(e) => setS3FormData({ ...s3FormData, region: e.target.value })}
                        required
                        placeholder="us-east-1"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Manifest Bucket</label>
                      <Input
                        type="text"
                        value={s3FormData.manifest_bucket}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, manifest_bucket: e.target.value })
                        }
                        required
                        placeholder="sumanmisra"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Manifest Prefix</label>
                      <Input
                        type="text"
                        value={s3FormData.manifest_prefix}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, manifest_prefix: e.target.value })
                        }
                        required
                        placeholder="cda/"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                      <p className="text-xs text-slate-500">Location of CDA manifest files</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Target Bucket</label>
                      <Input
                        type="text"
                        value={s3FormData.target_bucket}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, target_bucket: e.target.value })
                        }
                        required
                        placeholder="sumanmisra"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Target Prefix</label>
                      <Input
                        type="text"
                        value={s3FormData.target_prefix}
                        onChange={(e) =>
                          setS3FormData({ ...s3FormData, target_prefix: e.target.value })
                        }
                        required
                        placeholder="target/"
                        className="border-slate-300 focus:border-red-500 focus:ring-red-500"
                      />
                      <p className="text-xs text-slate-500">Output location for Delta tables</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Processing Configuration */}
              <div className="flex items-center space-x-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={processingConfig.parallel}
                    onChange={(e) =>
                      setProcessingConfig({ ...processingConfig, parallel: e.target.checked })
                    }
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Use Ray Parallel Processing</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={processingConfig.show_progress}
                    onChange={(e) =>
                      setProcessingConfig({ ...processingConfig, show_progress: e.target.checked })
                    }
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Show Progress</span>
                </label>
              </div>

              {/* Error Display */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertDescription className="text-red-800">
                    <ul className="list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={startJobMutation.isPending}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-6 text-lg shadow-lg shadow-red-500/30"
              >
                {startJobMutation.isPending ? 'Starting Job...' : 'Start Processing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load jobs: {error instanceof ApiError ? error.message : String(error)}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs && jobs.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500 text-lg">
                  No jobs found. Click "Start New Job" to begin processing.
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs?.map((job) => (
              <Card
                key={job.job_id}
                className="hover:shadow-lg hover:shadow-slate-200 cursor-pointer transition-all duration-200 border-slate-200 bg-white"
                onClick={() => navigate(`/guidewire/jobs/${job.job_id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-mono text-slate-900">{job.job_id}</CardTitle>
                      <CardDescription className="text-slate-500">
                        Started: {new Date(job.start_time).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(job.status)} className="font-semibold px-3 py-1">
                      {job.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6 text-sm mb-4">
                    <div className="space-y-1">
                      <p className="text-slate-500 text-xs font-medium">Progress</p>
                      <p className="text-2xl font-bold text-slate-900">{job.progress_percent.toFixed(1)}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 text-xs font-medium">Tables</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {job.tables_processed} <span className="text-lg text-slate-400">/ {job.total_tables}</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 text-xs font-medium">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{job.tables_failed}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 text-xs font-medium">Duration</p>
                      <p className="text-2xl font-bold text-slate-900">{formatDuration(job.duration_seconds)}</p>
                    </div>
                  </div>

                  {job.status === 'running' && (
                    <div className="mt-4 space-y-2">
                      {job.current_message && (
                        <p className="text-sm text-blue-700 font-medium italic">{job.current_message}</p>
                      )}
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${job.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
