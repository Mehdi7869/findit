import { AlertCircle, CheckCircle2, ImagePlus, Sparkles } from 'lucide-react';
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

export function ReportLostPage() {
  const { user, publicProfile } = useAuth();

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Bags & Backpacks');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState('10:30');
  const [color, setColor] = useState('');
  const [characteristics, setCharacteristics] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [contactPreference, setContactPreference] = useState('In-app verified messaging / Campus Desk');
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
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user?.emailVerified) {
      setError('Please verify your email address first using the banner at the top.');
      return;
    }
    if (!publicProfile) {
      setError('User profile is still loading. Please try again in a moment.');
      return;
    }
    if (itemName.trim().length < 2) {
      setError('Item name must be at least 2 characters.');
      return;
    }
    if (description.trim().length < 5) {
      setError('Please enter a detailed description (at least 5 characters).');
      return;
    }
    if (!color.trim()) {
      setError('Please specify the primary colour.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitItemReport(
        {
          type: 'lost',
          itemName,
          category,
          description,
          location,
          eventDate,
          eventTime,
          color,
          characteristics,
          additionalDetails,
          contactPreference,
          photoFile,
        },
        publicProfile
      );
      setSubmittedResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit lost item report.');
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
                Lost Item Report Published
              </h2>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Your report for <strong className="text-slate-900">{submittedResult.report.itemName}</strong>{' '}
            is now stored in Firestore and visible under My Reports. The Smart Matching Engine ran
            automatically against active found reports.
          </p>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span>Immediate Smart Matching Results ({submittedResult.matches.length})</span>
            </div>

            {submittedResult.matches.length === 0 ? (
              <p className="mt-2 text-xs text-slate-600">
                No found items currently cross the match threshold. You will receive a real-time
                notification the moment a matching found item is reported.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {submittedResult.matches.map((m) => (
                  <div
                    key={m.matchId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{m.foundItemName}</div>
                      <div className="mt-1">
                        <MatchScoreDisplay score={m.confidenceScore} tier={m.confidenceTier} />
                      </div>
                    </div>
                    <Link
                      to={`/items/${m.foundReportId}?matchId=${m.matchId}`}
                      className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                    >
                      View &amp; Claim
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
              Go to My Reports
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmittedResult(null);
                setItemName('');
                setDescription('');
                setCharacteristics('');
                setAdditionalDetails('');
                setPhotoFile(null);
                setPhotoPreview('');
              }}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Report Another Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-slate-900">Report a Lost Item</h2>
        <p className="mt-1 text-sm text-slate-600">
          Provide accurate details so the Smart Matching Engine can cross-reference campus found reports.
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
              placeholder="e.g. Navy Laptop Backpack"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Item Category *</label>
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
            Detailed Description *
          </label>
          <textarea
            required
            rows={3}
            maxLength={1200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe brand, size, contents, or context of where it was misplaced..."
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700">
              Last Seen Location *
            </label>
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
            <label className="block text-xs font-semibold text-slate-700">Date Lost *</label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Approximate Time Lost
            </label>
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
            <label className="block text-xs font-semibold text-slate-700">Item Colour *</label>
            <input
              type="text"
              required
              maxLength={60}
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Navy Blue with Cyan Zippers"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Identifying Characteristics
            </label>
            <input
              type="text"
              maxLength={400}
              value={characteristics}
              onChange={(e) => setCharacteristics(e.target.value)}
              placeholder="e.g. Keychain tag, subtle scratch on corner"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Private Verification Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-800">
              Additional Identifying Details (Private — Never Shown Publicly)
            </div>
            <p className="text-xs text-slate-500">
              Stored securely in an isolated subcollection for ownership verification only.
            </p>
            <textarea
              rows={2}
              maxLength={1000}
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Serial number, inside pocket contents, lock screen wallpaper, or initials..."
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Handover / Contact Preference (Private)
            </label>
            <input
              type="text"
              maxLength={120}
              value={contactPreference}
              onChange={(e) => setContactPreference(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Optional Photo Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Upload Item Photograph (Optional)
          </label>
          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <ImagePlus className="h-4 w-4 text-sky-600" />
              <span>{photoFile ? 'Change Photo' : 'Select Image (Max 5MB)'}</span>
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
                alt="Lost item preview"
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
            {submitting ? 'Submitting & Running Matcher...' : 'Submit Lost Item Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
