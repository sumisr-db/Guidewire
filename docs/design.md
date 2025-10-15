# Technical Design Document
# Guidewire Connector Monitor

## Executive Summary

This document outlines the technical architecture for the Guidewire Connector Monitor, a Databricks App that provides visibility into Guidewire CDA to Delta Lake processing pipelines. The app uses FastAPI backend with React frontend, integrated with Databricks SDK for workspace operations.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Databricks App UI                        │
│                    (React + TypeScript)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │  Tables  │  │  Config  │  │   Jobs   │   │
│  │   View   │  │   View   │  │   View   │  │   View   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │ REST API
        ┌─────────────┴─────────────────────────────────────┐
        │            FastAPI Backend                        │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
        │  │  Tables  │  │  Config  │  │   Jobs   │       │
        │  │  Router  │  │  Router  │  │  Router  │       │
        │  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
        │       │             │             │              │
        │  ┌────┴─────────────┴─────────────┴──────┐       │
        │  │         Service Layer                 │       │
        │  │  - DeltaTableService                  │       │
        │  │  - SparkExecutionService              │       │
        │  │  - JobManagementService               │       │
        │  └────┬──────────────────────────────────┘       │
        └───────┼──────────────────────────────────────────┘
                │
        ┌───────┴──────────────────────────────────────────┐
        │         Databricks Workspace                     │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
        │  │  Spark   │  │Jobs API  │  │  DBFS    │       │
        │  │   SQL    │  │          │  │   API    │       │
        │  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
        └───────┼─────────────┼─────────────┼──────────────┘
                │             │             │
        ┌───────┴─────────────┴─────────────┴──────────────┐
        │              AWS S3 Storage                       │
        │  s3://sumanmisra/target/ (Delta Tables)          │
        │  s3://sumanmisra/cda/ (CDA Manifests)            │
        └───────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
- **Framework**: FastAPI 0.100+
- **Language**: Python 3.11+
- **Package Manager**: `uv` for fast dependency management
- **Databricks SDK**: `databricks-sdk` for workspace API integration
- **Spark**: PySpark via Databricks Runtime for Delta table operations

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and HMR
- **UI Library**: shadcn/ui components with Tailwind CSS
- **State Management**: React Query (TanStack Query) for server state
- **API Client**: Auto-generated TypeScript client from OpenAPI spec
- **Package Manager**: Bun for fast installs

### Infrastructure
- **Platform**: Databricks Apps (serverless deployment)
- **Storage**: AWS S3 (us-east-1) for Delta tables
- **Compute**: Databricks Serverless for on-demand Spark execution
- **Authentication**: Databricks OAuth (built-in)

---

## Data Architecture

### Delta Lake Tables
- **Location**: `s3://sumanmisra/target/{table_name}/`
- **Format**: Delta Lake (Parquet + Transaction Log)
- **Partitioning**: Determined by Guidewire CDA schema
- **Transaction Log**: `_delta_log/` directory contains JSON transaction history

### Data Access Patterns
1. **List Tables**: `dbutils.fs.ls('s3://sumanmisra/target/')`
2. **Read Metadata**: `DESCRIBE HISTORY delta.s3://sumanmisra/target/{table}/`
3. **Query Data**: `SELECT * FROM delta.s3://sumanmisra/target/{table}/ LIMIT 10`
4. **Row Count**: `SELECT COUNT(*) FROM delta.s3://sumanmisra/target/{table}/`

### Configuration Storage
- **Source**: Notebook widgets from `Guidewire_Processing` notebook
- **Format**: Key-value pairs (AWS credentials, S3 paths, settings)
- **Access**: Read-only via Databricks Workspace API

---

## API Design

### REST Endpoints

#### Dashboard API
```
GET /api/dashboard
Response: {
  total_tables: int,
  last_processing_time: datetime,
  status: "connected" | "disconnected",
  s3_bucket: string
}
```

#### Tables API
```
GET /api/tables
Query: ?search=string&limit=int&offset=int
Response: {
  tables: [
    {
      name: string,
      path: string,
      transaction_count: int,
      last_updated: datetime,
      size_bytes: int
    }
  ],
  total: int
}

GET /api/tables/{table_name}
Response: {
  name: string,
  path: string,
  schema: [
    {
      name: string,
      type: string,
      nullable: bool
    }
  ],
  row_count: int,
  history: [
    {
      version: int,
      timestamp: datetime,
      operation: string,
      user: string
    }
  ],
  sample_data: [
    { ...column_values }
  ]
}
```

#### Configuration API
```
GET /api/config
Response: {
  aws_access_key_id: string (masked),
  aws_region: string,
  s3_bucket: string,
  manifest_location: string,
  processing_mode: "parallel" | "sequential",
  guidewire_package_version: string,
  ray_settings: {
    dedup_logs: bool
  }
}
```

#### Jobs API
```
POST /api/jobs/run
Request: {
  parameters: {
    aws_access_key_id: string,
    aws_secret_access_key: string,
    ...other params
  }
}
Response: {
  job_id: string,
  run_id: string,
  status: "pending"
}

GET /api/jobs/{run_id}
Response: {
  run_id: string,
  status: "running" | "completed" | "failed",
  start_time: datetime,
  end_time: datetime?,
  progress: {
    tables_processed: int,
    total_tables: int,
    percent_complete: float
  }
}

GET /api/jobs/{run_id}/logs
Response: {
  logs: string,
  last_line: int
}

DELETE /api/jobs/{run_id}
Response: {
  message: "Job cancelled"
}
```

---

## Backend Implementation

### Directory Structure
```
server/
├── app.py                    # FastAPI application entry
├── routers/
│   ├── dashboard.py          # Dashboard endpoints
│   ├── tables.py             # Table list and detail endpoints
│   ├── config.py             # Configuration endpoints
│   └── jobs.py               # Job execution endpoints
├── services/
│   ├── delta_table_service.py    # Delta table operations
│   ├── spark_service.py          # Spark SQL execution
│   ├── job_service.py            # Databricks Jobs API wrapper
│   └── config_service.py         # Configuration management
├── models/
│   ├── table.py              # Pydantic models for tables
│   ├── job.py                # Pydantic models for jobs
│   └── config.py             # Pydantic models for config
└── utils/
    ├── spark_context.py      # Spark session management
    └── s3_client.py          # S3 operations helper
```

### Key Services

#### DeltaTableService
```python
class DeltaTableService:
    """Service for Delta table operations"""

    def __init__(self, workspace_client: WorkspaceClient):
        self.client = workspace_client
        self.spark = self._get_spark_session()

    async def list_tables(self, search: str = None) -> List[TableSummary]:
        """List all Delta tables in S3 target location"""
        # Use dbutils.fs.ls() to list directories
        # Filter by search term if provided
        # Return table metadata

    async def get_table_details(self, table_name: str) -> TableDetail:
        """Get detailed information about a table"""
        # Query schema: DESCRIBE delta.`s3://...`
        # Query history: DESCRIBE HISTORY delta.`s3://...`
        # Query row count: SELECT COUNT(*) FROM delta.`s3://...`
        # Query sample: SELECT * FROM delta.`s3://...` LIMIT 10

    async def get_transaction_count(self, table_path: str) -> int:
        """Count transactions in _delta_log/ directory"""
        # List files in _delta_log/
        # Count .json files (excluding _last_checkpoint)
```

#### JobManagementService
```python
class JobManagementService:
    """Service for managing Guidewire processing jobs"""

    def __init__(self, workspace_client: WorkspaceClient):
        self.client = workspace_client

    async def submit_job(self, parameters: Dict[str, str]) -> JobRun:
        """Submit Guidewire processing notebook as job"""
        # Use jobs.submit_run() API
        # Configure notebook task with parameters
        # Return run ID and initial status

    async def get_job_status(self, run_id: str) -> JobStatus:
        """Get current status of running job"""
        # Use jobs.get_run(run_id) API
        # Parse state and progress

    async def get_job_logs(self, run_id: str, offset: int = 0) -> JobLogs:
        """Stream job execution logs"""
        # Use jobs API to fetch logs
        # Return logs from offset onwards

    async def cancel_job(self, run_id: str) -> None:
        """Cancel a running job"""
        # Use jobs.cancel_run(run_id) API
```

#### SparkExecutionService
```python
class SparkExecutionService:
    """Service for executing Spark SQL commands"""

    def __init__(self, workspace_client: WorkspaceClient):
        self.client = workspace_client
        self.sql_api = workspace_client.statement_execution

    async def execute_sql(self, query: str) -> List[Dict]:
        """Execute SQL query and return results"""
        # Use SQL Statement Execution API
        # Handle large result sets with pagination

    async def get_table_schema(self, table_path: str) -> List[ColumnSchema]:
        """Get table schema using DESCRIBE"""
        query = f"DESCRIBE delta.`{table_path}`"
        # Execute and parse results

    async def get_table_history(self, table_path: str) -> List[Transaction]:
        """Get Delta table transaction history"""
        query = f"DESCRIBE HISTORY delta.`{table_path}`"
        # Execute and parse results
```

---

## Frontend Implementation

### Directory Structure
```
client/src/
├── App.tsx                       # Main app with routing
├── pages/
│   ├── DashboardPage.tsx         # Dashboard view
│   ├── TablesListPage.tsx        # Tables list view
│   ├── TableDetailPage.tsx       # Table detail view
│   ├── ConfigurationPage.tsx     # Configuration view
│   └── JobsPage.tsx              # Jobs management view
├── components/
│   ├── TableCard.tsx             # Table summary card
│   ├── SchemaTable.tsx           # Schema display table
│   ├── HistoryTimeline.tsx       # Delta history timeline
│   ├── DataPreview.tsx           # Sample data table
│   ├── JobStatusBadge.tsx        # Job status indicator
│   ├── LogViewer.tsx             # Real-time log viewer
│   └── ui/                       # shadcn/ui components
├── hooks/
│   ├── useTablesQuery.ts         # React Query hook for tables
│   ├── useTableDetailQuery.ts    # React Query hook for detail
│   ├── useJobMutation.ts         # React Query hook for jobs
│   └── useJobStatus.ts           # Polling hook for job status
├── lib/
│   ├── api-client.ts             # Auto-generated API client
│   └── utils.ts                  # Utility functions
└── types/
    └── index.ts                  # TypeScript type definitions
```

### Key Components

#### DashboardPage
```tsx
export function DashboardPage() {
  const { data: dashboard } = useDashboardQuery();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>Total Tables</CardHeader>
        <CardContent>{dashboard?.total_tables}</CardContent>
      </Card>
      <Card>
        <CardHeader>Last Processing</CardHeader>
        <CardContent>{formatDate(dashboard?.last_processing_time)}</CardContent>
      </Card>
      <Card>
        <CardHeader>Status</CardHeader>
        <CardContent>
          <Badge variant={dashboard?.status === 'connected' ? 'success' : 'error'}>
            {dashboard?.status}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### TablesListPage
```tsx
export function TablesListPage() {
  const [search, setSearch] = useState('');
  const { data: tables, isLoading } = useTablesQuery({ search });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search tables..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isLoading ? (
        <Skeleton count={5} />
      ) : (
        <div className="grid gap-4">
          {tables?.map((table) => (
            <TableCard key={table.name} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}
```

#### JobsPage
```tsx
export function JobsPage() {
  const { mutate: runJob, data: jobRun } = useJobMutation();
  const { data: status } = useJobStatus(jobRun?.run_id, {
    refetchInterval: 5000, // Poll every 5 seconds
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => runJob({})}>
        Run Guidewire Processor
      </Button>

      {status && (
        <Card>
          <CardHeader>
            Job Status: <JobStatusBadge status={status.status} />
          </CardHeader>
          <CardContent>
            <Progress value={status.progress.percent_complete} />
            <p>{status.progress.tables_processed} / {status.progress.total_tables} tables</p>
          </CardContent>
        </Card>
      )}

      <LogViewer runId={jobRun?.run_id} />
    </div>
  );
}
```

---

## Integration Points

### Databricks SDK Integration

#### Workspace Client Setup
```python
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementExecutionAPI

# In Databricks App, credentials are auto-injected
workspace_client = WorkspaceClient()

# Access different APIs
jobs_api = workspace_client.jobs
sql_api = workspace_client.statement_execution
dbfs_api = workspace_client.dbfs
```

#### Spark SQL Execution
```python
# Execute SQL via Statement Execution API
response = workspace_client.statement_execution.execute_statement(
    warehouse_id=os.getenv("DATABRICKS_WAREHOUSE_ID"),
    statement="SELECT * FROM delta.`s3://sumanmisra/target/claim_401000005/` LIMIT 10",
    wait_timeout="30s"
)

# Parse results
results = response.result.data_array
```

#### Jobs API Usage
```python
# Submit notebook run
run = workspace_client.jobs.submit_run(
    run_name="Guidewire Processing",
    tasks=[
        {
            "task_key": "process_guidewire",
            "notebook_task": {
                "notebook_path": "/Users/suman.misra@databricks.com/Guidewire_Processing",
                "base_parameters": {
                    "aws_access_key_id": "...",
                    "aws_secret_access_key": "...",
                    "aws_manifest_location": "s3://sumanmisra/cda/",
                    "aws_region": "us-east-1",
                    "aws_s3_bucket": "sumanmisra/target"
                }
            },
            "new_cluster": {
                "spark_version": "14.3.x-scala2.12",
                "node_type_id": "i3.xlarge",
                "num_workers": 2
            }
        }
    ]
)

# Monitor job status
status = workspace_client.jobs.get_run(run.run_id)
```

### S3 Access via DBFS
```python
# List files in S3
files = workspace_client.dbfs.list("s3://sumanmisra/target/")

# Read Delta transaction logs
logs = workspace_client.dbfs.list("s3://sumanmisra/target/claim_401000005/_delta_log/")
```

---

## Security Considerations

### Authentication
- **Method**: Databricks OAuth (automatic for Databricks Apps)
- **User Context**: All API calls executed in the context of authenticated user
- **No Additional Auth**: No need for custom JWT/session management

### Authorization
- **Workspace Permissions**: User must have access to:
  - S3 bucket (`s3://sumanmisra/`) via instance profile or credentials
  - Notebooks (read access to `Guidewire_Processing`)
  - Jobs API (submit and monitor jobs)
  - SQL Warehouse (for query execution)

### Secrets Management
- **AWS Credentials**: Stored in notebook widgets (not in app code)
- **Masked Display**: Show only last 4 characters in UI
- **No Persistence**: Credentials passed to jobs, not stored in app backend

### Data Protection
- **Read-Only Operations**: App only reads from S3, no writes
- **Query Limits**: Enforce LIMIT clauses on data preview queries
- **No PII Exposure**: Sample data may contain sensitive information, limit access

---

## Performance Optimization

### Backend Optimization
- **Caching**: Cache table list for 5 minutes using TTL cache
- **Pagination**: Implement offset/limit for large table lists
- **Async Operations**: Use FastAPI async handlers for I/O operations
- **Connection Pooling**: Reuse Databricks SDK client instances

### Frontend Optimization
- **Code Splitting**: Lazy load pages with React.lazy()
- **Query Caching**: React Query caches API responses automatically
- **Debouncing**: Debounce search input (300ms delay)
- **Virtual Scrolling**: Use virtual list for 100+ tables

### Database Optimization
- **Parallel Queries**: Execute independent SQL queries concurrently
- **Result Limits**: Always use LIMIT for preview queries
- **Schema Caching**: Cache table schemas for 1 hour

---

## Error Handling

### Backend Error Patterns
```python
from fastapi import HTTPException

class TableNotFoundException(HTTPException):
    def __init__(self, table_name: str):
        super().__init__(
            status_code=404,
            detail=f"Table '{table_name}' not found"
        )

class SparkExecutionException(HTTPException):
    def __init__(self, query: str, error: str):
        super().__init__(
            status_code=500,
            detail=f"Failed to execute query: {error}"
        )
```

### Frontend Error Handling
```tsx
function TablesListPage() {
  const { data, error, isLoading } = useTablesQuery();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading tables</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  // Render tables...
}
```

### Common Error Scenarios
1. **S3 Access Denied**: Display error with instructions to check credentials
2. **Spark Query Timeout**: Show timeout error with retry button
3. **Job Submission Failed**: Display error with job configuration details
4. **Network Errors**: Automatic retry with exponential backoff (React Query)

---

## Testing Strategy

### Backend Testing
- **Unit Tests**: pytest for service layer logic
- **Integration Tests**: Test Databricks SDK integration with mock responses
- **API Tests**: Test FastAPI endpoints with TestClient
- **SQL Query Tests**: Validate Spark SQL query generation

### Frontend Testing
- **Component Tests**: React Testing Library for UI components
- **API Integration Tests**: Mock API responses with MSW
- **E2E Tests**: Playwright for critical user flows

### Manual Testing Checklist
- [ ] Dashboard loads with correct metrics
- [ ] Table list displays all S3 tables
- [ ] Table detail shows schema, history, and sample data
- [ ] Configuration page displays masked credentials
- [ ] Job submission starts processing job
- [ ] Job status updates in real-time
- [ ] Job logs stream correctly
- [ ] Job cancellation works

---

## Deployment Architecture

### App Structure
```
databricks-app/
├── server/              # FastAPI backend
├── client/dist/         # Built React app (static files)
├── app.yaml             # Databricks App config
├── requirements.txt     # Python dependencies
└── .databricks/         # Deployment metadata
```

### app.yaml Configuration
```yaml
command: ["uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "8000"]
static_files:
  - source: "client/dist"
    target: "/"
env:
  - name: DATABRICKS_HOST
  - name: DATABRICKS_TOKEN
  - name: DATABRICKS_WAREHOUSE_ID
    value: "${var.warehouse_id}"
resources:
  memory: "2Gi"
  cpu: "1"
```

### Deployment Process
1. **Build Frontend**: `cd client && bun run build`
2. **Generate Requirements**: `uv pip compile pyproject.toml -o requirements.txt`
3. **Deploy**: `databricks apps deploy guidewire-monitor`
4. **Verify**: Check app status and logs

---

## Monitoring and Observability

### Application Logs
- **Backend Logs**: FastAPI request/response logs
- **Job Logs**: Stream from Databricks Jobs API
- **Error Logs**: Structured error logging with context

### Metrics
- **API Response Times**: Track p50, p95, p99 latencies
- **Table Query Times**: Monitor Spark SQL execution times
- **Job Success Rate**: Track job completion vs failures

### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "databricks_connection": await check_databricks_connection(),
        "s3_access": await check_s3_access()
    }
```

---

## Implementation Status

### ✅ Completed: Job Management System (MVP)

#### Backend Implementation
**Files Created**:
- `server/models/guidewire.py` - Pydantic models for job management
- `server/services/guidewire_service.py` - Core service with Ray parallel processing
- `server/routers/guidewire.py` - FastAPI REST endpoints

**Pydantic Models**:
```python
class GuidewireConfig(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_manifest_location: str
    aws_region: str
    aws_s3_bucket: str
    ray_dedup_logs: str
    parallel: bool = True
    show_progress: bool = True
    table_names: Optional[List[str]] = None
    exceptions: Optional[List[str]] = None
    largest_tables_first_count: Optional[int] = None

class ProcessingResult(BaseModel):
    table: str
    status: str
    process_start_time: str
    process_finish_time: Optional[str]
    process_start_watermark: int
    process_finish_watermark: Optional[int]
    manifest_records: int
    errors: Optional[List[str]]
    warnings: Optional[List[str]]
    duration_seconds: Optional[float]

class ProcessingJobStatus(BaseModel):
    job_id: str
    status: str
    start_time: str
    end_time: Optional[str]
    total_tables: int
    tables_processed: int
    tables_failed: int
    progress_percent: float
    duration_seconds: Optional[float]
    error_message: Optional[str]
    results: List[ProcessingResult]
    config: Dict[str, Any]
```

**REST API Endpoints**:
```python
POST /api/guidewire/jobs/start
  Request: StartJobRequest with GuidewireConfig
  Response: StartJobResponse with job_id

GET /api/guidewire/jobs
  Response: List[ProcessingJobSummary]

GET /api/guidewire/jobs/{job_id}
  Response: ProcessingJobStatus with full details
```

**GuidewireService Implementation**:
- Thread-safe in-memory job store with locking
- Background thread execution for non-blocking job processing
- Ray parallel mode integration with Guidewire Processor
- Per-job environment variable management for AWS credentials
- Real-time progress tracking per table
- Comprehensive error handling and status reporting

**Key Methods**:
```python
async def start_job(config: GuidewireConfig) -> StartJobResponse:
    """Start processing job in background thread"""

def _run_processor_sync(job_id: str, config: GuidewireConfig):
    """Execute Guidewire Processor with Ray parallel mode"""

async def get_job_status(job_id: str) -> ProcessingJobStatus:
    """Get detailed job status with results"""

async def list_jobs() -> List[ProcessingJobSummary]:
    """List all jobs with summaries"""
```

#### Frontend Implementation
**Files Created**:
- `client/src/pages/GuidewireJobsPage.tsx` - Jobs list and configuration form
- `client/src/pages/JobDetailPage.tsx` - Detailed job monitoring
- `client/src/components/Layout.tsx` - Databricks-themed layout
- `client/src/lib/api.ts` - Custom API client wrapper
- `client/src/App.tsx` - Updated with routing

**GuidewireJobsPage Features**:
- Configuration form with AWS credentials and S3 locations
- Start job button with validation
- Jobs list with real-time auto-refresh (5-second polling)
- Job summary cards with progress, status, and metrics
- Navigation to detailed job view
- Error handling and loading states
- Databricks visual theme with red gradients and professional styling

**JobDetailPage Features**:
- Detailed job status with progress tracking
- Summary cards: Progress, Duration, Configuration
- Table processing results with per-table status
- Real-time updates (3-second polling for running jobs)
- Error display for failed tables
- Status badges and progress bars
- Databricks visual theme consistency

**React Query Integration**:
```typescript
// Auto-refresh every 5 seconds
const { data: jobs } = useQuery<JobSummary[]>({
  queryKey: ['guidewire-jobs'],
  queryFn: async () => { ... },
  refetchInterval: 5000,
});

// Conditional polling based on status
const { data: job } = useQuery<JobStatus>({
  queryKey: ['guidewire-job', jobId],
  queryFn: async () => { ... },
  refetchInterval: (data) => {
    return data?.status === 'running' ? 3000 : false;
  },
});
```

**Custom API Client**:
```typescript
export const apiClient = {
  GET: async (path: string, options?: { params?: { path?: Record<string, string> } }) => {
    let url = `${API_BASE_URL}${path}`;
    // Replace path parameters like {job_id}
    if (options?.params?.path) {
      for (const [key, value] of Object.entries(options.params.path)) {
        url = url.replace(`{${key}}`, value);
      }
    }
    const response = await fetch(url);
    const data = await response.json();
    return { data, response };
  },
  POST: async (path: string, options?: { body?: any }) => { ... },
  DELETE: async (path: string, options?: { params?: { path?: Record<string, string> } }) => { ... },
};
```

#### Databricks Visual Theme
**Color Palette**:
- Primary: Red gradients (`from-red-500 to-red-600`) for Databricks branding
- Text: Slate scale (`slate-900` for headings, `slate-500/600` for secondary)
- Backgrounds: White cards on gradient background (`from-slate-50 via-white to-slate-100`)
- Borders: Subtle `slate-200` borders for definition
- Shadows: Layered shadows for depth and visual hierarchy

**Layout Component**:
```tsx
- Databricks-branded header with logo and navigation
- Red gradient logo icon with Database icon
- Professional typography (text-xl font-bold)
- "Ray Parallel" green indicator badge
- Footer with service status
- Gradient background for visual depth
```

**Enhanced Components**:
- **Buttons**: Red gradients with shadow effects (`shadow-lg shadow-red-500/30`)
- **Forms**: Professional inputs with red focus states (`focus:border-red-500`)
- **Cards**: White backgrounds with hover shadows and transitions
- **Progress Bars**: Smooth red gradients with animations (`transition-all duration-500`)
- **Badges**: Bold, uppercase status indicators
- **Metrics**: Large, readable typography (5xl for numbers)

#### Development Experience
- **Hot Reloading**: Vite dev server with instant HMR
- **Auto-reload Backend**: Uvicorn with --reload flag
- **CORS Configuration**: Proper CORS for ports 3000 and 5173
- **TypeScript Safety**: Full type coverage with Pydantic and TypeScript
- **API Documentation**: Auto-generated FastAPI docs at `/docs`

---

## Implementation Plan (Updated)

### ✅ Phase 1: Job Management MVP (Completed)
**Goal**: Functional job management system with Ray parallel processing

**Completed Tasks**:
- [x] Implement GuidewireService with Ray parallel processing
- [x] Create Pydantic models for job management
- [x] Build FastAPI REST endpoints (start, list, get status)
- [x] Implement thread-safe in-memory job store
- [x] Create GuidewireJobsPage with configuration form
- [x] Build JobDetailPage with real-time monitoring
- [x] Add Layout component with Databricks branding
- [x] Implement React Query for auto-refresh
- [x] Apply Databricks visual theme across all components
- [x] Add custom API client wrapper
- [x] Configure CORS for local development

**Deliverables**:
- ✅ Users can configure and start Guidewire processing jobs
- ✅ Jobs run with Ray parallel mode in background threads
- ✅ Real-time job monitoring with auto-refresh
- ✅ Per-table processing results and error tracking
- ✅ Professional Databricks-themed UI
- ✅ Fully functional local development environment

### 🔄 Phase 2: Production Deployment (In Progress)
**Goal**: Deploy to Databricks Apps and integrate with production data

**Tasks**:
- [ ] Test with real Guidewire CDA data from S3
- [ ] Integrate actual Guidewire wheel package (0.1.2)
- [ ] Configure environment variables for production
- [ ] Build frontend for production (`bun run build`)
- [ ] Generate requirements.txt from pyproject.toml
- [ ] Deploy to Databricks Apps
- [ ] Test deployed app with real processing jobs
- [ ] Monitor logs and performance

**Deliverables**:
- Production-ready deployment on Databricks Apps
- Integration with real CDA parquet files
- Processing jobs running on Databricks clusters

### 📋 Phase 3: Additional Features (Future)
**Goal**: Extend functionality beyond job management

**Tasks**:
- [ ] Dashboard view with system overview
- [ ] Table list view (browse S3 Delta tables)
- [ ] Table detail view (schema, history, data preview)
- [ ] Configuration view (read-only settings display)
- [ ] Search and filter capabilities
- [ ] Job history and analytics
- [ ] Email/Slack notifications
- [ ] Delta table optimization commands

**Deliverables**:
- Complete data catalog functionality
- Historical metrics and trends
- Enhanced user experience features

---

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| S3 access permission issues | High | Test credentials early, provide clear error messages |
| Spark SQL query timeouts | Medium | Set reasonable timeouts, implement retry logic |
| Large result sets crash UI | Medium | Implement pagination, limit preview rows |
| Job submission failures | High | Validate parameters, handle errors gracefully |
| Delta table format changes | Low | Use Delta Lake APIs, handle version differences |

### Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| App deployment failures | High | Test deployment process, automate with CI/CD |
| User lacks workspace permissions | Medium | Document required permissions, show helpful errors |
| Network connectivity issues | Low | Implement automatic retries, show connection status |

---

## Future Enhancements

### Short-term (Next Quarter)
- Advanced search and filtering (by date, size, schema)
- Table comparison view (diff schemas across tables)
- Export table metadata to CSV/JSON
- Scheduled job runs with cron expressions
- Email/Slack notifications for job completion

### Long-term (Next 6 Months)
- Historical metrics and trends (job duration, data volume)
- Data quality checks (null counts, row count validation)
- Delta table optimization (OPTIMIZE, VACUUM commands)
- Multi-workspace support (switch between workspaces)
- Custom SQL query interface
- Integration with Unity Catalog for governance

---

## Success Criteria

### Technical Metrics
- ✅ App loads in < 2 seconds
- ✅ API response time < 500ms (p95)
- ✅ Can display 100+ tables without performance issues
- ✅ Zero downtime during deployments
- ✅ 95% test coverage for critical paths

### User Metrics
- ✅ Data engineers can verify table status in < 30 seconds
- ✅ Analytics users can find needed tables in < 1 minute
- ✅ Users can trigger processing jobs with < 5 clicks
- ✅ Job status updates visible within 5 seconds

### Business Metrics
- ✅ Reduces manual processing time by 50%
- ✅ Increases data pipeline visibility
- ✅ Decreases troubleshooting time for data issues

---

## Appendix

### Useful Databricks SDK References
- [Databricks SDK Documentation](https://databricks-sdk-py.readthedocs.io/)
- [SQL Statement Execution API](https://docs.databricks.com/api/workspace/statementexecution)
- [Jobs API Documentation](https://docs.databricks.com/api/workspace/jobs)
- [DBFS API Documentation](https://docs.databricks.com/api/workspace/dbfs)

### Delta Lake References
- [Delta Lake Documentation](https://docs.delta.io/)
- [DESCRIBE HISTORY](https://docs.delta.io/latest/delta-utility.html#history)
- [Delta Transaction Log](https://docs.delta.io/latest/delta-storage.html)

### Spark SQL References
- [Spark SQL Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [DataFrame API](https://spark.apache.org/docs/latest/api/python/reference/pyspark.sql/api/pyspark.sql.DataFrame.html)
