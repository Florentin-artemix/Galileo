package com.galileo.ai.controller;

import com.galileo.ai.dto.*;
import com.galileo.ai.entity.AIMode;
import com.galileo.ai.service.AIService;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.dto.ApiResponse;
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
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(
            @Valid @RequestBody AIChatRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(aiService.chat(request, userDetails));
    }

    @PostMapping("/summarize")
    public ResponseEntity<AISummaryResponse> summarize(
            @Valid @RequestBody AISummaryRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(aiService.summarize(request, userDetails));
    }

    @PostMapping("/explain")
    public ResponseEntity<Map<String, String>> explain(
            @Valid @RequestBody AIExplainRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String explanation = aiService.explainPassage(request, userDetails);
        return ResponseEntity.ok(Map.of("explanation", explanation));
    }

    @PostMapping("/compare")
    public ResponseEntity<Map<String, String>> compare(
            @Valid @RequestBody AICompareRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String comparison = aiService.comparePublications(request, userDetails);
        return ResponseEntity.ok(Map.of("comparison", comparison));
    }

    @GetMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AIConversationDTO>> getConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(aiService.getUserConversations(userDetails.getId()));
    }

    @PostMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AIConversationDTO> createConversation(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long publicationId = body.get("publicationId") != null ? Long.parseLong(body.get("publicationId").toString()) : null;
        String modeStr = (String) body.get("mode");
        AIMode mode = modeStr != null ? AIMode.valueOf(modeStr.toUpperCase()) : AIMode.GENERAL;
        String title = (String) body.get("title");

        AIConversationDTO conv = aiService.createConversation(userDetails.getId(), publicationId, mode, title);
        return ResponseEntity.status(HttpStatus.CREATED).body(conv);
    }

    @GetMapping("/conversations/{id}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AIMessageDTO>> getConversationMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(aiService.getConversationMessages(id, userDetails.getId()));
    }

    @DeleteMapping("/conversations/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        aiService.deleteConversation(id, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Conversation supprimée"));
    }
}
