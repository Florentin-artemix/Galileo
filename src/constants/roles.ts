import { UserRole } from '../services/authService';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  STAFF: 'Personnel',
  TEACHER: 'Enseignant',
  RESEARCHER: 'Chercheur',
  STUDENT: 'Étudiant',
  VIEWER: 'Visiteur',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  STAFF: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  TEACHER: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  RESEARCHER: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  STUDENT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  VIEWER: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Accès complet : gestion des utilisateurs, modération, soumissions',
  STAFF: 'Modération des soumissions et gestion du contenu',
  TEACHER: 'Supervision pédagogique et publication académique',
  RESEARCHER: 'Soumission, consultation et recherche avancée',
  STUDENT: 'Soumission et suivi de publications',
  VIEWER: 'Consultation uniquement',
};

export const ROLE_PERMISSIONS = {
  ADMIN: ['submit', 'moderate', 'manage_users', 'view_all'],
  STAFF: ['submit', 'moderate', 'view_all'],
  TEACHER: ['submit', 'moderate', 'view_all'],
  RESEARCHER: ['submit', 'view_all'],
  STUDENT: ['submit', 'view_own'],
  VIEWER: ['view_public'],
} as const;
