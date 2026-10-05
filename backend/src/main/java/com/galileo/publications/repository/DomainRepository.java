package com.galileo.publications.repository;

import com.galileo.publications.entity.Domain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DomainRepository extends JpaRepository<Domain, Long> {
    Optional<Domain> findBySlug(String slug);
    List<Domain> findByParentIsNull();
    List<Domain> findByParentId(Long parentId);
}
