package com.galileo.lecture.repository;

import com.galileo.lecture.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    // Trouver tous les membres actifs triés par ordre d'affichage
    List<TeamMember> findByIsActiveTrueOrderByDisplayOrderAsc();

    // Trouver par rôle
    List<TeamMember> findByRoleContainingIgnoreCaseAndIsActiveTrue(String role);

    // Trouver par nom
    List<TeamMember> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);

    // Compter les membres actifs
    long countByIsActiveTrue();
}
