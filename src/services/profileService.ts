import apiClient from './apiService';

export interface TeamMemberProfile {
  id?: number;
  name: string;
  role?: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  email?: string;
  phone?: string;
  motivation?: string;
  linkedinUrl?: string;
}

export interface PhotoUploadResponse {
  r2Key: string;
  signedUrl?: string;
  imageUrl?: string;
  success?: boolean;
  message?: string;
}

// Service API pour les profils utilisateurs
export const profileApi = {
  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getMyProfile(token: string): Promise<TeamMemberProfile | null> {
    try {
      const response = await apiClient.get('/users/me');
      
      // Gérer le cas où le profil n'existe pas encore
      if (response.data.exists === false) {
        return null;
      }
      
      return response.data as TeamMemberProfile;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        return null; // Profil non trouvé ou non authentifié
      }
      console.error('Erreur getMyProfile:', error);
      return null;
    }
  },

  /**
   * Créer ou mettre à jour le profil de l'utilisateur connecté
   */
  async saveMyProfile(token: string, profile: TeamMemberProfile): Promise<TeamMemberProfile> {
    const response = await apiClient.post('/users/me', profile);
    return response.data;
  },

  /**
   * Upload une photo de profil vers Cloudflare R2
   */
  async uploadPhoto(token: string, file: File): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Supprimer la photo de profil
   */
  async deletePhoto(token: string, r2Key: string): Promise<void> {
    await apiClient.delete('/profile/photo', {
      params: { r2Key },
    });
  },
};

export default profileApi;
