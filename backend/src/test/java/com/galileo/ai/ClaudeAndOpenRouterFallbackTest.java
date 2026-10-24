package com.galileo.ai;

import com.galileo.ai.service.ClaudeAIService;
import com.galileo.ai.service.OpenRouterAIService;
import okhttp3.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.SocketTimeoutException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaudeAndOpenRouterFallbackTest {

    @Mock
    private OkHttpClient mockClaudeHttpClient;

    @Mock
    private Call mockClaudeCall;

    @Mock
    private OpenRouterAIService mockOpenRouterService;

    @Test
    @DisplayName("1. Réponse primaire Claude réussie")
    void testPrimarySuccess() throws IOException {
        String jsonResponse = """
            {
              "id": "msg_123",
              "type": "message",
              "role": "assistant",
              "content": [
                {
                  "type": "text",
                  "text": "Réponse générée par Claude pour Galileo."
                }
              ],
              "model": "claude-sonnet-5",
              "usage": {
                "input_tokens": 42,
                "output_tokens": 128
              }
            }
            """;

        Response response = new Response.Builder()
                .request(new Request.Builder().url("https://api.bedrock.com.de/v1/messages").build())
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body(ResponseBody.create(jsonResponse, MediaType.parse("application/json")))
                .build();

        when(mockClaudeHttpClient.newCall(any(Request.class))).thenReturn(mockClaudeCall);
        when(mockClaudeCall.execute()).thenReturn(response);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "test-claude-key");
        ReflectionTestUtils.setField(claude, "baseUrl", "https://api.bedrock.com.de");
        ReflectionTestUtils.setField(claude, "model", "claude-sonnet-5");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertTrue(result.isSuccess());
        assertEquals("Réponse générée par Claude pour Galileo.", result.getContent());
        assertEquals(42, result.getInputTokens());
        assertEquals(128, result.getOutputTokens());
        assertEquals("claude", result.getProvider());
        assertEquals("claude-sonnet-5", result.getModel());
        assertFalse(result.isFallbackUsed());

        verify(mockOpenRouterService, never()).generateText(any(), any(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("6. Échec du fournisseur primaire (HTTP 500) avec fallback réussi sur OpenRouter")
    void testPrimaryFailure500WithOpenRouterFallbackSuccess() throws IOException {
        Response errorResponse = new Response.Builder()
                .request(new Request.Builder().url("https://api.bedrock.com.de/v1/messages").build())
                .protocol(Protocol.HTTP_1_1)
                .code(500)
                .message("Internal Server Error")
                .body(ResponseBody.create("{\"error\": {\"message\": \"Overloaded\"}}", MediaType.parse("application/json")))
                .build();

        when(mockClaudeHttpClient.newCall(any(Request.class))).thenReturn(mockClaudeCall);
        when(mockClaudeCall.execute()).thenReturn(errorResponse);

        ClaudeAIService.ClaudeResult openRouterResult = ClaudeAIService.ClaudeResult.builder()
                .content("Réponse générée par OpenRouter (secours).")
                .inputTokens(50)
                .outputTokens(150)
                .success(true)
                .provider("openrouter")
                .model("anthropic/claude-3.5-sonnet")
                .fallbackUsed(true)
                .build();

        when(mockOpenRouterService.isConfigured()).thenReturn(true);
        when(mockOpenRouterService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(openRouterResult);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "test-claude-key");
        ReflectionTestUtils.setField(claude, "baseUrl", "https://api.bedrock.com.de");
        ReflectionTestUtils.setField(claude, "model", "claude-sonnet-5");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertTrue(result.isSuccess());
        assertTrue(result.isFallbackUsed());
        assertEquals("openrouter", result.getProvider());
        assertEquals("anthropic/claude-3.5-sonnet", result.getModel());
        assertEquals("Réponse générée par OpenRouter (secours).", result.getContent());
        assertEquals(50, result.getInputTokens());
        assertEquals(150, result.getOutputTokens());

        verify(mockOpenRouterService, times(1)).generateText(any(), any(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("8. Timeout du fournisseur primaire avec bascule vers OpenRouter")
    void testPrimaryTimeoutWithFallbackSuccess() throws IOException {
        when(mockClaudeHttpClient.newCall(any(Request.class))).thenReturn(mockClaudeCall);
        when(mockClaudeCall.execute()).thenThrow(new SocketTimeoutException("Read timed out after 25s"));

        ClaudeAIService.ClaudeResult openRouterResult = ClaudeAIService.ClaudeResult.builder()
                .content("Réponse secourue après timeout.")
                .inputTokens(30)
                .outputTokens(90)
                .success(true)
                .provider("openrouter")
                .model("anthropic/claude-3.5-sonnet")
                .fallbackUsed(true)
                .build();

        when(mockOpenRouterService.isConfigured()).thenReturn(true);
        when(mockOpenRouterService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(openRouterResult);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "test-claude-key");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertTrue(result.isSuccess());
        assertTrue(result.isFallbackUsed());
        assertEquals("openrouter", result.getProvider());
    }

    @Test
    @DisplayName("7. Échec des deux fournisseurs (Claude 503 + OpenRouter 502)")
    void testBothProvidersFail() throws IOException {
        Response errorResponse = new Response.Builder()
                .request(new Request.Builder().url("https://api.bedrock.com.de/v1/messages").build())
                .protocol(Protocol.HTTP_1_1)
                .code(503)
                .message("Service Unavailable")
                .body(ResponseBody.create("{}", MediaType.parse("application/json")))
                .build();

        when(mockClaudeHttpClient.newCall(any(Request.class))).thenReturn(mockClaudeCall);
        when(mockClaudeCall.execute()).thenReturn(errorResponse);

        ClaudeAIService.ClaudeResult openRouterFail = ClaudeAIService.ClaudeResult.builder()
                .content("Le service de secours OpenRouter est indisponible.")
                .success(false)
                .error("HTTP_502: Bad Gateway")
                .provider("openrouter")
                .fallbackUsed(true)
                .build();

        when(mockOpenRouterService.isConfigured()).thenReturn(true);
        when(mockOpenRouterService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(openRouterFail);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "test-claude-key");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertFalse(result.isSuccess());
        assertTrue(result.getError().contains("ALL_PROVIDERS_FAILED"));
    }

    @Test
    @DisplayName("11. Erreur 401 sur le fournisseur primaire (pas de fallback aveugle)")
    void testPrimary401DoesNotTriggerFallback() throws IOException {
        Response response401 = new Response.Builder()
                .request(new Request.Builder().url("https://api.bedrock.com.de/v1/messages").build())
                .protocol(Protocol.HTTP_1_1)
                .code(401)
                .message("Unauthorized")
                .body(ResponseBody.create("{\"error\": {\"message\": \"Invalid API key\"}}", MediaType.parse("application/json")))
                .build();

        when(mockClaudeHttpClient.newCall(any(Request.class))).thenReturn(mockClaudeCall);
        when(mockClaudeCall.execute()).thenReturn(response401);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "invalid-key");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertFalse(result.isSuccess());
        assertEquals(401, result.getHttpStatus());
        assertFalse(result.isFallbackUsed());
        verify(mockOpenRouterService, never()).generateText(any(), any(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("12. Erreur 403 sur le fournisseur primaire (pas de fallback aveugle)")
    void testPrimary403DoesNotTriggerFallback() throws IOException {
        Response response403 = new Response.Builder()
                .request(new Request.Builder().url("https://api.bedrock.com.de/v1/messages").build())
                .protocol(Protocol.HTTP_1_1)
                .code(403)
                .message("Forbidden")
                .body(ResponseBody.create("{\"error\": {\"message\": \"Account disabled\"}}", MediaType.parse("application/json")))
                .build();

        when(mockClaudeHttpClient.newCall(any(Request.class))).thenReturn(mockClaudeCall);
        when(mockClaudeCall.execute()).thenReturn(response403);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "forbidden-key");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertFalse(result.isSuccess());
        assertEquals(403, result.getHttpStatus());
        assertFalse(result.isFallbackUsed());
        verify(mockOpenRouterService, never()).generateText(any(), any(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("9. Clé primaire Claude absente avec OpenRouter configuré")
    void testClaudeKeyMissingUsesOpenRouterDirectly() {
        ClaudeAIService.ClaudeResult openRouterResult = ClaudeAIService.ClaudeResult.builder()
                .content("Réponse servie directement par OpenRouter.")
                .success(true)
                .provider("openrouter")
                .model("anthropic/claude-3.5-sonnet")
                .build();

        when(mockOpenRouterService.isConfigured()).thenReturn(true);
        when(mockOpenRouterService.generateText(any(), any(), anyDouble(), anyInt())).thenReturn(openRouterResult);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertTrue(result.isSuccess());
        assertEquals("openrouter", result.getProvider());
        verify(mockClaudeHttpClient, never()).newCall(any());
    }

    @Test
    @DisplayName("10. Clé primaire absente et clé secondaire absente")
    void testBothKeysMissing() {
        when(mockOpenRouterService.isConfigured()).thenReturn(false);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertFalse(result.isSuccess());
        assertEquals("API_KEY_MISSING", result.getError());
    }

    @Test
    @DisplayName("10b. Échec primaire et clé secondaire absente")
    void testPrimaryFailsAndSecondaryKeyMissing() throws IOException {
        Response errorResponse = new Response.Builder()
                .request(new Request.Builder().url("https://api.bedrock.com.de/v1/messages").build())
                .protocol(Protocol.HTTP_1_1)
                .code(500)
                .message("Server Error")
                .body(ResponseBody.create("{}", MediaType.parse("application/json")))
                .build();

        when(mockClaudeHttpClient.newCall(any(Request.class))).thenReturn(mockClaudeCall);
        when(mockClaudeCall.execute()).thenReturn(errorResponse);
        when(mockOpenRouterService.isConfigured()).thenReturn(false);

        ClaudeAIService claude = new ClaudeAIService(mockOpenRouterService, mockClaudeHttpClient);
        ReflectionTestUtils.setField(claude, "apiKey", "test-claude-key");

        ClaudeAIService.ClaudeResult result = claude.generateText("System prompt", "User message", 0.3, 2048);

        assertFalse(result.isSuccess());
        assertEquals(500, result.getHttpStatus());
        verify(mockOpenRouterService, never()).generateText(any(), any(), anyDouble(), anyInt());
    }

    @Test
    @DisplayName("OpenRouter service parser: OpenAI protocol choices and usage tokens")
    void testOpenRouterOpenAIProtocolParsing() throws IOException {
        String openAiResponse = """
            {
              "id": "gen-openrouter-999",
              "model": "anthropic/claude-3.5-sonnet",
              "choices": [
                {
                  "message": {
                    "role": "assistant",
                    "content": "Réponse conforme au protocole OpenAI."
                  },
                  "finish_reason": "stop"
                }
              ],
              "usage": {
                "prompt_tokens": 85,
                "completion_tokens": 210,
                "total_tokens": 295
              }
            }
            """;

        OkHttpClient mockHttpClient = mock(OkHttpClient.class);
        Call mockCall = mock(Call.class);
        Response response = new Response.Builder()
                .request(new Request.Builder().url("https://openrouter.ai/api/v1/chat/completions").build())
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body(ResponseBody.create(openAiResponse, MediaType.parse("application/json")))
                .build();

        when(mockHttpClient.newCall(any(Request.class))).thenReturn(mockCall);
        when(mockCall.execute()).thenReturn(response);

        OpenRouterAIService openRouter = new OpenRouterAIService(mockHttpClient);
        ReflectionTestUtils.setField(openRouter, "apiKey", "test-openrouter-key");
        ReflectionTestUtils.setField(openRouter, "baseUrl", "https://openrouter.ai/api/v1");
        ReflectionTestUtils.setField(openRouter, "model", "anthropic/claude-3.5-sonnet");

        ClaudeAIService.ClaudeResult result = openRouter.generateText("System prompt", "User prompt", 0.3, 2048);

        assertTrue(result.isSuccess());
        assertEquals("Réponse conforme au protocole OpenAI.", result.getContent());
        assertEquals(85, result.getInputTokens());
        assertEquals(210, result.getOutputTokens());
        assertEquals("openrouter", result.getProvider());
        assertEquals("anthropic/claude-3.5-sonnet", result.getModel());
        assertTrue(result.isFallbackUsed());
    }
}

