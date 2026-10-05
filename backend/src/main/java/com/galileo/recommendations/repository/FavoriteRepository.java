package com.galileo.recommendations.repository;

import com.galileo.recommendations.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Page<Favorite> findByUserId(Long userId, Pageable pageable);
    Optional<Favorite> findByUserIdAndPublicationId(Long userId, Long publicationId);
    boolean existsByUserIdAndPublicationId(Long userId, Long publicationId);
    void deleteByUserIdAndPublicationId(Long userId, Long publicationId);
}
