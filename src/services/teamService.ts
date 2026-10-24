/**
 * Service pour gérer les membres de l'équipe institutionnelle via l'API backend
 */

import apiClient from './apiService';
import type { TeamMember } from '../types';

export interface TeamMemberDTO {
  id: number;
  uid?: string;
  displayName: string;
  name?: string;
  role: string;
  bio?: string;
  description?: string;
  department?: string;
  avatarUrl?: string;
  imageUrl?: string;
  location?: string;
  email?: string;
  phone?: string;
}

/**
 * Convertit un DTO backend en type frontend TeamMember
 */
export function mapToTeamMember(dto: TeamMemberDTO): TeamMember {
  const name = dto.displayName || dto.name || 'Membre';
  const avatar = dto.avatarUrl || dto.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
  const description = dto.bio || dto.description || (dto.department ? `Département : ${dto.department}` : '');

  return {
    id: dto.id,
    name,
    role: dto.role,
    description,
    imageUrl: avatar,
    location: dto.location || undefined,
    email: dto.email || undefined,
    phone: dto.phone || undefined
  };
}

/**
 * Récupérer tous les membres actifs de l'équipe institutionnelle (ADMIN, STAFF, TEACHER, RESEARCHER)
 */
export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
    const response = await apiClient.get<TeamMemberDTO[]>('/public/team');
    return (response.data || []).map(mapToTeamMember);
  } catch (error) {
    console.error('Erreur lors de la récupération des membres de l\'équipe:', error);
    throw error;
  }
}

/**
 * Récupérer les membres de l'équipe par rôle institutionnel (STAFF, ADMIN, TEACHER, RESEARCHER)
 */
export async function getTeamMembersByRole(role: string): Promise<TeamMember[]> {
  try {
    const response = await apiClient.get<TeamMemberDTO[]>(`/public/team/role/${encodeURIComponent(role)}`);
    return (response.data || []).map(mapToTeamMember);
  } catch (error) {
    console.error(`Erreur lors de la récupération des membres pour le rôle ${role}:`, error);
    throw error;
  }
}

export const teamService = {
  getAllTeamMembers,
  getTeamMembersByRole
};

export default teamService;
