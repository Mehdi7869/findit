import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FilePlus2,
  FileSearch,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MatchScoreDisplay } from '../components/MatchScoreDisplay';
import { useAuth } from '../context/AuthContext';
import { ItemClaim, ItemReport, SmartMatch, UserNotification } from '../types/findit';

interface DashboardPageProps {
  reports: ItemReport[];
  matches: SmartMatch[];
  claims: ItemClaim[];
  notifications: UserNotification[];
  loading: boolean;
}

export function DashboardPage({
  reports,
  matches,
  claims,
  notifications,
  loading,
}: DashboardPageProps) {
  const { user, publicProfile } = useAuth();
  const uid = user?.uid || '';

  const totalLost = reports.filter((r) => r.type === 'lost' && r.status !== 'closed').length;
  const totalFound = reports.filter((r) => r.type === 'found' && r.status !== 'closed').length;
  const possibleMatches = matches.filter((m) => m.status !== 'dismissed');
  const pendingClaims = claims.filter((c) => c.status === 'pending' || c.status === 'approved');
  const recoveredItems = reports.filter((r) => r.status === 'returned').length;
  const myRecovered = reports.filter((r) => r.reporterId === uid && r.status === 'returned').length;

  const stats = [
    { label: 'Total Reported Lost', value: totalLost, sub: 'Active campus reports' },
    { label: 'Total Reported Found', value: totalFound, sub: 'Available for matching' },
    { label: 'Possible Matches', value: possibleMatches.length, sub: 'Personal match alerts' },
    { label: 'Pending Claims', value: pendingClaims.length, sub: 'Awaiting verification' },
    { label: 'Successfully Recovered', value: recoveredItems, sub: `${myRecovered} of yours` },
  ];

  const recentActivity = [
    ...notifications.slice(0, 4).map((n) => ({
      id: n.notificationId,
      title: n.title,
      detail: n.message,
      type: n.type,
      link: n.type === 'match' ? `/items/${n.relatedId}` : '/my-claims',
    })),
    ...reports
      .filter((r) => r.reporterId === uid)
      .slice(0, 3)
      .map((r) => ({
        id: r.reportId,
        title: `${r.type === 'lost' ? 'Lost' : 'Found'} Report · ${r.itemName}`,
        detail: `${r.location} · Status: ${r.status.replace('_', ' ')}`,
        type: 'report',
        link: `/items/${r.reportId}`,
      })),
  ].slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Welcome Header & Primary CTAs */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Campus Overview · {publicProfile?.role === 'faculty' ? 'Faculty Portal' : 'Student Portal'}
          </p>
          <h2 className="font-display mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome back, {publicProfile?.displayName || user?.displayName || 'Campus Member'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Real-time campus lost and found activity, weighted matching alerts, and verification status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/report-lost"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <FileSearch className="h-4 w-4 text-sky-600" />
            <span>Report Lost Item</span>
          </Link>
          <Link
            to="/report-found"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>Report Found Item</span>
          </Link>
        </div>
      </div>

      {/* 5 Core KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="text-xs font-medium text-slate-500">{stat.label}</div>
            <div className="font-display tabular-nums mt-2 text-3xl font-bold text-slate-900">
              {loading ? '—' : stat.value}
            </div>
            <div className="mt-1 text-xs text-slate-500">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-Column Split: Smart Matches + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Smart Matching Engine Suggestions */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Smart Matching Suggestions
              </h3>
              <p className="text-xs text-slate-500">
                Weighted comparison across category, name, keywords, location, date, and traits.
              </p>
            </div>
            <Link
              to="/my-reports"
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap"
            >
              View All Reports
            </Link>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : possibleMatches.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
              <h4 className="mt-3 text-sm font-semibold text-slate-800">
                No match suggestions yet
              </h4>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                When you report a lost or found item, FINDIT automatically evaluates all active
                campus reports for potential matches.
              </p>
              <Link
                to="/browse"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800"
              >
                <span>Browse Campus Items</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {possibleMatches.slice(0, 5).map((match) => {
                const targetReportId =
                  match.lostReporterId === uid ? match.foundReportId : match.lostReportId;
                return (
                  <div
                    key={match.matchId}
                    className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold text-slate-900">
                          {match.lostItemName}
                        </span>
                        <span className="text-xs text-slate-400">↔</span>
                        <span className="font-display text-sm font-semibold text-sky-800">
                          {match.foundItemName}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <MatchScoreDisplay
                          score={match.confidenceScore}
                          tier={match.confidenceTier}
                        />
                        <span>
                          Location {match.breakdown.location}% · Name {match.breakdown.name}%
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/items/${targetReportId}?matchId=${match.matchId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 whitespace-nowrap"
                    >
                      <span>Inspect Match</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Activity Feed */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-display text-lg font-bold text-slate-900">Recent Activity</h3>
            <Link
              to="/notifications"
              className="text-xs font-semibold text-sky-700 hover:text-sky-800"
            >
              Notifications
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Clock className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-xs text-slate-500">
                Your recent reports, matches, and claim updates will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentActivity.map((act) => (
                <Link
                  key={act.id}
                  to={act.link}
                  className="block rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">{act.title}</div>
                      <div className="mt-0.5 text-xs text-slate-600 line-clamp-2">{act.detail}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
