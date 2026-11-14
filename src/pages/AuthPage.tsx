import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinditLogoMark } from '../components/FinditLogoMark';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/findit';

type AuthMode = 'login' | 'register' | 'reset';

export function AuthPage() {
  const { registerWithEmail, loginWithEmail, loginWithGoogle, sendResetEmail } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [campusId, setCampusId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [providerHelp, setProviderHelp] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setProviderHelp(false);
    setBusy(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        navigate('/dashboard');
      } else if (mode === 'register') {
        if (displayName.trim().length < 2) {
          throw new Error('Please enter your full name (at least 2 characters).');
        }
        if (role === 'student' && !/^(\d{10}|\d{12})$/.test(campusId.trim())) {
          throw new Error('Student ID must be exactly 10 or 12 numeric digits.');
        }
        if (role === 'faculty' && !campusId.trim()) {
          throw new Error('Please enter your Faculty ID.');
        }
        if (!/^\d{10}$/.test(phone.trim())) {
          throw new Error('Phone number must be exactly 10 numeric digits after +91.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await registerWithEmail({
          email: email.trim(),
          password,
          displayName,
          role,
          department,
          phone: `+91${phone.trim()}`,
          campusId: campusId.trim(),
        });
        navigate('/dashboard');
      } else {
        await sendResetEmail(email);
        setSuccessMsg(
          'Password reset link sent. Please check your inbox and follow the instructions.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      if (
        msg.includes('auth/operation-not-allowed') ||
        msg.includes('auth/admin-restricted-operation')
      ) {
        setProviderHelp(true);
        setError(
          'Email/Password sign-in is not yet enabled on your Firebase project. Enable it in Firebase Console or sign in with Google below.'
        );
      } else if (msg.includes('auth/invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('An account with this email already exists. Switch to Sign In.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setProviderHelp(false);
    setBusy(true);
    try {
      await loginWithGoogle(role);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50">
      {/* Left Brand Panel */}
      <div className="flex flex-col justify-between bg-[#071327] px-8 py-10 text-white lg:w-[44%] lg:px-14 lg:py-14">
        <div>
          <div className="flex items-center gap-3.5">
            <FinditLogoMark size={44} />
            <div>
              <div className="font-display text-2xl font-bold tracking-tight">FINDIT</div>
              <div className="text-xs font-medium text-cyan-300">Smart Campus Lost &amp; Found</div>
            </div>
          </div>

          <h1 className="font-display mt-12 text-3xl sm:text-4xl font-bold leading-tight text-balance">
            Lost something? Let&apos;s find it.
          </h1>
          <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-slate-300">
            A verified campus platform connecting students, faculty, and security desks with weighted
            multi-attribute Smart Matching and privacy-first ownership verification.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-8 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <div>
              <div className="font-semibold text-white">Privacy-First Isolation</div>
              <p className="mt-0.5 text-slate-400">
                Contact details and secret item traits remain hidden from public listings.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
            <div>
              <div className="font-semibold text-white">Verified Handover</div>
              <p className="mt-0.5 text-slate-400">
                Claims require proof of ownership and confirmation before closure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 cursor-pointer rounded-md py-2 text-xs font-semibold transition ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 cursor-pointer rounded-md py-2 text-xs font-semibold transition ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 cursor-pointer rounded-md py-2 text-xs font-semibold transition ${
                mode === 'reset' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reset Password
            </button>
          </div>

          <h2 className="font-display mt-6 text-xl font-bold text-slate-900">
            {mode === 'login'
              ? 'Sign in to your campus account'
              : mode === 'register'
              ? 'Register as Student or Faculty'
              : 'Recover your account password'}
          </h2>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div>
                  <p className="font-medium">{error}</p>
                  {providerHelp && (
                    <p className="mt-1.5 text-red-700">
                      To enable Email/Password: Open Firebase Console → Authentication → Sign-in
                      method → Enable &ldquo;Email/Password&rdquo; and save.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Role selector for Registration or Google Sign-In */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700">Campus Role</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(['student', 'faculty'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        if (r === 'student') {
                          setCampusId((prev) => prev.replace(/\D/g, '').slice(0, 12));
                        }
                      }}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition ${
                        role === r
                          ? 'border-sky-600 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Department</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Science"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      {role === 'student' ? 'Student ID' : 'Faculty ID'}
                    </label>
                    <input
                      type="text"
                      inputMode={role === 'student' ? 'numeric' : 'text'}
                      required
                      maxLength={role === 'student' ? 12 : 40}
                      value={campusId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (role === 'student') {
                          setCampusId(val.replace(/\D/g, '').slice(0, 12));
                        } else {
                          setCampusId(val);
                        }
                      }}
                      placeholder={role === 'student' ? '10 or 12 digit ID' : 'FAC-CS-019'}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                    />
                    {role === 'student' &&
                      campusId.length > 0 &&
                      campusId.length !== 10 &&
                      campusId.length !== 12 && (
                        <p className="mt-1 text-[11px] font-medium text-amber-700">
                          Enter 10 or 12 numeric digits ({campusId.length}/12)
                        </p>
                      )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone Number (Private)
                  </label>
                  <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-sky-600">
                    <span className="inline-flex items-center border-r border-slate-300 bg-slate-100 px-3 text-sm font-semibold text-slate-700 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className="w-full px-3 py-2 text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                  {phone.length > 0 && phone.length !== 10 && (
                    <p className="mt-1 text-[11px] font-medium text-amber-700">
                      Enter exactly 10 numeric digits ({phone.length}/10)
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Campus Email / Personal Email
              </label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu or name@gmail.com"
                  className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <div className="relative mt-1">
                  <KeyRound className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
            >
              {mode === 'register' && <UserPlus className="h-4 w-4" />}
              <span>
                {busy
                  ? 'Processing...'
                  : mode === 'login'
                  ? 'Sign In'
                  : mode === 'register'
                  ? 'Create Verified Account'
                  : 'Send Password Reset Link'}
              </span>
            </button>
          </form>

          {mode !== 'reset' && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>or continue with</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Continue with Google ({role})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
