package com.galileo.ai.repository;

import com.galileo.ai.entity.PublicationSummaryCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PublicationSummaryCacheRepository extends JpaRepository<PublicationSummaryCache, Long> {
    Optional<PublicationSummaryCache> findByPublicationIdAndSummaryType(Long publicationId, String summaryType);
    void deleteByPublicationId(Long publicationId);
}
