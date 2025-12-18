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
 * Intercepteur pour ajouter automatiquement le token Firebase à chaque requête
 */
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authService.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Ajouter l'UID de l'utilisateur dans un header personnalisé
      const user = authService.getCurrentUser();
      if (user) {
        config.headers['X-User-Id'] = user.uid;
        config.headers['X-User-Email'] = user.email || '';
        const role = await authService.getCurrentUserRole();
        config.headers['X-User-Role'] = role;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur pour gérer les erreurs d'authentification
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide, déconnecter l'utilisateur
      await authService.logout();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
