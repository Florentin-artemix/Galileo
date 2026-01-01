import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { permissionsService } from '../src/services/permissionsService';
import { Permission } from '../src/constants/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  /**
   * Permission(s) requise(s). Si un tableau est fourni, l'utilisateur doit avoir TOUTES les permissions (AND).
   */
  required?: Permission | Permission[];
  /**
   * Permission(s) alternative(s). Si un tableau est fourni, l'utilisateur doit avoir AU MOINS UNE permission (OR).
   */
  anyOf?: Permission[];
  /**
   * Élément à afficher si l'utilisateur n'a pas les permissions (par défaut: redirection vers /auth)
   */
  fallback?: ReactNode;
}

/**
 * Composant de protection basé sur les permissions
 * Utilise le nouveau système RBAC backend
 * 
 * Exemples:
 * - <PermissionGuard required="SUBMIT">...</PermissionGuard>
 * - <PermissionGuard required={["MODERATE", "APPROVE_SUBMISSION"]}>...</PermissionGuard>
 * - <PermissionGuard anyOf={["MANAGE_BLOG", "MANAGE_EVENTS"]}>...</PermissionGuard>
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  required, 
  anyOf, 
  fallback 
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setLoading(true);

        // Si anyOf est fourni, vérifier au moins une permission
        if (anyOf && anyOf.length > 0) {
          const result = await permissionsService.checkAnyPermission(anyOf);
          setHasPermission(result);
          return;
        }

        // Si required est fourni
        if (required) {
          if (Array.isArray(required)) {
            // Vérifier toutes les permissions
            const result = await permissionsService.checkAllPermissions(required);
            setHasPermission(result);
          } else {
            // Vérifier une seule permission
            const result = await permissionsService.checkPermission(required);
            setHasPermission(result);
          }
          return;
        }

        // Aucune permission spécifiée, autoriser par défaut
        setHasPermission(true);
      } catch (error) {
        console.error('Erreur vérification permissions:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [required, anyOf]);

  // Chargement en cours
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-light-text-secondary dark:text-gray-400">Vérification des permissions...</p>
      </div>
    );
  }

  // Permission refusée
  if (hasPermission === false) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/auth" replace />;
  }

  // Permission accordée
  return <>{children}</>;
};

export default PermissionGuard;
