package com.galileo.lecture.service;

import com.galileo.lecture.dto.TeamMemberCreateDTO;
import com.galileo.lecture.dto.TeamMemberDTO;
import com.galileo.lecture.entity.TeamMember;
import com.galileo.lecture.repository.TeamMemberRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class TeamMemberService {

    private final TeamMemberRepository teamMemberRepository;

    public TeamMemberService(TeamMemberRepository teamMemberRepository) {
        this.teamMemberRepository = teamMemberRepository;
    }

    /**
     * Récupérer tous les membres actifs
     */
    @Transactional(readOnly = true)
    public List<TeamMemberDTO> getAllActiveMembers() {
        return teamMemberRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer un membre par ID
     */
    @Transactional(readOnly = true)
    public TeamMemberDTO getMemberById(Long id) {
        TeamMember member = teamMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé: " + id));
        return convertToDTO(member);
    }

    /**
     * Créer un nouveau membre
     */
    public TeamMemberDTO createMember(TeamMemberCreateDTO dto) {
        TeamMember member = new TeamMember();
        updateEntityFromDTO(member, dto);
        TeamMember saved = teamMemberRepository.save(member);
        log.info("Membre créé: {} (ID: {})", saved.getName(), saved.getId());
        return convertToDTO(saved);
    }

    /**
     * Mettre à jour un membre
     */
    public TeamMemberDTO updateMember(Long id, TeamMemberCreateDTO dto) {
        TeamMember member = teamMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé: " + id));
        
        updateEntityFromDTO(member, dto);
        TeamMember saved = teamMemberRepository.save(member);
        log.info("Membre mis à jour: {} (ID: {})", saved.getName(), saved.getId());
        return convertToDTO(saved);
    }

    /**
     * Supprimer un membre (soft delete)
     */
    public void deleteMember(Long id) {
        TeamMember member = teamMemberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé: " + id));
        
        member.setIsActive(false);
        teamMemberRepository.save(member);
        log.info("Membre désactivé: ID {}", id);
    }

    /**
     * Rechercher des membres par rôle
     */
    @Transactional(readOnly = true)
    public List<TeamMemberDTO> getMembersByRole(String role) {
        return teamMemberRepository.findByRoleContainingIgnoreCaseAndIsActiveTrue(role).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupérer un membre par Firebase UID
     */
    @Transactional(readOnly = true)
    public TeamMemberDTO getMemberByFirebaseUid(String firebaseUid) {
        TeamMember member = teamMemberRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé pour UID: " + firebaseUid));
        return convertToDTO(member);
    }

    /**
     * Créer ou mettre à jour un membre par Firebase UID
     */
    public TeamMemberDTO createOrUpdateByFirebaseUid(String firebaseUid, TeamMemberCreateDTO dto) {
        TeamMember member = teamMemberRepository.findByFirebaseUid(firebaseUid)
                .orElse(new TeamMember());
        
        member.setFirebaseUid(firebaseUid);
        
        // Si le nom n'est pas fourni, utiliser l'email ou un nom par défaut
        if (dto.getName() == null || dto.getName().isBlank()) {
            if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
                dto.setName(dto.getEmail().split("@")[0]);
            } else if (member.getName() != null && !member.getName().isBlank()) {
                dto.setName(member.getName()); // Garder le nom existant
            } else {
                dto.setName("Utilisateur");
            }
        }
        
        // Si le rôle n'est pas fourni, utiliser VIEWER par défaut
        if (dto.getRole() == null || dto.getRole().isBlank()) {
            if (member.getRole() != null && !member.getRole().isBlank()) {
                dto.setRole(member.getRole()); // Garder le rôle existant
            } else {
                dto.setRole("VIEWER");
            }
        }
        
        updateEntityFromDTO(member, dto);
        
        TeamMember saved = teamMemberRepository.save(member);
        log.info("Profil équipe {} pour UID: {}", saved.getId() != null ? "mis à jour" : "créé", firebaseUid);
        return convertToDTO(saved);
    }

    // ============ Méthodes de conversion ============

    private TeamMemberDTO convertToDTO(TeamMember member) {
        TeamMemberDTO dto = new TeamMemberDTO();
        dto.setId(member.getId());
        dto.setName(member.getName());
        dto.setRole(member.getRole());
        dto.setDescription(member.getDescription());
        dto.setImageUrl(member.getImageUrl());
        dto.setLocation(member.getLocation());
        dto.setEmail(member.getEmail());
        dto.setPhone(member.getPhone());
        dto.setMotivation(member.getMotivation());
        dto.setLinkedinUrl(member.getLinkedinUrl());
        return dto;
    }

    private void updateEntityFromDTO(TeamMember member, TeamMemberCreateDTO dto) {
        member.setName(dto.getName());
        member.setRole(dto.getRole());
        member.setDescription(dto.getDescription());
        member.setImageUrl(dto.getImageUrl());
        member.setLocation(dto.getLocation());
        member.setEmail(dto.getEmail());
        member.setPhone(dto.getPhone());
        member.setMotivation(dto.getMotivation());
        member.setLinkedinUrl(dto.getLinkedinUrl());
        if (dto.getDisplayOrder() != null) {
            member.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getFirebaseUid() != null) {
            member.setFirebaseUid(dto.getFirebaseUid());
        }
    }
}
