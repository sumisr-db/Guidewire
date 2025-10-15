import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GuidewireJobsPage } from './pages/GuidewireJobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { WelcomePage } from './pages/WelcomePage';
import S3BrowserPage from './pages/S3BrowserPage';
import DeltaInspectorPage from './pages/DeltaInspectorPage';
import { Layout } from './components/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/guidewire" replace />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/guidewire" element={<GuidewireJobsPage />} />
            <Route path="/guidewire/jobs/:jobId" element={<JobDetailPage />} />
            <Route path="/s3-browser" element={<S3BrowserPage />} />
            <Route path="/delta-inspector" element={<DeltaInspectorPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
