package com.galileo.lecture.repository;

import com.galileo.lecture.entity.Evenement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EvenementRepository extends JpaRepository<Evenement, Long> {

    List<Evenement> findByPublieTrue();
    
    @Query("SELECT e FROM Evenement e WHERE e.publie = true AND e.dateDebut >= :now ORDER BY e.dateDebut ASC")
    List<Evenement> findEvenementsAVenir(LocalDateTime now);
    
    @Query("SELECT e FROM Evenement e WHERE e.publie = true AND (e.dateFin < :now OR (e.dateFin IS NULL AND e.dateDebut < :now)) ORDER BY e.dateDebut DESC")
    List<Evenement> findEvenementsPasses(LocalDateTime now);
    
    List<Evenement> findByTypeAndPublieTrue(String type);
}
