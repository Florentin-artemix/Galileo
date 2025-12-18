import apiClient from './apiService';
import type { Publication } from '../../types';

// DTO correspondant à la réponse réelle du backend
export interface PublicationDTO {
  id: number;
  titre: string;
  resume: string;
  auteurPrincipal: string;
  coAuteurs?: string[] | null;
  domaine: string;  // Le backend retourne 'domaine', pas 'domaineRecherche'
  motsCles: string; // Le backend retourne une string séparée par virgules
  datePublication: string;
  urlPdf?: string | null;
  urlImageCouverture?: string | null;
  nombreTelechargements: number;
  nombreVues: number;
  tailleFichier?: number | null;
  nombrePages?: number | null;
}

export interface SoumissionDTO {
  titre: string;
  resume: string;
  auteurPrincipal: string;
  emailAuteur: string;
  coAuteurs?: string[];
  motsCles: string[];
  domaineRecherche: string;
  notes?: string;
}

/**
 * Service pour les publications (service de lecture)
 */
export const publicationsService = {
  /**
   * Récupérer toutes les publications publiées
   */
  async getPublications(page: number = 0, size: number = 20): Promise<{
    content: PublicationDTO[];
    totalElements: number;
    totalPages: number;
  }> {
    const response = await apiClient.get('/publications', {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Récupérer une publication par ID
   */
  async getPublicationById(id: number): Promise<PublicationDTO> {
    const response = await apiClient.get(`/publications/${id}`);
    return response.data;
  },

  /**
   * Récupérer les publications récentes
   */
  async getRecentPublications(): Promise<PublicationDTO[]> {
    const response = await apiClient.get('/publications/recentes');
    return response.data;
  },

  /**
   * Récupérer les publications populaires
   */
  async getPopularPublications(): Promise<PublicationDTO[]> {
    const response = await apiClient.get('/publications/populaires');
    return response.data;
  },

  /**
   * Rechercher par domaine
   */
  async getByDomaine(domaine: string): Promise<PublicationDTO[]> {
    const response = await apiClient.get(`/publications/domaine/${domaine}`);
    return response.data;
  },

  /**
   * Rechercher par auteur
   */
  async getByAuteur(auteur: string): Promise<PublicationDTO[]> {
    const response = await apiClient.get(`/publications/auteur/${auteur}`);
    return response.data;
  },

  /**
   * Enregistrer un téléchargement
   */
  async recordDownload(id: number): Promise<void> {
    await apiClient.post(`/publications/${id}/telecharger`);
  },

  /**
   * Obtenir l'URL de téléchargement signée
   */
  async getDownloadUrl(id: number): Promise<string> {
    const response = await apiClient.get(`/publications/${id}/telecharger`);
    return response.data.url;
  },

  /**
   * Convertir un DTO backend vers le format Publication du frontend
   */
  dtoToPublication(dto: PublicationDTO): Publication {
    // Convertir motsCles (string séparée par virgules) en array
    const tags = dto.motsCles 
      ? dto.motsCles.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];
    
    return {
      id: dto.id,
      title: { fr: dto.titre, en: dto.titre },
      authors: dto.coAuteurs ? [dto.auteurPrincipal, ...dto.coAuteurs] : [dto.auteurPrincipal],
      date: dto.datePublication,
      domain: { fr: dto.domaine || '', en: dto.domaine || '' },
      summary: { fr: dto.resume || '', en: dto.resume || '' },
      pdfUrl: dto.urlPdf || '',
      imageUrl: dto.urlImageCouverture || 'https://picsum.photos/seed/galileo' + dto.id + '/600/400',
      tags: tags,
    };
  }
};

/**
 * Service pour les soumissions (service d'écriture)
 */
export const soumissionsService = {
  /**
   * Soumettre une nouvelle publication avec un fichier PDF
   */
  async soumettre(data: SoumissionDTO, fichierPdf: File): Promise<any> {
    const formData = new FormData();
    formData.append('fichierPdf', fichierPdf);
    formData.append('titre', data.titre);
    formData.append('resume', data.resume);
    formData.append('auteurPrincipal', data.auteurPrincipal);
    formData.append('emailAuteur', data.emailAuteur);
    if (data.coAuteurs) {
      data.coAuteurs.forEach(coAuteur => {
        formData.append('coAuteurs', coAuteur);
      });
    }
    data.motsCles.forEach(motCle => {
      formData.append('motsCles', motCle);
    });
    formData.append('domaineRecherche', data.domaineRecherche);
    if (data.notes) {
      formData.append('notes', data.notes);
    }

    const response = await apiClient.post('/soumissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Récupérer mes soumissions
   */
  async getMesSoumissions(): Promise<any[]> {
    const response = await apiClient.get('/soumissions');
    return response.data;
  },

  /**
   * Récupérer une soumission par ID
   */
  async getSoumissionById(id: number): Promise<any> {
    const response = await apiClient.get(`/soumissions/${id}`);
    return response.data;
  },

  /**
   * Récupérer les soumissions en attente (ADMIN/STAFF)
   */
  async getSoumissionsEnAttente(): Promise<any[]> {
    const response = await apiClient.get('/admin/soumissions/en-attente');
    return response.data;
  },

  /**
   * Mettre à jour le statut d'une soumission (ADMIN/STAFF)
   */
  async changerStatut(id: number, statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REJETEE'): Promise<void> {
    await apiClient.put(`/admin/soumissions/${id}/statut`, { statut });
  }
};

export default { publicationsService, soumissionsService };
