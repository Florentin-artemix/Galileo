package com.galileo.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    /**
     * Interroge l'assistant DeepSeek pour analyser un document ou répondre à une question académique
     */
    public String askDocumentAssistant(String systemPrompt, String userMessage) {
        if (!isConfigured()) {
            return "L'assistant IA DeepSeek n'est pas encore configuré sur cette instance (clé API absente).";
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
                    "temperature", 0.3,
                    "max_tokens", 2048
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
                    return "Le service d'assistance IA est temporairement indisponible (erreur " + response.code() + ").";
                }

                String responseBody = response.body() != null ? response.body().string() : "{}";
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    return choices.get(0).path("message").path("content").asText();
                }
            }
        } catch (IOException e) {
            log.error("Erreur de communication avec DeepSeek API : {}", e.getMessage());
            return "Une erreur réseau est survenue lors de la communication avec l'assistant IA.";
        }

        return "Aucune réponse reçue de l'assistant IA.";
    }
}
