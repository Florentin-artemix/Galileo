package com.galileo.recommendations.repository;

import com.galileo.recommendations.entity.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, Long> {
    List<ReadingHistory> findByUserIdOrderByReadAtDesc(Long userId);
    Page<ReadingHistory> findByUserIdOrderByReadAtDesc(Long userId, Pageable pageable);
    Optional<ReadingHistory> findFirstByUserIdAndPublicationIdOrderByReadAtDesc(Long userId, Long publicationId);

    default Optional<ReadingHistory> findByUserIdAndPublicationId(Long userId, Long publicationId) {
        return findFirstByUserIdAndPublicationIdOrderByReadAtDesc(userId, publicationId);
    }

    long countByUserId(Long userId);
}
