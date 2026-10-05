import { API_BASE_URL } from '../config/api';

export type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT' | 'VIEWER';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
}

const ROLE_STORAGE_KEY = 'galileo_user_role';
const TOKEN_STORAGE_KEY = 'galileo_jwt_token';

const apiBase = (API_BASE_URL && API_BASE_URL.trim().length > 0)
  ? API_BASE_URL
  : `${window.location.origin.replace(/\/$/, '')}/api`;

/**
 * Service d'authentification basé sur JWT (Backend Spring Boot)
 */
export const authService = {
  async signup(
    email: string,
    password: string,
    role: UserRole = 'VIEWER',
    extra?: { displayName?: string; program?: string; motivation?: string }
  ): Promise<User> {
    const response = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, ...extra })
    });
    if (!response.ok) throw new Error('Signup failed');
    const data = await response.json();
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    localStorage.setItem(ROLE_STORAGE_KEY, data.user.role);
    return data.user as User;
  },

  setUserRole(role: UserRole): void {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  },

  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    localStorage.setItem(ROLE_STORAGE_KEY, data.user.role);
    return data.user as User;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  },

  async getIdToken(): Promise<string | null> {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      // Decode JWT roughly or rely on backend
      callback({ uid: 'mock', email: 'mock@mock.com', role: 'VIEWER' });
    } else {
      callback(null);
    }
    return () => {};
  },

  getCurrentUser(): User | null {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return token ? { uid: 'mock', email: 'mock@mock.com', role: 'VIEWER' } : null;
  },

  async getCurrentUserRole(): Promise<UserRole> {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    return storedRole || 'VIEWER';
  },

  clearStoredRole(): void {
    localStorage.removeItem(ROLE_STORAGE_KEY);
  },

  async sendPasswordReset(email: string): Promise<void> {
    // API Call
  },

  async syncRoleFromBackend(user: User | null): Promise<UserRole | null> {
    return user ? user.role : null;
  }
};
