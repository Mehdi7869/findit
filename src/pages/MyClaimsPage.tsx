import { CheckCircle2, FileCheck2, ShieldAlert, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { confirmClaimReturned, reviewOwnershipClaim } from '../services/finditApi';
import { ItemClaim } from '../types/findit';

interface MyClaimsPageProps {
  claims: ItemClaim[];
  loading: boolean;
}

export function MyClaimsPage({ claims, loading }: MyClaimsPageProps) {
  const { user, isAdmin } = useAuth();
  const uid = user?.uid || '';
  const [tab, setTab] = useState<'submitted' | 'incoming'>('submitted');
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const submittedClaims = claims.filter((c) => c.claimantId === uid);
  const incomingClaims = claims.filter((c) => c.reportOwnerId === uid);
  const activeList = tab === 'submitted' ? submittedClaims : incomingClaims;

  const handleReview = async (claim: ItemClaim, decision: 'approved' | 'rejected') => {
    setBusyId(claim.claimId);
    try {
      await reviewOwnershipClaim({
        claim,
        decision,
        adminNote: notes[claim.claimId] || '',
      });
    } finally {
      setBusyId('');
    }
  };

  const handleConfirmReturn = async (claim: ItemClaim) => {
    setBusyId(claim.claimId);
    try {
      await confirmClaimReturned(claim);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            My Claims &amp; Ownership Verification
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Verify ownership proofs and confirm secure campus handover.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('submitted')}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === 'submitted' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Claims I Submitted ({submittedClaims.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('incoming')}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === 'incoming' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Claims on My Reports ({incomingClaims.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : activeList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileCheck2 className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="font-display mt-3 text-lg font-bold text-slate-900">
            No {tab === 'submitted' ? 'submitted' : 'incoming'} claims
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'submitted'
              ? 'Browse items or review Smart Matches to initiate an ownership claim.'
              : 'When another campus user claims an item you reported, it will appear here for verification.'}
          </p>
          <Link
            to="/browse"
            className="mt-5 inline-block rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
          >
            Browse Items
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeList.map((claim) => {
            const canVerify = (claim.reportOwnerId === uid || isAdmin) && claim.status === 'pending';
            const canConfirmReturn =
              claim.status === 'approved' &&
              (claim.claimantId === uid || claim.reportOwnerId === uid || isAdmin);

            return (
              <div
                key={claim.claimId}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-tech">{claim.claimId}</span>
                      <span>·</span>
                      <span className="font-mono-tech">Report {claim.reportId}</span>
                      <span>·</span>
                      <span className="font-semibold capitalize text-slate-800">
                        Status: {claim.status}
                      </span>
                    </div>
                    <Link
                      to={`/items/${claim.reportId}`}
                      className="font-display mt-1 block text-lg font-bold text-slate-900 hover:text-sky-700"
                    >
                      {claim.itemName}
                    </Link>
                    <p className="text-xs text-slate-500">Claimant: {claim.claimantName}</p>
                  </div>

                  {claim.status === 'returned' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Returned &amp; Closed</span>
                    </span>
                  )}
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">Submitted Ownership Proof:</div>
                  <p className="mt-1 whitespace-pre-wrap">{claim.ownershipProof}</p>
                  {claim.adminNote && (
                    <div className="mt-2 border-t border-slate-200 pt-2 text-slate-600">
                      <strong>Verification Note:</strong> {claim.adminNote}
                    </div>
                  )}
                </div>

                {canVerify && (
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                      <span>
                        Compare this proof against your private report details before approving.
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Optional handover instructions or decline reason..."
                      value={notes[claim.claimId] || ''}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [claim.claimId]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-sky-600 focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === claim.claimId}
                        onClick={() => handleReview(claim, 'approved')}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve Ownership</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === claim.claimId}
                        onClick={() => handleReview(claim, 'rejected')}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Decline Claim</span>
                      </button>
                    </div>
                  </div>
                )}

                {canConfirmReturn && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="text-xs font-medium text-emerald-700">
                      Ownership approved! Confirm once the physical handover is complete.
                    </span>
                    <button
                      type="button"
                      disabled={busyId === claim.claimId}
                      onClick={() => handleConfirmReturn(claim)}
                      className="cursor-pointer rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      Verify &amp; Mark Returned
                    </button>
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
