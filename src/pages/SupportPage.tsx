import { AlertCircle, CheckCircle2, HelpCircle, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitSupportTicket } from '../services/finditApi';
import { SupportCategory, SupportTicket } from '../types/findit';

interface SupportPageProps {
  tickets: SupportTicket[];
}

const CATEGORIES: SupportCategory[] = [
  'Account & Verification',
  'Report Issue',
  'Claim Dispute',
  'Campus Security Desk',
  'Technical Feedback',
];

export function SupportPage({ tickets }: SupportPageProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportCategory>('Campus Security Desk');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const myTickets = tickets.filter((t) => t.userId === user?.uid);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user?.emailVerified) {
      setError('Please verify your email address before submitting a support ticket.');
      return;
    }
    if (subject.trim().length < 3 || message.trim().length < 10) {
      setError('Please provide a subject and at least 10 characters in your message.');
      return;
    }

    setSubmitting(true);
    try {
      const id = await submitSupportTicket({ subject, category, message });
      setSuccess(`Support ticket ${id} submitted to Campus Security & Administration.`);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Help &amp; Support</h2>
        <p className="mt-1 text-sm text-slate-600">
          Campus Lost &amp; Found policies, Smart Matching confidence thresholds, and direct desk
          assistance.
        </p>
      </div>

      {/* Guidelines & Threshold Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
            <ShieldCheck className="h-4 w-4" />
            <span>Smart Matching Confidence Thresholds</span>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            <li>
              <strong className="text-emerald-700 font-mono-tech">85–100%</strong> · High-confidence
              match across category, name, location, and traits.
            </li>
            <li>
              <strong className="text-sky-700 font-mono-tech">65–84%</strong> · Potential match —
              recommended for user inspection and verification.
            </li>
            <li>
              <strong className="text-amber-700 font-mono-tech">Below 65%</strong> · Lower-confidence
              suggestion. Always verify ownership before handover.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700">
            <HelpCircle className="h-4 w-4" />
            <span>Campus Security Desk</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            High-value electronics, ID cards, and keys can be deposited at the{' '}
            <strong className="text-slate-900">Administration &amp; Security Desk</strong> (Mon–Sat,
            8:00 AM – 8:00 PM). Never share private serial numbers publicly.
          </p>
        </div>
      </div>

      {/* Contact Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <h3 className="font-display text-lg font-bold text-slate-900">Submit a Support Request</h3>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Subject *</label>
            <input
              type="text"
              required
              maxLength={160}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Need help verifying laptop claim"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportCategory)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">Message *</label>
          <textarea
            required
            rows={3}
            maxLength={1500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your question, report ID, or claim dispute..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Send Support Ticket'}
          </button>
        </div>
      </form>

      {/* User's Submitted Tickets */}
      {myTickets.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-bold text-slate-900">Your Support Tickets</h3>
          <div className="divide-y divide-slate-100">
            {myTickets.map((t) => (
              <div key={t.ticketId} className="py-3 first:pt-1 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900">{t.subject}</span>
                  <span className="font-mono-tech uppercase text-sky-700">{t.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{t.message}</p>
                <div className="mt-1 font-mono-tech text-[11px] text-slate-400">
                  {t.ticketId} · {t.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
