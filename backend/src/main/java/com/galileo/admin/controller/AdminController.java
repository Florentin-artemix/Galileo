package com.galileo.admin.controller;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.dto.ApiResponse;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.submissions.entity.SubmissionStatus;
import com.galileo.submissions.service.SubmissionService;
import com.galileo.users.entity.UserProfile;
import com.galileo.users.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SubmissionService submissionService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final com.galileo.admin.service.AdminService adminService;

    // ==========================================
    // MODÉRATION DES SOUMISSIONS (STAFF & ADMIN)
    // ==========================================

    @GetMapping("/soumissions/en-attente")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getPendingSubmissions() {
        return ResponseEntity.ok(submissionService.getPendingSubmissions());
    }

    @GetMapping("/soumissions")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getSubmissionsByStatus(
            @RequestParam(required = false) String statut
    ) {
        SubmissionStatus status = null;
        if (statut != null && !statut.trim().isEmpty()) {
            try {
                status = SubmissionStatus.valueOf(statut.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Si nom français
                if ("EN_ATTENTE".equalsIgnoreCase(statut)) status = SubmissionStatus.PENDING;
                else if ("ACCEPTEE".equalsIgnoreCase(statut)) status = SubmissionStatus.ACCEPTED;
                else if ("REJETEE".equalsIgnoreCase(statut)) status = SubmissionStatus.REJECTED;
            }
        }
        return ResponseEntity.ok(submissionService.getSubmissionsByStatus(status));
    }

    @GetMapping("/soumissions/statistiques")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Number>> getSubmissionStats() {
        return ResponseEntity.ok(submissionService.getStatistics());
    }

    @PostMapping("/soumissions/{id}/valider")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> validateSubmission(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String commentaire = body != null ? body.get("commentaire") : null;
        return ResponseEntity.ok(submissionService.validateSubmission(id, userDetails.getId(), commentaire));
    }

    @PostMapping("/soumissions/{id}/rejeter")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> rejectSubmission(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String commentaire = body != null ? body.get("commentaire") : null;
        return ResponseEntity.ok(submissionService.rejectSubmission(id, userDetails.getId(), commentaire));
    }

    @PostMapping("/soumissions/{id}/demander-revisions")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> requestRevision(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String commentaire = body != null ? body.get("commentaire") : "Révisions requises";
        return ResponseEntity.ok(submissionService.requestRevision(id, userDetails.getId(), commentaire));
    }

    @PutMapping("/soumissions/{id}/statut")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String statut = body.get("statut");
        if ("ACCEPTEE".equalsIgnoreCase(statut) || "ACCEPTED".equalsIgnoreCase(statut)) {
            return ResponseEntity.ok(submissionService.validateSubmission(id, userDetails.getId(), body.get("commentaire")));
        } else if ("REJETEE".equalsIgnoreCase(statut) || "REJECTED".equalsIgnoreCase(statut)) {
            return ResponseEntity.ok(submissionService.rejectSubmission(id, userDetails.getId(), body.get("commentaire")));
        } else {
            return ResponseEntity.ok(submissionService.requestRevision(id, userDetails.getId(), body.get("commentaire")));
        }
    }

    // ==========================================
    // GESTION DES UTILISATEURS (ADMIN ONLY)
    // ==========================================

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (User u : users) {
            UserProfile profile = userProfileRepository.findByUserId(u.getId()).orElse(null);
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("uid", String.valueOf(u.getId()));
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            map.put("disabled", u.getIsActive() != null && !u.getIsActive());
            map.put("isActive", u.getIsActive());
            map.put("creationTime", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            map.put("lastSignInTime", u.getUpdatedAt() != null ? u.getUpdatedAt().toString() : "");
            map.put("displayName", profile != null ? profile.getDisplayName() : u.getEmail().split("@")[0]);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable String id) {
        Long userId = Long.parseLong(id);
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        UserProfile profile = userProfileRepository.findByUserId(u.getId()).orElse(null);

        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("uid", String.valueOf(u.getId()));
        map.put("email", u.getEmail());
        map.put("role", u.getRole().name());
        map.put("disabled", u.getIsActive() != null && !u.getIsActive());
        map.put("isActive", u.getIsActive());
        map.put("creationTime", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
        map.put("displayName", profile != null ? profile.getDisplayName() : u.getEmail().split("@")[0]);

        return ResponseEntity.ok(map);
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        Long targetUserId = Long.parseLong(id);
        String roleStr = body.get("role");
        if (roleStr == null) {
            throw new BadRequestException("Rôle obligatoire");
        }

        Role newRole;
        try {
            newRole = Role.valueOf(roleStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Rôle invalide : " + roleStr);
        }

        // Empêcher l'administrateur de s'auto-rétrograder
        if (currentUser.getId().equals(targetUserId) && newRole != Role.ADMIN) {
            throw new ForbiddenException("Vous ne pouvez pas révoquer vos propres privilèges d'administrateur");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", targetUserId));

        targetUser.setRole(newRole);
        userRepository.save(targetUser);

        return ResponseEntity.ok(ApiResponse.ok("Rôle mis à jour avec succès vers " + newRole.name()));
    }

    @PutMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> body
    ) {
        Long targetUserId = Long.parseLong(id);
        boolean isActive = body.getOrDefault("isActive", true);
        adminService.toggleUserStatus(targetUserId, isActive);
        return ResponseEntity.ok(ApiResponse.ok("Statut du compte mis à jour (actif=" + isActive + ")"));
    }

    // ==========================================
    // STATISTIQUES GLOBALES & OBSERVABILITÉ
    // ==========================================

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<com.galileo.admin.dto.AdminStatsDTO> getStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }

    // ==========================================
    // GESTION DES DOMAINES ACADÉMIQUES
    // ==========================================

    @GetMapping("/domains")
    public ResponseEntity<List<com.galileo.publications.entity.Domain>> listDomains() {
        return ResponseEntity.ok(adminService.listDomains());
    }

    @PostMapping("/domains")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.galileo.publications.entity.Domain> createDomain(@RequestBody com.galileo.publications.entity.Domain domain) {
        return ResponseEntity.ok(adminService.createDomain(domain));
    }

    @PutMapping("/domains/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.galileo.publications.entity.Domain> updateDomain(
            @PathVariable Long id,
            @RequestBody com.galileo.publications.entity.Domain domain
    ) {
        return ResponseEntity.ok(adminService.updateDomain(id, domain));
    }

    @DeleteMapping("/domains/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteDomain(@PathVariable Long id) {
        adminService.deleteDomain(id);
        return ResponseEntity.ok(ApiResponse.ok("Domaine supprimé avec succès"));
    }

    // ==========================================
    // GESTION DES QUOTAS IA
    // ==========================================

    @GetMapping("/quotas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAiQuotas() {
        return ResponseEntity.ok(adminService.getAiQuotas());
    }

    @PutMapping("/quotas")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateAiQuotas(@RequestBody Map<String, Object> quotas) {
        adminService.updateAiQuotas(quotas);
        return ResponseEntity.ok(adminService.getAiQuotas());
    }
}
