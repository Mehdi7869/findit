import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MatchScoreDisplay } from '../components/MatchScoreDisplay';
import { useAuth } from '../context/AuthContext';
import { getReportSecrets, submitOwnershipClaim } from '../services/finditApi';
import { evaluateReportPair } from '../services/matchingEngine';
import { ItemReport, ReportPrivateDetails } from '../types/findit';

interface ItemDetailPageProps {
  reports: ItemReport[];
}

export function ItemDetailPage({ reports }: ItemDetailPageProps) {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const matchIdParam = searchParams.get('matchId') || '';

  const { user, publicProfile, isAdmin } = useAuth();
  const report = reports.find((r) => r.reportId === reportId);

  const [secrets, setSecrets] = useState<ReportPrivateDetails | null>(null);
  const [ownershipProof, setOwnershipProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');

  const isOwner = Boolean(report && user && report.reporterId === user.uid);

  // Load private verification secrets ONLY if report owner or admin
  useEffect(() => {
    if (!reportId || (!isOwner && !isAdmin)) {
      setSecrets(null);
      return;
    }
    void getReportSecrets(reportId).then(setSecrets);
  }, [reportId, isOwner, isAdmin]);

  // Live Smart Matching comparison against user's opposite-type items
  const liveEvaluatedMatches = useMemo(() => {
    if (!report || !user) return [];
    const oppositeType = report.type === 'lost' ? 'found' : 'lost';
    const userOppositeReports = reports.filter(
      (r) =>
        r.reporterId === user.uid &&
        r.type === oppositeType &&
        r.status !== 'closed' &&
        r.status !== 'returned'
    );
    return userOppositeReports
      .map((other) => {
        const lost = report.type === 'lost' ? report : other;
        const found = report.type === 'found' ? report : other;
        return evaluateReportPair(lost, found);
      })
      .sort((a, b) => b.confidenceScore - a.confidenceScore);
  }, [report, reports, user]);

  const handleClaimSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!report || !user) return;
    setClaimError('');
    setClaimSuccess('');

    if (!user.emailVerified) {
      setClaimError('Please verify your email address before submitting an ownership claim.');
      return;
    }
    if (ownershipProof.trim().length < 5) {
      setClaimError('Please describe specific identifying details (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const claimId = await submitOwnershipClaim({
        report,
        claimantName: publicProfile?.displayName || user.displayName || 'Campus User',
        ownershipProof,
        matchId: matchIdParam,
      });
      setClaimSuccess(
        `Verification claim ${claimId} submitted. The ${
          report.type === 'found' ? 'finder' : 'reporter'
        } and Campus Admin have been notified.`
      );
      setOwnershipProof('');
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : 'Unable to submit claim.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-10 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="font-display mt-3 text-xl font-bold text-slate-900">Report not found</h2>
        <p className="mt-1 text-sm text-slate-500">
          This report may have been removed or the ID is invalid.
        </p>
        <Link
          to="/browse"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Browse Items</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/browse"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Browse Items</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image & Public Item Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-72 sm:h-80 w-full bg-slate-100">
              {report.photoURL ? (
                <img
                  src={report.photoURL}
                  alt={report.itemName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 text-slate-400">
                  <Package className="h-12 w-12" />
                  <span className="mt-2 text-xs font-medium">No photograph provided</span>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span
                  className={`font-semibold uppercase tracking-wider ${
                    report.type === 'lost' ? 'text-amber-700' : 'text-teal-700'
                  }`}
                >
                  {report.type === 'lost' ? 'Lost Item Report' : 'Found Item Report'} ·{' '}
                  {report.category}
                </span>
                <span className="font-mono-tech text-slate-500">
                  {report.reportId} · Status: {report.status.replace('_', ' ')}
                </span>
              </div>

              <h2 className="font-display mt-2 text-2xl font-bold text-slate-900">
                {report.itemName}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-700">{report.description}</p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 text-sky-600" />
                  <div>
                    <div className="font-semibold text-slate-800">
                      {report.type === 'lost' ? 'Last Seen Location' : 'Found Location'}
                    </div>
                    <div className="text-slate-600">{report.location}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="mt-0.5 h-4 w-4 text-sky-600" />
                  <div>
                    <div className="font-semibold text-slate-800">Date &amp; Time</div>
                    <div className="tabular-nums text-slate-600">
                      {report.eventDate} {report.eventTime ? `at ${report.eventTime}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <User className="mt-0.5 h-4 w-4 text-sky-600" />
                  <div>
                    <div className="font-semibold text-slate-800">Reported By</div>
                    <div className="text-slate-600 capitalize">
                      {report.reporterName} ({report.reporterRole})
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-sky-600" />
                  <div>
                    <div className="font-semibold text-slate-800">Colour &amp; Traits</div>
                    <div className="text-slate-600">
                      {report.color}
                      {report.characteristics ? ` · ${report.characteristics}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Private Secrets Card (Strictly visible to Owner or Admin) */}
          {(isOwner || isAdmin) && secrets && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-900">
                <Lock className="h-4 w-4 text-sky-700" />
                <span>Private Verification Details (Owner / Admin Only)</span>
              </div>
              <p className="mt-2 text-sm text-slate-800">
                {secrets.additionalDetails || 'No secret verification notes added.'}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Custody / Contact Preference: {secrets.contactPreference || 'Standard Campus Desk'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Smart Matching Breakdown + Claim Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Smart Matching Comparison vs User's Reports */}
          {liveEvaluatedMatches.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
                <Sparkles className="h-4 w-4" />
                <span>Smart Matching Against Your Reports</span>
              </div>
              <div className="mt-3 space-y-4">
                {liveEvaluatedMatches.map((m) => {
                  const yourItem =
                    report.type === 'lost' ? m.foundReport : m.lostReport;
                  return (
                    <div
                      key={yourItem.reportId}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="text-xs text-slate-500">
                        Compared with your {yourItem.type} item:
                      </div>
                      <div className="font-display text-sm font-bold text-slate-900">
                        {yourItem.itemName}
                      </div>
                      <div className="mt-2">
                        <MatchScoreDisplay score={m.confidenceScore} tier={m.confidenceTier} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 tabular-nums">
                        <span>Category: {m.breakdown.category}%</span>
                        <span>Name: {m.breakdown.name}%</span>
                        <span>Keywords: {m.breakdown.keywords}%</span>
                        <span>Description: {m.breakdown.description}%</span>
                        <span>Location: {m.breakdown.location}%</span>
                        <span>Date: {m.breakdown.date}%</span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Note: Confidence scores are algorithmic suggestions, not proof of ownership.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verify & Claim Ownership Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-lg font-bold text-slate-900">
              {report.type === 'found' ? 'Claim This Item' : 'Report Recovery / Match'}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {isOwner
                ? 'This is your own report. Incoming verification claims appear in My Claims.'
                : 'Submit specific identifying proof (serial number, hidden stickers, inside contents) to verify ownership.'}
            </p>

            {claimError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{claimError}</span>
              </div>
            )}

            {claimSuccess && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{claimSuccess}</span>
              </div>
            )}

            {!isOwner && report.status !== 'returned' && report.status !== 'closed' && (
              <form onSubmit={handleClaimSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Ownership Verification Proof *
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={1200}
                    value={ownershipProof}
                    onChange={(e) => setOwnershipProof(e.target.value)}
                    placeholder="Describe unique marks, contents inside, serial digits, or exact time/place lost..."
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full cursor-pointer rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting Verification...' : 'Submit Verification Claim'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
