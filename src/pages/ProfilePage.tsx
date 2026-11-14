import { AlertCircle, Camera, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadImageFile } from '../services/finditApi';

export function ProfilePage() {
  const {
    user,
    publicProfile,
    privateInfo,
    isAdmin,
    updateProfileDetails,
    sendResetEmail,
    resendVerificationEmail,
    refreshVerification,
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [campusId, setCampusId] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (publicProfile) {
      setDisplayName(publicProfile.displayName || '');
      setDepartment(publicProfile.department || '');
      setPhotoURL(publicProfile.photoURL || '');
    }
    if (privateInfo) {
      setPhone(privateInfo.phone || '');
      setCampusId(privateInfo.campusId || '');
    }
  }, [publicProfile, privateInfo]);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setErrorMsg('');
    setUploadingPhoto(true);
    try {
      const url = await uploadImageFile(file, 'avatars', user.uid);
      setPhotoURL(url);
      await updateProfileDetails({
        displayName: displayName || publicProfile?.displayName || 'Campus User',
        department: department || publicProfile?.department || 'General Studies',
        phone,
        campusId,
        photoURL: url,
      });
      setStatusMsg('Profile photo updated successfully.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    setSaving(true);
    try {
      await updateProfileDetails({
        displayName,
        department,
        phone,
        campusId,
        photoURL,
      });
      setStatusMsg('Profile updated in Firestore.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setErrorMsg('');
    setStatusMsg('');
    try {
      await sendResetEmail(user.email);
      setStatusMsg(`Password reset email sent to ${user.email}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send password reset email.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Profile &amp; Account Security
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Your private contact information is stored separately from public campus listings.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusMsg && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Avatar & Role Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 font-display text-xl font-bold text-sky-800">
              {(displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              {displayName || 'Campus User'}
            </h3>
            <p className="text-xs text-slate-500 capitalize">
              Role: {isAdmin ? 'Administrator' : publicProfile?.role || 'student'} ·{' '}
              {user?.emailVerified ? 'Verified Account' : 'Unverified Email'}
            </p>
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Camera className="h-4 w-4 text-sky-600" />
          <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploadingPhoto}
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Editable Profile Form */}
      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Department</label>
            <input
              type="text"
              required
              maxLength={100}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            <span>Private Profile Details (Only Visible to You &amp; Campus Admin)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email</label>
              <input
                type="email"
                disabled
                value={user?.email || privateInfo?.email || ''}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Campus ID</label>
              <input
                type="text"
                maxLength={40}
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePasswordReset}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Send Password Reset Email</span>
            </button>
            {!user?.emailVerified && (
              <>
                <button
                  type="button"
                  onClick={() => void resendVerificationEmail()}
                  className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
                >
                  Resend Verification
                </button>
                <button
                  type="button"
                  onClick={() => void refreshVerification()}
                  className="cursor-pointer rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Refresh Status
                </button>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
