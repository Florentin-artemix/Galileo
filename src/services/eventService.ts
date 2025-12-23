/**
 * Service pour gérer les événements via l'API backend
 */

import apiClient from './apiService';

export interface Speaker {
  name: string;
  role: Record<string, string>;
  imageUrl: string;
  linkedin?: string;
}

export interface Resource {
  name: string;
  url: string;
  size: string;
  format: string;
}

export interface EventData {
  id: number;
  title: Record<string, string>;
  date: string;
  type: Record<string, string>;
  domain: Record<string, string>;
  location: string;
  summary: Record<string, string>;
  description: Record<string, string>;
  speakers: Speaker[];
  tags: string[];
  imageUrl: string;
  photos: string[];
  resources: Resource[];
}

export interface EventsResponse {
  content: EventData[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class EventService {
  /**
   * Récupérer tous les événements avec pagination
   */
  async getAllEvents(page: number = 0, size: number = 20): Promise<EventsResponse> {
    try {
      const response = await apiClient.get('/events', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération événements:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les événements sans pagination
   */
  async getAllEventsNoPagination(): Promise<EventData[]> {
    try {
      const response = await apiClient.get('/events/all');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération événements:', error);
      throw error;
    }
  }

  /**
   * Récupérer un événement par ID
   */
  async getEventById(id: number): Promise<EventData> {
    try {
      const response = await apiClient.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur récupération événement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer les événements à venir
   */
  async getUpcomingEvents(): Promise<EventData[]> {
    try {
      const response = await apiClient.get('/events/upcoming');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération événements à venir:', error);
      throw error;
    }
  }

  /**
   * Récupérer les événements passés
   */
  async getPastEvents(): Promise<EventData[]> {
    try {
      const response = await apiClient.get('/events/past');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération événements passés:', error);
      throw error;
    }
  }

  /**
   * Rechercher des événements
   */
  async searchEvents(query: string): Promise<EventData[]> {
    try {
      const response = await apiClient.get('/events/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur recherche événements:', error);
      throw error;
    }
  }

  /**
   * Créer un nouvel événement (nécessite authentification)
   */
  async createEvent(event: Omit<EventData, 'id'>, token: string): Promise<EventData> {
    try {
      const response = await apiClient.post('/events', event, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur création événement:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un événement (nécessite authentification)
   */
  async updateEvent(id: number, event: Partial<EventData>, token: string): Promise<EventData> {
    try {
      const response = await apiClient.put(`/events/${id}`, event, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur mise à jour événement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un événement (nécessite authentification)
   */
  async deleteEvent(id: number, token: string): Promise<void> {
    try {
      await apiClient.delete(`/events/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error(`Erreur suppression événement ${id}:`, error);
      throw error;
    }
  }
}

export const eventService = new EventService();
