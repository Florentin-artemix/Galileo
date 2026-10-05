import { API_BASE_URL } from '../config/api';

export type UserRole = 'STUDENT' | 'RESEARCHER' | 'TEACHER' | 'STAFF' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  displayName?: string;
  role: UserRole;
}

const REFRESH_TOKEN_KEY = 'galileo_refresh_token';
const TOKEN_STORAGE_KEY = 'galileo_jwt_token';

const apiBase = (API_BASE_URL && API_BASE_URL.trim().length > 0)
  ? API_BASE_URL
  : `${window.location.origin.replace(/\/$/, '')}/api`;

export const authService = {
  async signup(
    email: string,
    password: string,
    role: UserRole = 'STUDENT',
    extra?: { displayName?: string; program?: string; motivation?: string }
  ): Promise<User> {
    const response = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, ...extra })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Signup failed');
    }
    
    const data = await response.json();
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    return data.user as User;
  },

  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
    if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    return data.user as User;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
        await fetch(`${apiBase}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        }).catch(console.error);
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  async refresh(): Promise<boolean> {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;
      
      try {
          const response = await fetch(`${apiBase}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
          });
          
          if (!response.ok) {
              await this.logout();
              return false;
          }
          
          const data = await response.json();
          localStorage.setItem(TOKEN_STORAGE_KEY, data.accessToken);
          if (data.refreshToken) {
              localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
          }
          return true;
      } catch (e) {
          await this.logout();
          return false;
      }
  },

  async getAccessToken(): Promise<string | null> {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  async fetchCurrentUser(): Promise<User | null> {
      const token = await this.getAccessToken();
      if (!token) return null;
      
      try {
          const response = await fetch(`${apiBase}/users/me`, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });
          
          if (response.ok) {
              return await response.json();
          } else if (response.status === 401) {
              const refreshed = await this.refresh();
              if (refreshed) {
                  return this.fetchCurrentUser(); // try again
              }
          }
          return null;
      } catch (e) {
          return null;
      }
  }
};
