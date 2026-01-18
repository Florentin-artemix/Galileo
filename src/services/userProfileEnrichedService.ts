import apiClient from './apiService';
import { authService } from './authService';

/**
 * Interface pour le profil utilisateur enrichi
 */
export interface EnrichedUserProfile {
  id: number;
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  bio?: string;
  institution?: string;
  department?: string;
  researchInterests?: string[];
  orcidId?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  websiteUrl?: string;
  publicationsCount?: number;
  favoritesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEnrichedProfileDTO {
  displayName?: string;
  bio?: string;
  institution?: string;
  department?: string;
  researchInterests?: string[];
  orcidId?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  websiteUrl?: string;
}

/**
 * Service pour le profil utilisateur enrichi
 * Exploite le microservice galileo-user-profile
 */
export const userProfileEnrichedService = {
  /**
   * Récupérer le profil enrichi de l'utilisateur courant
   */
  async getMyEnrichedProfile(): Promise<EnrichedUserProfile> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.get(`/userprofile/${user.uid}/profile`);
    return response.data;
  },

  /**
   * Récupérer le profil enrichi d'un utilisateur par UID
   */
  async getProfileByUid(uid: string): Promise<EnrichedUserProfile> {
    const response = await apiClient.get(`/userprofile/${uid}/profile`);
    return response.data;
  },

  /**
   * Mettre à jour le profil enrichi
   */
  async updateMyEnrichedProfile(profile: UpdateEnrichedProfileDTO): Promise<EnrichedUserProfile> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.put(`/userprofile/${user.uid}/profile`, profile);
    return response.data;
  },

  /**
   * Créer ou mettre à jour le profil enrichi (upsert)
   */
  async upsertMyEnrichedProfile(profile: UpdateEnrichedProfileDTO): Promise<EnrichedUserProfile> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    const response = await apiClient.post(`/userprofile/${user.uid}/profile`, profile);
    return response.data;
  },

  /**
   * Récupérer ou créer le profil enrichi à la première connexion
   */
  async ensureProfileExists(): Promise<EnrichedUserProfile> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');
    
    try {
      return await this.getMyEnrichedProfile();
    } catch {
      // Créer un profil minimal
      return await this.upsertMyEnrichedProfile({
        displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur'
      });
    }
  }
};

export default userProfileEnrichedService;
