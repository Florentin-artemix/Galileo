import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';

export type UserRole = 'ADMIN' | 'STAFF' | 'STUDENT' | 'VIEWER';

let cachedRole: UserRole = 'VIEWER';
let cachedUid: string | null = null;

/**
 * Service d'authentification Firebase
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async signup(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
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
   * Rôle courant issu des custom claims Firebase (fallback VIEWER)
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
          cachedRole = 'VIEWER';
      }
      cachedUid = user.uid;
    } catch (e) {
      cachedRole = 'VIEWER';
      cachedUid = user.uid;
    }
    return cachedRole;
  }
};
