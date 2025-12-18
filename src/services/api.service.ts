import { API_ENDPOINTS, API_CONFIG, getAuthHeaders } from '../config/api';

// Types pour les réponses paginées
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Types pour les publications
export interface Publication {
  id: number;
  titre: string;
  resume: string;
  auteurPrincipal: string;
  coAuteurs?: string;
  domaine: string;
  motsCles?: string;
  urlPdf: string;
  urlImageCouverture?: string;
  tailleFichier?: number;
  nombrePages?: number;
  nombreVues: number;
  nombreTelechargements: number;
  datePublication: string;
  publiee: boolean;
}

// Types pour les articles de blog
export interface BlogArticle {
  id: number;
  titre: string;
  contenu: string;
  resume: string;
  auteur: string;
  categorie?: string;
  motsCles?: string;
  urlImagePrincipale?: string;
  tempsLecture?: number;
  nombreVues: number;
  datePublication: string;
  publie: boolean;
}

// Types pour les événements
export interface Evenement {
  id: number;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  lienInscription?: string;
  nombreInscrits: number;
  capaciteMax?: number;
  actif: boolean;
}

// Service API pour les publications
export const publicationsApi = {
  async getAll(page = 0, size = 10): Promise<PageResponse<Publication>> {
    const response = await fetch(
      `${API_ENDPOINTS.publications.list}?page=${page}&size=${size}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des publications');
    return response.json();
  },

  async getById(id: number): Promise<Publication> {
    const response = await fetch(API_ENDPOINTS.publications.detail(id), { ...API_CONFIG });
    if (!response.ok) throw new Error('Publication non trouvée');
    return response.json();
  },

  async getByDomain(domain: string, page = 0, size = 10): Promise<PageResponse<Publication>> {
    const response = await fetch(
      `${API_ENDPOINTS.publications.byDomain(domain)}?page=${page}&size=${size}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des publications');
    return response.json();
  },

  async incrementViews(id: number): Promise<void> {
    await fetch(API_ENDPOINTS.publications.incrementViews(id), {
      method: 'POST',
      ...API_CONFIG,
    });
  },

  async incrementDownloads(id: number): Promise<void> {
    await fetch(API_ENDPOINTS.publications.download(id), {
      method: 'POST',
      ...API_CONFIG,
    });
  },
};

// Service API pour le blog
export const blogApi = {
  async getAll(page = 0, size = 10): Promise<PageResponse<BlogArticle>> {
    const response = await fetch(
      `${API_ENDPOINTS.blog.list}?page=${page}&size=${size}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des articles');
    return response.json();
  },

  async getById(id: number): Promise<BlogArticle> {
    const response = await fetch(API_ENDPOINTS.blog.detail(id), { ...API_CONFIG });
    if (!response.ok) throw new Error('Article non trouvé');
    return response.json();
  },

  async getPublished(page = 0, size = 10): Promise<PageResponse<BlogArticle>> {
    const response = await fetch(
      `${API_ENDPOINTS.blog.published}?page=${page}&size=${size}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des articles');
    return response.json();
  },

  async incrementViews(id: number): Promise<void> {
    await fetch(API_ENDPOINTS.blog.incrementViews(id), {
      method: 'POST',
      ...API_CONFIG,
    });
  },
};

// Service API pour les événements
export const eventsApi = {
  async getAll(page = 0, size = 10): Promise<PageResponse<Evenement>> {
    const response = await fetch(
      `${API_ENDPOINTS.events.list}?page=${page}&size=${size}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des événements');
    return response.json();
  },

  async getById(id: number): Promise<Evenement> {
    const response = await fetch(API_ENDPOINTS.events.detail(id), { ...API_CONFIG });
    if (!response.ok) throw new Error('Événement non trouvé');
    return response.json();
  },

  async getUpcoming(page = 0, size = 10): Promise<PageResponse<Evenement>> {
    const response = await fetch(
      `${API_ENDPOINTS.events.upcoming}?page=${page}&size=${size}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors du chargement des événements');
    return response.json();
  },
};

// Service API pour la recherche Elasticsearch
export const searchApi = {
  async searchPublications(query: string, page = 0, size = 10) {
    const response = await fetch(
      `${API_ENDPOINTS.search.publications}?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors de la recherche');
    return response.json();
  },

  async searchBlog(query: string, page = 0, size = 10) {
    const response = await fetch(
      `${API_ENDPOINTS.search.blog}?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors de la recherche');
    return response.json();
  },

  async autocompletePublications(prefix: string): Promise<string[]> {
    const response = await fetch(
      `${API_ENDPOINTS.search.autocompletePublications}?prefix=${encodeURIComponent(prefix)}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors de l\'autocomplete');
    return response.json();
  },

  async autocompleteBlog(prefix: string): Promise<string[]> {
    const response = await fetch(
      `${API_ENDPOINTS.search.autocompleteBlog}?prefix=${encodeURIComponent(prefix)}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors de l\'autocomplete');
    return response.json();
  },

  async getSimilar(id: number, limit = 5): Promise<Publication[]> {
    const response = await fetch(
      `${API_ENDPOINTS.search.similar(id)}?limit=${limit}`,
      { ...API_CONFIG }
    );
    if (!response.ok) throw new Error('Erreur lors de la recherche');
    return response.json();
  },
};

export default {
  publications: publicationsApi,
  blog: blogApi,
  events: eventsApi,
  search: searchApi,
};
