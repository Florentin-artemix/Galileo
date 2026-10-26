package com.galileo.learning.controller;

import com.galileo.auth.security.CustomUserDetails;
import com.galileo.learning.dto.LearningDTOs.*;
import com.galileo.learning.service.LearningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    // ==========================================
    // QUIZZES
    // ==========================================

    @PostMapping("/quizzes/generate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<QuizDTO> generateQuiz(
            @Valid @RequestBody QuizGenerateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        QuizDTO result = learningService.generateQuiz(request, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/quizzes/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<QuizDTO> getQuiz(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(learningService.getQuiz(id, userDetails.getId()));
    }

    @GetMapping("/quizzes/publication/{publicationId}")
    public ResponseEntity<List<QuizDTO>> getQuizzesForPublication(@PathVariable Long publicationId) {
        return ResponseEntity.ok(learningService.getQuizzesForPublication(publicationId));
    }

    @GetMapping("/quizzes/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<QuizDTO>> getMyQuizzes(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(learningService.getMyQuizzes(userDetails.getId()));
    }

    @PostMapping("/quizzes/{id}/attempt")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<QuizResultDTO> submitQuizAttempt(
            @PathVariable Long id,
            @RequestBody QuizSubmitRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(learningService.submitQuizAttempt(id, request, userDetails.getId()));
    }

    // ==========================================
    // PARCOURS D'APPRENTISSAGE (LEARNING PATHS)
    // ==========================================

    @PostMapping("/paths/generate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LearningPathDTO> generateLearningPath(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String topic = body.get("topic");
        LearningPathDTO path = learningService.generateLearningPath(topic, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(path);
    }

    @GetMapping("/paths")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LearningPathDTO>> getUserLearningPaths(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(learningService.getUserLearningPaths(userDetails.getId()));
    }

    @GetMapping("/paths/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LearningPathDTO> getLearningPath(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(learningService.getLearningPath(id, userDetails.getId()));
    }

    @PostMapping("/paths/{id}/step")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LearningPathDTO> updateStepProgress(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        int stepIndex = ((Number) body.get("stepIndex")).intValue();
        boolean completed = Boolean.TRUE.equals(body.get("completed"));
        return ResponseEntity.ok(learningService.updateStepProgress(id, stepIndex, completed, userDetails.getId()));
    }

    // ==========================================
    // PROFIL D'APPRENTISSAGE
    // ==========================================

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LearningProfileDTO> getLearningProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(learningService.getUserLearningProfile(userDetails.getId()));
    }
}
