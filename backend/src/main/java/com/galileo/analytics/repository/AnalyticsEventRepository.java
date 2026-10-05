package com.galileo.analytics.repository;

import com.galileo.analytics.entity.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {
    List<AnalyticsEvent> findByEventTypeAndCreatedAtBetween(String eventType, LocalDateTime start, LocalDateTime end);
    long countByPublicationIdAndEventType(Long publicationId, String eventType);
    long countByUserId(Long userId);
}
