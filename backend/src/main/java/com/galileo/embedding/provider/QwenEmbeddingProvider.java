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
    private static final String PROVIDER_NAME = "qwen-cloud";
    private static final String MODEL_NAME = "text-embedding-v4";

    @Value("${galileo.ai.qwen.api-key:}")
    private String apiKey;

    @Value("${galileo.ai.qwen.base-url:https://dashscope.aliyuncs.com/compatible-mode/v1}")
    private String baseUrl;

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
        return MODEL_NAME;
    }

    @Override
    public int getDimension() {
        return DIMENSION;
    }

    @Override
    public float[] generateEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new float[DIMENSION];
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.debug("Clé Qwen API non configurée. Génération d'un vecteur neutre.");
            return new float[DIMENSION];
        }

        try {
            String url = baseUrl.replaceAll("/$", "") + "/embeddings";
            String jsonBody = objectMapper.writeValueAsString(new EmbeddingRequest(MODEL_NAME, text, DIMENSION));

            RequestBody body = RequestBody.create(jsonBody, MediaType.parse("application/json"));
            Request request = new Request.Builder()
                    .url(url)
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .post(body)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.warn("Erreur API Qwen Embedding (HTTP {})", response.code());
                    return new float[DIMENSION];
                }

                String responseBody = response.body() != null ? response.body().string() : "{}";
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode dataNode = root.path("data");
                if (dataNode.isArray() && !dataNode.isEmpty()) {
                    JsonNode embeddingNode = dataNode.get(0).path("embedding");
                    if (embeddingNode.isArray()) {
                        float[] result = new float[DIMENSION];
                        for (int i = 0; i < Math.min(embeddingNode.size(), DIMENSION); i++) {
                            result[i] = (float) embeddingNode.get(i).asDouble();
                        }
                        return result;
                    }
                }
            }
        } catch (IOException e) {
            log.warn("Impossible de contacter le fournisseur d'embeddings Qwen : {}", e.getMessage());
        }

        return new float[DIMENSION];
    }

    @Override
    public List<float[]> generateEmbeddings(List<String> texts) {
        List<float[]> embeddings = new ArrayList<>(texts.size());
        for (String text : texts) {
            embeddings.add(generateEmbedding(text));
        }
        return embeddings;
    }

    private record EmbeddingRequest(String model, String input, int dimensions) {}
}
