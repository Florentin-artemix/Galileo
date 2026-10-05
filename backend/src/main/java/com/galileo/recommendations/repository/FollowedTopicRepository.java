package com.galileo.recommendations.repository;

import com.galileo.recommendations.entity.FollowedTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowedTopicRepository extends JpaRepository<FollowedTopic, Long> {
    List<FollowedTopic> findByUserId(Long userId);
    Optional<FollowedTopic> findByUserIdAndTopic(Long userId, String topic);
    void deleteByUserIdAndTopic(Long userId, String topic);
}
