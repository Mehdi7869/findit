import { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useFinditData } from './hooks/useFinditData';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { BrowseItemsPage } from './pages/BrowseItemsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { MyClaimsPage } from './pages/MyClaimsPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { ReportLostPage } from './pages/ReportLostPage';
import { SupportPage } from './pages/SupportPage';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FINDIT ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <h1 className="font-display text-xl font-bold text-slate-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-xs text-slate-600 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthenticatedApp() {
  const { user, authReady } = useAuth();
  const { reports, matches, claims, notifications, tickets, loading } = useFinditData();

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <p className="mt-3 text-xs font-medium text-slate-500">Connecting to FINDIT...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Layout unreadCount={unreadCount}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <DashboardPage
              reports={reports}
              matches={matches}
              claims={claims}
              notifications={notifications}
              loading={loading}
            />
          }
        />
        <Route
          path="/browse"
          element={<BrowseItemsPage reports={reports} loading={loading} />}
        />
        <Route path="/items/:reportId" element={<ItemDetailPage reports={reports} />} />
        <Route path="/report-lost" element={<ReportLostPage />} />
        <Route path="/report-found" element={<ReportFoundPage />} />
        <Route
          path="/my-reports"
          element={<MyReportsPage reports={reports} matches={matches} loading={loading} />}
        />
        <Route
          path="/my-claims"
          element={<MyClaimsPage claims={claims} loading={loading} />}
        />
        <Route
          path="/notifications"
          element={<NotificationsPage notifications={notifications} loading={loading} />}
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/support" element={<SupportPage tickets={tickets} />} />
        <Route path="/admin" element={<AdminPage claims={claims} tickets={tickets} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
