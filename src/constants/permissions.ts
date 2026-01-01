/**
 * Constantes des permissions disponibles dans le système
 * Synchronisé avec backend/galileo-ecriture/src/main/java/com/galileo/ecriture/security/Permission.java
 */
export const PERMISSIONS = {
  // Permissions de visualisation
  VIEW_PUBLIC: 'VIEW_PUBLIC',
  VIEW_OWN: 'VIEW_OWN',
  VIEW_ALL: 'VIEW_ALL',
  
  // Permissions de soumission
  SUBMIT: 'SUBMIT',
  EDIT_OWN_SUBMISSION: 'EDIT_OWN_SUBMISSION',
  DELETE_OWN_SUBMISSION: 'DELETE_OWN_SUBMISSION',
  
  // Permissions de modération
  MODERATE: 'MODERATE',
  APPROVE_SUBMISSION: 'APPROVE_SUBMISSION',
  REJECT_SUBMISSION: 'REJECT_SUBMISSION',
  REQUEST_REVISION: 'REQUEST_REVISION',
  
  // Permissions de gestion de contenu
  MANAGE_BLOG: 'MANAGE_BLOG',
  MANAGE_EVENTS: 'MANAGE_EVENTS',
  MANAGE_RESOURCES: 'MANAGE_RESOURCES',
  
  // Permissions d'équipe
  VIEW_TEAM: 'VIEW_TEAM',
  MANAGE_TEAM: 'MANAGE_TEAM',
  
  // Permissions utilisateurs
  VIEW_USERS: 'VIEW_USERS',
  MANAGE_USERS: 'MANAGE_USERS',
  
  // Permissions d'audit
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  
  // Permissions système
  MANAGE_SYSTEM: 'MANAGE_SYSTEM',
  BACKUP_RESTORE: 'BACKUP_RESTORE',
  CONFIGURE_SETTINGS: 'CONFIGURE_SETTINGS'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
