package com.galileo.learning.repository;

import com.galileo.learning.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByPublicationId(Long publicationId);
    List<Quiz> findByUserId(Long userId);
}
