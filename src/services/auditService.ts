/**
 * Service pour gérer les logs d'audit via l'API backend
 * Microservice: galileo-ecriture (port 8082)
 */

import apiClient from './apiService';

export interface AuditLogDTO {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}

export interface AuditFilterDTO {
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface AuditStatsDTO {
  totalActions: number;
  actionsByType: Array<{
    action: string;
    count: number;
  }>;
  actionsByUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  actionsByDay: Array<{
    date: string;
    count: number;
  }>;
  failureRate: number;
}

/**
 * Service d'audit (Admin)
 */
export const auditService = {
  /**
   * Récupérer les logs d'audit
   */
  async getLogs(filters?: AuditFilterDTO): Promise<{
    content: AuditLogDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/admin/audit', {
      params: filters
    });
    return response.data;
  },

  /**
   * Récupérer les logs récents
   */
  async getRecentLogs(limit: number = 50): Promise<AuditLogDTO[]> {
    const response = await apiClient.get('/admin/audit/recent', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Récupérer un log spécifique
   */
  async getLog(logId: string): Promise<AuditLogDTO> {
    const response = await apiClient.get(`/admin/audit/${logId}`);
    return response.data;
  },

  /**
   * Récupérer les logs d'une entité
   */
  async getEntityLogs(entityType: string, entityId: string): Promise<AuditLogDTO[]> {
    const response = await apiClient.get(`/admin/audit/entity/${entityType}/${entityId}`);
    return response.data;
  },

  /**
   * Récupérer les logs d'un utilisateur
   */
  async getUserLogs(userId: string, page: number = 0, size: number = 20): Promise<{
    content: AuditLogDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(`/admin/audit/user/${userId}`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Récupérer les statistiques d'audit
   */
  async getStats(period: 'day' | 'week' | 'month' = 'week'): Promise<AuditStatsDTO> {
    const response = await apiClient.get('/admin/audit/stats', {
      params: { period }
    });
    return response.data;
  },

  /**
   * Rechercher dans les logs
   */
  async search(query: string, filters?: AuditFilterDTO): Promise<{
    content: AuditLogDTO[];
    totalElements: number;
  }> {
    const response = await apiClient.get('/admin/audit/search', {
      params: { query, ...filters }
    });
    return response.data;
  },

  /**
   * Exporter les logs
   */
  async exportLogs(filters: AuditFilterDTO, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await apiClient.get('/admin/audit/export', {
      params: { ...filters, format },
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Récupérer les types d'actions disponibles
   */
  async getActionTypes(): Promise<string[]> {
    const response = await apiClient.get('/admin/audit/action-types');
    return response.data;
  },

  /**
   * Récupérer les types d'entités disponibles
   */
  async getEntityTypes(): Promise<string[]> {
    const response = await apiClient.get('/admin/audit/entity-types');
    return response.data;
  },

  /**
   * Récupérer les alertes de sécurité
   */
  async getSecurityAlerts(): Promise<AuditLogDTO[]> {
    const response = await apiClient.get('/admin/audit/security-alerts');
    return response.data;
  }
};

export default auditService;
