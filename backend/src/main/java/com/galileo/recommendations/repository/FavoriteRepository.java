package com.galileo.recommendations.repository;

import com.galileo.recommendations.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    Page<Favorite> findByUserId(Long userId, Pageable pageable);
    Optional<Favorite> findByUserIdAndPublicationId(Long userId, Long publicationId);
    boolean existsByUserIdAndPublicationId(Long userId, Long publicationId);
    void deleteByUserIdAndPublicationId(Long userId, Long publicationId);
    long countByUserId(Long userId);
}
