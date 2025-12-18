import apiClient from './apiService';

export interface SearchResult {
  id: string;
  publicationId: number;
  titre: string;
  resume: string;
  auteurPrincipal: string;
  domaine: string;
  motsCles: string[];
  datePublication: string;
  nombreVues: number;
  nombreTelechargements: number;
}

export interface SearchResponse {
  content: SearchResult[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Service de recherche utilisant Elasticsearch
 */
export const searchService = {
  /**
   * Recherche full-text dans les publications
   */
  async searchPublications(query: string, page: number = 0, size: number = 10): Promise<SearchResponse> {
    const response = await apiClient.get('/search/publications', {
      params: { q: query, page, size }
    });
    return response.data;
  },

  /**
   * Recherche dans les articles de blog
   */
  async searchBlog(query: string, page: number = 0, size: number = 10): Promise<SearchResponse> {
    const response = await apiClient.get('/search/blog', {
      params: { q: query, page, size }
    });
    return response.data;
  },

  /**
   * Recherche par domaine
   */
  async searchByDomain(domain: string, page: number = 0, size: number = 10): Promise<SearchResponse> {
    const response = await apiClient.get(`/search/publications/domain/${encodeURIComponent(domain)}`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Recherche globale (publications + blog)
   */
  async searchAll(query: string): Promise<{ publications: SearchResult[]; blog: SearchResult[] }> {
    const [pubResponse, blogResponse] = await Promise.all([
      this.searchPublications(query, 0, 5),
      this.searchBlog(query, 0, 5).catch(() => ({ content: [] }))
    ]);
    
    return {
      publications: pubResponse.content,
      blog: (blogResponse as SearchResponse).content || []
    };
  }
};

export default searchService;
