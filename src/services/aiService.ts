import apiClient from './apiService';

export type AIMode = 'GENERAL' | 'DOCUMENT' | 'RESEARCH' | 'LEARNING';
export type AISummaryType = 'QUICK' | 'STRUCTURED' | 'EDUCATIONAL';
export type AIExplanationLevel = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface SourceReference {
  chunkId: number;
  pageNumber: number;
  excerpt: string;
}

export interface AIChatRequest {
  conversationId?: number;
  publicationId?: number;
  mode?: AIMode;
  message: string;
}

export interface AIChatResponse {
  conversationId: number;
  messageId: number;
  response: string;
  mode: AIMode;
  sourceReferences: SourceReference[];
  inputTokens: number;
  outputTokens: number;
}

export interface AISummaryRequest {
  publicationId: number;
  summaryType?: AISummaryType;
  language?: string;
  forceRefresh?: boolean;
}

export interface AISummaryResponse {
  publicationId: number;
  summaryType: AISummaryType;
  content: string;
  language: string;
  fromCache: boolean;
  generatedAt: string;
}

export interface AIExplainRequest {
  text: string;
  level?: AIExplanationLevel;
  publicationId?: number;
}

export interface AICompareRequest {
  publicationIds: number[];
  criteria?: string[];
}

export interface AIMessageDTO {
  id: number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  sourceReferences?: SourceReference[];
  createdAt: string;
}

export interface AIConversationDTO {
  id: number;
  title: string;
  mode: AIMode;
  publicationId?: number;
  createdAt: string;
  updatedAt: string;
  messages?: AIMessageDTO[];
}

export const aiService = {
  /**
   * Envoi d'un message à l'assistant IA Claude
   */
  async sendMessage(request: AIChatRequest): Promise<AIChatResponse> {
    const response = await apiClient.post('/ai/chat', request);
    return response.data;
  },

  /**
   * Résumé intelligent d'une publication académique (avec cache PostgreSQL)
   */
  async summarizePublication(request: AISummaryRequest): Promise<AISummaryResponse> {
    const response = await apiClient.post('/ai/summarize', request);
    return response.data;
  },

  /**
   * Explication d'un passage selon le niveau de complexité
   */
  async explainPassage(request: AIExplainRequest): Promise<{ explanation: string; level: string }> {
    const response = await apiClient.post('/ai/explain', request);
    return response.data;
  },

  /**
   * Comparaison synthétique de plusieurs publications
   */
  async comparePublications(request: AICompareRequest): Promise<{ comparison: string; publicationCount: number }> {
    const response = await apiClient.post('/ai/compare', request);
    return response.data;
  },

  /**
   * Récupérer l'historique des conversations
   */
  async getConversations(): Promise<AIConversationDTO[]> {
    const response = await apiClient.get('/ai/conversations');
    return response.data;
  },

  /**
   * Récupérer une conversation avec l'intégralité de ses messages
   */
  async getConversation(id: number): Promise<AIConversationDTO> {
    const response = await apiClient.get(`/ai/conversations/${id}`);
    return response.data;
  }
};
