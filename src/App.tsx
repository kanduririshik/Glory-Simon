import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { queryClient } from '@/lib/query-client';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { IntroVideo } from '@/components/IntroVideo';

// Import Contexts for Premium Gold UI
import { NotificationProvider } from '@/context/NotificationContext';
import { CRMProvider, useCRM } from '@/context/CRMContext';
import { AIProvider } from '@/context/AIContext';

// Import Premium Gold UI Pages
import DashboardPage from '@/pages/DashboardPage';
import EnquiriesPage from '@/pages/EnquiriesPage';
import PipelinePage from '@/pages/PipelinePage';
import SiteVisitsPage from '@/pages/SiteVisitsPage';
import QuotationsPage from '@/pages/QuotationsPage';
import DesignStudioPage from '@/pages/DesignStudioPage';
import AIDesignDirectorPage from '@/pages/AIDesignDirectorPage';
import CommunicationPage from '@/pages/CommunicationPage';
import ProjectHubPage from '@/pages/ProjectHubPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';

import PageNotFound from '@/pages/PageNotFound';

// Sanitize legacy local storage keys
localStorage.removeItem('gsi_crm_data');
localStorage.removeItem('gsi_auth');

function AuthenticatedRoutes() {
  const navigate = useNavigate();
  const { setSelectedEnquiryId } = useCRM();

  const handleNavigate = (tab: string) => {
    if (tab === 'crm' || tab === 'enquiries') {
      setSelectedEnquiryId(null);
      navigate('/enquiries');
    } else if (tab === 'studio' || tab === 'design-studio') {
      navigate('/design-studio');
    } else if (tab === 'ai-director') {
      navigate('/ai-director');
    } else if (tab === 'scheduler' || tab === 'site-visits') {
      navigate('/site-visits');
    } else if (tab === 'pipeline') {
      navigate('/pipeline');
    } else if (tab === 'detail') {
      navigate('/enquiries');
    }
  };

  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage onNavigate={handleNavigate} onSelectEnquiry={(id) => setSelectedEnquiryId(id)} />} />
        <Route path="enquiries" element={<EnquiriesPage />} />
        <Route path="pipeline" element={<PipelinePage onSelectEnquiry={(id) => { setSelectedEnquiryId(id); navigate('/enquiries'); }} />} />
        <Route path="site-visits" element={<SiteVisitsPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="design-studio" element={<DesignStudioPage />} />
        <Route path="ai-director" element={<AIDesignDirectorPage />} />
        <Route path="messages" element={<CommunicationPage />} />
        <Route path="projects" element={<ProjectHubPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function AuthenticatedApp() {
  const { isLoadingAuth, authError } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Glory Simon Interiors</p>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-strong rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-lg font-semibold text-rose-400">Account Not Registered</h2>
          <p className="text-sm text-muted-foreground mt-2">{authError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      <Route path="*" element={<AuthenticatedRoutes />} />
    </Routes>
  );
}

export default function App() {
  const [introActive, setIntroActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('gsi_intro_seen') !== 'true';
    }
    return true;
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <CRMProvider>
            <AIProvider>
              <BrowserRouter>
                <AuthenticatedApp />
                {introActive && (
                  <IntroVideo onComplete={() => setIntroActive(false)} />
                )}
              </BrowserRouter>
            </AIProvider>
          </CRMProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

