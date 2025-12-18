package com.galileo.lecture.repository;

import com.galileo.lecture.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    // Trouver les événements à venir
    List<Event> findByDateGreaterThanEqualOrderByDateAsc(LocalDate date);

    // Trouver les événements passés
    List<Event> findByDateLessThanOrderByDateDesc(LocalDate date);

    // Trouver tous les événements triés par date décroissante
    List<Event> findAllByOrderByDateDesc();

    // Pagination
    Page<Event> findAllByOrderByDateDesc(Pageable pageable);

    // Recherche par domaine
    @Query("SELECT e FROM Event e WHERE LOWER(e.domainFr) LIKE LOWER(CONCAT('%', :domain, '%')) OR LOWER(e.domainEn) LIKE LOWER(CONCAT('%', :domain, '%'))")
    List<Event> findByDomain(@Param("domain") String domain);

    // Recherche par type
    @Query("SELECT e FROM Event e WHERE LOWER(e.typeFr) LIKE LOWER(CONCAT('%', :type, '%')) OR LOWER(e.typeEn) LIKE LOWER(CONCAT('%', :type, '%'))")
    List<Event> findByType(@Param("type") String type);

    // Recherche générale
    @Query("SELECT e FROM Event e WHERE " +
           "LOWER(e.titleFr) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.titleEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.summaryFr) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.summaryEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.tags) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Event> searchEvents(@Param("query") String query);

    // Événements par année
    @Query("SELECT e FROM Event e WHERE YEAR(e.date) = :year ORDER BY e.date DESC")
    List<Event> findByYear(@Param("year") int year);
}
