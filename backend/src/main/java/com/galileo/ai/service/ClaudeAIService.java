package com.galileo.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class ClaudeAIService {

    @Value("${galileo.ai.claude.api-key:}")
    private String apiKey;

    @Value("${galileo.ai.claude.base-url:https://api.anthropic.com}")
    private String baseUrl;

    @Value("${galileo.ai.claude.model:claude-sonnet-5}")
    private String model;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClaudeResult {
        private String content;
        private int inputTokens;
        private int outputTokens;
        private boolean success;
        private String error;
    }

    public ClaudeResult generateText(String systemPrompt, String userMessage, double temperature, int maxTokens) {
        if (!isConfigured()) {
            return ClaudeResult.builder()
                    .content("L'assistant IA Claude n'est pas encore configuré sur cette instance (clé API absente).")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error("API_KEY_MISSING")
                    .build();
        }

        try {
            String normalizedBaseUrl = baseUrl.replaceAll("/+$", "");
            String url = normalizedBaseUrl.endsWith("/v1")
                    ? normalizedBaseUrl + "/messages"
                    : normalizedBaseUrl + "/v1/messages";

            Map<String, Object> requestMap = Map.of(
                    "model", model,
                    "system", systemPrompt != null ? systemPrompt : "Tu es un assistant scientifique expert de la plateforme académique Galileo.",
                    "messages", List.of(Map.of("role", "user", "content", userMessage)),
                    "temperature", temperature,
                    "max_tokens", maxTokens
            );

            String requestBody = objectMapper.writeValueAsString(requestMap);
            Request request = new Request.Builder()
                    .url(url)
                    .header("x-api-key", apiKey.trim())
                    .header("anthropic-version", "2023-06-01")
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.warn("Erreur API Claude : HTTP {}", response.code());
                    return ClaudeResult.builder()
                            .content("Le service d'assistance IA est temporairement indisponible (erreur HTTP " + response.code() + ").")
                            .inputTokens(0)
                            .outputTokens(0)
                            .success(false)
                            .error("HTTP_" + response.code())
                            .build();
                }

                String responseBody = response.body() != null ? response.body().string() : "{}";
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode contentBlocks = root.path("content");
                String content = "";
                if (contentBlocks.isArray()) {
                    for (JsonNode block : contentBlocks) {
                        if ("text".equals(block.path("type").asText())) {
                            content += block.path("text").asText();
                        }
                    }
                }

                JsonNode usage = root.path("usage");
                int inputTokens = usage.path("input_tokens").asInt(userMessage.length() / 4);
                int outputTokens = usage.path("output_tokens").asInt(content.length() / 4);

                return ClaudeResult.builder()
                        .content(content)
                        .inputTokens(inputTokens)
                        .outputTokens(outputTokens)
                        .success(true)
                        .build();
            }
        } catch (IOException e) {
            log.error("Erreur de communication avec l'API Claude : {}", e.getMessage());
            return ClaudeResult.builder()
                    .content("Une erreur réseau est survenue lors de la communication avec l'assistant IA.")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    public String askDocumentAssistant(String systemPrompt, String userMessage) {
        return generateText(systemPrompt, userMessage, 0.3, 2048).getContent();
    }
}
