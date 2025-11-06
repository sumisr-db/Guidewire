# 🚀 Guidewire Connection to Databricks

A modern, full-stack application template for building Databricks Apps with Python FastAPI backend and React TypeScript frontend. 

**[Claude Code](https://claude.ai/code)-centric workflow** - a single `/dba` command transforms your ideas into deployed applications. Claude guides you through product requirements, technical design, implementation, and deployment. It knows the entire Databricks Apps ecosystem and self-heals by automatically diagnosing and fixing issues.

The `/dba` workflow acts as your product strategist and development architect - brainstorming ideas with you, then building everything all the way to deployment.

![Databricks Apps](https://img.shields.io/badge/Databricks-Apps-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Claude](https://img.shields.io/badge/Claude-Ready-purple)

## 🚀 Getting Started

### 1. Use This Template

Click **"Use this template"** on GitHub to create your own Databricks app repository.

### 2. Clone Your New Repository

```bash
git clone https://github.com/yourusername/your-databricks-app
cd your-databricks-app
```

### 3. Choose Your Development Approach

#### Option A: Automatic Workflow with `/dba` (Recommended)

Open your repository in [Claude Code](https://claude.ai/code) and run the fully automated, opinionated workflow:

```
/dba describe your app here
```

The `/dba` command will:
- ✅ **Set up your development environment** with interactive configuration
- ✅ **Test your app locally** before deployment to catch issues early
- ✅ **Create or verify your Databricks app** exists
- ✅ **Deploy successfully** to Databricks Apps platform
- ✅ **Guide you through product requirements** with collaborative iteration
- ✅ **Design your technical architecture** with ultrathinking approach
- ✅ **Generate documentation** (`docs/product.md` and `docs/design.md`)
- ✅ **Optionally implement your design** or provide guidance for later implementation

This provides a complete guided experience from idea to deployed app.

#### Option B: Manual Setup with Full Control

If you prefer to have full control over the development process:

1. **Run the setup script** to configure your environment:
   ```bash
   ./setup.sh
   ```

2. **Open in Claude Code** and develop normally. Claude will:
   - Know about your entire repository structure
   - Understand the Databricks Apps framework
   - Help with any development tasks you request
   - Use the natural language commands documented below

This approach gives you complete flexibility while still benefiting from Claude's knowledge of the codebase and all available commands.

---

## 🎬 Demo

This is a [40-minute walkthrough demo](https://youtu.be/jDBTfxk1r7Q) of making an app from start to finish using the `/dba` command in Claude Code.

**Working Example**: [trace-summary-dashboard branch](https://github.com/databricks-solutions/claude-databricks-app-template/tree/trace-summary-dashboard) - Complete implementation from the video  
**See the Changes**: [View diff](https://github.com/databricks-solutions/claude-databricks-app-template/compare/trace-summary-dashboard?expand=1) - All code changes made during the demo

[![claude_dba_hero](https://github.com/user-attachments/assets/75492599-e5a1-4855-a9d1-c76d45c48da8)](https://youtu.be/jDBTfxk1r7Q)

---

## 📋 Prerequisites

Before using this template, ensure you have:

### Required Tools
- **Git** - Version control
- **uv** - Ultra-fast Python package manager (auto-manages Python versions)
- **bun** - Fast JavaScript package manager
- **Node.js 18+** - Required for Playwright
- **Homebrew** - Package manager (macOS only, auto-checked)
- **Playwright** - Browser automation and testing (optional but recommended)

### Local S3 (optional for development)

If you need an S3-compatible server for local development, this repo includes documentation and a quick setup for MinIO (a lightweight S3-compatible server). See `docs/local-s3.md` for steps to run MinIO on your laptop (S3 API on port 9000, Console on port 9001).

Note: Python 3.11+ and Databricks CLI are automatically managed by uv

The `setup.sh` script will help you install any missing dependencies with interactive prompts.

### Databricks Setup
- Valid Databricks workspace
- Personal Access Token (PAT) or CLI profile configured
- Appropriate permissions for app deployment

---

## ✨ Features

- **🔥 Hot Reloading** - Instant updates for both Python backend and React frontend
- **🔄 Auto-Generated API Client** - TypeScript client automatically generated from FastAPI OpenAPI spec
- **🔐 Databricks Authentication** - Integrated with Databricks SDK for seamless workspace integration
- **🎨 Modern UI** - Beautiful components using shadcn/ui + Tailwind CSS
- **📦 Package Management** - uv for Python, bun for frontend
- **🚀 Databricks Apps Ready** - Pre-configured for deployment to Databricks Apps platform
- **🤖 Claude Integration** - Natural language development commands documented

## 🏗️ Project Structure

```
├── server/                    # FastAPI backend
│   ├── app.py                 # Main application
│   ├── routers/               # API route handlers
│   │   └── __init__.py        # Example router
│   └── services/              # Business logic
│
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # UI components
│   │   ├── lib/             # Utilities
│   │   └── fastapi_client/  # Generated API client
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite configuration
│
├── setup_utils/               # Modular setup system
│   ├── utils.sh              # Shared utilities
│   ├── check_git.sh          # Git dependency check
│   ├── check_uv.sh           # uv package manager check
│   ├── check_bun.sh          # Bun package manager check
│   ├── check_node.sh         # Node.js 18+ check
│   └── check_homebrew.sh     # Homebrew check (macOS)
│
├── scripts/                   # Development automation
│   ├── watch.sh             # Development server
│   ├── fix.sh               # Code formatting
│   └── deploy.sh            # Deployment
│
├── setup.sh                  # Main setup script
├── pyproject.toml            # Python dependencies
├── app.yaml                  # Databricks Apps config
└── CLAUDE.md                 # Development guide
```

## 🚀 Quick Start (Manual Setup)

> **Note:** This section is for manual setup. For the automated workflow, use the `/dba` command described above.

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

### 3. View Your App

Open http://localhost:5173 to see the beautiful welcome page with:
- Getting Started guide
- Claude Commands reference
- Tech Stack overview
- Project Structure visualization
- Current user information from Databricks

## 🧠 Claude Commands

This template includes natural language commands that Claude understands:

### Development Lifecycle
- `"start the devserver"` → Runs development servers
- `"kill the devserver"` → Stops background processes
- `"fix the code"` → Formats Python and TypeScript code
- `"deploy the app"` → Deploys to Databricks Apps

### Development Tasks
- `"add a new API endpoint"` → Creates FastAPI routes
- `"create a new React component"` → Builds UI components
- `"open the UI in playwright"` → Opens app in browser for testing
- `"debug this error"` → Analyzes logs and fixes issues

See `CLAUDE.md` for the complete development guide.

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

## 📝 Customization

1. **Update branding** in `client/src/pages/WelcomePage.tsx`
2. **Add new API endpoints** in `server/routers/`
3. **Create UI components** in `client/src/components/`
4. **Modify authentication** in `scripts/setup.sh`

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

**Purpose**: Overview of the development template, tech stack, and getting started information.

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

**Ready to build something amazing?** 🎉

Start with `./setup.sh` and let this template accelerate your Databricks app development!
