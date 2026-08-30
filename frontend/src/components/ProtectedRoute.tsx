import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Set on the change-password route itself, so a user on a temporary password
   * can reach the one page that lets them fix it without bouncing in a loop.
   */
  allowPasswordChange?: boolean;
}

export default function ProtectedRoute({
  children,
  allowPasswordChange = false,
}: ProtectedRouteProps) {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // An admin-issued temporary password gates the rest of the app until replaced.
  if (user?.mustChangePassword && !allowPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}
