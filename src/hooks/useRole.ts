import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../services/authService';

/**
 * Hook personnalisé pour faciliter la vérification des rôles
 */
export const useRole = () => {
  const { role, hasRole, isAuthenticated, loading } = useAuth();

  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF';
  const isTeacher = role === 'TEACHER';
  const isResearcher = role === 'RESEARCHER';
  const isStudent = role === 'STUDENT';

  const canSubmit = hasRole(['ADMIN', 'STAFF', 'TEACHER', 'RESEARCHER', 'STUDENT']);
  const canModerate = hasRole(['ADMIN', 'STAFF', 'TEACHER']);
  const canManageUsers = isAdmin;

  return {
    role,
    isAdmin,
    isStaff,
    isTeacher,
    isResearcher,
    isStudent,
    canSubmit,
    canModerate,
    canManageUsers,
    hasRole,
    isAuthenticated,
    loading,
  };
};
