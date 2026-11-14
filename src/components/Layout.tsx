import {
  Bell,
  FileCheck2,
  FilePlus2,
  FileSearch,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MailWarning,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCircle2,
  X,
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FinditLogoMark } from './FinditLogoMark';

interface LayoutProps {
  children: ReactNode;
  unreadCount: number;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/browse', label: 'Browse Items', icon: Search },
  { to: '/report-lost', label: 'Report Lost Item', icon: FileSearch },
  { to: '/report-found', label: 'Report Found Item', icon: FilePlus2 },
  { to: '/my-reports', label: 'My Reports', icon: FolderKanban },
  { to: '/my-claims', label: 'My Claims', icon: FileCheck2 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/support', label: 'Help & Support', icon: HelpCircle },
];

export function Layout({ children, unreadCount }: LayoutProps) {
  const { user, publicProfile, isAdmin, resendVerificationEmail, refreshVerification, logout } =
    useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentNav =
    NAV_ITEMS.find((n) => location.pathname.startsWith(n.to)) ||
    (location.pathname.startsWith('/admin')
      ? { label: 'Admin Review' }
      : location.pathname.startsWith('/items/')
      ? { label: 'Item Details' }
      : { label: 'Dashboard' });

  const handleResend = async () => {
    setVerifyBusy(true);
    setVerifyNotice('');
    try {
      await resendVerificationEmail();
      setVerifyNotice('Verification email sent. Please check your inbox and spam folder.');
    } catch (err) {
      setVerifyNotice(err instanceof Error ? err.message : 'Unable to send verification email.');
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleRefreshVerify = async () => {
    setVerifyBusy(true);
    setVerifyNotice('');
    try {
      const ok = await refreshVerification();
      setVerifyNotice(
        ok
          ? 'Email verified! All reporting and claim actions are now unlocked.'
          : 'Email is not verified yet. Please click the link in your inbox first.'
      );
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#071327] text-slate-200">
      {/* Brand Lockup */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <FinditLogoMark size={34} />
          <div>
            <div className="font-display text-lg font-bold tracking-tight text-white">FINDIT</div>
            <div className="text-[11px] font-medium text-cyan-300/85">Smart Campus Lost &amp; Found</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links (All 9 Required Pages + Admin if authorized) */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isNotifications = item.to === '/notifications';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/20 text-cyan-200 border border-cyan-400/25'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              {isNotifications && unreadCount > 0 && (
                <span className="font-mono-tech rounded-md bg-cyan-400 px-1.5 py-0.5 text-[11px] font-bold text-slate-950">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}

        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-white/10">
            <NavLink
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-200 border border-teal-400/25'
                    : 'text-teal-300/90 hover:bg-white/5 hover:text-white border border-transparent'
                }`
              }
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Admin Verification</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Account Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          {publicProfile?.photoURL ? (
            <img
              src={publicProfile.photoURL}
              alt={publicProfile.displayName}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full object-cover border border-cyan-400/40"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-cyan-200 border border-cyan-400/30">
              {(publicProfile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              {publicProfile?.displayName || user?.displayName || 'Campus User'}
            </div>
            <div className="truncate text-xs text-slate-400 capitalize">
              {isAdmin ? 'Administrator' : publicProfile?.role || 'student'}
              {publicProfile?.department ? ` · ${publicProfile.department}` : ''}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Clean Top Header Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">FINDIT</span>
              <span className="text-slate-300">/</span>
              <h1 className="font-display font-semibold text-slate-900">{currentNav.label}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <NavLink
              to="/report-lost"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 whitespace-nowrap"
            >
              Report Lost
            </NavLink>
            <NavLink
              to="/report-found"
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 whitespace-nowrap"
            >
              Report Found
            </NavLink>
          </div>
        </header>

        {/* Email Verification Gate Banner if unverified */}
        {user && !user.emailVerified && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-8">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 text-sm text-amber-900">
                <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div>
                  <span className="font-semibold">Verify your email address ({user.email})</span>
                  <span className="ml-1.5 text-amber-800">
                    to unlock submitting reports, Smart Matching, and claims.
                  </span>
                  {verifyNotice && <div className="mt-1 text-xs font-medium text-amber-900">{verifyNotice}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={verifyBusy}
                  onClick={handleResend}
                  className="cursor-pointer rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  Resend Email
                </button>
                <button
                  type="button"
                  disabled={verifyBusy}
                  onClick={handleRefreshVerify}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>I&apos;ve Verified</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Viewport */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
