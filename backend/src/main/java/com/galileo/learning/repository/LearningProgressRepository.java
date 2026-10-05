package com.galileo.learning.repository;

import com.galileo.learning.entity.LearningProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {
    List<LearningProgress> findByLearningPathIdAndUserId(Long learningPathId, Long userId);
}
