package com.galileo.ecriture.controller;

import com.galileo.ecriture.entity.AuditLog;
import com.galileo.ecriture.security.Role;
import com.galileo.ecriture.repository.AuditLogRepository;
import com.galileo.ecriture.security.Permission;
import com.galileo.ecriture.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Contrôleur pour consulter les logs d'audit (ADMIN uniquement)
 */
@RestController
@RequestMapping("/admin/audit")
@RequiredArgsConstructor
@Slf4j
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final RoleGuard roleGuard;

    /**
     * Récupère les derniers logs d'audit (100 les plus récents)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<AuditLog>> getRecentLogs(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestParam(defaultValue = "50") int limit) {
        log.info("Récupération des logs d'audit récents (limit={})", limit);
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.VIEW_AUDIT_LOGS);
        
        List<AuditLog> logs = auditLogRepository.findTop100ByOrderByCreatedAtDesc();
        
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère tous les logs avec pagination et filtres
     */
    @GetMapping
    public ResponseEntity<Page<AuditLog>> getLogs(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        log.info("Récupération des logs d'audit avec filtres");
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.VIEW_AUDIT_LOGS);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Page<AuditLog> logs;
        
        if (userEmail != null && !userEmail.isEmpty()) {
            logs = auditLogRepository.findByUserEmail(userEmail, pageable);
        } else if (action != null && !action.isEmpty()) {
            logs = auditLogRepository.findByAction(action, pageable);
        } else if (resourceType != null && !resourceType.isEmpty()) {
            logs = auditLogRepository.findByResourceType(resourceType, pageable);
        } else if (startDate != null && endDate != null) {
            logs = auditLogRepository.findByCreatedAtBetween(startDate, endDate, pageable);
        } else {
            logs = auditLogRepository.findAll(pageable);
        }
        
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère un log spécifique par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<AuditLog> getLogById(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader) {
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.VIEW_AUDIT_LOGS);
        
        AuditLog auditLog = auditLogRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Log non trouvé"));
        
        return ResponseEntity.ok(auditLog);
    }

    /**
     * Récupère les logs d'un utilisateur spécifique
     */
    @GetMapping("/user/{email}")
    public ResponseEntity<Page<AuditLog>> getLogsByUser(
            @PathVariable String email,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.VIEW_AUDIT_LOGS);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AuditLog> logs = auditLogRepository.findByUserEmail(email, pageable);
        
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère les statistiques d'audit
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getAuditStats(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "VIEWER") String roleHeader,
            @RequestParam(defaultValue = "week") String period) {
        
        log.info("Récupération des statistiques d'audit pour la période: {}", period);
        
        Role role = roleGuard.resolveRole(roleHeader);
        roleGuard.requirePermission(role, Permission.VIEW_AUDIT_LOGS);
        
        LocalDateTime startDate = switch (period) {
            case "day" -> LocalDateTime.now().minusDays(1);
            case "month" -> LocalDateTime.now().minusMonths(1);
            default -> LocalDateTime.now().minusWeeks(1);
        };
        
        List<AuditLog> logs = auditLogRepository.findByCreatedAtAfter(startDate);
        
        long totalActions = logs.size();
        
        var actionsByType = logs.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        AuditLog::getAction,
                        java.util.stream.Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> java.util.Map.of(
                        "action", entry.getKey(),
                        "count", entry.getValue()
                ))
                .toList();
        
        var actionsByUser = logs.stream()
                .filter(auditLog -> auditLog.getUserEmail() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        AuditLog::getUserEmail,
                        java.util.stream.Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> java.util.Map.of(
                        "userId", entry.getKey(),
                        "userName", entry.getKey(),
                        "count", entry.getValue()
                ))
                .toList();
        
        var actionsByDay = logs.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        auditLog -> auditLog.getCreatedAt().toLocalDate().toString(),
                        java.util.stream.Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> java.util.Map.of(
                        "date", entry.getKey(),
                        "count", entry.getValue()
                ))
                .toList();
        
        double failureRate = 0.0;
        
        var stats = java.util.Map.of(
                "totalActions", totalActions,
                "actionsByType", actionsByType,
                "actionsByUser", actionsByUser,
                "actionsByDay", actionsByDay,
                "failureRate", failureRate
        );
        
        return ResponseEntity.ok(stats);
    }
}
