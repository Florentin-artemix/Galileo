/**
 * Service pour gérer la modération via l'API backend
 * Microservice: galileo-ecriture (port 8082)
 */

import apiClient from './apiService';

export interface ModerationItemDTO {
  id: number;
  type: 'SUBMISSION' | 'COMMENT' | 'USER_REPORT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  submittedAt: string;
  category?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ModerationDecisionDTO {
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  feedback: string;
  internalNotes?: string;
}

export interface ModerationStatsDTO {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  averageProcessingTime: number;
  byCategory: Array<{
    category: string;
    count: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
  }>;
}

export interface ModerationFeedbackDTO {
  id: number;
  submissionId: number;
  moderatorId: string;
  moderatorName: string;
  feedback: string;
  status: string;
  createdAt: string;
}

/**
 * Service de modération (Staff)
 */
export const moderationService = {
  /**
   * Récupérer la file d'attente de modération
   */
  async getQueue(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    page?: number;
    size?: number;
  }): Promise<{
    content: ModerationItemDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/staff/moderation/queue', {
      params: filters
    });
    return response.data;
  },

  /**
   * Récupérer les éléments en attente
   */
  async getPendingItems(): Promise<ModerationItemDTO[]> {
    const response = await apiClient.get('/staff/moderation/pending');
    return response.data;
  },

  /**
   * Récupérer un élément spécifique
   */
  async getItem(itemId: number): Promise<ModerationItemDTO> {
    const response = await apiClient.get(`/staff/moderation/${itemId}`);
    return response.data;
  },

  /**
   * Approuver un élément
   */
  async approve(itemId: number, feedback?: string): Promise<ModerationItemDTO> {
    const response = await apiClient.post(`/staff/moderation/${itemId}/approve`, {
      feedback: feedback || 'Approuvé'
    });
    return response.data;
  },

  /**
   * Rejeter un élément
   */
  async reject(itemId: number, feedback: string): Promise<ModerationItemDTO> {
    const response = await apiClient.post(`/staff/moderation/${itemId}/reject`, {
      feedback
    });
    return response.data;
  },

  /**
   * Demander des révisions
   */
  async requestRevision(itemId: number, feedback: string): Promise<ModerationItemDTO> {
    const response = await apiClient.post(`/staff/moderation/${itemId}/request-revision`, {
      feedback
    });
    return response.data;
  },

  /**
   * Prendre une décision de modération
   */
  async decide(itemId: number, decision: ModerationDecisionDTO): Promise<ModerationItemDTO> {
    const response = await apiClient.post(`/staff/moderation/${itemId}/decide`, decision);
    return response.data;
  },

  /**
   * S'assigner un élément
   */
  async assignToSelf(itemId: number): Promise<ModerationItemDTO> {
    const response = await apiClient.post(`/staff/moderation/${itemId}/assign`);
    return response.data;
  },

  /**
   * Récupérer les statistiques de modération
   */
  async getStats(): Promise<ModerationStatsDTO> {
    const response = await apiClient.get('/staff/moderation/statistiques');
    return response.data;
  },

  /**
   * Récupérer l'historique des feedbacks
   */
  async getFeedbacks(submissionId: number): Promise<ModerationFeedbackDTO[]> {
    const response = await apiClient.get(`/staff/moderation/${submissionId}/feedbacks`);
    return response.data;
  },

  /**
   * Ajouter une note interne
   */
  async addNote(itemId: number, note: string): Promise<void> {
    await apiClient.post(`/staff/moderation/${itemId}/notes`, { note });
  },

  /**
   * Changer la priorité
   */
  async changePriority(itemId: number, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'): Promise<ModerationItemDTO> {
    const response = await apiClient.patch(`/staff/moderation/${itemId}/priority`, null, {
      params: { priority }
    });
    return response.data;
  },

  /**
   * Récupérer les éléments assignés à l'utilisateur courant
   */
  async getMyAssignments(): Promise<ModerationItemDTO[]> {
    const response = await apiClient.get('/staff/moderation/my-assignments');
    return response.data;
  }
};

export default moderationService;
