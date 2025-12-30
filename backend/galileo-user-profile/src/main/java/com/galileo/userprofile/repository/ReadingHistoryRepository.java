package com.galileo.userprofile.repository;

import com.galileo.userprofile.entity.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, Long> {
    
    List<ReadingHistory> findByFirebaseUidOrderByReadAtDesc(String firebaseUid);
    
    Page<ReadingHistory> findByFirebaseUid(String firebaseUid, Pageable pageable);
    
    Optional<ReadingHistory> findFirstByFirebaseUidAndPublicationIdOrderByReadAtDesc(
            String firebaseUid, Long publicationId);
    
    @Query("SELECT rh FROM ReadingHistory rh WHERE rh.firebaseUid = :uid AND rh.readAt >= :since ORDER BY rh.readAt DESC")
    List<ReadingHistory> findRecentHistory(@Param("uid") String firebaseUid, @Param("since") LocalDateTime since);
    
    @Query("SELECT COUNT(DISTINCT rh.publicationId) FROM ReadingHistory rh WHERE rh.firebaseUid = :uid")
    long countDistinctPublicationsRead(@Param("uid") String firebaseUid);
    
    @Query("SELECT SUM(rh.readingDurationSeconds) FROM ReadingHistory rh WHERE rh.firebaseUid = :uid")
    Long getTotalReadingTime(@Param("uid") String firebaseUid);
}

