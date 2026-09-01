import { useSelector } from 'react-redux';

/** Convenience hook to read auth state anywhere in the app. */
export default function useAuth() {
  const { user, isAuthenticated, status, error } = useSelector((state) => state.auth);
  return { user, isAuthenticated, status, error, role: user?.role };
}
