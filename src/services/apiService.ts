import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';

/**
 * Instance Axios configurée pour communiquer avec le backend Spring Boot
 * En production et en développement, utilise par défaut le chemin relatif `/api`
 * ou la variable d'environnement VITE_API_URL.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Intercepteur de requête : attache le jeton JWT Bearer valide
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authService.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Intercepteur de réponse : gère les erreurs 401/403
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 Non autorisé. Le jeton d\'accès a expiré ou est invalide.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
