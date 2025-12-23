import apiClient from './apiService';
import { getAuthHeaders } from '../config/api';
import { authService } from './authService';

// DTO correspondant à la réponse du backend
export interface ArticleBlogDTO {
  id: number;
  titre: string;
  contenu: string;
  resume: string;
  auteur: string;
  categorie?: string | null;
  motsCles?: string | null;
  urlImagePrincipale?: string | null;
  tempsLecture?: number | null;
  nombreVues: number;
  datePublication: string;
}

export interface ArticleBlogCreateDTO {
  titre: string;
  contenu: string;
  resume: string;
  auteur: string;
  categorie?: string;
  motsCles?: string;
  urlImagePrincipale?: string;
  tempsLecture?: number;
  publie?: boolean;
}

/**
 * Service pour les articles de blog
 */
export const blogService = {
  /**
   * Récupérer tous les articles de blog publiés
   */
  async getArticles(): Promise<ArticleBlogDTO[]> {
    // Utiliser directement /blog car apiClient a déjà baseURL avec /api
    const response = await apiClient.get('/blog');
    return response.data;
  },

  /**
   * Récupérer un article par ID
   */
  async getArticleById(id: number): Promise<ArticleBlogDTO> {
    const response = await apiClient.get(`/blog/${id}`);
    return response.data;
  },

  /**
   * Récupérer les articles récents
   */
  async getRecentArticles(): Promise<ArticleBlogDTO[]> {
    const response = await apiClient.get('/blog/recents');
    return response.data;
  },

  /**
   * Récupérer les articles populaires
   */
  async getPopularArticles(): Promise<ArticleBlogDTO[]> {
    const response = await apiClient.get('/blog/populaires');
    return response.data;
  },

  /**
   * Récupérer les articles par catégorie
   */
  async getArticlesByCategory(category: string): Promise<ArticleBlogDTO[]> {
    const response = await apiClient.get(`/blog/categorie/${category}`);
    return response.data;
  },

  /**
   * Créer un nouvel article (authentifié, ADMIN/STAFF)
   */
  async createArticle(article: ArticleBlogCreateDTO): Promise<ArticleBlogDTO> {
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await apiClient.post(
      '/blog',
      article,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  /**
   * Mettre à jour un article (authentifié, ADMIN/STAFF)
   */
  async updateArticle(id: number, article: ArticleBlogCreateDTO): Promise<ArticleBlogDTO> {
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await apiClient.put(
      `/blog/${id}`,
      article,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  },

  /**
   * Supprimer un article (authentifié, ADMIN)
   */
  async deleteArticle(id: number): Promise<void> {
    const token = await authService.getIdToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    await apiClient.delete(
      `/blog/${id}`,
      { headers: getAuthHeaders(token) }
    );
  },
};

