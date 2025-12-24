/**
 * Configuration de l'API Backend
 */

// Base URL de l'API selon l'environnement
const getApiBaseUrl = (): string => {
  // En production Docker, utiliser le proxy nginx (pas de /api car apiClient a déjà baseURL)
  if (import.meta.env.PROD) {
    return '';
  }
  
  // En développement local, apiClient a déjà baseURL avec /api
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Endpoints du Service Lecture (Public)
export const API_ENDPOINTS = {
  // Publications
  publications: {
    list: `${API_BASE_URL}/publications`,
    detail: (id: number) => `${API_BASE_URL}/publications/${id}`,
    downloadUrl: (id: number) => `${API_BASE_URL}/publications/${id}/telecharger`,
    recordDownload: (id: number) => `${API_BASE_URL}/publications/${id}/telechargement`,
    incrementViews: (id: number) => `${API_BASE_URL}/publications/${id}/views`,
    byDomain: (domain: string) => `${API_BASE_URL}/publications/domaine/${domain}`,
  },

  // Blog
  blog: {
    list: `${API_BASE_URL}/blog`,
    detail: (id: number) => `${API_BASE_URL}/blog/${id}`,
    recent: `${API_BASE_URL}/blog/recents`,
    popular: `${API_BASE_URL}/blog/populaires`,
    byCategory: (category: string) => `${API_BASE_URL}/blog/categorie/${category}`,
    create: `${API_BASE_URL}/blog`,
    update: (id: number) => `${API_BASE_URL}/blog/${id}`,
    delete: (id: number) => `${API_BASE_URL}/blog/${id}`,
  },

  // Événements
  events: {
    list: `${API_BASE_URL}/evenements`,
    detail: (id: number) => `${API_BASE_URL}/evenements/${id}`,
    upcoming: `${API_BASE_URL}/evenements/a-venir`,
  },

  // Recherche Elasticsearch
  search: {
    publications: `${API_BASE_URL}/search/publications`,
    blog: `${API_BASE_URL}/search/blog`,
    advanced: `${API_BASE_URL}/search/publications/advanced`,
    autocompletePublications: `${API_BASE_URL}/search/publications/autocomplete`,
    autocompleteBlog: `${API_BASE_URL}/search/blog/autocomplete`,
    similar: (id: number) => `${API_BASE_URL}/search/publications/${id}/similar`,
    byDomain: (domain: string) => `${API_BASE_URL}/search/publications/domain/${domain}`,
    byAuthor: (author: string) => `${API_BASE_URL}/search/publications/author/${author}`,
    byCategory: (category: string) => `${API_BASE_URL}/search/blog/category/${category}`,
    aggregations: {
      domains: `${API_BASE_URL}/search/aggregations/domains`,
      authors: `${API_BASE_URL}/search/aggregations/authors`,
      blogCategories: `${API_BASE_URL}/search/aggregations/blog-categories`,
    },
  },

  // Soumissions (Authentifié)
  submissions: {
    create: `${API_BASE_URL}/soumissions`,
    list: `${API_BASE_URL}/soumissions`,
    detail: (id: number) => `${API_BASE_URL}/soumissions/${id}`,
    uploadPDF: `${API_BASE_URL}/soumissions/upload-pdf`,
  },

  // Admin (Authentifié + Admin)
  admin: {
    pending: `${API_BASE_URL}/admin/soumissions/en-attente`,
    validate: (id: number) => `${API_BASE_URL}/admin/soumissions/${id}/valider`,
    reject: (id: number) => `${API_BASE_URL}/admin/soumissions/${id}/rejeter`,
    requestRevision: (id: number) => `${API_BASE_URL}/admin/soumissions/${id}/demander-revisions`,
  },

  // Indexation Elasticsearch (Admin)
  indexation: {
    publications: `${API_BASE_URL}/indexation/publications`,
    blog: `${API_BASE_URL}/indexation/blog`,
    reindex: `${API_BASE_URL}/indexation/reindex`,
  },

  // Profil utilisateur (Authentifié)
  profile: {
    me: `${API_BASE_URL}/users/me`,
    uploadPhoto: `${API_BASE_URL}/profile/photo`,
    deletePhoto: `${API_BASE_URL}/profile/photo`,
  },

  // Équipe
  team: {
    list: `${API_BASE_URL}/team`,
    byRole: (role: string) => `${API_BASE_URL}/team/role/${role}`,
  },
};

// Configuration des requêtes
export const API_CONFIG = {
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Helper pour les requêtes authentifiées
export const getAuthHeaders = (token?: string) => {
  if (!token) {
    return API_CONFIG.headers;
  }
  
  return {
    ...API_CONFIG.headers,
    'Authorization': `Bearer ${token}`,
  };
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  API_CONFIG,
  getAuthHeaders,
};
