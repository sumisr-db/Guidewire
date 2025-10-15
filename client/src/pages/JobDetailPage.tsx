import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient, ApiError } from '@/lib/api';
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, Server, Cloud, Terminal, Pause, Play } from 'lucide-react';
import { type JobStatus, type ProcessingResult, getProviderDisplayName } from '@/types/s3-config';

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [rayLogs, setRayLogs] = useState<string[]>([]);
  const [showRayLogs, setShowRayLogs] = useState(false);
  const [isStreamingLogs, setIsStreamingLogs] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: job, isLoading, error, dataUpdatedAt } = useQuery<JobStatus>({
    queryKey: ['guidewire-job', jobId],
    queryFn: async () => {
      try {
        const response = await apiClient.GET(`/api/guidewire/jobs/${jobId}`);
        if (!response || !response.data) {
          throw new Error('No data received from API');
        }
        return response.data as JobStatus;
      } catch (err) {
        console.error('[JobDetailPage] API Error:', err);
        throw err;
      }
    },
    refetchInterval: (query) => {
      try {
        const data = query?.state?.data;
        if (!data) return false;
        return data.status === 'running' || data.status === 'pending' ? 3000 : false;
      } catch {
        return false;
      }
    },
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: !!jobId,
    retry: 2,
  });

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (showRayLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rayLogs, showRayLogs]);

  // Handle Ray logs streaming
  const startRayLogsStream = () => {
    if (!jobId || isStreamingLogs) return;

    setIsStreamingLogs(true);
    setShowRayLogs(true);
    setRayLogs(['Connecting to Ray logs stream...']);

    const eventSource = new EventSource(`http://localhost:8000/api/guidewire/jobs/${jobId}/ray-logs`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const logLine = event.data;
      setRayLogs((prev) => [...prev, logLine]);
    };

    eventSource.onerror = () => {
      setRayLogs((prev) => [...prev, '[Error] Connection to Ray logs stream lost']);
      eventSource.close();
      setIsStreamingLogs(false);
    };
  };

  const stopRayLogsStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreamingLogs(false);
    setRayLogs((prev) => [...prev, '[Stream] Log streaming stopped']);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Helper to derive status from result data
  const getResultStatus = (result: ProcessingResult): string => {
    if (result.errors && result.errors.length > 0) {
      return 'failed';
    }
    if (result.process_finish_time) {
      return 'completed';
    }
    return 'running';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load job details: {error instanceof ApiError ? error.message : error ? String(error) : 'Job not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/guidewire')}
          className="hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-slate-900">Job Details</h1>
          <p className="text-slate-500 font-mono text-sm mt-1">{job.job_id}</p>
        </div>
        <Badge
          variant={getStatusBadgeVariant(job.status)}
          className="text-lg px-6 py-2 font-semibold"
        >
          {job.status.toUpperCase()}
        </Badge>
      </div>

      {job.current_message && job.status === 'running' && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800 font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 animate-pulse" />
            {job.current_message}
          </AlertDescription>
        </Alert>
      )}

      {job.error_message && (
        <Alert variant="destructive">
          <AlertDescription>{job.error_message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-900 text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-5xl font-bold text-slate-900 mb-4">{job.progress_percent.toFixed(1)}%</div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${job.progress_percent}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              {job.tables_processed} of {job.total_tables} tables processed
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-900 text-lg">Duration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-5xl font-bold text-slate-900 mb-4">{formatDuration(job.duration_seconds)}</div>
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Started:</span> {new Date(job.start_time).toLocaleString()}
              </p>
              {job.end_time && (
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Ended:</span> {new Date(job.end_time).toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-slate-900 text-lg flex items-center gap-2">
              {job.config?.s3_config?.provider === 'local' ? (
                <Server className="h-5 w-5 text-green-600" />
              ) : (
                <Cloud className="h-5 w-5 text-blue-600" />
              )}
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3 text-sm">
            <div>
              <span className="text-slate-500 font-medium">S3 Provider:</span>
              <div className="mt-1">
                <Badge
                  variant={job.config?.s3_config?.provider === 'local' ? 'secondary' : 'default'}
                  className="font-semibold"
                >
                  {job.config?.s3_config ? getProviderDisplayName(job.config.s3_config) : 'N/A'}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Manifest Bucket:</span>
              <p className="font-mono text-slate-900 mt-1">{job.config?.s3_config?.manifest_bucket || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Target Bucket:</span>
              <p className="font-mono text-slate-900 mt-1">{job.config?.s3_config?.target_bucket || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Region:</span>
              <p className="font-mono text-slate-900 mt-1">{job.config?.s3_config?.region || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Processing Mode:</span>
              <p className="font-semibold text-slate-900 mt-1">
                {job.config?.parallel ? '⚡ Ray Parallel' : 'Sequential'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-slate-900 text-xl">Table Processing Results</CardTitle>
          <CardDescription className="text-slate-600">
            {job.tables_processed} completed · {job.tables_failed} failed ·{' '}
            {job.total_tables - job.tables_processed} remaining
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {job.results.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              {job.status === 'running' || job.status === 'pending'
                ? 'Processing has not started yet...'
                : 'No results available'}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {job.results.map((result, index) => {
                const resultStatus = getResultStatus(result);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md hover:border-slate-300 transition-all duration-200 bg-white"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(resultStatus)}
                      <div>
                        <p className="font-mono font-semibold text-slate-900">{result.table}</p>
                        <p className="text-sm text-slate-600">
                          {result.manifest_records.toLocaleString()} records
                          {result.duration_seconds && ` • ${formatDuration(result.duration_seconds)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getStatusBadgeVariant(resultStatus)}
                        className="font-medium px-3 py-1"
                      >
                        {resultStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ray Logs Viewer */}
      <Card className="border-slate-200 shadow-lg bg-white">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 text-xl flex items-center gap-2">
              <Terminal className="h-5 w-5 text-blue-600" />
              Ray Processing Logs
            </CardTitle>
            <div className="flex gap-2">
              {!isStreamingLogs ? (
                <Button
                  onClick={startRayLogsStream}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Log Stream
                </Button>
              ) : (
                <Button
                  onClick={stopRayLogsStream}
                  size="sm"
                  variant="destructive"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Stream
                </Button>
              )}
              {rayLogs.length > 0 && (
                <Button
                  onClick={() => setRayLogs([])}
                  size="sm"
                  variant="outline"
                >
                  Clear Logs
                </Button>
              )}
            </div>
          </div>
          <CardDescription className="text-slate-600">
            {isStreamingLogs ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                Live streaming Ray logs...
              </span>
            ) : (
              'View real-time Ray processing logs for debugging and monitoring'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {!showRayLogs ? (
            <div className="text-center py-16 text-slate-500">
              <Terminal className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>Click "Start Log Stream" to view Ray processing logs in real-time</p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {rayLogs.length === 0 ? (
                <p className="text-slate-400">No logs yet...</p>
              ) : (
                <div className="space-y-1">
                  {rayLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`${
                        log.includes('[Error]') || log.includes('ERROR') || log.includes('Exception')
                          ? 'text-red-400'
                          : log.includes('[Warning]') || log.includes('WARNING')
                          ? 'text-yellow-400'
                          : log.includes('[Status]') || log.includes('[Stream]')
                          ? 'text-blue-400'
                          : log.includes('[Keepalive]')
                          ? 'text-slate-500'
                          : 'text-green-400'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {job.results.some((r) => r.errors && r.errors.length > 0) && (
        <Card className="border-2 border-red-300 shadow-xl bg-red-50">
          <CardHeader className="border-b-2 border-red-300 bg-red-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800 text-2xl flex items-center gap-3">
                <XCircle className="h-6 w-6" />
                Processing Errors Detected
              </CardTitle>
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {job.tables_failed} Failed
              </Badge>
            </div>
            <CardDescription className="text-red-700 font-medium mt-2">
              The following tables encountered errors during processing. Review error details below for troubleshooting.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {job.results
                .filter((r) => r.errors && r.errors.length > 0)
                .map((result, index) => (
                  <div key={index} className="border-2 border-red-400 bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-red-100 px-4 py-3 border-b-2 border-red-400">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono font-bold text-slate-900 text-lg">{result.table}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {result.manifest_records.toLocaleString()} records in manifest
                            {result.process_start_watermark && ` · Watermark: ${result.process_start_watermark}`}
                          </p>
                        </div>
                        <Badge variant="destructive" className="font-semibold">
                          FAILED
                        </Badge>
                      </div>
                    </div>
                    <div className="px-4 py-4 bg-white">
                      <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3">Error Details:</h4>
                      <div className="space-y-3">
                        {result.errors!.map((error, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-300 rounded p-3">
                            <div className="flex gap-2">
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-slate-800 font-mono whitespace-pre-wrap break-words flex-1">{error}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
