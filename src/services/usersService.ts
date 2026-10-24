import apiClient from './apiService';
import type { UserRole } from './authService';

export interface UserDTO {
  id?: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  creationTime?: string;
  lastSignInTime?: string;
  disabled?: boolean;
  isActive?: boolean;
}

/**
 * Service pour la gestion des utilisateurs (ADMIN only)
 */
export const usersService = {
  /**
   * Récupérer la liste des utilisateurs (paginée ou non)
   */
  async getUsers(page?: number, size?: number): Promise<UserDTO[]> {
    const params: Record<string, number> = {};
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;

    const response = await apiClient.get('/admin/users', { params });
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    return Array.isArray(response.data) ? response.data : [];
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
