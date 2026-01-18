import apiClient from './apiService';
import { authService } from './authService';

/**
 * Interface pour un favori
 */
export interface Favorite {
  id: number;
  userId: string;
  publicationId: number;
  publicationTitle?: string;
  publicationAuthors?: string;
  publicationDomain?: string;
  createdAt: string;
}

export interface AddFavoriteDTO {
  publicationId: number;
  publicationTitle?: string;
  publicationAuthors?: string;
  publicationDomain?: string;
}

export interface PaginatedFavorites {
  content: Favorite[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Service pour gérer les favoris utilisateur
 * Exploite le microservice galileo-user-profile
 */
export const favoritesService = {
  /**
   * Récupérer tous les favoris de l'utilisateur courant
   */
  async getMyFavorites(): Promise<Favorite[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/userprofile/${user.uid}/favorites`);
    return response.data;
  },

  /**
   * Récupérer les favoris avec pagination
   */
  async getMyFavoritesPaginated(page: number = 0, size: number = 10): Promise<PaginatedFavorites> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/userprofile/${user.uid}/favorites/paginated`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Ajouter une publication aux favoris
   */
  async addFavorite(favorite: AddFavoriteDTO): Promise<Favorite> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.post(`/userprofile/${user.uid}/favorites`, favorite);
    return response.data;
  },

  /**
   * Retirer une publication des favoris
   */
  async removeFavorite(publicationId: number): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    await apiClient.delete(`/userprofile/${user.uid}/favorites/${publicationId}`);
  },

  /**
   * Vérifier si une publication est dans les favoris
   */
  async isFavorite(publicationId: number): Promise<boolean> {
    const user = authService.getCurrentUser();
    if (!user) return false;
    
    try {
      const response = await apiClient.get(`/userprofile/${user.uid}/favorites/check/${publicationId}`);
      return response.data;
    } catch {
      return false;
    }
  },

  /**
   * Toggle favori (ajouter si absent, retirer si présent)
   */
  async toggleFavorite(publication: { id: number; titre: string; auteurs: string; domaine: string }): Promise<boolean> {
    const isFav = await this.isFavorite(publication.id);
    
    if (isFav) {
      await this.removeFavorite(publication.id);
      return false;
    } else {
      await this.addFavorite({
        publicationId: publication.id,
        publicationTitle: publication.titre,
        publicationAuthors: publication.auteurs,
        publicationDomain: publication.domaine
      });
      return true;
    }
  }
};

export default favoritesService;
