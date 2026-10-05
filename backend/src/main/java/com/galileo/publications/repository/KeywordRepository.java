package com.galileo.publications.repository;

import com.galileo.publications.entity.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KeywordRepository extends JpaRepository<Keyword, Long> {
    Optional<Keyword> findByLabel(String label);
    Optional<Keyword> findBySlug(String slug);
}
