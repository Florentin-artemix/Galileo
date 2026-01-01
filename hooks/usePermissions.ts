import { useState, useEffect } from 'react';
import { permissionsService, UserPermissionsResponse } from '../src/services/permissionsService';
import { Permission } from '../src/constants/permissions';

/**
 * Hook personnalisé pour gérer les permissions utilisateur
 * 
 * Exemples:
 * const { permissions, hasPermission, loading } = usePermissions();
 * 
 * if (hasPermission('SUBMIT')) {
 *   // Afficher le bouton de soumission
 * }
 * 
 * if (hasPermission(['MODERATE', 'APPROVE_SUBMISSION'])) {
 *   // Afficher les outils de modération
 * }
 */
export const usePermissions = () => {
  const [permissionsData, setPermissionsData] = useState<UserPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const data = await permissionsService.getMyPermissions();
        setPermissionsData(data);
        setError(null);
      } catch (err) {
        console.error('Erreur chargement permissions:', err);
        setError('Impossible de charger les permissions');
        setPermissionsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  /**
   * Vérifie si l'utilisateur a une ou plusieurs permissions
   * @param permission - Permission ou tableau de permissions à vérifier
   * @param requireAll - Si true avec un tableau, toutes les permissions sont requises (AND). Si false, au moins une (OR).
   */
  const hasPermission = (
    permission: Permission | Permission[], 
    requireAll: boolean = true
  ): boolean => {
    if (!permissionsData) return false;

    if (Array.isArray(permission)) {
      if (requireAll) {
        return permission.every(perm => permissionsData.permissions.includes(perm));
      } else {
        return permission.some(perm => permissionsData.permissions.includes(perm));
      }
    }

    return permissionsData.permissions.includes(permission);
  };

  return {
    permissions: permissionsData?.permissions || [],
    role: permissionsData?.role || null,
    hasPermission,
    loading,
    error
  };
};
