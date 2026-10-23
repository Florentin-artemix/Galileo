package com.galileo.analytics.repository;

import com.galileo.analytics.entity.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {
    List<AnalyticsEvent> findByEventTypeAndCreatedAtBetween(String eventType, LocalDateTime start, LocalDateTime end);
    long countByEventTypeAndCreatedAtAfter(String eventType, LocalDateTime date);
    long countByEventTypeAndCreatedAtBetween(String eventType, LocalDateTime start, LocalDateTime end);
    long countByPublicationIdAndEventType(Long publicationId, String eventType);
    long countByPublicationIdAndEventTypeAndCreatedAtAfter(Long publicationId, String eventType, LocalDateTime date);
    long countByUserId(Long userId);

    @Query("SELECT COUNT(DISTINCT e.user.id) FROM AnalyticsEvent e WHERE e.publication.id = :publicationId AND e.user IS NOT NULL")
    Long countDistinctUserIdByPublicationId(@Param("publicationId") Long publicationId);
}
