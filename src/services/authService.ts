import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/api';

export type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT' | 'VIEWER';

const ROLE_STORAGE_KEY = 'galileo_user_role';
let cachedRole: UserRole = 'VIEWER';
let cachedUid: string | null = null;

const apiBase = (API_BASE_URL && API_BASE_URL.trim().length > 0)
  ? API_BASE_URL
  : `${window.location.origin.replace(/\/$/, '')}/api`;

/**
 * Service d'authentification Firebase
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur avec rôle
   * Après inscription Firebase, synchronise le rôle avec les custom claims via /self-register
   */
  async signup(
    email: string,
    password: string,
    role: UserRole = 'VIEWER',
    extra?: { displayName?: string; program?: string; motivation?: string }
  ): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const displayName = extra?.displayName;
    const program = extra?.program;
    const motivation = extra?.motivation;
    
    // Stocker le rôle dans localStorage pour persistance immédiate
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    localStorage.setItem(`${ROLE_STORAGE_KEY}_uid`, user.uid);
    cachedRole = role;
    cachedUid = user.uid;
    
    // Synchroniser le rôle avec Firebase custom claims via le backend
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${apiBase}/admin/users/self-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Role': role // Le gateway utilise ce header si pas de claim Firebase
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: role,
          displayName,
          program,
          motivation
        })
      });
      
      if (response.ok) {
        console.log('[Auth] Rôle synchronisé avec Firebase custom claims:', role);
        // Force le rafraîchissement du token pour récupérer le nouveau claim
        await user.getIdToken(true);
      } else {
        console.warn('[Auth] Échec de la synchronisation du rôle, utilisation du localStorage');
      }
    } catch (error) {
      console.warn('[Auth] Erreur lors de la synchronisation du rôle:', error);
      // Le localStorage sera utilisé comme fallback
    }
    
    return user;
  },

  /**
   * Définir le rôle de l'utilisateur (pour l'inscription)
   */
  setUserRole(role: UserRole): void {
    const user = auth.currentUser;
    if (user) {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
      localStorage.setItem(`${ROLE_STORAGE_KEY}_uid`, user.uid);
      cachedRole = role;
      cachedUid = user.uid;
    }
  },

  /**
   * Connexion d'un utilisateur existant
   */
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await authService.syncRoleFromBackend(user);
    return user;
  },

  /**
   * Déconnexion de l'utilisateur courant
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Obtenir le token d'authentification de l'utilisateur courant
   */
  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  },

  /**
   * Observer les changements d'état d'authentification
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Obtenir l'utilisateur courant
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Rôle courant : backend (PostgreSQL) en source de vérité, puis claims, puis localStorage
   */
  async getCurrentUserRole(): Promise<UserRole> {
    const user = auth.currentUser;
    if (!user) {
      cachedRole = 'VIEWER';
      cachedUid = null;
      return cachedRole;
    }

    // Cache simple par UID
    if (cachedUid === user.uid && cachedRole) {
      return cachedRole;
    }

    // 1) Backend en source de vérité
    const backendRole = await authService.syncRoleFromBackend(user);
    if (backendRole) return backendRole;

    // 2) Claims Firebase
    try {
      const tokenResult = await user.getIdTokenResult();
      const roleClaim = (tokenResult.claims as Record<string, any>).role;
      const mapped = mapRole(typeof roleClaim === 'string' ? roleClaim : '');
      if (mapped) {
        cachedRole = mapped;
        cachedUid = user.uid;
        localStorage.setItem(ROLE_STORAGE_KEY, mapped);
        localStorage.setItem(`${ROLE_STORAGE_KEY}_uid`, user.uid);
        return mapped;
      }
    } catch (e) {
      // ignore
    }

    // 3) Fallback localStorage
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    const storedUid = localStorage.getItem(`${ROLE_STORAGE_KEY}_uid`);
    if (storedRole && storedUid === user.uid) {
      cachedRole = storedRole;
      cachedUid = user.uid;
      return storedRole;
    }

    cachedRole = 'VIEWER';
    cachedUid = user.uid;
    return cachedRole;
  },

  /**
   * Effacer le rôle stocké (pour déconnexion)
   */
  clearStoredRole(): void {
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(`${ROLE_STORAGE_KEY}_uid`);
    cachedRole = 'VIEWER';
    cachedUid = null;
  },

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  /**
   * Sync rôle depuis le backend /users/me et le met en cache/localStorage
   */
  async syncRoleFromBackend(user: User | null): Promise<UserRole | null> {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${apiBase}/users/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-User-Id': user.uid,
          'X-User-Email': user.email ?? ''
        }
      });
      if (!response.ok) return null;
      const data = await response.json();
      const backendRole = mapRole((data.role as string | undefined) ?? '');
      if (backendRole) {
        cachedRole = backendRole;
        cachedUid = user.uid;
        localStorage.setItem(ROLE_STORAGE_KEY, backendRole);
        localStorage.setItem(`${ROLE_STORAGE_KEY}_uid`, user.uid);
        return backendRole;
      }
    } catch (err) {
      // ignore
    }
    return null;
  }
};

function mapRole(raw: string): UserRole | null {
  const normalized = raw?.toUpperCase();
  switch (normalized) {
    case 'ADMIN':
      return 'ADMIN';
    case 'STAFF':
    case 'PERSONNEL':
      return 'STAFF';
    case 'STUDENT':
    case 'ETUDIANT':
      return 'STUDENT';
    case 'VIEWER':
      return 'VIEWER';
    default:
      return null;
  }
}
