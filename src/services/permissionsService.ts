import apiClient from './apiService';
import { getAuthHeaders } from '../config/api';
import { authService } from './authService';

export interface UserPermissionsResponse {
  role: string;
  permissions: string[];
}

export interface PermissionCheckResponse {
  hasPermission: boolean;
}

/**
 * Service pour gérer les permissions utilisateur
 */
export const permissionsService = {
  /**
   * Récupérer les permissions de l'utilisateur connecté
   */
  async getMyPermissions(): Promise<UserPermissionsResponse> {
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await apiClient.get('/users/permissions/me', {
      headers: getAuthHeaders(token)
    });
    return response.data;
  },

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   */
  async checkPermission(permission: string): Promise<boolean> {
    const token = await authService.getIdToken();
    if (!token) {
      return false;
    }

    try {
      const response = await apiClient.get(`/users/permissions/check/${permission}`, {
        headers: getAuthHeaders(token)
      });
      return response.data.hasPermission === true;
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      return false;
    }
  },

  /**
   * Vérifier si l'utilisateur a toutes les permissions listées
   */
  async checkAllPermissions(permissions: string[]): Promise<boolean> {
    const userPerms = await this.getMyPermissions();
    return permissions.every(perm => userPerms.permissions.includes(perm));
  },

  /**
   * Vérifier si l'utilisateur a au moins une des permissions listées
   */
  async checkAnyPermission(permissions: string[]): Promise<boolean> {
    const userPerms = await this.getMyPermissions();
    return permissions.some(perm => userPerms.permissions.includes(perm));
  }
};
