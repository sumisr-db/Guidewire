import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, Zap, FolderOpen } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Databricks-style Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link to="/guidewire" className="flex items-center space-x-4 hover:opacity-90 transition-opacity">
              {/* Databricks Logo */}
              <div className="flex items-center space-x-4">
                <img
                  src="/databricks-logo.png"
                  alt="Databricks Logo"
                  className="h-16 w-auto"
                />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Guidewire Connector</h1>
                  <p className="text-xs text-slate-500">CDA to Delta Lake Processing • Powered by Ray</p>
                </div>
              </div>
            </Link>

            <nav className="flex items-center space-x-6">
              <Link
                to="/guidewire"
                className={`text-sm font-semibold transition-colors ${
                  location.pathname === '/guidewire'
                    ? 'text-red-600 border-b-2 border-red-600 pb-1'
                    : 'text-slate-600 hover:text-red-600'
                }`}
              >
                Jobs
              </Link>
              <Link
                to="/s3-browser"
                className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                  location.pathname === '/s3-browser'
                    ? 'text-red-600 border-b-2 border-red-600 pb-1'
                    : 'text-slate-600 hover:text-red-600'
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                S3 Browser
              </Link>
              <Link
                to="/delta-inspector"
                className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                  location.pathname === '/delta-inspector'
                    ? 'text-red-600 border-b-2 border-red-600 pb-1'
                    : 'text-slate-600 hover:text-red-600'
                }`}
              >
                <Database className="h-4 w-4" />
                Delta Inspector
              </Link>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
              >
                API Docs
              </a>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 rounded-full text-xs font-semibold border border-red-200">
                <Zap className="h-3 w-3" />
                <span>Ray Parallel</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-semibold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                Powered by Databricks Apps
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Built with FastAPI & React</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-slate-600 font-medium">Services Online</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
