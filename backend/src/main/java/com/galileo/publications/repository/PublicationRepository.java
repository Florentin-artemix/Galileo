package com.galileo.publications.repository;

import com.galileo.publications.entity.AccessLevel;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PublicationRepository extends JpaRepository<Publication, Long> {
    Optional<Publication> findBySlug(String slug);
    Page<Publication> findByStatusAndAccessLevel(PublicationStatus status, AccessLevel accessLevel, Pageable pageable);
    Page<Publication> findByDomainIdAndStatus(Long domainId, PublicationStatus status, Pageable pageable);
}
