package com.galileo.recommendations.repository;

import com.galileo.recommendations.entity.FollowedAuthor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowedAuthorRepository extends JpaRepository<FollowedAuthor, Long> {
    List<FollowedAuthor> findByUserId(Long userId);
    Optional<FollowedAuthor> findByUserIdAndFollowedUserId(Long userId, Long followedUserId);
    void deleteByUserIdAndFollowedUserId(Long userId, Long followedUserId);
}
