package com.galileo.ai;

import com.galileo.ai.service.DeepSeekAIService;
import com.galileo.embedding.provider.EmbeddingProviderUnavailableException;
import com.galileo.embedding.provider.QwenEmbeddingProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class AIServiceTest {

    @Test
    @DisplayName("QwenEmbeddingProvider should declare 1024 dimensions and reject missing API key with EmbeddingProviderUnavailableException")
    void testQwenEmbeddingProviderWithoutKey() {
        QwenEmbeddingProvider provider = new QwenEmbeddingProvider();
        ReflectionTestUtils.setField(provider, "apiKey", "");
        ReflectionTestUtils.setField(provider, "baseUrl", "https://dashscope.aliyuncs.com/compatible-mode/v1");

        assertEquals(1024, provider.getDimension());
        assertEquals("text-embedding-v4", provider.getModelName());
        assertEquals("qwen-cloud", provider.getProviderName());
        assertFalse(provider.isConfigured());

        assertThrows(EmbeddingProviderUnavailableException.class, () ->
                provider.generateEmbedding("Introduction à l'intelligence artificielle")
        );
    }

    @Test
    @DisplayName("DeepSeekAIService should return graceful notice when API key is not configured")
    void testDeepSeekAIServiceWithoutKey() {
        DeepSeekAIService deepSeek = new DeepSeekAIService();
        ReflectionTestUtils.setField(deepSeek, "apiKey", "");

        assertFalse(deepSeek.isConfigured());

        String response = deepSeek.askDocumentAssistant("Prompt système", "Question utilisateur");
        assertNotNull(response);
        assertTrue(response.contains("n'est pas encore configuré") || response.contains("absente"));
    }
}
