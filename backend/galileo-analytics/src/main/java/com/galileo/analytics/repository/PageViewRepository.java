package com.galileo.analytics.repository;

import com.galileo.analytics.entity.PageView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PageViewRepository extends JpaRepository<PageView, Long> {
    
    List<PageView> findByPagePathOrderByViewedAtDesc(String pagePath);
    
    List<PageView> findByUserIdOrderByViewedAtDesc(String userId);
    
    @Query("SELECT COUNT(pv) FROM PageView pv WHERE pv.viewedAt >= :since")
    long countViewsSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(DISTINCT pv.sessionId) FROM PageView pv WHERE pv.viewedAt >= :since")
    long countUniqueVisitorsSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT pv.pagePath, COUNT(pv) as viewCount FROM PageView pv " +
           "WHERE pv.viewedAt >= :since GROUP BY pv.pagePath ORDER BY viewCount DESC")
    List<Object[]> findTopPagesSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(pv) FROM PageView pv WHERE pv.pagePath LIKE :pathPattern AND pv.viewedAt >= :since")
    long countViewsByPathPatternSince(@Param("pathPattern") String pathPattern, @Param("since") LocalDateTime since);
    
    @Query("SELECT pv.country, COUNT(pv) FROM PageView pv WHERE pv.viewedAt >= :since AND pv.country IS NOT NULL " +
           "GROUP BY pv.country ORDER BY COUNT(pv) DESC")
    List<Object[]> findViewsByCountrySince(@Param("since") LocalDateTime since);
    
    @Query("SELECT pv.deviceType, COUNT(pv) FROM PageView pv WHERE pv.viewedAt >= :since AND pv.deviceType IS NOT NULL " +
           "GROUP BY pv.deviceType")
    List<Object[]> findViewsByDeviceTypeSince(@Param("since") LocalDateTime since);
}

