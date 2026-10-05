package com.galileo.learning.repository;

import com.galileo.learning.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByQuizIdAndUserId(Long quizId, Long userId);
    List<QuizAttempt> findByUserId(Long userId);
}
