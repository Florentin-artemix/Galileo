package com.galileo.ecriture.repository;

import com.galileo.ecriture.entity.Soumission;
import com.galileo.ecriture.entity.Soumission.StatutSoumission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SoumissionRepository extends JpaRepository<Soumission, Long> {

    // Rechercher par statut
    List<Soumission> findByStatut(StatutSoumission statut);

    // Rechercher les soumissions d'un utilisateur
    List<Soumission> findByUserIdOrderByDateSoumissionDesc(String userId);

    // Rechercher par email utilisateur
    List<Soumission> findByUserEmailOrderByDateSoumissionDesc(String userEmail);

    // Compter les soumissions en attente
    long countByStatut(StatutSoumission statut);

    // Rechercher une soumission d'un utilisateur
    Optional<Soumission> findByIdAndUserId(Long id, String userId);

    // Rechercher par domaine et statut
    List<Soumission> findByDomaineAndStatut(String domaine, StatutSoumission statut);
}
