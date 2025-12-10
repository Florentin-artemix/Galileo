package com.galileo.lecture.specification;

import com.galileo.lecture.entity.Publication;
import org.springframework.data.jpa.domain.Specification;

/**
 * Spécifications JPA pour les recherches dynamiques sur les Publications
 */
public class PublicationSpecification {

    /**
     * Publications publiées uniquement
     */
    public static Specification<Publication> estPubliee() {
        return (root, query, cb) -> cb.isTrue(root.get("publiee"));
    }

    /**
     * Recherche par domaine (exact)
     */
    public static Specification<Publication> parDomaine(String domaine) {
        return (root, query, cb) -> {
            if (domaine == null || domaine.isEmpty()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("domaine"), domaine);
        };
    }

    /**
     * Recherche par auteur (contient, insensible à la casse)
     */
    public static Specification<Publication> parAuteur(String auteur) {
        return (root, query, cb) -> {
            if (auteur == null || auteur.isEmpty()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("auteurPrincipal")), "%" + auteur.toLowerCase() + "%");
        };
    }

    /**
     * Recherche par mots-clés (contient, insensible à la casse)
     */
    public static Specification<Publication> parMotsCles(String motsCles) {
        return (root, query, cb) -> {
            if (motsCles == null || motsCles.isEmpty()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("motsCles")), "%" + motsCles.toLowerCase() + "%");
        };
    }

    /**
     * Recherche dans le titre (contient, insensible à la casse)
     */
    public static Specification<Publication> parTitre(String titre) {
        return (root, query, cb) -> {
            if (titre == null || titre.isEmpty()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("titre")), "%" + titre.toLowerCase() + "%");
        };
    }

    /**
     * Recherche globale (titre, résumé, auteur, mots-clés)
     */
    public static Specification<Publication> rechercheGlobale(String query) {
        return (root, criteriaQuery, cb) -> {
            if (query == null || query.isEmpty()) {
                return cb.conjunction();
            }
            String pattern = "%" + query.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("titre")), pattern),
                cb.like(cb.lower(root.get("resume")), pattern),
                cb.like(cb.lower(root.get("auteurPrincipal")), pattern),
                cb.like(cb.lower(root.get("motsCles")), pattern)
            );
        };
    }

    /**
     * Minimum de vues
     */
    public static Specification<Publication> minimumVues(Integer minVues) {
        return (root, query, cb) -> {
            if (minVues == null) {
                return cb.conjunction();
            }
            return cb.greaterThanOrEqualTo(root.get("nombreVues"), minVues);
        };
    }
}
