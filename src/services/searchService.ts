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
   * Recherche avancée avec filtres multiples
   */
  async advancedSearch(params: {
    query?: string;
    domaine?: string;
    auteur?: string;
    page?: number;
    size?: number;
  }): Promise<SearchResponse> {
    const response = await apiClient.get('/search/publications/advanced', {
      params: {
        q: params.query || '',
        domaine: params.domaine || '',
        auteur: params.auteur || '',
        page: params.page || 0,
        size: params.size || 10
      }
    });
    return response.data;
  },

  /**
   * Recherche de publications similaires
   */
  async getSimilarPublications(id: number, limit: number = 5): Promise<SearchResult[]> {
    const response = await apiClient.get(`/search/publications/${id}/similar`, {
      params: { limit }
    });
    return response.data.content || [];
  },

  /**
   * Autocomplete pour publications
   */
  async autocompletePublications(prefix: string): Promise<string[]> {
    if (prefix.length < 2) return [];
    const response = await apiClient.get('/search/publications/autocomplete', {
      params: { prefix }
    });
    return response.data;
  },

  /**
   * Autocomplete pour blog
   */
  async autocompleteBlog(prefix: string): Promise<string[]> {
    if (prefix.length < 2) return [];
    const response = await apiClient.get('/search/blog/autocomplete', {
      params: { prefix }
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
