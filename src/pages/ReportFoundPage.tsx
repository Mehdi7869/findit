import { AlertCircle, CheckCircle2, ImagePlus, Shield, Sparkles } from 'lucide-react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { MatchScoreDisplay } from '../components/MatchScoreDisplay';
import { useAuth } from '../context/AuthContext';
import { submitItemReport } from '../services/finditApi';
import {
  CAMPUS_LOCATIONS,
  ITEM_CATEGORIES,
  ItemCategory,
  ItemReport,
  SmartMatch,
} from '../types/findit';

export function ReportFoundPage() {
  const { user, publicProfile } = useAuth();

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Water Bottles & Gear');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState('12:00');
  const [color, setColor] = useState('');
  const [custodyStatus, setCustodyStatus] = useState('Submitted to Campus Security Desk');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedResult, setSubmittedResult] = useState<{
    report: ItemReport;
    matches: SmartMatch[];
  } | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.emailVerified) {
      setError('Please verify your email address first using the banner at the top.');
      return;
    }
    if (!publicProfile) {
      setError('User profile is still loading.');
      return;
    }
    if (itemName.trim().length < 2 || description.trim().length < 5 || !color.trim()) {
      setError('Please complete all required item fields.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitItemReport(
        {
          type: 'found',
          itemName,
          category,
          description,
          location,
          eventDate,
          eventTime,
          color,
          characteristics: `Current custody: ${custodyStatus}`,
          additionalDetails,
          contactPreference: custodyStatus,
          photoFile,
        },
        publicProfile
      );
      setSubmittedResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit found item report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="font-mono-tech text-xs font-semibold text-emerald-700">
                REPORT ID · {submittedResult.report.reportId}
              </p>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                Found Item Recorded Safely
              </h2>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Thank you for reporting <strong className="text-slate-900">{submittedResult.report.itemName}</strong>.
            Private verification details remain hidden from public discovery to prevent fraudulent
            claims.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span>Possible Lost Item Matches ({submittedResult.matches.length})</span>
            </div>

            {submittedResult.matches.length === 0 ? (
              <p className="mt-2 text-xs text-slate-600">
                No matching lost reports yet. The item is now searchable in Browse Items and ready
                for incoming verification claims.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {submittedResult.matches.map((m) => (
                  <div
                    key={m.matchId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{m.lostItemName}</div>
                      <div className="mt-1">
                        <MatchScoreDisplay score={m.confidenceScore} tier={m.confidenceTier} />
                      </div>
                    </div>
                    <Link
                      to={`/items/${m.lostReportId}?matchId=${m.matchId}`}
                      className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                    >
                      Review Match
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/my-reports"
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              View My Reports
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedResult(null);
                setItemName('');
                setDescription('');
                setAdditionalDetails('');
                setPhotoFile(null);
                setPhotoPreview('');
              }}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Report Another Found Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-slate-900">Report a Found Item</h2>
        <p className="mt-1 text-sm text-slate-600">
          Keep specific identifying proof private so true owners can verify ownership securely.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Item Name *</label>
            <input
              type="text"
              required
              maxLength={120}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Insulated Turquoise Water Bottle"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Public Description (Avoid revealing secret markings) *
          </label>
          <textarea
            required
            rows={3}
            maxLength={1200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="General description visible in Browse Items..."
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Found Location *</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            >
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Date Found *</label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Time Found</label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Primary Colour *</label>
            <input
              type="text"
              required
              maxLength={60}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Turquoise & Brushed Steel"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Current Item Status / Custody *
            </label>
            <select
              value={custodyStatus}
              onChange={(e) => setCustodyStatus(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            >
              <option value="Submitted to Campus Security Desk">
                Submitted to Campus Security Desk
              </option>
              <option value="Held at Department Front Desk">Held at Department Front Desk</option>
              <option value="Kept Safely by Finder (Awaiting Verified Claim)">
                Kept Safely by Finder (Awaiting Verified Claim)
              </option>
              <option value="Library Lost & Found Counter">Library Lost &amp; Found Counter</option>
            </select>
          </div>
        </div>

        {/* Protected Verification Secrets */}
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
            <Shield className="h-4 w-4 text-sky-700" />
            <span>Protected Verification Details (Private — Hidden From Public)</span>
          </div>
          <p className="mt-1 text-xs text-sky-800/80">
            Record serial numbers, sticker details, or inside contents here so you and Campus Admin
            can verify genuine claimants without exposing clues publicly.
          </p>
          <textarea
            rows={2}
            maxLength={1000}
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="Secret markings, ID card name inside, serial code, or custom engravings..."
            className="mt-2 w-full rounded-lg border border-sky-200 bg-white px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Item Photograph (Recommended)
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <ImagePlus className="h-4 w-4 text-sky-600" />
              <span>{photoFile ? 'Change Photo' : 'Upload Found Item Photo (Max 5MB)'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Found item preview"
                className="h-16 w-16 rounded-lg object-cover border border-slate-200"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {submitting ? 'Saving & Running Matcher...' : 'Publish Found Item Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
