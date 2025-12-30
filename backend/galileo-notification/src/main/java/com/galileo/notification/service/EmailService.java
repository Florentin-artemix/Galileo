package com.galileo.notification.service;

import com.galileo.notification.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${notification.email.enabled:false}")
    private boolean emailEnabled;
    
    @Value("${notification.email.from:noreply@galileo-revue.com}")
    private String fromEmail;
    
    public void sendNotificationEmail(String to, Notification notification) {
        if (!emailEnabled) {
            log.info("Envoi d'email désactivé. Email non envoyé à {}", to);
            return;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("[Galileo] " + notification.getTitle());
            message.setText(buildEmailBody(notification));
            
            mailSender.send(message);
            log.info("Email de notification envoyé à {}", to);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage());
            throw e;
        }
    }
    
    public void sendWelcomeEmail(String to, String displayName) {
        if (!emailEnabled) {
            log.info("Envoi d'email désactivé. Email de bienvenue non envoyé à {}", to);
            return;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("[Galileo] Bienvenue sur Galileo !");
            message.setText(buildWelcomeEmailBody(displayName));
            
            mailSender.send(message);
            log.info("Email de bienvenue envoyé à {}", to);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de bienvenue à {}: {}", to, e.getMessage());
        }
    }
    
    private String buildEmailBody(Notification notification) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bonjour,\n\n");
        sb.append(notification.getMessage());
        sb.append("\n\n");
        sb.append("---\n");
        sb.append("Cet email a été envoyé automatiquement par Galileo.\n");
        sb.append("Pour gérer vos préférences de notification, rendez-vous sur votre profil.\n");
        return sb.toString();
    }
    
    private String buildWelcomeEmailBody(String displayName) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bonjour").append(displayName != null ? " " + displayName : "").append(",\n\n");
        sb.append("Bienvenue sur Galileo, la revue scientifique étudiante !\n\n");
        sb.append("Vous pouvez maintenant :\n");
        sb.append("- Parcourir nos publications scientifiques\n");
        sb.append("- Ajouter des articles à vos favoris\n");
        sb.append("- Soumettre vos propres travaux de recherche\n\n");
        sb.append("Nous sommes ravis de vous compter parmi nous !\n\n");
        sb.append("L'équipe Galileo\n");
        sb.append("---\n");
        sb.append("Cet email a été envoyé automatiquement.\n");
        return sb.toString();
    }
}

