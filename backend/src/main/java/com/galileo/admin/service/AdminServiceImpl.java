package com.galileo.admin.service;

import com.galileo.admin.dto.AdminStatsDTO;
import com.galileo.admin.dto.AdminUserDTO;
import com.galileo.ai.repository.AIInteractionRepository;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.publications.entity.Domain;
import com.galileo.publications.repository.DomainRepository;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.submissions.entity.SubmissionStatus;
import com.galileo.submissions.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final PublicationRepository publicationRepository;
    private final SubmissionRepository submissionRepository;
    private final DocumentRepository documentRepository;
    private final AIInteractionRepository aiInteractionRepository;
    private final DomainRepository domainRepository;

    private final Map<String, Object> aiQuotas = new ConcurrentHashMap<>(Map.of(
            "maxDailyRequestsPerUser", 100,
            "maxTokensPerRequest", 4096,
            "embeddingDimensions", 1024,
            "qwenEmbeddingEnabled", true,
            "deepSeekEnabled", true,
            "rateLimitPerMinute", 20
    ));

    @Override
    @Transactional(readOnly = true)
    public AdminStatsDTO getPlatformStats() {
        return AdminStatsDTO.builder()
                .totalUsers(userRepository.count())
                .totalPublications(publicationRepository.count())
                .totalSubmissions(submissionRepository.count())
                .pendingSubmissions(submissionRepository.countByStatus(SubmissionStatus.PENDING))
                .totalDocuments(documentRepository.count())
                .totalAIInteractions(aiInteractionRepository.count())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserDTO> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(u -> AdminUserDTO.builder()
                .id(u.getId())
                .email(u.getEmail())
                .role(u.getRole())
                .isActive(u.getIsActive())
                .emailVerified(u.getEmailVerified())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build());
    }

    @Override
    @Transactional
    public void updateUserRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        user.setRole(role);
        userRepository.save(user);
        log.info("Role mis à jour pour l'utilisateur {} vers {}", userId, role);
    }

    @Override
    @Transactional
    public void toggleUserStatus(Long userId, boolean isActive) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        user.setIsActive(isActive);
        userRepository.save(user);
        log.info("Statut du compte utilisateur {} modifié vers isActive={}", userId, isActive);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Domain> listDomains() {
        return domainRepository.findAll();
    }

    @Override
    @Transactional
    public Domain createDomain(Domain domain) {
        if (domain.getName() == null || domain.getName().trim().isEmpty()) {
            throw new BadRequestException("Le nom du domaine est obligatoire");
        }
        if (domain.getSlug() == null || domain.getSlug().trim().isEmpty()) {
            domain.setSlug(slugify(domain.getName()));
        }
        return domainRepository.save(domain);
    }

    @Override
    @Transactional
    public Domain updateDomain(Long id, Domain domainDetails) {
        Domain domain = domainRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Domaine", "id", id));
        if (domainDetails.getName() != null) domain.setName(domainDetails.getName());
        if (domainDetails.getDescription() != null) domain.setDescription(domainDetails.getDescription());
        if (domainDetails.getSlug() != null) domain.setSlug(domainDetails.getSlug());
        if (domainDetails.getParent() != null) domain.setParent(domainDetails.getParent());
        return domainRepository.save(domain);
    }

    @Override
    @Transactional
    public void deleteDomain(Long id) {
        domainRepository.deleteById(id);
    }

    @Override
    public Map<String, Object> getAiQuotas() {
        return new HashMap<>(aiQuotas);
    }

    @Override
    public void updateAiQuotas(Map<String, Object> quotas) {
        if (quotas != null) {
            aiQuotas.putAll(quotas);
            log.info("Quotas IA mis à jour par l'administrateur : {}", quotas);
        }
    }

    private String slugify(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
