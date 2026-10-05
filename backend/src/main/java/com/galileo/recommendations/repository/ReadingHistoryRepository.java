package com.galileo.recommendations.repository;

import com.galileo.recommendations.entity.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, Long> {
    Page<ReadingHistory> findByUserIdOrderByReadAtDesc(Long userId, Pageable pageable);
    Optional<ReadingHistory> findByUserIdAndPublicationId(Long userId, Long publicationId);
}
