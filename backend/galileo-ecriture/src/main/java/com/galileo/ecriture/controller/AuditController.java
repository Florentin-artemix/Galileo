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

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Contrôleur pour consulter les logs d'audit (ADMIN uniquement)
 */
@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@Slf4j
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final RoleGuard roleGuard;

    /**
     * Récupère les derniers logs d'audit (100 les plus récents)
     */
    @GetMapping("/recent")
    public ResponseEntity<List<AuditLog>> getRecentLogs(HttpServletRequest request) {
        log.info("Récupération des logs d'audit récents");
        
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.VIEW_AUDIT_LOGS);
        
        List<AuditLog> logs = auditLogRepository.findTop100ByOrderByCreatedAtDesc();
        
        return ResponseEntity.ok(logs);
    }

    /**
     * Récupère tous les logs avec pagination et filtres
     */
    @GetMapping
    public ResponseEntity<Page<AuditLog>> getLogs(
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {
        
        log.info("Récupération des logs d'audit avec filtres");
        
        Role role = (Role) request.getAttribute("userRole");
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
    public ResponseEntity<AuditLog> getLogById(@PathVariable Long id, HttpServletRequest request) {
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.VIEW_AUDIT_LOGS);
        
        AuditLog log = auditLogRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Log non trouvé"));
        
        return ResponseEntity.ok(log);
    }

    /**
     * Récupère les logs d'un utilisateur spécifique
     */
    @GetMapping("/user/{email}")
    public ResponseEntity<Page<AuditLog>> getLogsByUser(
            @PathVariable String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {
        
        Role role = (Role) request.getAttribute("userRole");
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
            @RequestParam(defaultValue = "week") String period,
            HttpServletRequest request) {
        
        log.info("Récupération des statistiques d'audit pour la période: {}", period);
        
        Role role = (Role) request.getAttribute("userRole");
        roleGuard.requirePermission(role, Permission.VIEW_AUDIT_LOGS);
        
        LocalDateTime startDate = switch (period) {
            case "day" -> LocalDateTime.now().minusDays(1);
            case "month" -> LocalDateTime.now().minusMonths(1);
            default -> LocalDateTime.now().minusWeeks(1);
        };
        
        List<AuditLog> logs = auditLogRepository.findByCreatedAtAfter(startDate);
        
        // Statistiques basiques
        long totalActions = logs.size();
        
        // Actions par type
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
        
        // Actions par utilisateur
        var actionsByUser = logs.stream()
                .filter(log -> log.getUserEmail() != null)
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
        
        // Actions par jour
        var actionsByDay = logs.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        log -> log.getCreatedAt().toLocalDate().toString(),
                        java.util.stream.Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> java.util.Map.of(
                        "date", entry.getKey(),
                        "count", entry.getValue()
                ))
                .toList();
        
        // Taux d'échec (exemple simplifié)
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
