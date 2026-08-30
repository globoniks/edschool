import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';

const homeFor = (role?: string): string => {
  if (!role) return '/';
  if (role === 'PARENT') return '/app/parent-portal';
  if (role === 'TEACHER') return '/app/teacher-dashboard';
  if (role === 'DRIVER') return '/app/driver-dashboard';
  return '/app/dashboard';
};

export default function NotFound() {
  const { user, token } = useAuthStore();
  const location = useLocation();
  const home = token ? homeFor(user?.role) : '/';

  return (
    <div className="min-h-screen bg-slate-50 font-body flex flex-col items-center justify-center px-6 py-16 text-center">
      <Logo variant="stacked" size="lg" className="mb-10" />

      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-6">
        <Compass className="w-8 h-8 text-brand-700" />
      </div>

      <p className="text-sm font-bold uppercase tracking-widest text-brand-400 mb-2">
        Error 404
      </p>
      <h1 className="font-headline text-3xl font-bold text-brand-900 mb-3">
        This page doesn’t exist
      </h1>
      <p className="text-slate-500 max-w-md mb-2">
        We couldn’t find anything at{' '}
        <span className="font-semibold text-slate-600 break-all">{location.pathname}</span>.
      </p>
      <p className="text-slate-500 max-w-md mb-8">
        It may have been moved, or the link may be out of date.
      </p>

      <Link
        to={home}
        className="inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-[1.03]"
        style={{
          background: 'linear-gradient(135deg, #000666 0%, #1a237e 100%)',
          boxShadow: '0 8px 24px rgba(0, 6, 102, 0.25)',
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        {token ? 'Back to your dashboard' : 'Back to home'}
      </Link>
    </div>
  );
}
