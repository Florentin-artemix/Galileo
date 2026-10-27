import { API_BASE_URL } from '../config/api';

export type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT' | 'RESEARCHER' | 'TEACHER' | 'VIEWER';

export interface User {
  id: number;
  uid: string; // Compatibilité ascendante avec l'ancien code frontend
  email: string;
  displayName?: string;
  role: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  getIdToken?: () => Promise<string | null>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
}

const TOKEN_STORAGE_KEY = 'galileo_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'galileo_refresh_token';
const USER_STORAGE_KEY = 'galileo_user';
const ROLE_STORAGE_KEY = 'galileo_user_role';

const apiBase = (API_BASE_URL && API_BASE_URL.trim().length > 0)
  ? API_BASE_URL.replace(/\/$/, '')
  : '/api';

// Listeners pour changements d'état d'authentification
type AuthListener = (user: User | null) => void;
const listeners = new Set<AuthListener>();

const notifyListeners = (user: User | null) => {
  listeners.forEach((callback) => {
    try {
      callback(user);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
};

/**
 * Service d'authentification JWT pour Spring Boot
 */
export const authService = {
  /**
   * Retourne le jeton d'accès actuel
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('galileo_jwt_token');
  },

  /**
   * Alias de getAccessToken pour compatibilité avec le code existant
   */
  async getIdToken(): Promise<string | null> {
    return this.getAccessToken();
  },

  /**
   * Retourne le refresh token actuel
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  },

  /**
   * Récupère l'utilisateur actuellement connecté depuis le localStorage
   */
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as User;
      // Attacher la fonction getIdToken sur l'objet utilisateur pour compatibilité
      user.getIdToken = () => Promise.resolve(this.getAccessToken());
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Récupère le rôle de l'utilisateur connecté
   */
  async getCurrentUserRole(): Promise<UserRole> {
    const user = this.getCurrentUser();
    return user ? user.role : 'VIEWER';
  },

  /**
   * Inscription publique : attribue obligatoirement un rôle non privilégié (STUDENT)
   */
  async signup(
    email: string,
    password: string,
    requestedRole: UserRole = 'STUDENT',
    extra?: { displayName?: string; firstName?: string; lastName?: string; program?: string; motivation?: string }
  ): Promise<User> {
    // Public signup can request the non-privileged VIEWER role only.
    const response = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        role: requestedRole === 'VIEWER' ? 'VIEWER' : 'STUDENT',
        displayName: extra?.displayName || '',
        firstName: extra?.firstName || extra?.displayName?.split(' ')[0] || '',
        lastName: extra?.lastName || extra?.displayName?.split(' ').slice(1).join(' ') || '',
        program: extra?.program || '',
        motivation: extra?.motivation || ''
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Échec de l\'inscription');
    }

    const data = await response.json();
    return this.handleAuthSuccess(data);
  },

  /**
   * Connexion avec email et mot de passe
   */
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Identifiants invalides');
    }

    const data = await response.json();
    return this.handleAuthSuccess(data);
  },

  /**
   * Traitement d'un succès d'authentification
   */
  handleAuthSuccess(data: any): User {
    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;
    const userId = Number(data.userId || data.id || 0);

    if (accessToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      localStorage.setItem('galileo_jwt_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }

    const user: User = {
      id: userId,
      uid: String(userId),
      email: data.email,
      displayName: data.displayName || data.firstName || data.email?.split('@')[0],
      role: (data.role as UserRole) || 'STUDENT',
      isActive: data.isActive !== false,
      emailVerified: Boolean(data.emailVerified)
    };
    user.getIdToken = () => Promise.resolve(accessToken || null);

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(ROLE_STORAGE_KEY, user.role);

    notifyListeners(user);
    return user;
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(`${apiBase}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.getAccessToken() ? { Authorization: `Bearer ${this.getAccessToken()}` } : {})
          },
          body: JSON.stringify({ refreshToken })
        });
      } catch (e) {
        // Ignorer l'erreur réseau lors de la déconnexion
      }
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem('galileo_jwt_token');
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);

    notifyListeners(null);
  },

  /**
   * Rafraîchissement du jeton d'accès via le refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      await this.logout();
      return null;
    }

    try {
      const response = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        await this.logout();
        return null;
      }

      const data = await response.json();
      if (data.accessToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
        localStorage.setItem('galileo_jwt_token', data.accessToken);
        return data.accessToken;
      }
    } catch {
      await this.logout();
    }
    return null;
  },

  /**
   * Alias booléen de rafraîchissement
   */
  async refresh(): Promise<boolean> {
    const token = await this.refreshAccessToken();
    return !!token;
  },

  /**
   * Alias asynchrone pour récupérer l'utilisateur courant (avec vérification /me)
   */
  async fetchCurrentUser(): Promise<User | null> {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const response = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const freshUser = await response.json();
        return this.handleAuthSuccess({
          accessToken: token,
          refreshToken: this.getRefreshToken(),
          ...freshUser
        });
      } else if (response.status === 401) {
        const refreshed = await this.refresh();
        if (refreshed) {
          return this.fetchCurrentUser();
        }
      }
    } catch {
      // Ignorer
    }
    return this.getCurrentUser();
  },

  /**
   * Abonnement aux changements d'état d'authentification
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    listeners.add(callback);
    // Notification immédiate avec l'utilisateur actuel en cache
    const current = this.getCurrentUser();
    callback(current);

    // Si un jeton existe, vérifie sa validité auprès du backend
    if (this.getAccessToken()) {
      fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${this.getAccessToken()}` }
      })
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else if (res.status === 401) {
            // Tenter le rafraîchissement
            return this.refreshAccessToken().then((token) => {
              if (!token) throw new Error('Refresh failed');
            });
          }
        })
        .then((freshUser) => {
          if (freshUser && freshUser.email) {
            this.handleAuthSuccess({
              accessToken: this.getAccessToken(),
              refreshToken: this.getRefreshToken(),
              ...freshUser
            });
          }
        })
        .catch(() => {
          // Token expiré ou serveur injoignable, on garde la session locale ou on invalide
        });
    }

    return () => {
      listeners.delete(callback);
    };
  },

  clearStoredRole(): void {
    localStorage.removeItem(ROLE_STORAGE_KEY);
  },

  /**
   * Demande de réinitialisation de mot de passe
   */
  async sendPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${apiBase}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (response.status === 501 || response.status === 404) {
      throw new Error('Le service d\'envoi d\'emails de réinitialisation n\'est pas configuré sur ce serveur.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Impossible d\'envoyer l\'email de réinitialisation');
    }
  },

  async syncRoleFromBackend(user: User | null): Promise<UserRole | null> {
    return user ? user.role : null;
  }
};

export default authService;
