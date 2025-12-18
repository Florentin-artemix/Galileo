import apiClient from './apiService';
import type { UserRole } from './authService';

export interface UserDTO {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  creationTime: string;
  lastSignInTime: string;
  disabled: boolean;
}

/**
 * Service pour la gestion des utilisateurs (ADMIN only)
 */
export const usersService = {
  /**
   * Récupérer la liste de tous les utilisateurs
   */
  async getUsers(): Promise<UserDTO[]> {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  /**
   * Récupérer un utilisateur par UID
   */
  async getUser(uid: string): Promise<UserDTO> {
    const response = await apiClient.get(`/admin/users/${uid}`);
    return response.data;
  },

  /**
   * Modifier le rôle d'un utilisateur
   */
  async updateRole(uid: string, role: UserRole): Promise<void> {
    await apiClient.put(`/admin/users/${uid}/role`, { role });
  },
};

export default usersService;
