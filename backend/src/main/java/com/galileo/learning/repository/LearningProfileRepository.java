package com.galileo.learning.repository;

import com.galileo.auth.entity.User;
import com.galileo.learning.entity.LearningProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LearningProfileRepository extends JpaRepository<LearningProfile, Long> {
    Optional<LearningProfile> findByUser(User user);
    Optional<LearningProfile> findByUserId(Long userId);
}
