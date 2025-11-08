# 🚀 Guidewire Connector Monitor

A production-ready Databricks application for processing Guidewire Cloud Data Access (CDA) data into Delta Lake tables with comprehensive monitoring, inspection, and S3 browsing capabilities.

**Built with modern technologies**: FastAPI backend with React TypeScript frontend, deployed as a Databricks App with seamless workspace integration.

![Databricks Apps](https://img.shields.io/badge/Databricks-Apps-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Delta Lake](https://img.shields.io/badge/Delta-Lake-blue)
![Guidewire](https://img.shields.io/badge/Guidewire-CDA-red)

## 🎯 What This App Does

**Guidewire Connector Monitor** provides a complete solution for ingesting Guidewire CDA data into Databricks:

- **🔄 Processing Jobs**: Start and monitor Guidewire CDA to Delta Lake conversion jobs with Ray parallel processing
- **🔍 Delta Inspector**: Inspect Delta Lake tables with schema viewer, transaction history, and data preview
- **📁 S3 Browser**: Browse S3 or MinIO buckets, navigate folders, search files, and download data
- **📊 Real-time Monitoring**: Track job progress with live updates, table-by-table status, and error handling

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/sumisr-db/Guidewire.git
cd Guidewire
```

### 2. Setup Environment

Run the interactive setup script to configure your environment:

```bash
./setup.sh
```

This will:
- Check and install required dependencies (Git, uv, bun, Node.js)
- Configure Databricks authentication (PAT or CLI profile)
- Install Python and frontend dependencies
- Set up environment variables

### 3. Start Development Server

```bash
./watch.sh
```

This runs both servers in the background:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. Open the Application

Navigate to http://localhost:5173 to access the Guidewire Connector Monitor interface.

---

## 📋 Prerequisites

### Required Tools
- **Git** - Version control
- **uv** - Ultra-fast Python package manager (auto-manages Python versions)
- **bun** - Fast JavaScript package manager
- **Node.js 18+** - Required for frontend build
- **Homebrew** - Package manager (macOS only, auto-checked)

Note: Python 3.11+ and Databricks CLI are automatically managed by uv. The `setup.sh` script will help you install any missing dependencies with interactive prompts.

### Databricks Requirements
- Valid Databricks workspace
- Personal Access Token (PAT) or CLI profile configured
- Cluster with CAN_RESTART permission for the app service principal
- Appropriate permissions for app deployment

### Data Sources
- **AWS S3** or **MinIO** for Guidewire CDA manifest and data files
- S3 credentials with ListBucket and GetObject permissions

For local development, you can use MinIO (lightweight S3-compatible server). See `docs/local-s3.md` for setup instructions (S3 API on port 9000, Console on port 9001).

---

## ✨ Key Features

### Processing & Monitoring
- **⚡ Ray Parallel Processing** - Process multiple Guidewire tables simultaneously for faster ingestion
- **📊 Real-time Progress Tracking** - Live job status with progress bars and table-by-table details
- **🔄 Automatic Retries** - Robust error handling with detailed failure reporting
- **📈 Job History** - Complete audit trail of all processing jobs

### Delta Lake Integration
- **🔍 Schema Inspector** - View table structure, data types, and partition columns
- **📜 Transaction History** - Full Delta Lake transaction log with version tracking
- **👁️ Data Preview** - Browse actual table data with 100-row samples
- **✅ Data Validation** - Verify processing results with row counts and data sampling

### S3/MinIO Browser
- **📁 File Navigation** - Browse buckets and folders with breadcrumb navigation
- **🔎 Search** - Filter files and folders by name in real-time
- **⬇️ Secure Downloads** - Generate pre-signed URLs for file downloads
- **🌐 Multi-Provider** - Support for both AWS S3 and local MinIO

### Technical Features
- **🔥 Hot Reloading** - Instant updates during development for both frontend and backend
- **🔄 Auto-Generated API Client** - TypeScript client generated from FastAPI OpenAPI spec
- **🔐 Databricks Authentication** - Seamless workspace integration with Databricks SDK
- **🎨 Modern UI** - Beautiful, responsive interface using shadcn/ui + Tailwind CSS
- **🚀 Production Ready** - Deployed as Databricks App with proper error handling and logging

## 🏗️ Project Structure

```
├── server/                         # FastAPI backend
│   ├── app.py                      # Main application
│   ├── routers/                    # API route handlers
│   │   ├── guidewire.py           # Guidewire CDA processing endpoints
│   │   ├── delta.py               # Delta Lake inspection endpoints
│   │   ├── s3_browser.py          # S3/MinIO browser endpoints
│   │   └── user.py                # User information endpoints
│   ├── models/                     # Pydantic data models
│   │   ├── guidewire.py           # Job and processing models
│   │   ├── delta.py               # Delta table models
│   │   └── s3_browser.py          # S3 object models
│   └── services/                   # Business logic
│       ├── guidewire_service.py   # Job management and processing
│       ├── delta_service.py       # Delta Lake operations
│       ├── s3_browser_service.py  # S3/MinIO operations
│       └── s3_client_factory.py   # S3 client configuration
│
├── client/                         # React TypeScript frontend
│   ├── src/
│   │   ├── pages/                 # Main application pages
│   │   │   ├── WelcomePage.tsx   # Landing page
│   │   │   ├── GuidewireJobsPage.tsx      # Job management UI
│   │   │   ├── JobDetailPage.tsx          # Job detail view
│   │   │   ├── DeltaInspectorPage.tsx     # Delta table inspection
│   │   │   └── S3BrowserPage.tsx          # S3/MinIO browser
│   │   ├── components/            # Reusable UI components (shadcn/ui)
│   │   ├── lib/                   # Utilities and helpers
│   │   └── fastapi_client/        # Auto-generated API client
│   ├── package.json               # Frontend dependencies
│   └── vite.config.ts             # Vite configuration
│
├── docs/                           # Documentation
│   ├── product.md                 # Product requirements
│   ├── design.md                  # Technical design
│   ├── local-s3.md                # MinIO setup guide
│   └── databricks_apis/           # Databricks API docs
│
├── scripts/                        # Automation scripts
│   ├── make_fastapi_client.py    # Generate TypeScript client
│   └── generate_semver_requirements.py # Create requirements.txt
│
├── setup.sh                        # Interactive environment setup
├── watch.sh                        # Development server launcher
├── fix.sh                          # Code formatter (ruff + prettier)
├── deploy.sh                       # Databricks Apps deployment
├── app_status.sh                   # Check deployed app status
├── dba_client.py                   # CLI tool for testing endpoints
├── dba_logz.py                     # Real-time log streaming
├── pyproject.toml                  # Python dependencies
├── app.yaml                        # Databricks Apps configuration
└── CLAUDE.md                       # Development guide for Claude Code
```

## 🔧 Development Workflow

### 1. Setup Environment

```bash
./setup.sh
```

This interactive script will:
- **Check system dependencies** (Git, uv, Bun, Node.js 18+)
- **Install missing dependencies** with interactive prompts and OS-specific commands
- **Set up Databricks authentication** (PAT or profile)
- **Install Python dependencies** with uv (including Python 3.11+ if needed)
- **Install frontend dependencies** with bun
- **Configure environment variables**

The setup script uses a modular design with individual dependency checkers in the `setup_utils/` directory for better maintainability.

### 2. Start Development

```bash
./watch.sh
```

This runs both servers in the background:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 3. Access the Application

Open http://localhost:5173 to access the Guidewire Connector Monitor with:
- **Home Page**: Application overview and development commands
- **Processing Jobs**: Start and monitor CDA to Delta Lake jobs
- **Delta Inspector**: Inspect Delta tables with schema, history, and preview
- **S3 Browser**: Browse and download files from S3 or MinIO

See the **User Guide** section below for detailed instructions on using each feature.

## 🛠️ Development Commands

| Command | Description | Flags |
|---------|-------------|-------|
| `./setup.sh` | Interactive environment setup | `--auto-close` |
| `./watch.sh` | Start dev servers (background) | `--prod` |
| `./fix.sh` | Format code (Python + TypeScript) | None |
| `./deploy.sh` | Deploy to Databricks Apps | `--verbose`, `--create` |
| `./app_status.sh` | Check deployed app status | `--verbose` |
| `./run_app_local.sh` | Run app locally for debugging | `--verbose` |

### Script Details

#### Core Development Scripts
- **`./setup.sh`** - Configures authentication, installs dependencies, sets up environment
- **`./watch.sh`** - Starts both frontend and backend with hot reloading and auto-client generation
- **`./fix.sh`** - Formats Python (ruff) and TypeScript (prettier) code

#### Deployment & Monitoring
- **`./deploy.sh`** - Builds, syncs, and deploys to Databricks Apps
  - `--create` - Creates app if it doesn't exist
  - `--verbose` - Shows detailed deployment logs
- **`./app_status.sh`** - Shows app status with nice formatting
  - `--verbose` - Includes full JSON response and workspace files

#### Debugging Tools
- **`./run_app_local.sh`** - Runs app locally with debug mode for troubleshooting deployment issues
- **`scripts/make_fastapi_client.py`** - Generates TypeScript client from OpenAPI spec
- **`scripts/generate_semver_requirements.py`** - Creates requirements.txt from pyproject.toml

## 🧪 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **uv** - Ultra-fast Python package management
- **Databricks SDK** - Workspace integration and API access
- **Databricks Connect** - Local development with remote compute
- **MLflow[databricks]** - Experiment tracking, model management, and AI agents
- **Automatic OpenAPI** - Generated documentation

### Frontend
- **React 18** - Modern React with TypeScript
- **Vite** - Lightning-fast build tool
- **shadcn/ui** - Beautiful, accessible components
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **bun** - Fast package manager

### Development
- **Hot Reloading** - Instant feedback loop
- **Type Safety** - Full TypeScript coverage
- **Code Quality** - ruff (Python) + prettier (TypeScript)
- **Background Processes** - nohup with comprehensive logging

## 🔐 Authentication & Configuration

### Environment Variables (`.env.local`)

The setup script creates `.env.local` with your configuration:

```bash
# Authentication Type
DATABRICKS_AUTH_TYPE=pat  # or "databricks-cli"

# For PAT Authentication
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=your-personal-access-token

# For Profile Authentication  
DATABRICKS_CONFIG_PROFILE=your-profile-name

# App Configuration
DATABRICKS_APP_NAME=your-app-name
DBA_SOURCE_CODE_PATH=/Workspace/Users/you@company.com/your-app-name
```

### Authentication Methods

#### 1. Personal Access Token (PAT) - Recommended for Development
- **Pros**: Simple setup, works everywhere
- **Cons**: Token needs periodic renewal
- **Setup**: Generate PAT in Databricks workspace → User Settings → Access Tokens

#### 2. CLI Profile - Recommended for Production
- **Pros**: More secure, supports OAuth
- **Cons**: Requires CLI configuration
- **Setup**: Run `databricks auth login --host <workspace-url> --profile <profile-name>`

### Validation
The setup script automatically validates your configuration and tests connectivity.

## 🚀 Deployment

### Deploy to Databricks Apps

```bash
# Deploy existing app
./deploy.sh

# Create and deploy new app
./deploy.sh --create

# Deploy with verbose logging
./deploy.sh --verbose
```

### Deployment Process

The deployment script automatically:
1. **Authenticates** with Databricks using your `.env.local` configuration
2. **Creates app** (if using `--create` flag and app doesn't exist)
3. **Builds frontend** using Vite for production
4. **Generates requirements.txt** from pyproject.toml (avoids editable installs)
5. **Syncs source code** to Databricks workspace
6. **Deploys app** via Databricks CLI
7. **Verifies deployment** and shows app URL

### Monitoring Your App

#### Check App Status
```bash
./app_status.sh          # Basic status with nice formatting
./app_status.sh --verbose # Includes full JSON + workspace files
```

#### View App Logs
- **Visit your app URL + `/logz`** in browser (requires OAuth authentication)
- **Example**: `https://your-app-url.databricksapps.com/logz`
- **Cannot be accessed via curl** - browser authentication required

#### Debug Deployment Issues
```bash
./run_app_local.sh        # Test app locally first
./run_app_local.sh --verbose # Detailed local debugging
```

### Deployment Troubleshooting

**Common Issues:**
- **Import errors**: Run `./run_app_local.sh` to test locally first
- **Missing files**: Check with `./app_status.sh --verbose`
- **Authentication**: Verify `.env.local` configuration
- **CLI outdated**: Since we use `databricks`, the CLI is always up-to-date

## 🔧 Extending the Application

### Adding New Features

**Add API Endpoints**:
- Create new routers in `server/routers/`
- Define Pydantic models in `server/models/`
- Implement business logic in `server/services/`
- Auto-generated TypeScript client will include new endpoints

**Create UI Pages**:
- Add React pages in `client/src/pages/`
- Use shadcn/ui components from `client/src/components/ui/`
- Import API client: `import { apiClient } from '@/lib/api'`
- Add routes in `client/src/App.tsx`

**Add Dependencies**:
- Python: `uv add package-name`
- Frontend: `cd client && bun add package-name`

See `CLAUDE.md` for detailed development workflows and best practices.

## 🐛 Troubleshooting

### Development Server Issues

#### Check Development Server Status
```bash
# View logs
tail -f /tmp/databricks-app-watch.log

# Check running processes
ps aux | grep databricks-app

# Check PID file
cat /tmp/databricks-app-watch.pid
```

#### Restart Development Servers
```bash
# Stop servers
kill $(cat /tmp/databricks-app-watch.pid) || pkill -f watch.sh

# Start servers
nohup ./watch.sh > /tmp/databricks-app-watch.log 2>&1 &
```

### Common Error Solutions

#### Port Already in Use
```bash
# Kill processes using ports 5173/8000
pkill -f "uvicorn server.app:app"
pkill -f "vite"
```

#### TypeScript Client Missing
```bash
# Regenerate TypeScript client
uv run python scripts/make_fastapi_client.py
```

#### Import Errors (like `@/lib/utils`)
```bash
# Check if utils.ts exists in correct location
ls -la src/lib/utils.ts
ls -la client/src/lib/utils.ts

# Copy if missing
cp client/src/lib/utils.ts src/lib/utils.ts
```

#### Authentication Issues
```bash
# Test authentication (works for both PAT and profile)
source .env.local && export DATABRICKS_HOST && export DATABRICKS_TOKEN && databricks current-user me

# Reconfigure if needed
./setup.sh
```

### Deployment Issues

#### App Status Troubleshooting
```bash
# Check app status
./app_status.sh

# Get detailed information
./app_status.sh --verbose

# Check workspace files
source .env.local && export DATABRICKS_HOST && export DATABRICKS_TOKEN && databricks workspace list "$DBA_SOURCE_CODE_PATH"
```

#### Local Testing Before Deployment
```bash
# Test locally to catch issues
./run_app_local.sh

# Debug mode
./run_app_local.sh --verbose
```

### Advanced Debugging

#### FastAPI Development
- **API Documentation**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.json
- **Health Check**: http://localhost:8000/health

#### Frontend Development
- **Development Server**: http://localhost:5173
- **Network Tab**: Check browser dev tools for API calls
- **React Query DevTools**: Available in development mode

#### Log Files
- **Development**: `/tmp/databricks-app-watch.log`
- **Local App Test**: `/tmp/local-app-test.log`
- **Deployment**: Visit app URL + `/logz` in browser

### Reset Everything
```bash
# Nuclear option - reset everything
pkill -f watch.sh
rm -f /tmp/databricks-app-watch.pid
rm -f /tmp/databricks-app-watch.log
./setup.sh
```

## 🔒 Security & Legal

### Security
- **Security Policy**: See [SECURITY.md](SECURITY.md) for reporting vulnerabilities
- **Authentication**: Uses Databricks SDK with proper credential management
- **Environment Variables**: Stored in `.env.local` (excluded from version control)
- **Best Practices**: Follow secure coding practices in all contributions

### Legal & Licensing
- **License**: Custom Databricks license - see [LICENSE.md](LICENSE.md)
- **Code Ownership**: See [CODEOWNERS.txt](CODEOWNERS.txt) for maintainer information
- **Notice**: See [NOTICE.md](NOTICE.md) for third-party notices

### Privacy
- **Data Handling**: App runs in your Databricks workspace with your data governance
- **Credentials**: Stored locally, never transmitted except to Databricks
- **Logging**: Development logs stored locally in `/tmp/` directory

## 📖 User Guide - Using the Frontend Application

Once your app is running (either locally via `./watch.sh` at http://localhost:5173 or deployed to Databricks Apps), you can access the following features:

### Application Overview

The Guidewire Connector Monitor provides four main features accessible via the navigation menu:

1. **Home** - Welcome page with development guides and tech stack information
2. **Processing Jobs** - Start and monitor Guidewire CDA to Delta Lake processing jobs
3. **Delta Inspector** - Inspect Delta Lake tables with schema, history, and data preview
4. **S3 Browser** - Browse and download files from S3 or MinIO buckets

---

### 🏠 Home Page

**Purpose**: Overview of the application, tech stack, and getting started information.

**Features**:
- Current user information from Databricks
- Development commands reference
- Claude natural language commands
- Tech stack overview
- Project structure visualization
- Quick links to API documentation

**Usage**: This is your landing page. Use it to:
- Verify your Databricks authentication is working (user info displayed at top)
- Reference development commands while building
- Access API documentation via the "Explore API Documentation" button

---

### ⚙️ Processing Jobs Page

**Purpose**: Start new Guidewire CDA to Delta Lake processing jobs and monitor their progress in real-time.

#### Starting a New Job

1. **Click "Start New Job"** button in the top right
2. **Choose S3 Provider**:
   - **Local S3 (MinIO)**: For development/testing with local MinIO instance
   - **AWS S3**: For production data in AWS

3. **Configure S3 Settings**:

   **For Local MinIO**:
   - **MinIO Endpoint**: `http://127.0.0.1:9000` (default)
   - **Access Key**: `minioadmin` (default)
   - **Secret Key**: `minioadmin` (default)
   - **Region**: `us-east-1`
   - **Manifest Bucket**: Bucket containing CDA manifest files (e.g., `guidewire-cda`)
   - **Manifest Prefix**: Path to manifest files (e.g., `cda/`)
   - **Target Bucket**: Bucket for Delta Lake output (e.g., `guidewire-delta`)
   - **Target Prefix**: Path for Delta tables (e.g., `target/`)

   **For AWS S3**:
   - **AWS Access Key ID**: Your AWS access key
   - **AWS Secret Access Key**: Your AWS secret key
   - **AWS Region**: S3 region (e.g., `us-east-1`)
   - **Manifest Bucket**: S3 bucket with CDA manifests (e.g., `sumanmisra`)
   - **Manifest Prefix**: Prefix to manifest files (e.g., `cda/`)
   - **Target Bucket**: S3 bucket for Delta output (e.g., `sumanmisra`)
   - **Target Prefix**: Prefix for Delta tables (e.g., `target/`)

4. **Processing Configuration**:
   - ☑️ **Use Ray Parallel Processing**: Enable for faster multi-table processing
   - ☑️ **Show Progress**: Display real-time progress updates

5. **Click "Start Processing"** to begin the job

#### Monitoring Jobs

- **Job List**: All jobs are displayed as cards, showing:
  - Job ID (unique identifier)
  - Status badge (PENDING, RUNNING, COMPLETED, FAILED)
  - Progress percentage
  - Tables processed / total tables
  - Failed table count
  - Duration

- **Real-time Updates**: Jobs auto-refresh every 5 seconds while running

- **Progress Bar**: Active jobs show a progress bar and current operation message

- **View Details**: Click any job card to see detailed information and table-by-table progress

#### Navigation

- **S3 Browser Button**: Quick access to browse your S3/MinIO buckets
- **Refresh**: Jobs list automatically updates, no manual refresh needed

---

### 🔍 Delta Inspector Page

**Purpose**: Inspect Delta Lake tables created by processing jobs. View schema, transaction history, and preview data.

#### Setup

1. **Configure S3 Credentials** (top section):
   - **Bucket**: S3 bucket containing Delta tables (e.g., `sumanmisra`)
   - **Prefix**: Path to Delta tables (e.g., `target/`)
   - **Region**: AWS region (e.g., `us-east-1`)
   - **Access Key ID**: Your AWS access key
   - **Secret Access Key**: Your AWS secret key

2. **Click "Refresh"** to load available Delta tables

#### Browsing Tables

**Tables List**:
- Shows all Delta tables found in the specified S3 location
- Displays for each table:
  - Table name
  - Full S3 path
  - Number of files
  - Total size
  - Last modified timestamp

**Select a Table**: Click any table to view detailed information in three tabs:

#### Schema Tab

View the table structure:
- **Columns**: Name, data type, and nullable status for each column
- **Partition Columns**: Highlighted partitioning scheme (if applicable)

**Use Cases**:
- Verify table structure after processing
- Check data types for downstream integrations
- Identify partition columns for query optimization

#### History Tab

View Delta Lake transaction log:
- **Current Version**: Latest table version number
- **Transaction History**: Complete audit trail showing:
  - Version number
  - Timestamp
  - Operation type (WRITE, MERGE, UPDATE, DELETE, etc.)
  - User who performed the operation

**Use Cases**:
- Audit data changes
- Track who modified tables and when
- Debug data quality issues by reviewing operation history

#### Preview Tab

View actual table data:
- **Row Count**: Shows number of rows displayed (up to 100)
- **Data Grid**: Scrollable table with all columns
- **Data Preview**: First 50 rows displayed in monospace font
- **JSON Values**: Complex types shown as JSON strings

**Use Cases**:
- Quick data validation
- Verify processing results
- Sample data for testing queries

---

### 📁 S3 Browser Page

**Purpose**: Browse S3 or MinIO buckets, navigate folders, search files, and generate download URLs.

#### Setup

1. **Configure S3 Settings**:
   - **Provider**: Choose AWS S3 or Local MinIO
   - **Bucket**: Select from dropdown or enter manually
   - **Region**: AWS region (e.g., `us-east-1`)
   - **Access Key ID**: Your access key
   - **Secret Access Key**: Your secret key
   - **Endpoint URL**: (MinIO only) MinIO server URL (e.g., `http://localhost:9000`)

2. **Select Bucket**:
   - Use dropdown to select from available buckets
   - Or click "Manual" to type a bucket name directly

#### Navigation

**Breadcrumb Navigation**:
- Click the home icon (🏠) to go to bucket root
- Click any folder in the breadcrumb trail to navigate there
- Breadcrumb shows: Home > folder1 > folder2 > ...

**Browse Folders**:
- Folders displayed with blue folder icon (📁)
- Click any folder to enter it
- Subfolders and files load automatically

**Direct Path Navigation**:
- Click the folder input icon next to "Browse:"
- Enter a path directly (e.g., `cda/2024/01/`)
- Press Enter or click "Go"

#### Search

- **Search Box**: Top right of file browser
- Type to filter files and folders by name (case-insensitive)
- Results update in real-time as you type

#### File Operations

**View Files**:
- Files displayed with document icon (📄)
- Shows filename, size, and last modified date

**Download Files**:
- Click the download icon (⬇️) next to any file
- Generates a temporary pre-signed URL (valid for 1 hour)
- Opens in new browser tab for download

#### Summary Bar

Bottom of the browser shows:
- Total folder count
- Total file count
- Combined file size

#### Tips

- **Large Folders**: Displays up to 1,000 items per folder
- **Nested Folders**: Navigate freely between folder levels
- **Search**: Works on current folder only, not recursive
- **Refresh**: Use refresh button to reload current folder contents

---

### 🔄 Common Workflows

#### Workflow 1: Process Guidewire Data

1. Navigate to **Processing Jobs**
2. Click **Start New Job**
3. Select **AWS S3** tab
4. Enter your AWS credentials and bucket information
5. Enable **Ray Parallel Processing** for faster processing
6. Click **Start Processing**
7. Monitor progress in the job card (auto-refreshes every 5 seconds)
8. Click job card to see detailed table-by-table progress

#### Workflow 2: Inspect Processed Data

1. Wait for processing job to complete
2. Navigate to **Delta Inspector**
3. Enter S3 credentials and target bucket/prefix
4. Click **Refresh** to load tables
5. Click a table to view details
6. Check **Schema** to verify structure
7. View **History** to see processing operations
8. Use **Preview** to sample data

#### Workflow 3: Download Source Files

1. Navigate to **S3 Browser**
2. Configure AWS S3 credentials
3. Select your source bucket
4. Navigate to the `cda/` folder (or your manifest location)
5. Use breadcrumbs or direct path input to explore
6. Find files to download
7. Click download icon to get pre-signed URL
8. File opens in new tab for download

#### Workflow 4: Troubleshoot Failed Jobs

1. Navigate to **Processing Jobs**
2. Find job with **FAILED** status (red badge)
3. Click job card to view details
4. Check "Failed Tables" section for error messages
5. Note the table names that failed
6. Navigate to **S3 Browser**
7. Browse to source bucket and verify files exist
8. Navigate to **Delta Inspector**
9. Check if partial tables were created
10. Review transaction history for clues

---

### 💡 Tips and Best Practices

**Security**:
- Never commit credentials to version control
- Use IAM roles instead of access keys when possible
- Rotate credentials regularly
- Use separate credentials for dev and production

**Performance**:
- Enable Ray Parallel Processing for jobs with many tables
- Use partition columns in Delta tables for faster queries
- Monitor job progress to identify slow tables
- Consider processing large tables separately

**Troubleshooting**:
- Check S3 permissions if files don't appear
- Verify bucket names and prefixes are correct
- Ensure credentials have ListBucket and GetObject permissions
- For MinIO: Confirm server is running and accessible
- Check browser console (F12) for API errors

**Data Validation**:
- Always preview data in Delta Inspector after processing
- Compare row counts between source and target
- Check schema matches expectations
- Review transaction history for unexpected operations

---

## 📚 Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Databricks Apps](https://docs.databricks.com/en/dev-tools/databricks-apps/index.html)
- [shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `./fix.sh` to format code
5. Submit a pull request

---

**Ready to process Guidewire data?** 🎉

Start with `./setup.sh` to configure your environment and begin monitoring your Guidewire CDA processing jobs!
