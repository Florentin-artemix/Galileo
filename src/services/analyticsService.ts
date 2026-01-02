/**
 * Service pour gérer les analytics via l'API backend
 * Microservice: galileo-analytics (port 8085)
 */

import apiClient from './apiService';

export interface PageViewDTO {
  userId?: string;
  page: string;
  referrer?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface PublicationViewDTO {
  userId?: string;
  publicationId: number;
  duration?: number;
}

export interface DownloadTrackDTO {
  userId?: string;
  publicationId: number;
  format: string;
}

export interface DashboardStatsDTO {
  totalPageViews: number;
  uniqueVisitors: number;
  totalPublicationViews: number;
  totalDownloads: number;
  topPublications: Array<{
    publicationId: number;
    title: string;
    viewCount: number;
    downloadCount: number;
  }>;
  viewsByDay: Array<{
    date: string;
    views: number;
  }>;
  viewsByCategory: Array<{
    category: string;
    count: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface PublicationStatsDTO {
  publicationId: number;
  viewCount: number;
  downloadCount: number;
  uniqueViewers: number;
  averageReadingTime: number;
  viewsByDay: Array<{
    date: string;
    views: number;
  }>;
}

/**
 * Service d'analytics
 */
export const analyticsService = {
  /**
   * Tracker une page vue
   */
  async trackPageView(data: PageViewDTO): Promise<void> {
    await apiClient.post('/analytics/track/pageview', data);
  },

  /**
   * Tracker une vue de publication
   */
  async trackPublicationView(publicationId: number, userId?: string): Promise<void> {
    await apiClient.post(`/analytics/track/publication/${publicationId}/view`, null, {
      params: { userId }
    });
  },

  /**
   * Tracker un téléchargement
   */
  async trackDownload(data: DownloadTrackDTO): Promise<void> {
    await apiClient.post('/analytics/track/download', data);
  },

  /**
   * Tracker la durée de lecture
   */
  async trackReadingDuration(publicationId: number, duration: number, userId?: string): Promise<void> {
    await apiClient.post(`/analytics/track/publication/${publicationId}/reading-time`, null, {
      params: { duration, userId }
    });
  },

  /**
   * Récupérer les statistiques du dashboard admin
   */
  async getDashboardStats(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<DashboardStatsDTO> {
    const response = await apiClient.get('/analytics/dashboard', {
      params: { period }
    });
    return response.data;
  },

  /**
   * Récupérer les statistiques d'une publication
   */
  async getPublicationStats(publicationId: number): Promise<PublicationStatsDTO> {
    const response = await apiClient.get(`/analytics/publications/${publicationId}`);
    return response.data;
  },

  /**
   * Récupérer les publications les plus vues
   */
  async getTopPublications(limit: number = 10): Promise<Array<{
    publicationId: number;
    title: string;
    viewCount: number;
  }>> {
    const response = await apiClient.get('/analytics/top-publications', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Récupérer l'activité récente
   */
  async getRecentActivity(limit: number = 20): Promise<Array<{
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
  }>> {
    const response = await apiClient.get('/analytics/recent-activity', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Exporter les statistiques
   */
  async exportStats(period: string, format: 'csv' | 'json' = 'json'): Promise<Blob> {
    const response = await apiClient.get('/analytics/export', {
      params: { period, format },
      responseType: 'blob'
    });
    return response.data;
  }
};

export default analyticsService;
