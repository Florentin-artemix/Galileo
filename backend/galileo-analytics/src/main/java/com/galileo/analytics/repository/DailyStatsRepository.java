package com.galileo.analytics.repository;

import com.galileo.analytics.entity.DailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyStatsRepository extends JpaRepository<DailyStats, Long> {
    
    Optional<DailyStats> findByStatDate(LocalDate statDate);
    
    List<DailyStats> findByStatDateBetweenOrderByStatDateAsc(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT SUM(ds.totalPageViews) FROM DailyStats ds WHERE ds.statDate >= :startDate AND ds.statDate <= :endDate")
    Long getTotalPageViewsInRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT SUM(ds.uniqueVisitors) FROM DailyStats ds WHERE ds.statDate >= :startDate AND ds.statDate <= :endDate")
    Long getTotalUniqueVisitorsInRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT AVG(ds.bounceRate) FROM DailyStats ds WHERE ds.statDate >= :startDate AND ds.statDate <= :endDate")
    Double getAvgBounceRateInRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}

