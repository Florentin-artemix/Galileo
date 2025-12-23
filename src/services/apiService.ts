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
        console.log('[API] Request to:', config.url, '| Role header:', role);
      }
    } else {
      // Même sans token, essayer de récupérer le rôle depuis localStorage
      const storedRole = localStorage.getItem('galileo_user_role');
      if (storedRole) {
        config.headers['X-User-Role'] = storedRole;
        console.log('[API] Request to:', config.url, '| Role from localStorage:', storedRole);
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
