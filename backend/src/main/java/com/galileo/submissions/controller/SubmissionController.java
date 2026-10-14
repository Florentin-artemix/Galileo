package com.galileo.submissions.controller;

import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.dto.ApiResponse;
import com.galileo.submissions.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/soumissions", "/api/submissions"})
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, Object>> submitPublication(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("fichierPdf") MultipartFile fichierPdf,
            @RequestParam("titre") String titre,
            @RequestParam("resume") String resume,
            @RequestParam(value = "auteurPrincipal", required = false) String auteurPrincipal,
            @RequestParam(value = "emailAuteur", required = false) String emailAuteur,
            @RequestParam(value = "coAuteurs", required = false) List<String> coAuteurs,
            @RequestParam(value = "motsCles", required = false) List<String> motsCles,
            @RequestParam(value = "domaineRecherche", required = false) String domaineRecherche,
            @RequestParam(value = "notes", required = false) String notes
    ) {
        Long userId = userDetails.getId();
        Map<String, Object> result = submissionService.createSubmission(
                userId,
                fichierPdf,
                titre,
                resume,
                auteurPrincipal,
                emailAuteur,
                coAuteurs,
                motsCles,
                domaineRecherche,
                notes
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMySubmissions(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(submissionService.getMySubmissions(userDetails.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSubmissionById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isAdminOrStaff = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
        return ResponseEntity.ok(submissionService.getSubmissionById(id, userDetails.getId(), isAdminOrStaff));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubmission(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        submissionService.deleteSubmission(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Soumission retirée avec succès"));
    }
}
