import { API_ENDPOINTS, getAuthHeaders } from '../config/api';

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
  signedUrl: string;
}

// Service API pour les profils utilisateurs
export const profileApi = {
  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getMyProfile(token: string): Promise<TeamMemberProfile | null> {
    try {
      const response = await fetch(API_ENDPOINTS.profile.me, {
        headers: getAuthHeaders(token),
      });
      
      if (response.status === 404 || response.status === 401) {
        return null; // Profil non trouvé ou non authentifié
      }
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du profil');
      }
      
      const data = await response.json();
      
      // Gérer le cas où le profil n'existe pas encore
      if (data.exists === false) {
        return null;
      }
      
      return data as TeamMemberProfile;
    } catch (error) {
      console.error('Erreur getMyProfile:', error);
      return null;
    }
  },

  /**
   * Créer ou mettre à jour le profil de l'utilisateur connecté
   */
  async saveMyProfile(token: string, profile: TeamMemberProfile): Promise<TeamMemberProfile> {
    const response = await fetch(API_ENDPOINTS.profile.me, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(profile),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors de la sauvegarde du profil');
    }
    
    return response.json();
  },

  /**
   * Upload une photo de profil vers Cloudflare R2
   */
  async uploadPhoto(token: string, file: File): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(API_ENDPOINTS.profile.uploadPhoto, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Ne pas mettre Content-Type pour multipart/form-data
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors de l\'upload de la photo');
    }
    
    return response.json();
  },

  /**
   * Supprimer la photo de profil
   */
  async deletePhoto(token: string, r2Key: string): Promise<void> {
    const response = await fetch(`${API_ENDPOINTS.profile.deletePhoto}?r2Key=${encodeURIComponent(r2Key)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression de la photo');
    }
  },
};

export default profileApi;
