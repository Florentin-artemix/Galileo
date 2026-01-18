import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService, PageViewDTO } from '../services/analyticsService';
import { readingHistoryService, RecordReadingDTO } from '../services/readingHistoryService';

/**
 * Hook pour le tracking automatique des analytics
 * Exploite galileo-analytics et galileo-user-profile
 */
export const useAnalytics = () => {
  const location = useLocation();
  const sessionId = useRef<string>(getOrCreateSessionId());
  const pageStartTime = useRef<number>(Date.now());

  // Générer ou récupérer l'ID de session
  function getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('galileo_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('galileo_session_id', sessionId);
    }
    return sessionId;
  }

  // Tracker une vue de page
  const trackPageView = useCallback(async (pagePath?: string) => {
    try {
      const pageView: PageViewDTO = {
        page: pagePath || location.pathname,
        referrer: document.referrer,
        sessionId: sessionId.current
      };
      await analyticsService.trackPageView(pageView);
    } catch (error) {
      console.debug('Analytics page view error:', error);
    }
  }, [location.pathname]);

  // Tracker une vue de publication
  const trackPublicationView = useCallback(async (publicationId: number, _title?: string) => {
    try {
      await analyticsService.trackPublicationView(publicationId);
    } catch (error) {
      console.debug('Analytics publication view error:', error);
    }
  }, []);

  // Tracker un téléchargement
  const trackDownload = useCallback(async (
    publicationId: number,
    _fileName?: string,
    _fileType?: string
  ) => {
    try {
      await analyticsService.trackDownload(publicationId);
    } catch (error) {
      console.debug('Analytics download error:', error);
    }
  }, []);

  // Tracker une recherche (placeholder - pas d'endpoint dédié)
  const trackSearch = useCallback(async (
    _query: string,
    _resultsCount: number,
    _filters?: Record<string, any>
  ) => {
    // Note: pas d'endpoint trackSearch dans le service actuel
    console.debug('Search tracking not implemented');
  }, []);

  // Tracker un événement personnalisé (placeholder)
  const trackEvent = useCallback(async (
    _eventName: string,
    _properties?: Record<string, any>
  ) => {
    // Note: pas d'endpoint trackEvent dans le service actuel
    console.debug('Event tracking not implemented');
  }, []);

  // Tracker le temps passé sur la page précédente et la nouvelle page
  useEffect(() => {
    // Reset le timer pour la nouvelle page
    pageStartTime.current = Date.now();
    
    // Tracker la vue de la nouvelle page
    trackPageView();
    
  }, [location.pathname, trackPageView]);

  // Tracker la session de lecture pour une publication
  const startReadingSession = useCallback((publicationId: number, publicationInfo?: { title?: string; authors?: string; domain?: string }) => {
    const startTime = Date.now();
    
    // Enregistrer le début de lecture
    const recordDTO: RecordReadingDTO = {
      publicationId,
      publicationTitle: publicationInfo?.title,
      publicationAuthors: publicationInfo?.authors,
      publicationDomain: publicationInfo?.domain
    };
    readingHistoryService.recordReading(recordDTO).catch(() => {});
    
    return {
      updateProgress: async (progress: number) => {
        try {
          await readingHistoryService.updateProgress(publicationId, progress);
        } catch (error) {
          console.debug('Progress update error:', error);
        }
      },
      endSession: async (finalProgress?: number) => {
        try {
          if (finalProgress !== undefined) {
            await readingHistoryService.updateProgress(publicationId, finalProgress);
          }
        } catch (error) {
          console.debug('End session error:', error);
        }
      }
    };
  }, []);

  return {
    trackPageView,
    trackPublicationView,
    trackDownload,
    trackSearch,
    trackEvent,
    startReadingSession,
    sessionId: sessionId.current
  };
};

export default useAnalytics;
