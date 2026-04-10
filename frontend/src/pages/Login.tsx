import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { GraduationCap } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import { isPushSupported, subscribeToPush } from '../utils/pushNotifications';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errors: { email?: string; password?: string } = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuth(response.data.token, response.data.user);

      // Request push subscription (fire-and-forget)
      if (isPushSupported() && Notification.permission !== 'denied') {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        subscribeToPush();
      }

      // Redirect based on user role
      if (response.data.user?.role === 'PARENT') {
        navigate('/app/parent-portal');
      } else if (response.data.user?.role === 'TEACHER') {
        navigate('/app/teacher-dashboard');
      } else if (response.data.user?.role === 'DRIVER') {
        navigate('/app/driver-dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      showError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-body flex flex-col">

      {/* ── Glass Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl shadow-sm shadow-blue-900/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-2 text-blue-900 font-extrabold font-headline text-xl tracking-tight hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Globoniks Logo" className="w-8 h-8 object-contain" />
            G Schools
          </Link>

        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-6 pt-12 pb-24">

        {/* Hero heading */}
        <div className="mb-10 relative">
          <div className="absolute -top-6 -right-4 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <h1 className="font-headline text-4xl font-bold text-blue-900 leading-tight mb-3">
            Welcome back<br />to <span style={{ background: 'linear-gradient(135deg, #000666, #1a237e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Globoniks Schools.</span>
          </h1>
          <p className="text-slate-500 font-medium">Log in to manage your school, track students, and communicate effectively.</p>
        </div>

        {/* Login Card */}
        <section
          className="bg-white p-6 rounded-3xl relative overflow-hidden"
          style={{ boxShadow: '0 12px 32px -4px rgba(0, 6, 102, 0.08)' }}
        >
          {/* Card header label */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs font-bold text-blue-900 tracking-widest uppercase">SECURE LOGIN</span>
            <div className="h-px flex-grow bg-slate-200" />
          </div>

          <h2 className="font-headline text-2xl font-bold text-blue-900 mb-6">Login to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 border-r border-slate-200 pr-3">
                <span className="material-symbols-outlined text-xl text-blue-700">mail</span>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                }}
                required
                placeholder="Email Address"
                className={`w-full text-center pl-14 pr-14 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-900/30 focus:bg-white transition-all font-semibold text-base text-blue-900 outline-none placeholder:text-slate-400 ${formErrors.email ? 'ring-2 ring-red-400' : ''}`}
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 border-r border-slate-200 pr-3">
                <span className="material-symbols-outlined text-xl text-blue-700">lock</span>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
                }}
                required
                placeholder="Enter Password"
                className={`w-full text-center pl-14 pr-14 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-900/30 focus:bg-white transition-all font-semibold text-base text-blue-900 outline-none placeholder:text-slate-400 ${formErrors.password ? 'ring-2 ring-red-400' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700 transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">{formErrors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-4 rounded-full text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)', boxShadow: '0 8px 24px rgba(0, 6, 102, 0.25)' }}
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-3 py-3 bg-slate-50 rounded-xl">
            <span className="material-symbols-outlined text-blue-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="text-xs font-bold text-slate-500 tracking-tight">100% SECURE LOGIN</span>
          </div>
        </section>



        {/* Feature trust badges */}
        <div className="mt-10 flex items-center justify-center gap-8">
          {[
            { icon: 'school', label: 'All Roles' },
            { icon: 'notifications_active', label: 'Notifications' },
            { icon: 'shield', label: 'Secure Data' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-blue-700">
                <span className="material-symbols-outlined">{icon}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">{label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-slate-100 pt-6 pb-10 px-6">
        <div className="max-w-lg mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-slate-400 font-bold font-headline text-lg opacity-50 grayscale mb-4">
            <img src="/logo.svg" alt="Globoniks Logo" className="w-5 h-5 object-contain" />
            G Schools
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </footer>
    </div>
  );
}
