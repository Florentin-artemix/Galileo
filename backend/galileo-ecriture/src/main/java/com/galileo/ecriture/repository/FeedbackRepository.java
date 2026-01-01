package com.galileo.ecriture.repository;

import com.galileo.ecriture.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findBySoumissionId(Long soumissionId);
    List<Feedback> findBySoumissionIdAndInternalFalse(Long soumissionId);
}
