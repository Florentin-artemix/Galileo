import apiClient from './apiService';

/**
 * Interface pour les statistiques du dashboard
 */
export interface DashboardStats {
  totalPublications: number;
  totalDownloads: number;
  totalViews: number;
  totalUsers: number;
  viewsToday: number;
  downloadsToday: number;
  viewsThisWeek: number;
  downloadsThisWeek: number;
  viewsThisMonth: number;
  downloadsThisMonth: number;
  topPublications: TopPublication[];
  dailyMetrics: DailyMetric[];
}

export interface TopPublication {
  publicationId: number;
  title: string;
  authors: string;
  domain: string;
  views: number;
  downloads: number;
}

export interface DailyMetric {
  date: string;
  views: number;
  downloads: number;
  uniqueVisitors: number;
}

export interface PublicationAnalytics {
  publicationId: number;
  title: string;
  totalViews: number;
  totalDownloads: number;
  uniqueViewers: number;
  averageReadTime: number;
  viewsByDay: DailyMetric[];
  viewsByCountry?: Record<string, number>;
  viewsByDevice?: Record<string, number>;
}

export interface PageViewDTO {
  page: string;
  referrer?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Service pour les analytics
 * Exploite le microservice galileo-analytics
 */
export const analyticsService = {
  // ============ TRACKING ============

  /**
   * Tracker une vue de page
   */
  async trackPageView(pageView: PageViewDTO): Promise<void> {
    try {
      await apiClient.post('/analytics/track/pageview', pageView);
    } catch (error) {
      console.warn('[Analytics] Failed to track page view:', error);
      // Silencieux - ne pas bloquer l'UX
    }
  },

  /**
   * Tracker une vue de publication
   */
  async trackPublicationView(publicationId: number): Promise<void> {
    try {
      await apiClient.post(`/analytics/track/publication/${publicationId}/view`);
    } catch (error) {
      console.warn('[Analytics] Failed to track publication view:', error);
      // Silencieux - ne pas bloquer l'UX
    }
  },

  /**
   * Tracker un téléchargement de publication
   */
  async trackDownload(publicationId: number): Promise<void> {
    try {
      await apiClient.post(`/analytics/track/publication/${publicationId}/download`);
    } catch (error) {
      console.warn('[Analytics] Failed to track download:', error);
      // Silencieux - ne pas bloquer l'UX
    }
  },

  // ============ DASHBOARD (ADMIN) ============

  /**
   * Récupérer les statistiques du dashboard
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  /**
   * Récupérer les analytics d'une publication spécifique
   */
  async getPublicationAnalytics(publicationId: number): Promise<PublicationAnalytics> {
    const response = await apiClient.get(`/analytics/publications/${publicationId}`);
    return response.data;
  },

  // ============ HELPERS ============

  /**
   * Générer un ID de session unique pour le tracking
   */
  getSessionId(): string {
    let sessionId = sessionStorage.getItem('galileo_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('galileo_session_id', sessionId);
    }
    return sessionId;
  },

  /**
   * Tracker automatiquement la navigation
   * À appeler dans un useEffect global ou un router listener
   */
  trackNavigation(pathname: string): void {
    this.trackPageView({
      page: pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    });
  }
};

export default analyticsService;
