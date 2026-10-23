import apiClient from './apiService';
import type { PublicationDTO } from './publicationsService';

export interface FollowedAuthorDTO {
  id: number;
  authorId: number;
  authorEmail: string;
  createdAt: string;
}

export interface FollowedTopicDTO {
  id: number;
  topic: string;
  domainId?: number;
  domainName?: string;
  createdAt: string;
}

export interface RecommendationItemDTO {
  publication: PublicationDTO;
  publicationId: number;
  score: number;
  reason: string;
}

export const recommendationService = {
  /**
   * Récupérer les recommandations personnalisées
   */
  async getRecommendations(limit: number = 10): Promise<RecommendationItemDTO[]> {
    const response = await apiClient.get('/recommendations', { params: { limit } });
    return response.data;
  },

  /**
   * Marquer une recommandation comme consultée
   */
  async markSeen(id: number): Promise<void> {
    await apiClient.patch(`/recommendations/${id}/seen`);
  },

  /**
   * Suivre un auteur
   */
  async followAuthor(authorId: number): Promise<void> {
    await apiClient.post(`/recommendations/authors/${authorId}/follow`);
  },

  /**
   * Ne plus suivre un auteur
   */
  async unfollowAuthor(authorId: number): Promise<void> {
    await apiClient.delete(`/recommendations/authors/${authorId}/follow`);
  },

  /**
   * Lister les auteurs suivis
   */
  async getFollowedAuthors(): Promise<FollowedAuthorDTO[]> {
    const response = await apiClient.get('/recommendations/authors');
    return response.data;
  },

  /**
   * Suivre un thème de recherche
   */
  async followTopic(topic: string, domainId?: number): Promise<void> {
    await apiClient.post('/recommendations/topics/follow', { topic, domainId });
  },

  /**
   * Ne plus suivre un thème
   */
  async unfollowTopic(topic: string): Promise<void> {
    await apiClient.delete(`/recommendations/topics/${encodeURIComponent(topic)}`);
  },

  /**
   * Lister les thèmes suivis
   */
  async getFollowedTopics(): Promise<FollowedTopicDTO[]> {
    const response = await apiClient.get('/recommendations/topics');
    return response.data;
  }
};
