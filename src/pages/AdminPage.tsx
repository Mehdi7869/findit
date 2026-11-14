import { CheckCircle2, Lock, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  confirmClaimReturned,
  getReportSecrets,
  reviewOwnershipClaim,
  updateSupportTicketStatus,
} from '../services/finditApi';
import { ItemClaim, ReportPrivateDetails, SupportTicket } from '../types/findit';

interface AdminPageProps {
  claims: ItemClaim[];
  tickets: SupportTicket[];
}

export function AdminPage({ claims, tickets }: AdminPageProps) {
  const { isAdmin } = useAuth();
  const [busyId, setBusyId] = useState('');
  const [secretsMap, setSecretsMap] = useState<Record<string, ReportPrivateDetails | null>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-red-500" />
        <h2 className="font-display mt-3 text-xl font-bold text-slate-900">
          Administrator Access Required
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Only verified campus administrators can access the moderation and claim verification desk.
        </p>
      </div>
    );
  }

  const handleLoadSecrets = async (reportId: string) => {
    const data = await getReportSecrets(reportId);
    setSecretsMap((prev) => ({ ...prev, [reportId]: data }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Admin Verification &amp; Support Console
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Manually review ownership claims against protected report secrets and resolve campus
          support tickets.
        </p>
      </div>

      {/* Claims Moderation */}
      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold text-slate-900">
          Campus Claims Queue ({claims.length})
        </h3>
        {claims.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No claims recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const secretLoaded = claim.reportId in secretsMap;
              const secret = secretsMap[claim.reportId];
              return (
                <div
                  key={claim.claimId}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono-tech text-xs text-slate-500">
                        {claim.claimId} · Report {claim.reportId} · Status: {claim.status}
                      </div>
                      <div className="font-display text-base font-bold text-slate-900">
                        {claim.itemName} (Claimant: {claim.claimantName})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleLoadSecrets(claim.reportId)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Inspect Private Report Secrets</span>
                    </button>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                    <strong>Claimant Proof:</strong> {claim.ownershipProof}
                  </div>

                  {secretLoaded && (
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                      <strong>Protected Report Secrets:</strong>{' '}
                      {secret?.additionalDetails || 'None recorded'} · Custody:{' '}
                      {secret?.contactPreference || 'N/A'}
                    </div>
                  )}

                  {claim.status === 'pending' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Admin note..."
                        value={notes[claim.claimId] || ''}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [claim.claimId]: e.target.value }))
                        }
                        className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        disabled={busyId === claim.claimId}
                        onClick={async () => {
                          setBusyId(claim.claimId);
                          await reviewOwnershipClaim({
                            claim,
                            decision: 'approved',
                            adminNote: notes[claim.claimId] || 'Verified by Campus Admin',
                          });
                          setBusyId('');
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === claim.claimId}
                        onClick={async () => {
                          setBusyId(claim.claimId);
                          await reviewOwnershipClaim({
                            claim,
                            decision: 'rejected',
                            adminNote: notes[claim.claimId] || 'Proof did not match record',
                          });
                          setBusyId('');
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {claim.status === 'approved' && (
                    <button
                      type="button"
                      disabled={busyId === claim.claimId}
                      onClick={async () => {
                        setBusyId(claim.claimId);
                        await confirmClaimReturned(claim);
                        setBusyId('');
                      }}
                      className="cursor-pointer rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                    >
                      Mark Returned
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Support Tickets */}
      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold text-slate-900">
          Support Tickets ({tickets.length})
        </h3>
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.ticketId}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="font-mono-tech text-xs text-slate-400">
                  {t.ticketId} · {t.category}
                </div>
                <div className="font-display text-sm font-bold text-slate-900">{t.subject}</div>
                <p className="mt-1 text-xs text-slate-600">{t.message}</p>
              </div>
              <select
                value={t.status}
                onChange={(e) =>
                  void updateSupportTicketStatus(
                    t.ticketId,
                    e.target.value as 'open' | 'in_review' | 'resolved'
                  )
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
