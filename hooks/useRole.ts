import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../src/services/authService';

/**
 * Hook personnalisé pour faciliter la vérification des rôles
 */
export const useRole = () => {
  const { role, hasRole, isAuthenticated, loading } = useAuth();

  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';
  const isStudent = role === 'STUDENT';
  const isViewer = role === 'VIEWER';

  const canSubmit = hasRole(['ADMIN', 'STAFF', 'STUDENT']);
  const canModerate = hasRole(['ADMIN', 'STAFF']);
  const canManageUsers = isAdmin;

  return {
    role,
    isAdmin,
    isStaff,
    isStudent,
    isViewer,
    canSubmit,
    canModerate,
    canManageUsers,
    hasRole,
    isAuthenticated,
    loading,
  };
};
