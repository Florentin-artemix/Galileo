/**
 * Configuration de l'API Backend
 */

// Base URL de l'API selon l'environnement
const getApiBaseUrl = (): string => {
  // En production Docker, utiliser le proxy nginx
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // En développement local
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Endpoints du Service Lecture (Public)
export const API_ENDPOINTS = {
  // Publications
  publications: {
    list: `${API_BASE_URL}/publications`,
    detail: (id: number) => `${API_BASE_URL}/publications/${id}`,
    download: (id: number) => `${API_BASE_URL}/publications/${id}/download`,
    incrementViews: (id: number) => `${API_BASE_URL}/publications/${id}/views`,
    byDomain: (domain: string) => `${API_BASE_URL}/publications/domaine/${domain}`,
  },

  // Blog
  blog: {
    list: `${API_BASE_URL}/blog`,
    detail: (id: number) => `${API_BASE_URL}/blog/${id}`,
    published: `${API_BASE_URL}/blog/publies`,
    incrementViews: (id: number) => `${API_BASE_URL}/blog/${id}/views`,
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
    autocompletePublications: `${API_BASE_URL}/search/publications/autocomplete`,
    autocompleteBlog: `${API_BASE_URL}/search/blog/autocomplete`,
    similar: (id: number) => `${API_BASE_URL}/search/publications/${id}/similar`,
    byDomain: (domain: string) => `${API_BASE_URL}/search/publications/domain/${domain}`,
    byAuthor: (author: string) => `${API_BASE_URL}/search/publications/author/${author}`,
    byCategory: (category: string) => `${API_BASE_URL}/search/blog/category/${category}`,
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
  },

  // Indexation Elasticsearch (Admin)
  indexation: {
    publications: `${API_BASE_URL}/indexation/publications`,
    blog: `${API_BASE_URL}/indexation/blog`,
    reindex: `${API_BASE_URL}/indexation/reindex`,
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
