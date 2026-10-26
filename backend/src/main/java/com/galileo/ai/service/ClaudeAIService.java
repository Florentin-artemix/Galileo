package com.galileo.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class ClaudeAIService {

    @Value("${galileo.ai.claude.api-key:}")
    private String apiKey = "";

    @Value("${galileo.ai.claude.base-url:https://api.bedrock.com.de}")
    private String baseUrl = "https://api.bedrock.com.de";

    @Value("${galileo.ai.claude.model:claude-sonnet-5}")
    private String model = "claude-sonnet-5";

    private final OpenRouterAIService openRouterAIService;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public ClaudeAIService(@Autowired(required = false) OpenRouterAIService openRouterAIService) {
        this.openRouterAIService = openRouterAIService;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(25, TimeUnit.SECONDS)
                .callTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    public ClaudeAIService(OpenRouterAIService openRouterAIService, OkHttpClient httpClient) {
        this.openRouterAIService = openRouterAIService;
        this.httpClient = httpClient;
    }

    public ClaudeAIService() {
        this(null);
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    public String getModel() {
        return model;
    }

    public String getProviderName() {
        return "claude";
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
        private Integer httpStatus;
        @Builder.Default
        private String provider = "claude";
        private String model;
        private boolean fallbackUsed;

        public boolean isRecoverableError() {
            if (success) {
                return false;
            }
            if (httpStatus != null) {
                return httpStatus >= 500 || httpStatus == 429 || httpStatus == 408;
            }
            return true; // Erreurs réseau, timeouts
        }
    }

    public ClaudeResult generateText(String systemPrompt, String userMessage, double temperature, int maxTokens) {
        return generateTextInternal(systemPrompt, List.of(AIChatTurn.user(userMessage)), userMessage, temperature, maxTokens, false);
    }

    public ClaudeResult generateTextWithHistory(String systemPrompt, List<AIChatTurn> messages, double temperature, int maxTokens) {
        return generateTextInternal(systemPrompt, messages, null, temperature, maxTokens, true);
    }

    private ClaudeResult generateTextInternal(String systemPrompt, List<AIChatTurn> messages, String singleUserMessage,
                                              double temperature, int maxTokens, boolean useHistory) {
        // 1. Si la clé primaire est absente, basculer directement sur OpenRouter si disponible
        if (!isConfigured()) {
            if (openRouterAIService != null && openRouterAIService.isConfigured()) {
                log.info("Clé Claude non configurée. Bascule directe sur le fournisseur de secours OpenRouter");
                return useHistory
                        ? openRouterAIService.generateTextWithHistory(systemPrompt, messages, temperature, maxTokens)
                        : openRouterAIService.generateText(systemPrompt, singleUserMessage, temperature, maxTokens);
            }
            return ClaudeResult.builder()
                    .content("L'assistant IA Claude n'est pas encore configuré sur cette instance (clé API absente).")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error("API_KEY_MISSING")
                    .provider("claude")
                    .model(model)
                    .fallbackUsed(false)
                    .build();
        }

        // 2. Appel au fournisseur primaire (Claude)
        ClaudeResult primaryResult = callClaude(systemPrompt, messages, temperature, maxTokens);

        if (primaryResult.isSuccess()) {
            return primaryResult;
        }

        // 3. Politique de bascule en cas d'échec récupérable
        if (primaryResult.isRecoverableError()) {
            if (openRouterAIService != null && openRouterAIService.isConfigured()) {
                log.warn("Échec du fournisseur primaire Claude ({}), déclenchement du fallback vers OpenRouter", primaryResult.getError());
                ClaudeResult fallbackResult = useHistory
                        ? openRouterAIService.generateTextWithHistory(systemPrompt, messages, temperature, maxTokens)
                        : openRouterAIService.generateText(systemPrompt, singleUserMessage, temperature, maxTokens);
                if (fallbackResult.isSuccess()) {
                    log.info("Bascule OpenRouter réussie avec le modèle {}", fallbackResult.getModel());
                    return fallbackResult;
                }
                log.error("Échec des deux fournisseurs IA (Claude: {}, OpenRouter: {})", primaryResult.getError(), fallbackResult.getError());
                return ClaudeResult.builder()
                        .content("Les services d'assistance IA (Claude et OpenRouter) sont temporairement indisponibles.")
                        .inputTokens(0)
                        .outputTokens(0)
                        .success(false)
                        .httpStatus(primaryResult.getHttpStatus() != null ? primaryResult.getHttpStatus() : 503)
                        .error("ALL_PROVIDERS_FAILED: Claude=[" + primaryResult.getError() + "], OpenRouter=[" + fallbackResult.getError() + "]")
                        .provider("openrouter")
                        .model(fallbackResult.getModel())
                        .fallbackUsed(true)
                        .build();
            } else {
                log.warn("Échec récupérable de Claude ({}), mais OpenRouter n'est pas disponible ou configuré", primaryResult.getError());
            }
        } else {
            log.warn("Erreur non récupérable pour Claude (HTTP {}). Aucun fallback déclenché.", primaryResult.getHttpStatus());
        }

        return primaryResult;
    }

    private ClaudeResult callClaude(String systemPrompt, List<AIChatTurn> messages, double temperature, int maxTokens) {
        try {
            String normalizedBaseUrl = baseUrl != null ? baseUrl.replaceAll("/+$", "") : "https://api.bedrock.com.de";
            String url;
            if (normalizedBaseUrl.endsWith("/v1/messages")) {
                url = normalizedBaseUrl;
            } else if (normalizedBaseUrl.endsWith("/v1")) {
                url = normalizedBaseUrl + "/messages";
            } else {
                url = normalizedBaseUrl + "/v1/messages";
            }

            List<Map<String, String>> providerMessages = messages.stream()
                    .map(message -> Map.of("role", message.role(), "content", message.content()))
                    .toList();
            Map<String, Object> requestMap = Map.of(
                    "model", model,
                    "system", systemPrompt != null ? systemPrompt : "Tu es un assistant scientifique expert de la plateforme académique Galileo.",
                    "messages", providerMessages,
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
                int code = response.code();
                String responseBody = response.body() != null ? response.body().string() : "{}";

                if (!response.isSuccessful()) {
                    log.warn("Erreur API Claude : HTTP {}", code);
                    String errorDetail = "HTTP_" + code;
                    try {
                        JsonNode errNode = objectMapper.readTree(responseBody);
                        if (errNode.has("error")) {
                            errorDetail = errNode.path("error").path("message").asText(errorDetail);
                        }
                    } catch (Exception ignored) {}

                    return ClaudeResult.builder()
                            .content("Le service d'assistance IA est temporairement indisponible (erreur HTTP " + code + ").")
                            .inputTokens(0)
                            .outputTokens(0)
                            .success(false)
                            .httpStatus(code)
                            .error("HTTP_" + code + ": " + errorDetail)
                            .provider("claude")
                            .model(model)
                            .fallbackUsed(false)
                            .build();
                }

                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode contentBlocks = root.path("content");
                StringBuilder content = new StringBuilder();
                if (contentBlocks.isArray()) {
                    for (JsonNode block : contentBlocks) {
                        if ("text".equals(block.path("type").asText())) {
                            content.append(block.path("text").asText());
                        }
                    }
                }

                JsonNode usage = root.path("usage");
                int inputTokens = usage.path("input_tokens").asInt(0);
                int outputTokens = usage.path("output_tokens").asInt(0);

                return ClaudeResult.builder()
                        .content(content.toString())
                        .inputTokens(inputTokens)
                        .outputTokens(outputTokens)
                        .success(true)
                        .provider("claude")
                        .model(model)
                        .fallbackUsed(false)
                        .build();
            }
        } catch (SocketTimeoutException e) {
            log.error("Timeout de communication avec l'API Claude : {}", e.getMessage());
            return ClaudeResult.builder()
                    .content("Délai de réponse dépassé avec le service d'assistance IA.")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error("TIMEOUT: " + e.getMessage())
                    .provider("claude")
                    .model(model)
                    .fallbackUsed(false)
                    .build();
        } catch (IOException e) {
            log.error("Erreur de communication avec l'API Claude : {}", e.getMessage());
            return ClaudeResult.builder()
                    .content("Une erreur réseau est survenue lors de la communication avec l'assistant IA.")
                    .inputTokens(0)
                    .outputTokens(0)
                    .success(false)
                    .error("NETWORK_ERROR: " + e.getMessage())
                    .provider("claude")
                    .model(model)
                    .fallbackUsed(false)
                    .build();
        }
    }

    public String askDocumentAssistant(String systemPrompt, String userMessage) {
        return generateText(systemPrompt, userMessage, 0.3, 2048).getContent();
    }
}
