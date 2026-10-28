package com.galileo;

import com.galileo.auth.dto.AuthResponse;
import com.galileo.auth.dto.RegisterRequest;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.auth.service.AuthService;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.submissions.service.SubmissionService;
import com.galileo.users.entity.UserProfile;
import com.galileo.users.repository.UserProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EndToEndRoleLifecycleH2Test {

    @Autowired
    private AuthService authService;

    @Autowired
    private SubmissionService submissionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PublicationRepository publicationRepository;

    private MockMultipartFile createValidPdf(String filename) {
        String minimalPdf = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";
        return new MockMultipartFile(
                "fichierPdf",
                filename,
                "application/pdf",
                minimalPdf.getBytes(StandardCharsets.UTF_8)
        );
    }

    @Test
    @DisplayName("Cycle complet H2 : Inscription (VIEWER, STUDENT, STAFF, ADMIN) -> Soumission PDF -> Révision -> Validation/Rejet")
    void fullLifecycleFromRegistrationToAdminValidationAcrossRoles() {
        // 1. Inscription d'un VIEWER : conserve le rôle VIEWER
        RegisterRequest viewerReq = RegisterRequest.builder()
                .email("viewer.h2@mapon.cd")
                .password("Password123!")
                .role(Role.VIEWER)
                .displayName("Lecteur Externe")
                .program("Consultation")
                .motivation("Lecture scientifique")
                .build();
        AuthResponse viewerAuth = authService.register(viewerReq);
        assertEquals(Role.VIEWER, viewerAuth.getRole());

        // 2. Inscription publique tentant d'usurper ADMIN : ramenée automatiquement à STUDENT + profil sauvegardé
        RegisterRequest studentReq = RegisterRequest.builder()
                .email("etudiant.h2@mapon.cd")
                .password("Password123!")
                .role(Role.ADMIN)
                .displayName("Jean Kabuya")
                .program("Génie Informatique")
                .motivation("Partager mes travaux de recherche en systèmes d'exploitation")
                .build();
        AuthResponse studentAuth = authService.register(studentReq);
        assertEquals(Role.STUDENT, studentAuth.getRole());

        UserProfile studentProfile = userProfileRepository.findByUserId(studentAuth.getUserId()).orElseThrow();
        assertEquals("Jean Kabuya", studentProfile.getDisplayName());
        assertEquals("Génie Informatique", studentProfile.getProgram());
        assertEquals("Partager mes travaux de recherche en systèmes d'exploitation", studentProfile.getBio());

        // 3. Création des comptes STAFF et ADMIN
        User staffUser = userRepository.save(User.builder()
                .email("staff.h2@mapon.cd")
                .passwordHash("hashed")
                .role(Role.STAFF)
                .isActive(true)
                .build());
        User adminUser = userRepository.save(User.builder()
                .email("admin.h2@mapon.cd")
                .passwordHash("hashed")
                .role(Role.ADMIN)
                .isActive(true)
                .build());

        // 4. Soumission d'un fichier PDF par l'étudiant (auto-initialisation du domaine sur H2 vierge)
        Map<String, Object> created = submissionService.createSubmission(
                studentAuth.getUserId(),
                createValidPdf("systemes_exploitation.pdf"),
                "Architecture et Ordonnancement des Processus UNIX",
                "Étude approfondie de l'ordonnancement préemptif, des appels systèmes fork/execve et de la gestion mémoire virtuelle sous UNIX et Linux pour les architectures multi-cœurs modernes. Cette recherche analyse les compromis de latence et de consommation énergétique dans les systèmes d'exploitation embarqués temps réel.",
                "Jean Kabuya",
                "jean.kabuya@mapon.cd",
                List.of("Prof. Hugues Delalin"),
                List.of("UNIX", "Processus", "Ordonnancement"),
                "genie-informatique",
                "Faculté Polytechnique - Université Mapon"
        );

        Long submissionId = ((Number) created.get("id")).longValue();
        Long publicationId = ((Number) created.get("publicationId")).longValue();
        assertNotNull(submissionId);
        assertNotNull(created.get("urlPdf"));

        // 5. Vérification de la visibilité dans la file d'attente Admin/Staff (même en statut UNDER_REVIEW)
        List<Map<String, Object>> pendingQueue = submissionService.getPendingSubmissions();
        assertTrue(pendingQueue.stream().anyMatch(s -> submissionId.equals(((Number) s.get("id")).longValue())),
                "La soumission doit rester visible dans la file de modération Admin/Staff après analyse PDF");

        // 6. Un étudiant ne peut pas valider sa propre soumission
        assertThrows(ForbiddenException.class, () ->
                submissionService.validateSubmission(submissionId, studentAuth.getUserId(), "Auto-validation interdite")
        );

        // 7. Le STAFF demande une révision
        Map<String, Object> inRevision = submissionService.requestRevision(
                submissionId,
                staffUser.getId(),
                "Veuillez préciser la complexité algorithmique de l'ordonnanceur à la section 3."
        );
        assertEquals("UNDER_REVIEW", inRevision.get("statut"));

        // 8. Le rejet sans motif doit échouer avec BadRequestException
        assertThrows(BadRequestException.class, () ->
                submissionService.rejectSubmission(submissionId, adminUser.getId(), "   ")
        );

        // 9. Validation finale par l'ADMIN -> publication passe à PUBLISHED
        Map<String, Object> validated = submissionService.validateSubmission(
                submissionId,
                adminUser.getId(),
                "Conforme aux normes académiques, publication autorisée."
        );
        assertEquals("ACCEPTED", validated.get("statut"));

        Publication published = publicationRepository.findById(publicationId).orElseThrow();
        assertEquals(PublicationStatus.PUBLISHED, published.getStatus());
        assertNotNull(published.getPublishedAt());
    }
}
