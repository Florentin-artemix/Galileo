import { UserRole } from '../services/authService';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  STAFF: 'Personnel',
  TEACHER: 'Professeur',
  RESEARCHER: 'Chercheur',
  STUDENT: 'Étudiant',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  STAFF: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  TEACHER: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  RESEARCHER: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  STUDENT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Accès complet : gestion des utilisateurs, modération, soumissions',
  STAFF: 'Modération des soumissions et gestion du contenu',
  TEACHER: 'Validation de contenu et supervision d\'étudiants',
  RESEARCHER: 'Publication de recherches',
  STUDENT: 'Soumission et suivi de publications',
};

export const ROLE_PERMISSIONS = {
  ADMIN: ['submit', 'moderate', 'manage_users', 'view_all'],
  STAFF: ['submit', 'moderate', 'view_all'],
  TEACHER: ['submit', 'moderate', 'view_all'],
  RESEARCHER: ['submit', 'view_own'],
  STUDENT: ['submit', 'view_own'],
} as const;
