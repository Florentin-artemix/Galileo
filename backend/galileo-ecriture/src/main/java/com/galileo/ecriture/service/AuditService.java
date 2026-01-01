package com.galileo.ecriture.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.ecriture.entity.AuditLog;
import com.galileo.ecriture.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * Service pour logger les actions administratives dans la base de données
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    /**
     * Log une action avec les détails de la requête
     */
    public void logAction(HttpServletRequest request, String action, String resourceType, 
                         String resourceId, Map<String, Object> details) {
        
        String userEmail = (String) request.getAttribute("userEmail");
        String userRole = request.getAttribute("userRole") != null ? 
            request.getAttribute("userRole").toString() : "UNKNOWN";
        
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        String detailsJson = null;
        if (details != null && !details.isEmpty()) {
            try {
                detailsJson = objectMapper.writeValueAsString(details);
            } catch (JsonProcessingException e) {
                log.error("Erreur lors de la conversion des détails en JSON", e);
                detailsJson = details.toString();
            }
        }
        
        AuditLog auditLog = AuditLog.builder()
            .userEmail(userEmail)
            .userRole(userRole)
            .action(action)
            .resourceType(resourceType)
            .resourceId(resourceId)
            .details(detailsJson)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .build();
        
        auditLogRepository.save(auditLog);
        
        log.info("Action auditée: {} sur {} [{}] par {}", action, resourceType, resourceId, userEmail);
    }

    /**
     * Log une action simple sans détails supplémentaires
     */
    public void logAction(HttpServletRequest request, String action, String resourceType, String resourceId) {
        logAction(request, action, resourceType, resourceId, null);
    }

    /**
     * Log une action de création
     */
    public void logCreate(HttpServletRequest request, String resourceType, String resourceId, Object resource) {
        Map<String, Object> details = new HashMap<>();
        details.put("resource", resource);
        logAction(request, "CREATE", resourceType, resourceId, details);
    }

    /**
     * Log une action de mise à jour
     */
    public void logUpdate(HttpServletRequest request, String resourceType, String resourceId, 
                         Object oldValue, Object newValue) {
        Map<String, Object> details = new HashMap<>();
        details.put("oldValue", oldValue);
        details.put("newValue", newValue);
        logAction(request, "UPDATE", resourceType, resourceId, details);
    }

    /**
     * Log une action de suppression
     */
    public void logDelete(HttpServletRequest request, String resourceType, String resourceId, Object resource) {
        Map<String, Object> details = new HashMap<>();
        details.put("deletedResource", resource);
        logAction(request, "DELETE", resourceType, resourceId, details);
    }

    /**
     * Récupère l'adresse IP réelle du client (même derrière un proxy)
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}
