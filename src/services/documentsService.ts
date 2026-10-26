import apiClient from './apiService';

export type DocumentProcessingStatus = 'UPLOADED' | 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DocumentDTO {
  id: number;
  publicationId: number;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number | null;
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

  async getDocumentsByPublication(publicationId: number): Promise<DocumentDTO> {
    const response = await apiClient.get(`/documents/publication/${publicationId}`);
    return response.data;
  },

  async getDocumentForPublication(publicationId: number): Promise<DocumentDTO> {
    return this.getDocumentsByPublication(publicationId);
  },

  async getDocumentBlob(documentId: number): Promise<Blob> {
    const response = await apiClient.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
    const blob = response.data as Blob;
    const signature = await blob.slice(0, 5).text();
    if (!signature.startsWith('%PDF-')) {
      throw new Error('Le fichier reçu n’est pas un PDF valide.');
    }
    return blob;
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
