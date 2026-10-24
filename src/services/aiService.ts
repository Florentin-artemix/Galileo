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

/**
 * Normalise les messages d'erreur de l'assistant IA selon le statut HTTP réel
 * pour éviter d'induire l'utilisateur en erreur sur ses permissions d'accès.
 */
export function getAIErrorMessage(err: any): string {
  if (!err) {
    return "Une erreur inattendue est survenue.";
  }

  // Timeout (Axios code ECONNABORTED ou message timeout)
  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return "Le délai d'attente de l'assistant IA a été dépassé. Veuillez réessayer dans quelques instants.";
  }

  // Erreur réseau (pas de réponse reçue du serveur)
  if (!err.response) {
    return "Impossible de joindre le serveur Galileo. Veuillez vérifier votre connexion Internet.";
  }

  const status = err.response.status;

  if (status === 401) {
    return "Votre session a expiré ou vous n'êtes pas connecté. Veuillez vous reconnecter pour utiliser l'assistant IA.";
  }

  if (status === 403) {
    return "Vous n'avez pas l'autorisation d'accéder à ce document ou à cette ressource académique.";
  }

  if (status === 429) {
    return "Limite de requêtes atteinte (quota journalier épuisé). Veuillez réessayer demain.";
  }

  if (status === 504) {
    return "Le délai d'attente du fournisseur IA a été dépassé. Veuillez renouveler votre requête.";
  }

  if (status >= 500) {
    return "Le service d'assistance IA rencontre un problème technique temporaire. Nos équipes techniques sont informées.";
  }

  const serverMessage = err.response.data?.message;
  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage;
  }

  return "Une erreur est survenue lors du traitement de votre requête. Veuillez réessayer.";
}

export default aiService;
