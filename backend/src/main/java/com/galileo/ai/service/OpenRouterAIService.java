package com.galileo.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Fournisseur secondaire d'intelligence artificielle utilisant OpenRouter
 * via l'API compatible OpenAI (/chat/completions).
 */
@Slf4j
@Service
public class OpenRouterAIService {

    @Value("${galileo.ai.openrouter.api-key:}")
    private String apiKey = "";

    @Value("${galileo.ai.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl = "https://openrouter.ai/api/v1";

    @Value("${galileo.ai.openrouter.chat-model:anthropic/claude-3.5-sonnet}")
    private String model = "anthropic/claude-3.5-sonnet";

    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OpenRouterAIService() {
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(90, TimeUnit.SECONDS)
                .callTimeout(120, TimeUnit.SECONDS)
                .build();
    }

    public OpenRouterAIService(OkHttpClient httpClient) {
        this.httpClient = httpClient;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    public String getModel() {
        return model;
    }

    public String getProviderName() {
        return "openrouter";
    }

    public ClaudeAIService.ClaudeResult generateText(String systemPrompt, String userMessage, double temperature, int maxTokens) {
        return generateTextWithHistory(systemPrompt, List.of(AIChatTurn.user(userMessage)), temperature, maxTokens);
    }

    public ClaudeAIService.ClaudeResult generateTextWithHistory(String systemPrompt, List<AIChatTurn> history, double temperature, int maxTokens) {
        if (!isConfigured()) {
            return ClaudeAIService.ClaudeResult.builder()
                    .content("Le service de secours OpenRouter n'est pas configuré (clé API absente).")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error("OPENROUTER_API_KEY_MISSING")
                    .provider("openrouter")
                    .model(model)
                    .fallbackUsed(true)
                    .build();
        }

        try {
            String normalizedBaseUrl = baseUrl != null ? baseUrl.replaceAll("/+$", "") : "https://openrouter.ai/api/v1";
            String url = normalizedBaseUrl.endsWith("/chat/completions")
                    ? normalizedBaseUrl
                    : normalizedBaseUrl + "/chat/completions";

            List<Map<String, String>> providerMessages = new ArrayList<>();
            providerMessages.add(Map.of(
                    "role", "system",
                    "content", systemPrompt != null ? systemPrompt : "Tu es un assistant scientifique expert de la plateforme académique Galileo."
            ));
            history.stream()
                    .map(message -> Map.of("role", message.role(), "content", message.content()))
                    .forEach(providerMessages::add);
            Map<String, Object> requestMap = Map.of(
                    "model", model,
                    "messages", providerMessages,
                    "temperature", temperature,
                    "max_tokens", maxTokens
            );

            String requestBody = objectMapper.writeValueAsString(requestMap);
            Request request = new Request.Builder()
                    .url(url)
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .header("HTTP-Referer", "https://galileo.mapon.cd")
                    .header("X-Title", "Galileo Academic Platform")
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                int code = response.code();
                String responseBody = response.body() != null ? response.body().string() : "{}";

                if (!response.isSuccessful()) {
                    log.warn("Erreur API OpenRouter : HTTP {}", code);
                    String errorDetail = "HTTP_" + code;
                    try {
                        JsonNode errNode = objectMapper.readTree(responseBody);
                        if (errNode.has("error")) {
                            errorDetail = errNode.path("error").path("message").asText(errorDetail);
                        }
                    } catch (Exception ignored) {}

                    return ClaudeAIService.ClaudeResult.builder()
                            .content("Le service de secours OpenRouter est temporairement indisponible (erreur HTTP " + code + ").")
                            .inputTokens(0)
                            .outputTokens(0)
                            .success(false)
                            .httpStatus(code)
                            .error("HTTP_" + code + ": " + errorDetail)
                            .provider("openrouter")
                            .model(model)
                            .fallbackUsed(true)
                            .build();
                }

                JsonNode root = objectMapper.readTree(responseBody);
                String actualModel = root.path("model").asText(model);
                JsonNode choices = root.path("choices");
                String content = "";
                if (choices.isArray() && choices.size() > 0) {
                    content = choices.get(0).path("message").path("content").asText("");
                }

                JsonNode usage = root.path("usage");
                int inputTokens = usage.path("prompt_tokens").asInt(0);
                int outputTokens = usage.path("completion_tokens").asInt(0);

                return ClaudeAIService.ClaudeResult.builder()
                        .content(content)
                        .inputTokens(inputTokens)
                        .outputTokens(outputTokens)
                        .success(true)
                        .provider("openrouter")
                        .model(actualModel)
                        .fallbackUsed(true)
                        .build();
            }
        } catch (SocketTimeoutException e) {
            log.error("Timeout de communication avec OpenRouter : {}", e.getMessage());
            return ClaudeAIService.ClaudeResult.builder()
                    .content("Délai de réponse dépassé avec le service de secours OpenRouter.")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error("TIMEOUT: " + e.getMessage())
                    .provider("openrouter")
                    .model(model)
                    .fallbackUsed(true)
                    .build();
        } catch (IOException e) {
            log.error("Erreur de communication avec l'API OpenRouter : {}", e.getMessage());
            return ClaudeAIService.ClaudeResult.builder()
                    .content("Une erreur réseau est survenue lors de la communication avec le service OpenRouter.")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error("NETWORK_ERROR: " + e.getMessage())
                    .provider("openrouter")
                    .model(model)
                    .fallbackUsed(true)
                    .build();
        }
    }

    public String extractTextFromPdfImages(List<String> base64JpegPages, String documentTitle) {
        if (!isConfigured() || base64JpegPages == null || base64JpegPages.isEmpty()) {
            return "";
        }
        try {
            String normalizedBaseUrl = baseUrl != null ? baseUrl.replaceAll("/+$", "") : "https://openrouter.ai/api/v1";
            String url = normalizedBaseUrl.endsWith("/chat/completions")
                    ? normalizedBaseUrl
                    : normalizedBaseUrl + "/chat/completions";

            List<Map<String, Object>> contentParts = new ArrayList<>();
            for (int i = 0; i < base64JpegPages.size(); i++) {
                contentParts.add(Map.of(
                        "type", "text",
                        "text", " Image de la Page " + (i + 1) + " :"
                ));
                contentParts.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of("url", "data:image/jpeg;base64," + base64JpegPages.get(i))
                ));
            }
            contentParts.add(Map.of(
                    "type", "text",
                    "text", "Transcris fidèlement et intégralement tout le texte visible sur chacune de ces pages/diapositives du document PDF « "
                            + documentTitle + " ». Formate obligatoirement chaque page avec l'en-tête exact [Page X] suivi de tout son texte."
            ));

            List<Map<String, Object>> messages = List.of(
                    Map.of("role", "system", "content", "Tu es un système d'extraction documentaire académique haute précision pour Galileo."),
                    Map.of("role", "user", "content", contentParts)
            );
            Map<String, Object> requestMap = Map.of(
                    "model", model,
                    "messages", messages,
                    "temperature", 0.1,
                    "max_tokens", 4000
            );

            String requestBody = objectMapper.writeValueAsString(requestMap);
            Request request = new Request.Builder()
                    .url(url)
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .header("HTTP-Referer", "https://galileo.mapon.cd")
                    .header("X-Title", "Galileo Academic Platform")
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) {
                    return "";
                }
                JsonNode root = objectMapper.readTree(response.body().string());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && choices.size() > 0) {
                    return choices.get(0).path("message").path("content").asText("").trim();
                }
            }
        } catch (Exception e) {
            log.warn("Impossible de transcrire les images du PDF via OpenRouter : {}", e.getMessage());
        }
        return "";
    }
}
