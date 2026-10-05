package com.galileo.publications.repository;

import com.galileo.publications.entity.PublicationAuthor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicationAuthorRepository extends JpaRepository<PublicationAuthor, Long> {
    List<PublicationAuthor> findByPublicationIdOrderByPositionAsc(Long publicationId);
    List<PublicationAuthor> findByUserId(Long userId);
}
