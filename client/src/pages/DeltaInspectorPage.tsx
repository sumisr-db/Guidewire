import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, FileCode, History, Eye } from 'lucide-react';
import { AWS_S3_DEFAULTS } from '@/types/s3-config';

interface DeltaTableInfo {
  name: string;
  path: string;
  size_bytes: number;
  num_files: number;
  last_modified: string | null;
}

interface DeltaColumn {
  name: string;
  type: string;
  nullable: boolean;
}

interface DeltaTableSchema {
  table_name: string;
  columns: DeltaColumn[];
  partition_columns: string[];
}

interface DeltaHistoryEntry {
  version: number;
  timestamp: string;
  operation: string;
  operation_parameters: Record<string, any> | null;
  user_identity: string | null;
}

interface DeltaTableHistory {
  table_name: string;
  current_version: number;
  entries: DeltaHistoryEntry[];
}

interface DeltaTablePreview {
  table_name: string;
  columns: string[];
  rows: Record<string, any>[];
  limit: number;
}

interface S3Credentials {
  s3_bucket: string;
  s3_prefix: string;
  access_key_id: string;
  secret_access_key: string;
  region: string;
}

export default function DeltaInspectorPage() {
  const [credentials, setCredentials] = useState<S3Credentials>({
    s3_bucket: AWS_S3_DEFAULTS.manifest_bucket || 'sumanmisra',
    s3_prefix: AWS_S3_DEFAULTS.target_prefix || 'target/',
    access_key_id: '',
    secret_access_key: '',
    region: AWS_S3_DEFAULTS.region || 'us-east-1',
  });

  const [selectedTable, setSelectedTable] = useState<DeltaTableInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string>('schema');

  // Query for listing Delta tables
  const { data: tables, isLoading: tablesLoading, refetch: refetchTables } = useQuery<DeltaTableInfo[]>({
    queryKey: ['delta-tables', credentials],
    queryFn: async () => {
      const response = await apiClient.POST('/api/delta/tables', {
        body: credentials,
      });
      return (response.data || []) as DeltaTableInfo[];
    },
    enabled: !!credentials.access_key_id && !!credentials.s3_bucket,
  });

  // Query for table schema
  const { data: schema, isLoading: schemaLoading } = useQuery<DeltaTableSchema>({
    queryKey: ['delta-schema', selectedTable?.path, credentials],
    queryFn: async () => {
      const response = await apiClient.POST('/api/delta/tables/schema', {
        params: {
          query: {
            table_path: selectedTable!.path,
          },
        },
        body: credentials,
      });
      return response.data as DeltaTableSchema;
    },
    enabled: !!selectedTable && activeTab === 'schema',
  });

  // Query for table history
  const { data: history, isLoading: historyLoading } = useQuery<DeltaTableHistory>({
    queryKey: ['delta-history', selectedTable?.path, credentials],
    queryFn: async () => {
      const response = await apiClient.POST('/api/delta/tables/history', {
        params: {
          query: {
            table_path: selectedTable!.path,
          },
        },
        body: credentials,
      });
      return response.data as DeltaTableHistory;
    },
    enabled: !!selectedTable && activeTab === 'history',
  });

  // Query for table preview
  const { data: preview, isLoading: previewLoading } = useQuery<DeltaTablePreview>({
    queryKey: ['delta-preview', selectedTable?.path, credentials],
    queryFn: async () => {
      const response = await apiClient.POST('/api/delta/tables/preview', {
        params: {
          query: {
            table_path: selectedTable!.path,
            limit: 100,
          },
        },
        body: credentials,
      });
      return response.data as DeltaTablePreview;
    },
    enabled: !!selectedTable && activeTab === 'preview',
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Database className="h-8 w-8" />
          Delta Lake Inspector
        </h1>
        <Button onClick={() => refetchTables()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* S3 Configuration */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900">S3 Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bucket">Bucket</Label>
              <Input
                id="bucket"
                value={credentials.s3_bucket}
                onChange={(e) =>
                  setCredentials({ ...credentials, s3_bucket: e.target.value })
                }
                placeholder="my-bucket"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={credentials.s3_prefix}
                onChange={(e) =>
                  setCredentials({ ...credentials, s3_prefix: e.target.value })
                }
                placeholder="target/"
              />
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
                  setCredentials({ ...credentials, secret_access_key: e.target.value })
                }
                placeholder="***"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables List */}
      <Card className="border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900">Delta Tables</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tablesLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : tables && tables.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {tables.map((table) => (
                <div
                  key={table.path}
                  className={`flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer ${
                    selectedTable?.path === table.path ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedTable(table)}
                >
                  <div className="flex items-center gap-4">
                    <Database className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-slate-900">{table.name}</p>
                      <p className="text-sm text-slate-500">{table.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div>
                      <Badge variant="outline">{table.num_files} files</Badge>
                    </div>
                    <div>{formatBytes(table.size_bytes)}</div>
                    <div>{formatDate(table.last_modified)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No Delta tables found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table Details */}
      {selectedTable && (
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-slate-900">
                Table: {selectedTable.name}
              </CardTitle>
              <Button
                onClick={() => setSelectedTable(null)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="schema">
                  <FileCode className="h-4 w-4 mr-2" />
                  Schema
                </TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Schema Tab */}
              <TabsContent value="schema" className="mt-4">
                {schemaLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : schema ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Columns</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nullable</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schema.columns.map((col) => (
                            <TableRow key={col.name}>
                              <TableCell className="font-mono">{col.name}</TableCell>
                              <TableCell className="font-mono text-sm">{col.type}</TableCell>
                              <TableCell>
                                {col.nullable ? (
                                  <Badge variant="outline">Nullable</Badge>
                                ) : (
                                  <Badge>Required</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {schema.partition_columns.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Partition Columns</h3>
                        <div className="flex gap-2">
                          {schema.partition_columns.map((col) => (
                            <Badge key={col} variant="secondary">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500">No schema data available</p>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : history ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary">Current Version: {history.current_version}</Badge>
                      <Badge variant="outline">{history.entries.length} Versions</Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Version</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Operation</TableHead>
                          <TableHead>User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.entries.map((entry) => (
                          <TableRow key={entry.version}>
                            <TableCell className="font-mono">{entry.version}</TableCell>
                            <TableCell className="text-sm">{formatDate(entry.timestamp)}</TableCell>
                            <TableCell>
                              <Badge>{entry.operation}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{entry.user_identity || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-slate-500">No history data available</p>
                )}
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="mt-4">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : preview && preview.rows.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Showing {preview.rows.length} rows</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {preview.columns.map((col) => (
                              <TableHead key={col} className="font-mono text-xs">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.rows.slice(0, 50).map((row, idx) => (
                            <TableRow key={idx}>
                              {preview.columns.map((col) => (
                                <TableCell key={col} className="font-mono text-xs max-w-xs truncate">
                                  {JSON.stringify(row[col])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">No preview data available</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
