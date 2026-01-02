/**
 * Service pour gérer l'historique de lecture via l'API backend
 * Microservice: galileo-userprofile (port 8083)
 */

import apiClient from './apiService';

export interface ReadingHistoryDTO {
  id: string;
  userId: string;
  publicationId: number;
  publicationTitle?: string;
  publicationAuthors?: string[];
  publicationCategory?: string;
  progress: number; // 0-100
  lastReadAt: string;
  totalReadingTime: number; // en secondes
  completed: boolean;
  createdAt: string;
}

export interface ReadingProgressDTO {
  publicationId: number;
  progress: number;
  currentPage?: number;
  totalPages?: number;
}

/**
 * Service de gestion de l'historique de lecture
 */
export const readingHistoryService = {
  /**
   * Récupérer l'historique de lecture d'un utilisateur
   */
  async getHistory(userId: string): Promise<ReadingHistoryDTO[]> {
    const response = await apiClient.get(`/users/${userId}/history`);
    return response.data;
  },

  /**
   * Récupérer l'historique avec pagination
   */
  async getHistoryPaginated(userId: string, page: number = 0, size: number = 10): Promise<{
    content: ReadingHistoryDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(`/users/${userId}/history/paginated`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Récupérer les lectures récentes
   */
  async getRecentHistory(userId: string, limit: number = 5): Promise<ReadingHistoryDTO[]> {
    const response = await apiClient.get(`/users/${userId}/history/recent`, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Enregistrer une nouvelle lecture
   */
  async recordReading(
    userId: string, 
    publicationId: number, 
    publicationTitle?: string,
    publicationDomain?: string
  ): Promise<ReadingHistoryDTO> {
    const response = await apiClient.post(`/users/${userId}/history`, {
      publicationId,
      publicationTitle,
      publicationDomain,
      readingDurationSeconds: 0,
      progressPercentage: 0
    });
    return response.data;
  },

  /**
   * Mettre à jour la progression de lecture
   */
  async updateProgress(userId: string, publicationId: number, progress: ReadingProgressDTO): Promise<ReadingHistoryDTO> {
    const response = await apiClient.patch(`/users/${userId}/history/${publicationId}/progress`, progress);
    return response.data;
  },

  /**
   * Marquer une publication comme terminée
   */
  async markAsCompleted(userId: string, publicationId: number): Promise<ReadingHistoryDTO> {
    const response = await apiClient.patch(`/users/${userId}/history/${publicationId}/complete`);
    return response.data;
  },

  /**
   * Ajouter du temps de lecture
   */
  async addReadingTime(userId: string, publicationId: number, seconds: number): Promise<void> {
    await apiClient.patch(`/users/${userId}/history/${publicationId}/reading-time`, null, {
      params: { seconds }
    });
  },

  /**
   * Récupérer la progression d'une publication spécifique
   */
  async getPublicationProgress(userId: string, publicationId: number): Promise<ReadingHistoryDTO | null> {
    try {
      const response = await apiClient.get(`/users/${userId}/history/${publicationId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Récupérer les statistiques de lecture
   */
  async getReadingStats(userId: string): Promise<{
    totalPublicationsRead: number;
    completedCount: number;
    inProgressCount: number;
    totalReadingTime: number;
    averageProgress: number;
  }> {
    const response = await apiClient.get(`/users/${userId}/history/stats`);
    return response.data;
  },

  /**
   * Supprimer un élément de l'historique
   */
  async removeFromHistory(userId: string, publicationId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}/history/${publicationId}`);
  },

  /**
   * Effacer tout l'historique
   */
  async clearHistory(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/history`);
  },

  /**
   * Récupérer les lectures en cours (non terminées)
   */
  async getInProgress(userId: string): Promise<ReadingHistoryDTO[]> {
    const response = await apiClient.get(`/users/${userId}/history/in-progress`);
    return response.data;
  }
};

export default readingHistoryService;
