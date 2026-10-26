package com.galileo.ai.service;

public record AIChatTurn(String role, String content) {
    public static AIChatTurn user(String content) {
        return new AIChatTurn("user", content);
    }

    public static AIChatTurn assistant(String content) {
        return new AIChatTurn("assistant", content);
    }
}
