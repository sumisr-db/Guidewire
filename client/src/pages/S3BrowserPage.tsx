import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Folder,
  File,
  ChevronRight,
  Home,
  Download,
  RefreshCw,
  Search,
  FolderInput,
} from 'lucide-react';

type S3Provider = 'aws' | 'local';

interface S3Credentials {
  provider: S3Provider;
  access_key_id: string;
  secret_access_key: string;
  region: string;
  endpoint_url?: string;
}

export default function S3BrowserPage() {
  const [credentials, setCredentials] = useState<S3Credentials>({
    provider: 'aws',
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1',
  });

  const [bucket, setBucket] = useState('sumanmisra');
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bucketInputMode, setBucketInputMode] = useState(false);
  const [pathInput, setPathInput] = useState('');
  const [showPathInput, setShowPathInput] = useState(false);

  // Query for listing available buckets
  const { data: bucketsData } = useQuery({
    queryKey: ['s3-buckets', credentials],
    queryFn: async () => {
      const response = await apiClient.POST('/api/s3/buckets', {
        body: credentials,
      });
      return response.data;
    },
    enabled: !!credentials.access_key_id,
  });

  // Query for listing S3 objects
  const { data: listing, isLoading, refetch } = useQuery({
    queryKey: ['s3-listing', bucket, currentPrefix, credentials],
    queryFn: async () => {
      const response = await apiClient.POST('/api/s3/list', {
        params: {
          query: {
            bucket,
            prefix: currentPrefix,
            max_keys: 1000,
          },
        },
        body: credentials,
      });
      return response.data;
    },
    enabled: !!bucket && !!credentials.access_key_id,
  });

  const handleFolderClick = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  const handleBreadcrumbClick = (prefix: string) => {
    setCurrentPrefix(prefix);
  };

  const goToRoot = () => {
    setCurrentPrefix('');
  };

  const navigateToPath = () => {
    setCurrentPrefix(pathInput.endsWith('/') ? pathInput : pathInput + '/');
    setShowPathInput(false);
  };

  const handlePathInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigateToPath();
    }
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
        body: credentials,
      });
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to generate download URL:', error);
      alert('Failed to generate download URL');
    }
  };

  // Build breadcrumb from current prefix
  const breadcrumbs = currentPrefix
    ? currentPrefix.split('/').filter(Boolean)
    : [];

  // Filter objects by search term
  const filteredObjects = listing?.objects?.filter((obj) =>
    obj.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPrefixes = listing?.prefixes?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">S3 Browser</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Credentials Form */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900">S3 Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={credentials.provider}
                onValueChange={(value: S3Provider) =>
                  setCredentials({ ...credentials, provider: value })
                }
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">AWS S3</SelectItem>
                  <SelectItem value="local">Local MinIO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bucket">Bucket</Label>
              {bucketInputMode ? (
                <div className="flex gap-2">
                  <Input
                    id="bucket"
                    value={bucket}
                    onChange={(e) => setBucket(e.target.value)}
                    placeholder="my-bucket"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBucketInputMode(false)}
                  >
                    Select
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={bucket}
                    onValueChange={(value) => {
                      setBucket(value);
                      setCurrentPrefix(''); // Reset path when changing buckets
                    }}
                  >
                    <SelectTrigger id="bucket">
                      <SelectValue placeholder="Select a bucket" />
                    </SelectTrigger>
                    <SelectContent>
                      {bucketsData?.map((b: any) => (
                        <SelectItem key={b.name} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBucketInputMode(true)}
                  >
                    Manual
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={credentials.region}
                onChange={(e) =>
                  setCredentials({ ...credentials, region: e.target.value })
                }
                placeholder="us-east-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-key">Access Key ID</Label>
              <Input
                id="access-key"
                type="text"
                value={credentials.access_key_id}
                onChange={(e) =>
                  setCredentials({ ...credentials, access_key_id: e.target.value })
                }
                placeholder="AKIA..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret-key">Secret Access Key</Label>
              <Input
                id="secret-key"
                type="text"
                value={credentials.secret_access_key}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    secret_access_key: e.target.value,
                  })
                }
                placeholder="***"
              />
            </div>

            {credentials.provider === 'local' && (
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint URL</Label>
                <Input
                  id="endpoint"
                  value={credentials.endpoint_url || ''}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      endpoint_url: e.target.value,
                    })
                  }
                  placeholder="http://localhost:9000"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Browser */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <CardTitle className="text-lg text-slate-900">
                Browse: s3://{bucket}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPathInput(!showPathInput);
                  setPathInput(currentPrefix);
                }}
                className="h-7 px-2"
              >
                <FolderInput className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 w-64">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>
          </div>

          {/* Path Input */}
          {showPathInput && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-slate-50 rounded-lg">
              <FolderInput className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="Enter folder path (e.g., cda/ or data/2024/)"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                onKeyPress={handlePathInputKeyPress}
                className="h-8"
                autoFocus
              />
              <Button size="sm" onClick={navigateToPath}>
                Go
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPathInput(false)}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToRoot}
              className="h-7 px-2"
            >
              <Home className="h-4 w-4" />
            </Button>
            {breadcrumbs.map((crumb, index) => {
              const prefix = breadcrumbs.slice(0, index + 1).join('/') + '/';
              return (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBreadcrumbClick(prefix)}
                    className="h-7 px-2"
                  >
                    {crumb}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* Folders */}
              {filteredPrefixes?.map((prefix) => (
                <div
                  key={prefix.prefix}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleFolderClick(prefix.prefix)}
                >
                  <Folder className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{prefix.name}</p>
                  </div>
                </div>
              ))}

              {/* Files */}
              {filteredObjects?.map((obj) => (
                <div
                  key={obj.key}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50"
                >
                  <File className="h-5 w-5 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{obj.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatBytes(obj.size)} • {formatDate(obj.last_modified)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(obj.key)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Empty State */}
              {!isLoading &&
                (!filteredPrefixes?.length && !filteredObjects?.length) && (
                  <div className="text-center py-12 text-slate-500">
                    <Folder className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>No files or folders found</p>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {listing && !isLoading && (
        <Card className="border-slate-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div>
                {filteredPrefixes?.length || 0} folders •{' '}
                {filteredObjects?.length || 0} files
              </div>
              <div>Total size: {formatBytes(listing.total_size || 0)}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
