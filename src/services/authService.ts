import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';

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
  }
};
