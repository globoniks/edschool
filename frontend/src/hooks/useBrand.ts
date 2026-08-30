import { useAuthStore } from '../store/authStore';
import { resolveBrand, type Brand } from '../lib/brand';

/**
 * The brand the current viewer should see.
 *
 * Signed in: their school's identity (white-label model a).
 * Signed out: the build-time identity — the school's own for a dedicated
 * build, otherwise the vendor's.
 */
export function useBrand(): Brand {
  const school = useAuthStore((state) => state.user?.school);
  return resolveBrand(school);
}
