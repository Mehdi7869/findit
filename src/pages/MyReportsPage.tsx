import { FolderKanban, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MatchScoreDisplay } from '../components/MatchScoreDisplay';
import { useAuth } from '../context/AuthContext';
import { deleteOpenReport, updateReportStatus } from '../services/finditApi';
import { ItemReport, SmartMatch } from '../types/findit';

interface MyReportsPageProps {
  reports: ItemReport[];
  matches: SmartMatch[];
  loading: boolean;
}

export function MyReportsPage({ reports, matches, loading }: MyReportsPageProps) {
  const { user } = useAuth();
  const uid = user?.uid || '';
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [busyId, setBusyId] = useState('');

  const myReports = reports.filter(
    (r) => r.reporterId === uid && (filterType === 'all' || r.type === filterType)
  );

  const handleClose = async (reportId: string) => {
    setBusyId(reportId);
    try {
      await updateReportStatus(reportId, 'closed');
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (reportId: string) => {
    setBusyId(reportId);
    try {
      await deleteOpenReport(reportId);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">My Reports</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track your lost and found submissions along with Smart Matching Engine scores.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(['all', 'lost', 'found'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                filterType === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : myReports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="font-display mt-3 text-lg font-bold text-slate-900">No reports yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Submit a lost or found report to activate real-time campus matching.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/report-lost"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Report Lost
            </Link>
            <Link
              to="/report-found"
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Report Found
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {myReports.map((rep) => {
            const relatedMatches = matches.filter(
              (m) =>
                (m.lostReportId === rep.reportId || m.foundReportId === rep.reportId) &&
                m.status !== 'dismissed'
            );

            return (
              <div
                key={rep.reportId}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-semibold uppercase tracking-wider ${
                          rep.type === 'lost' ? 'text-amber-700' : 'text-teal-700'
                        }`}
                      >
                        {rep.type}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono-tech text-slate-500">{rep.reportId}</span>
                      <span className="text-slate-300">·</span>
                      <span className="capitalize font-medium text-slate-700">
                        Status: {rep.status.replace('_', ' ')}
                      </span>
                    </div>
                    <Link
                      to={`/items/${rep.reportId}`}
                      className="font-display mt-1 block text-lg font-bold text-slate-900 hover:text-sky-700"
                    >
                      {rep.itemName}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {rep.category} · {rep.location} · {rep.eventDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/items/${rep.reportId}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Details
                    </Link>
                    {rep.status !== 'returned' && rep.status !== 'closed' && (
                      <button
                        type="button"
                        disabled={busyId === rep.reportId}
                        onClick={() => handleClose(rep.reportId)}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Close Report
                      </button>
                    )}
                    {rep.status === 'open' && (
                      <button
                        type="button"
                        disabled={busyId === rep.reportId}
                        onClick={() => handleDelete(rep.reportId)}
                        title="Delete open report"
                        className="cursor-pointer rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Detected Smart Matches for this report */}
                {relatedMatches.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                      <span>Smart Matching Engine Candidates ({relatedMatches.length})</span>
                    </div>
                    <div className="space-y-2">
                      {relatedMatches.map((m) => {
                        const targetId =
                          m.lostReportId === rep.reportId ? m.foundReportId : m.lostReportId;
                        const targetName =
                          m.lostReportId === rep.reportId ? m.foundItemName : m.lostItemName;
                        return (
                          <div
                            key={m.matchId}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs font-semibold text-slate-900">
                                {targetName}
                              </span>
                              <MatchScoreDisplay
                                score={m.confidenceScore}
                                tier={m.confidenceTier}
                              />
                            </div>
                            <Link
                              to={`/items/${targetId}?matchId=${m.matchId}`}
                              className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                            >
                              Verify &amp; Return →
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
