/**
 * Service pour gérer les favoris via l'API backend
 * Microservice: galileo-userprofile (port 8083)
 */

import apiClient from './apiService';

export interface FavoriteDTO {
  id: string;
  userId: string;
  publicationId: number;
  publicationTitle?: string;
  publicationAuthors?: string[];
  publicationCategory?: string;
  publicationDomain?: string;
  publicationAbstract?: string;
  publicationYear?: number;
  publicationCoverImage?: string;
  publicationLanguage?: string;
  publicationType?: string;
  createdAt: string;
}

export interface FavoriteCreateDTO {
  publicationId: number;
}

/**
 * Service de gestion des favoris
 */
export const favoritesService = {
  /**
   * Récupérer tous les favoris d'un utilisateur
   */
  async getFavorites(userId: string): Promise<FavoriteDTO[]> {
    const response = await apiClient.get(`/users/${userId}/favorites`);
    return response.data;
  },

  /**
   * Récupérer les favoris avec pagination
   */
  async getFavoritesPaginated(userId: string, page: number = 0, size: number = 10): Promise<{
    content: FavoriteDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(`/users/${userId}/favorites/paginated`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Ajouter une publication aux favoris
   */
  async addFavorite(
    userId: string, 
    publicationId: number, 
    publicationTitle?: string,
    publicationDomain?: string
  ): Promise<FavoriteDTO> {
    const response = await apiClient.post(`/users/${userId}/favorites`, {
      publicationId,
      publicationTitle,
      publicationDomain
    });
    return response.data;
  },

  /**
   * Retirer une publication des favoris
   */
  async removeFavorite(userId: string, publicationId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}/favorites/${publicationId}`);
  },

  /**
   * Vérifier si une publication est dans les favoris
   */
  async isFavorite(userId: string, publicationId: number): Promise<boolean> {
    try {
      const response = await apiClient.get(`/users/${userId}/favorites/check/${publicationId}`);
      return response.data.isFavorite;
    } catch {
      return false;
    }
  },

  /**
   * Basculer le statut favori d'une publication
   */
  async toggleFavorite(
    userId: string, 
    publicationId: number,
    publicationTitle?: string,
    publicationDomain?: string
  ): Promise<{ isFavorite: boolean }> {
    const isFav = await this.isFavorite(userId, publicationId);
    if (isFav) {
      await this.removeFavorite(userId, publicationId);
      return { isFavorite: false };
    } else {
      await this.addFavorite(userId, publicationId, publicationTitle, publicationDomain);
      return { isFavorite: true };
    }
  },

  /**
   * Compter le nombre de favoris
   */
  async getFavoritesCount(userId: string): Promise<number> {
    const response = await apiClient.get(`/users/${userId}/favorites/count`);
    return response.data.count;
  },

  /**
   * Récupérer les IDs des publications favorites (pour check rapide)
   */
  async getFavoriteIds(userId: string): Promise<number[]> {
    const response = await apiClient.get(`/users/${userId}/favorites/ids`);
    return response.data;
  }
};

export default favoritesService;
