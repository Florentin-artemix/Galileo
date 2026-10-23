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
public class DeepSeekAIService {

    @Value("${galileo.ai.deepseek.api-key:}")
    private String apiKey;

    @Value("${galileo.ai.deepseek.base-url:https://api.deepseek.com/v1}")
    private String baseUrl;

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
    public static class DeepSeekResult {
        private String content;
        private int inputTokens;
        private int outputTokens;
        private boolean success;
        private String error;
    }

    public DeepSeekResult generateText(String systemPrompt, String userMessage, double temperature, int maxTokens) {
        if (!isConfigured()) {
            return DeepSeekResult.builder()
                    .content("L'assistant IA DeepSeek n'est pas encore configuré sur cette instance (clé API absente).")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error("API_KEY_MISSING")
                    .build();
        }

        try {
            String url = baseUrl.replaceAll("/$", "") + "/chat/completions";

            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", systemPrompt != null ? systemPrompt : "Tu es un assistant scientifique expert de la plateforme académique Galileo."),
                    Map.of("role", "user", "content", userMessage)
            );

            Map<String, Object> requestMap = Map.of(
                    "model", "deepseek-chat",
                    "messages", messages,
                    "temperature", temperature,
                    "max_tokens", maxTokens
            );

            String requestBody = objectMapper.writeValueAsString(requestMap);

            Request request = new Request.Builder()
                    .url(url)
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.warn("Erreur API DeepSeek : HTTP {}", response.code());
                    return DeepSeekResult.builder()
                            .content("Le service d'assistance IA est temporairement indisponible (erreur HTTP " + response.code() + ").")
                            .inputTokens(0)
                            .outputTokens(0)
                            .success(false)
                            .error("HTTP_" + response.code())
                            .build();
                }

                String responseBody = response.body() != null ? response.body().string() : "{}";
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode choices = root.path("choices");
                String content = "";
                if (choices.isArray() && !choices.isEmpty()) {
                    content = choices.get(0).path("message").path("content").asText();
                }

                JsonNode usage = root.path("usage");
                int promptTokens = usage.path("prompt_tokens").asInt(userMessage.length() / 4);
                int completionTokens = usage.path("completion_tokens").asInt(content.length() / 4);

                return DeepSeekResult.builder()
                        .content(content)
                        .inputTokens(promptTokens)
                        .outputTokens(completionTokens)
                        .success(true)
                        .build();
            }
        } catch (IOException e) {
            log.error("Erreur de communication avec DeepSeek API : {}", e.getMessage());
            return DeepSeekResult.builder()
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
