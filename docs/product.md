# Product Requirements Document
# Guidewire Connector Monitor (Test App)

## Executive Summary

### Problem Statement
Insurance companies using Guidewire Cloud Data Access need visibility into the data processing pipeline when converting CDA parquet files to Delta Lake tables. Currently, there's no simple way to monitor processing status, view table information, or trigger data refreshes.

### Solution
A lightweight Databricks App that provides a web interface for monitoring Guidewire CDA processing jobs, viewing processed tables, and displaying basic metrics about the data pipeline.

---

## Target Users

### Primary User: Data Engineers
- **Role**: Responsible for maintaining Guidewire data pipelines
- **Goals**: Monitor processing status, troubleshoot issues, verify table availability
- **Pain Points**: No visibility into processing progress, manual checking required

### Secondary User: Analytics Teams
- **Role**: Consume processed Guidewire data for analysis
- **Goals**: Check data freshness, verify table availability
- **Pain Points**: Unclear when data is ready, no catalog of available tables

---

## Core Features (MVP - Test Version)

### 1. Dashboard View
**Description**: Simple home page showing system overview
- Display total number of processed tables
- Show last processing timestamp
- Display basic system health status (connected/disconnected)

**User Story**:
> As a data engineer, I want to see a quick overview of the Guidewire processing status when I open the app, so I can verify the system is running properly.

### 2. Table List View
**Description**: Display list of available Guidewire Delta tables from S3
- List tables from `s3://sumanmisra/target/` using `dbutils.fs.ls()`
- Display Delta transaction counts from `_delta_log/` directory
- Show last updated timestamps from Delta table history
- Simple search/filter functionality
- Copy-to-clipboard for table paths

**User Story**:
> As an analytics user, I want to see which Guidewire Delta tables are available in S3, so I know what data I can query.

**Technical Implementation**:
```python
# List tables using Databricks SDK
tables = dbutils.fs.ls('s3://sumanmisra/target/')
# For each table, read Delta history
spark.sql(f"DESCRIBE HISTORY delta.`s3://sumanmisra/target/{table_name}/`")
```

### 3. Table Detail View
**Description**: Show details for a selected Delta table
- Table name and S3 path
- Schema preview using `DESCRIBE` command
- Row count from `COUNT(*)` query
- Delta history showing all transactions
- Sample data preview (first 10 rows)

**User Story**:
> As a data engineer, I want to see detailed information about a specific Delta table, so I can verify it has the correct schema and data.

**Technical Implementation**:
```sql
-- Get schema
DESCRIBE delta.`s3://sumanmisra/target/claim_401000005/`

-- Get history
DESCRIBE HISTORY delta.`s3://sumanmisra/target/claim_401000005/`

-- Preview data
SELECT * FROM delta.`s3://sumanmisra/target/claim_401000005/` LIMIT 10
```

### 4. Configuration View
**Description**: Display current Guidewire processing configuration
- AWS credentials (masked, show last 4 chars only)
- S3 bucket locations (CDA manifest, Delta target)
- AWS region
- Processing mode (Parallel/Sequential)
- Guidewire package version
- Ray cluster settings

**User Story**:
> As a data engineer, I want to view the current Guidewire configuration, so I can verify settings are correct.

**Configuration Items** (from notebook widgets):
- AWS Access Key ID (masked)
- AWS Secret Access Key (masked)
- AWS Manifest Location
- AWS Region
- AWS S3 Bucket
- Ray Dedup Logs setting

### 5. Run Guidewire Processor (MVP Feature)
**Description**: Trigger the Guidewire CDA to Delta Lake processing job
- Button to start processing job
- Display job status (Not Started / Running / Completed / Failed)
- Show processing progress and logs in real-time
- Display Ray cluster status during processing
- Ability to cancel/stop running jobs

**User Story**:
> As a data engineer, I want to trigger Guidewire processing from the UI, so I don't have to manually run the notebook every time.

**Technical Implementation**:
```python
# Option 1: Run notebook via Databricks Jobs API
databricks_client.jobs.submit_run(
    run_name="Guidewire Processing",
    tasks=[{
        "notebook_task": {
            "notebook_path": "/Users/suman.misra@databricks.com/Guidewire_Processing",
            "base_parameters": {
                "aws_access_key_id": "...",
                "aws_secret_access_key": "...",
                # ... other parameters
            }
        }
    }]
)

# Option 2: Call Guidewire processor directly (if package accessible)
from guidewire import Processor
processor = Processor(target_cloud="aws", parallel=True)
processor.run()
```

**Job Monitoring**:
- Poll job status every 5 seconds
- Display Ray cluster metrics
- Show processing logs in real-time
- Track number of tables processed
- Display estimated time remaining

---

## Nice-to-Have Features (Future)

- **Advanced Job Controls** - Pause/resume processing, retry failed tables
- **Selective Processing** - Choose specific tables to process
- **Real-time Ray Metrics** - CPU/memory usage, worker status
- **Data Quality Metrics** - Row counts, null checks, data freshness
- **Email/Slack Notifications** - Alert on job completion/failure
- **Edit Configuration** - Update widget values and save
- **Historical Metrics** - Track processing times, data volumes over time
- **Delta Table Optimization** - Trigger OPTIMIZE and VACUUM commands
- **Validation View** - Run queries from `Guidewire review` notebook
- **Job Scheduling** - Schedule recurring processing jobs
- **Multi-Job Management** - Run multiple processing jobs in parallel

---

## Success Metrics

### Technical Metrics
- App loads in < 2 seconds
- Can display list of 100+ tables without performance issues
- Zero downtime during deployments

### User Metrics
- Data engineers can verify table status in < 30 seconds
- Analytics users can find needed tables in < 1 minute

---

## Implementation Priority

### Phase 1: Basic UI (Week 1)
- Dashboard with mock data
- Table list view with hardcoded tables
- Basic navigation between views
- Configuration view (read-only)

### Phase 2: Data Integration (Week 2)
- Connect to S3 to list Delta tables using Databricks SDK
- Query Delta table metadata using Spark SQL
- Display real row counts using `COUNT(*)`
- Show Delta history timestamps
- Implement S3 authentication with AWS credentials

### Phase 3: Job Execution (Week 3)
- Implement "Run Processor" button
- Trigger `Guidewire_Processing` notebook via Jobs API
- Display job status and progress
- Show real-time logs from job execution
- Handle job errors and failures

### Phase 4: Polish (Week 4)
- Add search/filter functionality
- Improve styling and UX
- Error handling and loading states
- Add job history view
- Optimize performance

---

## Technical Constraints

### Must Use
- Databricks Apps platform
- FastAPI backend (already in template)
- React frontend (already in template)
- Databricks SDK for data access

### Must Work With
- Guidewire CDA Delta tables in S3 (`s3://sumanmisra/target/`)
- AWS S3 (us-east-1 region)
- Unity Catalog Volume (`/Volumes/pc_insurance/guidewire/Files/`)
- Ray cluster for distributed processing
- Spark SQL for Delta table queries

### Performance Requirements
- Support at least 100 tables in list view
- Page load time < 2 seconds
- API response time < 500ms

---

## Out of Scope (For This Test)

- Authentication/authorization (uses Databricks App built-in auth)
- Data processing/transformation (read-only app)
- Writing data back to Guidewire
- Complex analytics or visualizations
- Mobile app support
- Multi-tenancy

---

## Real Data Sources

### S3 Locations
```
CDA Manifest: s3://sumanmisra/cda/
Delta Tables: s3://sumanmisra/target/
Unity Catalog: /Volumes/pc_insurance/guidewire/Files/
```

### Sample Tables (Real)
```
1. claim_401000005 - Located at s3://sumanmisra/target/claim_401000005/
   - Delta transactions: 494+
   - Query: SELECT * FROM delta.`s3://sumanmisra/target/claim_401000005/`
```

### Actual Configuration
```
Connection Type: AWS S3
AWS Region: us-east-1
S3 Bucket: sumanmisra/target
Manifest Location: s3://sumanmisra/cda/
Processing Mode: Parallel (Ray-based)
Guidewire Package: guidewire_cda_delta_clone-0.1.3-py3-none-any.whl
Package Location: /Volumes/pc_insurance/guidewire/Files/
```

---

## Acceptance Criteria

### Must Have (MVP)
✅ User can view dashboard with system overview
✅ User can see list of Guidewire Delta tables from S3
✅ User can click on a table to see details (schema, history, data preview)
✅ User can view configuration settings (AWS/S3)
✅ User can trigger Guidewire processing job
✅ User can monitor job status and progress
✅ App is deployed and accessible via Databricks Apps URL

### Nice to Have
⚪ User can search/filter tables
⚪ User can see real-time data from Unity Catalog
⚪ User can copy table names for SQL queries
⚪ App has loading states and error messages

---

## Notes

This is a **test/proof-of-concept** app designed to:
1. Validate the Databricks Apps development workflow
2. Test basic CRUD operations with Databricks SDK
3. Demonstrate UI capabilities for stakeholder review
4. Establish patterns for future features

**Timeline**: 1-2 weeks for MVP
**Team**: 1 developer
**Deployment**: Databricks Apps (already set up)
