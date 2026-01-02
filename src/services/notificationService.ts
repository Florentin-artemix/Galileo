/**
 * Service pour gérer les notifications via l'API backend
 * Microservice: galileo-notification (port 8084)
 */

import apiClient from './apiService';

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SUBMISSION_STATUS' | 'NEW_PUBLICATION';
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationStatsDTO {
  totalCount: number;
  unreadCount: number;
  readCount: number;
}

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

/**
 * Service de notifications
 */
export const notificationService = {
  /**
   * Récupérer toutes les notifications d'un utilisateur
   */
  async getNotifications(userId: string): Promise<NotificationDTO[]> {
    const response = await apiClient.get('/notifications', {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Récupérer les notifications avec pagination
   */
  async getNotificationsPaginated(userId: string, page: number = 0, size: number = 20): Promise<{
    content: NotificationDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/notifications/paginated', {
      params: { userId, page, size }
    });
    return response.data;
  },

  /**
   * Récupérer les notifications non lues
   */
  async getUnreadNotifications(userId: string): Promise<NotificationDTO[]> {
    const response = await apiClient.get('/notifications/unread', {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Récupérer les statistiques de notifications
   */
  async getStats(userId: string): Promise<NotificationStatsDTO> {
    const response = await apiClient.get('/notifications/stats', {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<NotificationDTO> {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string): Promise<void> {
    await apiClient.patch('/notifications/read-all', null, {
      params: { userId }
    });
  },

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Créer une notification (admin/système)
   */
  async createNotification(notification: CreateNotificationDTO): Promise<NotificationDTO> {
    const response = await apiClient.post('/notifications', notification);
    return response.data;
  }
};

export default notificationService;
