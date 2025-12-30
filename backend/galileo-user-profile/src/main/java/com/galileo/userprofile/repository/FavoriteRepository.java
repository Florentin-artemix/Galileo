package com.galileo.userprofile.repository;

import com.galileo.userprofile.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    
    List<Favorite> findByFirebaseUidOrderByCreatedAtDesc(String firebaseUid);
    
    Page<Favorite> findByFirebaseUid(String firebaseUid, Pageable pageable);
    
    Optional<Favorite> findByFirebaseUidAndPublicationId(String firebaseUid, Long publicationId);
    
    boolean existsByFirebaseUidAndPublicationId(String firebaseUid, Long publicationId);
    
    void deleteByFirebaseUidAndPublicationId(String firebaseUid, Long publicationId);
    
    long countByFirebaseUid(String firebaseUid);
}

