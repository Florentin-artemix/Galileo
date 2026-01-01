package com.galileo.ecriture.repository;

import com.galileo.ecriture.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUserEmail(String userEmail, Pageable pageable);
    Page<AuditLog> findByAction(String action, Pageable pageable);
    Page<AuditLog> findByResourceType(String resourceType, Pageable pageable);
    Page<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
}
