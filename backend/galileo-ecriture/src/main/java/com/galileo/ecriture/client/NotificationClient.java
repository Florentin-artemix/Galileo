package com.galileo.ecriture.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Client pour envoyer des notifications au service de notifications
 */
@Component
@Slf4j
public class NotificationClient {
    
    private final RestTemplate restTemplate;
    private final String notificationServiceUrl;
    
    public NotificationClient(
            @Value("${notification.service.url:http://notification:8084}") String notificationServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.notificationServiceUrl = notificationServiceUrl;
    }
    
    /**
     * Envoie une notification à un utilisateur
     */
    public void sendNotification(String userId, String type, String title, String message, Map<String, Object> data) {
        try {
            String url = notificationServiceUrl + "/api/notifications";
            
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("type", type);
            request.put("title", title);
            request.put("message", message);
            if (data != null) {
                request.put("data", data);
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            log.info("Notification envoyée avec succès à l'utilisateur {}: {}", userId, title);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification à {}: {}", userId, e.getMessage());
            // Ne pas faire échouer l'opération principale si la notification échoue
        }
    }
    
    /**
     * Envoie une notification de soumission approuvée
     */
    public void sendSubmissionApprovedNotification(String userId, Long submissionId, String submissionTitle) {
        Map<String, Object> data = new HashMap<>();
        data.put("submissionId", submissionId);
        data.put("submissionTitle", submissionTitle);
        
        sendNotification(
            userId,
            "SUBMISSION_VALIDATED",
            "Soumission approuvée",
            "Votre soumission \"" + submissionTitle + "\" a été approuvée et sera publiée prochainement.",
            data
        );
    }
    
    /**
     * Envoie une notification de soumission rejetée
     */
    public void sendSubmissionRejectedNotification(String userId, Long submissionId, String submissionTitle, String reason) {
        Map<String, Object> data = new HashMap<>();
        data.put("submissionId", submissionId);
        data.put("submissionTitle", submissionTitle);
        data.put("reason", reason);
        
        sendNotification(
            userId,
            "SUBMISSION_REJECTED",
            "Soumission rejetée",
            "Votre soumission \"" + submissionTitle + "\" a été rejetée. " + 
            (reason != null && !reason.isEmpty() ? "Raison: " + reason : ""),
            data
        );
    }
    
    /**
     * Envoie une notification de demande de révision
     */
    public void sendRevisionRequestedNotification(String userId, Long submissionId, String submissionTitle, String feedback) {
        Map<String, Object> data = new HashMap<>();
        data.put("submissionId", submissionId);
        data.put("submissionTitle", submissionTitle);
        data.put("feedback", feedback);
        
        sendNotification(
            userId,
            "SUBMISSION_RECEIVED",
            "Révision demandée",
            "Des révisions sont demandées pour votre soumission \"" + submissionTitle + "\".",
            data
        );
    }
}
