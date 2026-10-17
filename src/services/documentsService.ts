import apiClient from './apiService';

export type DocumentProcessingStatus = 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DocumentDTO {
  id: number;
  publicationId: number;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  version: number;
  processingStatus: DocumentProcessingStatus;
  processingError?: string;
  isCurrent: boolean;
  downloadUrl?: string;
  createdAt: string;
  processedAt?: string;
}

export const documentsService = {
  /**
   * Récupère les métadonnées d'un document par son identifiant
   */
  async getDocumentById(id: number): Promise<DocumentDTO> {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  /**
   * Récupère la liste des versions de documents d'une publication
   */
  async getDocumentsByPublication(publicationId: number): Promise<DocumentDTO[]> {
    const response = await apiClient.get(`/documents/publication/${publicationId}`);
    return response.data;
  },

  /**
   * Récupère l'URL de téléchargement direct ou signée temporaire
   */
  async getDownloadUrl(documentId: number): Promise<string> {
    const doc = await this.getDocumentById(documentId);
    return doc.downloadUrl || `/api/documents/${documentId}/download`;
  },

  /**
   * Relance l'indexation asynchrone d'un document en cas d'échec
   */
  async retryDocumentProcessing(documentId: number): Promise<DocumentDTO> {
    const response = await apiClient.post(`/documents/${documentId}/retry`);
    return response.data.data;
  },

  /**
   * Relance l'analyse du document actuel d'une publication
   */
  async retryPublicationProcessing(publicationId: number): Promise<DocumentDTO> {
    const response = await apiClient.post(`/documents/publication/${publicationId}/retry`);
    return response.data.data;
  }
};
