package com.galileo.analytics.repository;

import com.galileo.analytics.entity.PublicationStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PublicationStatsRepository extends JpaRepository<PublicationStats, Long> {
    
    Optional<PublicationStats> findByPublicationIdAndStatDate(Long publicationId, LocalDate statDate);
    
    List<PublicationStats> findByPublicationIdOrderByStatDateDesc(Long publicationId);
    
    List<PublicationStats> findByStatDateOrderByViewsCountDesc(LocalDate statDate);
    
    @Query("SELECT ps FROM PublicationStats ps WHERE ps.statDate >= :startDate AND ps.statDate <= :endDate " +
           "ORDER BY ps.viewsCount DESC")
    List<PublicationStats> findTopPublicationsInRange(@Param("startDate") LocalDate startDate, 
                                                       @Param("endDate") LocalDate endDate);
    
    @Query("SELECT SUM(ps.viewsCount) FROM PublicationStats ps WHERE ps.publicationId = :publicationId")
    Long getTotalViewsForPublication(@Param("publicationId") Long publicationId);
    
    @Query("SELECT SUM(ps.downloadsCount) FROM PublicationStats ps WHERE ps.publicationId = :publicationId")
    Long getTotalDownloadsForPublication(@Param("publicationId") Long publicationId);
}

