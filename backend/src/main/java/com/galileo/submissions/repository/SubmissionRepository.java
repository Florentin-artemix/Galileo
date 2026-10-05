package com.galileo.submissions.repository;

import com.galileo.submissions.entity.Submission;
import com.galileo.submissions.entity.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Page<Submission> findByStatus(SubmissionStatus status, Pageable pageable);
    List<Submission> findBySubmittedById(Long userId);
    List<Submission> findByPublicationId(Long publicationId);
}
