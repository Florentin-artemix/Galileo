package com.galileo.lecture.repository;

import com.galileo.lecture.entity.Publication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour les Publications
 * JpaSpecificationExecutor permet les recherches dynamiques avec Criteria API
 */
@Repository
public interface PublicationRepository extends JpaRepository<Publication, Long>, JpaSpecificationExecutor<Publication> {

    // Rechercher les publications publiées
    List<Publication> findByPublieeTrue();

    // Rechercher par domaine
    List<Publication> findByDomaineAndPublieeTrue(String domaine);

    // Rechercher par auteur principal
    List<Publication> findByAuteurPrincipalContainingIgnoreCaseAndPublieeTrue(String auteur);

    // Les plus récentes
    List<Publication> findTop10ByPublieeTrueOrderByDatePublicationDesc();

    // Les plus vues
    List<Publication> findTop10ByPublieeTrueOrderByNombreVuesDesc();

    // Incrémenter le nombre de vues
    @Modifying
    @Query("UPDATE Publication p SET p.nombreVues = p.nombreVues + 1 WHERE p.id = :id")
    void incrementerVues(Long id);

    // Incrémenter le nombre de téléchargements
    @Modifying
    @Query("UPDATE Publication p SET p.nombreTelechargements = p.nombreTelechargements + 1 WHERE p.id = :id")
    void incrementerTelechargements(Long id);
}
