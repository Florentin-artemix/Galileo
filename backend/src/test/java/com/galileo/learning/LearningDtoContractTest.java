package com.galileo.learning;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.learning.dto.LearningDTOs.CorrectionDTO;
import com.galileo.learning.dto.LearningDTOs.QuizDTO;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LearningDtoContractTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void quizAndCorrectionDtosSerializeTheFieldsUsedByTheFrontend() {
        QuizDTO quiz = QuizDTO.builder()
                .id(12L)
                .topic("Physique quantique")
                .type("MCQ")
                .passingScore(60)
                .questions(List.of())
                .build();
        CorrectionDTO correction = CorrectionDTO.builder()
                .questionId(42L)
                .question("Question réelle")
                .userAnswer("A. Réponse")
                .correctAnswer("A. Réponse")
                .correct(true)
                .explanation("Explication réelle")
                .build();

        JsonNode quizJson = objectMapper.valueToTree(quiz);
        JsonNode correctionJson = objectMapper.valueToTree(correction);

        assertEquals(60, quizJson.path("passingScore").asInt());
        assertTrue(correctionJson.path("correct").asBoolean());
        assertFalse(correctionJson.has("isCorrect"));
    }
}
