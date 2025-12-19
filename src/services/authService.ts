import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/api';

export type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT' | 'VIEWER';

const ROLE_STORAGE_KEY = 'galileo_user_role';
let cachedRole: UserRole = 'VIEWER';
let cachedUid: string | null = null;

/**
 * Service d'authentification Firebase
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur avec rôle
   * Après inscription Firebase, synchronise le rôle avec les custom claims via /self-register
   */
  async signup(email: string, password: string, role: UserRole = 'VIEWER'): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Stocker le rôle dans localStorage pour persistance immédiate
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    localStorage.setItem(`${ROLE_STORAGE_KEY}_uid`, user.uid);
    cachedRole = role;
    cachedUid = user.uid;
    
    // Synchroniser le rôle avec Firebase custom claims via le backend
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/admin/users/self-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-Role': role // Le gateway utilise ce header si pas de claim Firebase
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: role
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
    return userCredential.user;
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
   * Rôle courant : d'abord localStorage, puis custom claims Firebase (fallback VIEWER)
   */
  async getCurrentUserRole(): Promise<UserRole> {
    const user = auth.currentUser;
    if (!user) {
      cachedRole = 'VIEWER';
      cachedUid = null;
      return cachedRole;
    }

    // Cache simple par UID
    if (cachedUid === user.uid && cachedRole && cachedRole !== 'VIEWER') {
      return cachedRole;
    }

    // Vérifier d'abord localStorage (pour les inscriptions récentes)
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    const storedUid = localStorage.getItem(`${ROLE_STORAGE_KEY}_uid`);
    
    if (storedRole && storedUid === user.uid) {
      cachedRole = storedRole;
      cachedUid = user.uid;
      return cachedRole;
    }

    try {
      const tokenResult = await user.getIdTokenResult();
      const roleClaim = (tokenResult.claims as Record<string, any>).role;
      const normalized = typeof roleClaim === 'string' ? roleClaim.toUpperCase() : '';
      switch (normalized) {
        case 'ADMIN':
          cachedRole = 'ADMIN';
          break;
        case 'STAFF':
        case 'PERSONNEL':
          cachedRole = 'STAFF';
          break;
        case 'STUDENT':
        case 'ETUDIANT':
          cachedRole = 'STUDENT';
          break;
        default:
          // Si pas de claim Firebase, utiliser le localStorage
          cachedRole = storedRole || 'VIEWER';
      }
      cachedUid = user.uid;
    } catch (e) {
      cachedRole = storedRole || 'VIEWER';
      cachedUid = user.uid;
    }
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
  }
};
