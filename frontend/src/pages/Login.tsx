import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { GraduationCap } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import LoadingSpinner from '../components/LoadingSpinner';
import { FormField, Input } from '../components/FormField';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { showError } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    // Basic validation
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
      // Redirect based on user role
      if (response.data.user?.role === 'PARENT') {
        navigate('/app/parent-portal');
      } else if (response.data.user?.role === 'TEACHER') {
        navigate('/app/teacher-dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-full mb-3 sm:mb-4">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">EdSchool</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">School Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Email" required error={formErrors.email}>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                }}
                required
                placeholder="Enter your email"
                error={!!formErrors.email}
              />
            </FormField>

            <FormField label="Password" required error={formErrors.password}>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
                }}
                required
                placeholder="Enter your password"
                error={!!formErrors.password}
              />
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo credentials: admin@school.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

