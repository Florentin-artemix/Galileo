package com.galileo.embedding.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class QwenEmbeddingProvider implements EmbeddingProvider {

    private static final int DIMENSION = 1024;
    private static final String PROVIDER_NAME = "openrouter";

    @Value("${galileo.ai.openrouter.api-key:}")
    private String apiKey;

    @Value("${galileo.ai.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    @Value("${galileo.ai.openrouter.embedding-model:nvidia/nemotron-3.5-embed-1b:free}")
    private String model;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public String getModelName() {
        return model;
    }

    @Override
    public int getDimension() {
        return DIMENSION;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    @Override
    public float[] generateEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Le texte à vectoriser ne peut pas être vide");
        }

        if (!isConfigured()) {
            throw new EmbeddingProviderUnavailableException("Fournisseur OpenRouter non configuré : variable OPENROUTER_API_KEY absente.");
        }

        try {
            String url = baseUrl.replaceAll("/$", "") + "/embeddings";
            return requestEmbeddings(url, List.of(text.trim())).get(0);
        } catch (IOException e) {
            log.warn("Impossible de contacter le fournisseur d'embeddings OpenRouter : {}", e.getMessage());
            throw new EmbeddingProviderUnavailableException("Impossible de contacter le fournisseur OpenRouter : " + e.getMessage(), e);
        }
    }

    @Override
    public List<float[]> generateEmbeddings(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }
        if (!isConfigured()) {
            throw new EmbeddingProviderUnavailableException("Fournisseur OpenRouter non configuré : variable OPENROUTER_API_KEY absente.");
        }
        List<String> inputs = texts.stream().map(text -> {
            if (text == null || text.trim().isEmpty()) {
                throw new IllegalArgumentException("Le texte à vectoriser ne peut pas être vide");
            }
            return text.trim();
        }).toList();
        try {
            return requestEmbeddings(baseUrl.replaceAll("/$", "") + "/embeddings", inputs);
        } catch (IOException e) {
            throw new EmbeddingProviderUnavailableException("Impossible de contacter le fournisseur OpenRouter : " + e.getMessage(), e);
        }
    }

    private List<float[]> requestEmbeddings(String url, List<String> inputs) throws IOException {
        String jsonBody = objectMapper.writeValueAsString(new EmbeddingRequest(model, inputs));
        Request request = new Request.Builder().url(url)
                .header("Authorization", "Bearer " + apiKey.trim())
                .post(RequestBody.create(jsonBody, MediaType.parse("application/json"))).build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new EmbeddingProviderUnavailableException("Erreur API OpenRouter Embedding (HTTP " + response.code() + ")");
            }
            JsonNode data = objectMapper.readTree(response.body() != null ? response.body().string() : "{}").path("data");
            if (!data.isArray() || data.size() != inputs.size()) {
                throw new EmbeddingProviderUnavailableException("Réponse OpenRouter invalide ou incomplète");
            }
            List<float[]> results = new ArrayList<>(inputs.size());
            for (JsonNode item : data) {
                JsonNode vector = item.path("embedding");
                if (!vector.isArray() || vector.size() < DIMENSION) {
                    throw new EmbeddingProviderUnavailableException("Dimension OpenRouter inattendue : au moins " + DIMENSION + " requises");
                }
                float[] embedding = new float[DIMENSION];
                for (int i = 0; i < DIMENSION; i++) embedding[i] = (float) vector.get(i).asDouble();
                results.add(embedding);
            }
            return results;
        }
    }

    private record EmbeddingRequest(String model, List<String> input) {}
}
