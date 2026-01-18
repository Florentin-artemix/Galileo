import apiClient from './apiService';
import { authService } from './authService';

/**
 * Interface pour un élément d'historique de lecture
 */
export interface ReadingHistoryItem {
  id: number;
  userId: string;
  publicationId: number;
  publicationTitle?: string;
  publicationAuthors?: string;
  publicationDomain?: string;
  readAt: string;
  readProgress?: number; // 0-100%
  totalReadTime?: number; // en secondes
}

export interface RecordReadingDTO {
  publicationId: number;
  publicationTitle?: string;
  publicationAuthors?: string;
  publicationDomain?: string;
}

export interface PaginatedHistory {
  content: ReadingHistoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Service pour gérer l'historique de lecture utilisateur
 * Exploite le microservice galileo-user-profile
 */
export const readingHistoryService = {
  /**
   * Récupérer tout l'historique de lecture
   */
  async getMyHistory(): Promise<ReadingHistoryItem[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/userprofile/${user.uid}/history`);
    return response.data;
  },

  /**
   * Récupérer l'historique avec pagination
   */
  async getMyHistoryPaginated(page: number = 0, size: number = 10): Promise<PaginatedHistory> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/userprofile/${user.uid}/history/paginated`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Récupérer l'historique récent (N derniers jours)
   */
  async getRecentHistory(days: number = 7): Promise<ReadingHistoryItem[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/userprofile/${user.uid}/history/recent`, {
      params: { days }
    });
    return response.data;
  },

  /**
   * Enregistrer une lecture de publication
   */
  async recordReading(reading: RecordReadingDTO): Promise<ReadingHistoryItem> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.post(`/userprofile/${user.uid}/history`, reading);
    return response.data;
  },

  /**
   * Mettre à jour la progression de lecture
   */
  async updateProgress(publicationId: number, progress: number): Promise<ReadingHistoryItem> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.patch(
      `/userprofile/${user.uid}/history/${publicationId}/progress`,
      { progress }
    );
    return response.data;
  },

  /**
   * Tracker automatiquement l'ouverture d'une publication
   * À appeler quand l'utilisateur ouvre une publication
   */
  async trackReading(publication: { id: number; titre: string; auteurs: string; domaine: string }): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return; // Silencieux si pas connecté
    
    try {
      await this.recordReading({
        publicationId: publication.id,
        publicationTitle: publication.titre,
        publicationAuthors: publication.auteurs,
        publicationDomain: publication.domaine
      });
    } catch (error) {
      console.warn('[ReadingHistory] Failed to track reading:', error);
      // Silencieux - ne pas bloquer l'UX
    }
  }
};

export default readingHistoryService;
