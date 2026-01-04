/**
 * Service pour gérer les membres de l'équipe via l'API backend
 */

import type { TeamMember } from '../../types';

// URL de base pour les appels API
// En développement: utiliser directement le backend (port 8080)
// En production: utiliser le proxy nginx (/api)
const API_BASE = import.meta.env.DEV 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:8080/api')
  : '/api';

export interface TeamMemberDTO {
  id: number;
  name: string;
  role: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  email?: string;
  phone?: string;
}

export interface TeamMemberCreateDTO {
  name: string;
  role: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  email?: string;
  phone?: string;
  displayOrder?: number;
}

/**
 * Convertit un DTO backend en type frontend TeamMember
 */
function mapToTeamMember(dto: TeamMemberDTO): TeamMember {
  return {
    id: dto.id,
    name: dto.name,
    role: dto.role,
    description: dto.description || '',
    imageUrl: dto.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(dto.name)}&background=random&size=200`,
    location: dto.location,
    email: dto.email,
    phone: dto.phone
  };
}

/**
 * Récupérer tous les membres actifs de l'équipe (STAFF + ADMIN depuis PostgreSQL)
 */
export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
    // Utiliser le nouvel endpoint public qui retourne les users STAFF/ADMIN
    const response = await fetch(`${API_BASE}/public/team`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    // Mapper les UserDTO vers TeamMember
    return data.map((user: any) => ({
      id: user.uid || user.id,
      name: user.displayName || user.email?.split('@')[0] || 'Membre',
      role: user.role || 'STAFF',
      description: user.motivation || user.program || '',
      imageUrl: user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=random&size=200`,
      location: user.location,
      email: user.email,
      phone: user.phone
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    throw error;
  }
}

/**
 * Récupérer un membre par ID
 */
export async function getTeamMemberById(id: number): Promise<TeamMember> {
  try {
    const response = await fetch(`${API_BASE}/team/${id}`);
    
    if (!response.ok) {
      throw new Error(`Membre non trouvé: ${id}`);
    }
    
    const data: TeamMemberDTO = await response.json();
    return mapToTeamMember(data);
  } catch (error) {
    console.error('Erreur lors de la récupération du membre:', error);
    throw error;
  }
}

/**
 * Récupérer les membres par rôle (depuis PostgreSQL)
 */
export async function getTeamMembersByRole(role: string): Promise<TeamMember[]> {
  try {
    // Utiliser le nouvel endpoint public
    const response = await fetch(`${API_BASE}/public/team/role/${encodeURIComponent(role)}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    // Mapper les UserDTO vers TeamMember
    return data.map((user: any) => ({
      id: user.uid || user.id,
      name: user.displayName || user.email?.split('@')[0] || 'Membre',
      role: user.role || role,
      description: user.motivation || user.program || '',
      imageUrl: user.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=random&size=200`,
      location: user.location,
      email: user.email,
      phone: user.phone
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération par rôle:', error);
    throw error;
  }
}

/**
 * Créer un nouveau membre (nécessite authentification)
 */
export async function createTeamMember(
  member: TeamMemberCreateDTO,
  authToken: string
): Promise<TeamMember> {
  try {
    const response = await fetch(`${API_BASE}/team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(member)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création');
    }
    
    const data: TeamMemberDTO = await response.json();
    return mapToTeamMember(data);
  } catch (error) {
    console.error('Erreur lors de la création du membre:', error);
    throw error;
  }
}

/**
 * Mettre à jour un membre (nécessite authentification)
 */
export async function updateTeamMember(
  id: number,
  member: TeamMemberCreateDTO,
  authToken: string
): Promise<TeamMember> {
  try {
    const response = await fetch(`${API_BASE}/team/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(member)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la mise à jour');
    }
    
    const data: TeamMemberDTO = await response.json();
    return mapToTeamMember(data);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du membre:', error);
    throw error;
  }
}

/**
 * Supprimer un membre (nécessite authentification)
 */
export async function deleteTeamMember(id: number, authToken: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/team/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du membre:', error);
    throw error;
  }
}

export const teamService = {
  getAllTeamMembers,
  getTeamMemberById,
  getTeamMembersByRole,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
};

export default teamService;
