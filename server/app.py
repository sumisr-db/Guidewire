"""FastAPI application for Databricks App Template."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from server.routers import router
from server.routers.guidewire import router as guidewire_router
from server.routers.s3_browser import router as s3_browser_router
from server.routers.delta import router as delta_router


# Load environment variables from .env.local if it exists
def load_env_file(filepath: str) -> None:
  """Load environment variables from a file."""
  if Path(filepath).exists():
    with open(filepath) as f:
      for line in f:
        line = line.strip()
        if line and not line.startswith('#'):
          key, _, value = line.partition('=')
          if key and value:
            os.environ[key] = value


# Load .env files
load_env_file('.env')
load_env_file('.env.local')


@asynccontextmanager
async def lifespan(app: FastAPI):
  """Manage application lifespan."""
  yield


app = FastAPI(
  title='Databricks App API',
  description='Modern FastAPI application template for Databricks Apps with React frontend',
  version='0.1.0',
  lifespan=lifespan,
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  allow_credentials=True,
  allow_methods=['*'],
  allow_headers=['*'],
)

app.include_router(router, prefix='/api', tags=['api'])
app.include_router(guidewire_router)
app.include_router(s3_browser_router)
app.include_router(delta_router)


@app.get('/health')
async def health():
  """Health check endpoint."""
  return {'status': 'healthy'}


# ============================================================================
# SERVE STATIC FILES FROM CLIENT BUILD DIRECTORY (MUST BE LAST!)
# ============================================================================
# This static file mount MUST be the last route registered!
# It catches all unmatched requests and serves the React app.
# Any routes added after this will be unreachable!
if os.path.exists('client/build'):
  # Mount static assets (JS, CSS, images, etc.)
  app.mount('/assets', StaticFiles(directory='client/build/assets'), name='assets')

  # SPA catch-all: serve index.html for all unmatched routes
  # This enables client-side routing to work on page reload
  @app.get('/{full_path:path}')
  async def serve_spa(full_path: str):
    """Serve React SPA for all unmatched routes (enables client-side routing)."""
    # First, try to serve static files from build directory (like favicon.ico, logo.png, etc.)
    # Only check root-level files (no slashes in path) to avoid conflicts with React routes
    if '/' not in full_path:
      file_path = Path('client/build') / full_path
      if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    # For everything else (React routes), serve index.html
    index_path = Path('client/build/index.html')
    if index_path.exists():
      return FileResponse(index_path)
    return {'error': 'Frontend build not found'}
