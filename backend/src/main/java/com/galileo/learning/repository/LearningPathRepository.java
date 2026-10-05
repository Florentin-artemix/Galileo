package com.galileo.learning.repository;

import com.galileo.learning.entity.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, Long> {
    List<LearningPath> findByUserIdAndIsActiveTrue(Long userId);
    List<LearningPath> findByUserId(Long userId);
}
