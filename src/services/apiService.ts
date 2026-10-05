import axios, { AxiosInstance } from 'axios';
import { authService } from './authService';

/**
 * Instance Axios configurée pour communiquer avec le backend
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Intercepteur pour ajouter automatiquement le token JWT à chaque requête
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authService.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur pour gérer les erreurs d'authentification
 * Note: Ne redirige pas automatiquement sur 401 pour éviter les boucles de redirection
 * Le composant appelant doit gérer l'erreur appropriée
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized response. Token may be invalid or expired.');
      // Ne pas rediriger automatiquement - laisser le composant gérer
      // Cela évite les boucles de redirection sur le dashboard admin
    }
    return Promise.reject(error);
  }
);

export default apiClient;
