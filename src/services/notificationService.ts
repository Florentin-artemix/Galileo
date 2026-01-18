import apiClient from './apiService';
import { authService } from './authService';

/**
 * Types de notification
 */
export type NotificationType = 
  | 'PUBLICATION_APPROVED'
  | 'PUBLICATION_REJECTED'
  | 'REVISION_REQUESTED'
  | 'NEW_PUBLICATION'
  | 'NEW_COMMENT'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'WELCOME'
  | 'ROLE_CHANGED';

/**
 * Interface pour une notification
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  mutedTypes: NotificationType[];
}

export interface PaginatedNotifications {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Service pour gérer les notifications utilisateur
 * Exploite le microservice galileo-notification
 */
export const notificationService = {
  /**
   * Récupérer toutes les notifications de l'utilisateur
   */
  async getMyNotifications(): Promise<Notification[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/notifications/${user.uid}`);
    return response.data;
  },

  /**
   * Récupérer les notifications avec pagination
   */
  async getMyNotificationsPaginated(page: number = 0, size: number = 20): Promise<PaginatedNotifications> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/notifications/${user.uid}/paginated`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Récupérer les notifications non lues
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/notifications/${user.uid}/unread`);
    return response.data;
  },

  /**
   * Compter les notifications non lues (pour le badge)
   */
  async getUnreadCount(): Promise<number> {
    try {
      const unread = await this.getUnreadNotifications();
      return unread.length;
    } catch {
      return 0;
    }
  },

  /**
   * Récupérer les statistiques de notifications
   */
  async getStats(): Promise<NotificationStats> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/notifications/${user.uid}/stats`);
    return response.data;
  },

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.patch(`/notifications/${user.uid}/${notificationId}/read`);
    return response.data;
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    await apiClient.patch(`/notifications/${user.uid}/read-all`);
  },

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    await apiClient.delete(`/notifications/${user.uid}/${notificationId}`);
  },

  /**
   * Créer une notification (pour admin/système)
   */
  async createNotification(notification: CreateNotificationDTO): Promise<Notification> {
    const response = await apiClient.post('/notifications', notification);
    return response.data;
  },

  // ============ PRÉFÉRENCES DE NOTIFICATION ============

  /**
   * Récupérer les préférences de notification
   */
  async getPreferences(): Promise<NotificationPreferences> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/notifications/${user.uid}/preferences`);
    return response.data;
  },

  /**
   * Mettre à jour les préférences de notification
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.put(`/notifications/${user.uid}/preferences`, preferences);
    return response.data;
  },

  /**
   * Muter un type de notification
   */
  async muteType(type: NotificationType): Promise<NotificationPreferences> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.post(`/notifications/${user.uid}/preferences/mute`, { type });
    return response.data;
  },

  /**
   * Réactiver un type de notification
   */
  async unmuteType(type: NotificationType): Promise<NotificationPreferences> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.post(`/notifications/${user.uid}/preferences/unmute`, { type });
    return response.data;
  }
};

export default notificationService;
