import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ShieldCheck, ArrowLeft, Check } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import Logo from '../components/Logo';

/** Mirrors the backend rule so the user sees the problem before a round trip. */
const MIN_LENGTH = 8;

interface Rule {
  label: string;
  passed: boolean;
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { showError, showSuccess } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // A forced change has no "cancel" — the account is on a temporary password.
  const forced = Boolean(user?.mustChangePassword);

  const rules: Rule[] = [
    { label: `At least ${MIN_LENGTH} characters`, passed: newPassword.length >= MIN_LENGTH },
    {
      label: 'Different from the current password',
      passed: newPassword.length > 0 && newPassword !== currentPassword,
    },
    {
      label: 'Both new password fields match',
      passed: newPassword.length > 0 && newPassword === confirmPassword,
    },
  ];

  const canSubmit = currentPassword.length > 0 && rules.every((r) => r.passed) && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      showSuccess('Password changed. Please sign in with your new password.');
      // The server retires every token issued before the change, so the current
      // session is already dead — send the user back to a clean login.
      logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      showError(err.message || 'Could not change the password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-brand-900/30 ' +
    'focus:bg-white transition-all font-semibold text-base text-brand-900 outline-none ' +
    'placeholder:text-slate-400 placeholder:font-medium';

  return (
    <div className="min-h-screen bg-slate-50 font-body flex flex-col">
      <main className="flex-1 w-full max-w-lg mx-auto px-6 py-12">
        {forced ? (
          <div className="flex justify-center mb-8">
            <Logo variant="stacked" size="lg" />
          </div>
        ) : (
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-900 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        )}

        {forced && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-8">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">Set your own password</p>
              <p className="text-amber-800 text-sm mt-0.5">
                Your account is using a temporary password issued by an administrator.
                Choose a new one to continue.
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="font-headline text-3xl font-bold text-brand-900 mb-2">
            Change password
          </h1>
          <p className="text-slate-500 font-medium">
            Signed in as <span className="font-semibold text-slate-600">{user?.email}</span>
          </p>
        </div>

        <section
          className="bg-white p-6 rounded-3xl"
          style={{ boxShadow: '0 12px 32px -4px rgba(0, 6, 102, 0.08)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="w-4 h-4 text-brand-700" />
            <span className="text-xs font-bold text-brand-900 tracking-widest uppercase">
              {forced ? 'Temporary password' : 'Current password'}
            </span>
            <div className="h-px flex-grow bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-slate-600 mb-1.5">
                {forced ? 'Temporary password' : 'Current password'}
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="Enter it exactly as given"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-600 mb-1.5">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={inputClass}
                placeholder={`At least ${MIN_LENGTH} characters`}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-600 mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="Type it again"
              />
            </div>

            <ul className="space-y-1.5 pt-2">
              {rules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 text-sm ${
                    rule.passed ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <Check className={`w-4 h-4 ${rule.passed ? 'opacity-100' : 'opacity-30'}`} />
                  {rule.label}
                </li>
              ))}
            </ul>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full font-bold py-4 rounded-full text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:active:scale-100 mt-2"
              style={{
                background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)',
                boxShadow: '0 8px 24px rgba(0, 6, 102, 0.25)',
              }}
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Changing…' : 'Change password'}
            </button>

            <p className="text-[11px] text-slate-400 font-medium text-center pt-1">
              Changing your password signs you out of every device.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
