package com.galileo.learning.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class LearningDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizGenerateRequest {
        private Long publicationId;
        private String topic;
        @Builder.Default
        private Integer questionCount = 5;
        @Builder.Default
        private String type = "MCQ"; // Multiple Choice Questions
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizDTO {
        private Long id;
        private Long publicationId;
        private String publicationTitle;
        private String topic;
        private String type;
        private Integer passingScore;
        private List<QuestionDTO> questions;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDTO {
        private Long id;
        private String question;
        private List<String> options;
        private String answer; // Only visible after submission or for creator
        private String explanation;
        private Integer position;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizSubmitRequest {
        private Map<Long, String> answers; // questionId -> selected answer
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizResultDTO {
        private Long attemptId;
        private Long quizId;
        private Float score;
        private Integer passingScore;
        private Integer totalQuestions;
        private Integer correctCount;
        private boolean passed;
        private List<CorrectionDTO> corrections;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CorrectionDTO {
        private Long questionId;
        private String question;
        private String userAnswer;
        private String correctAnswer;
        private boolean correct;
        private String explanation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningPathDTO {
        private Long id;
        private Long userId;
        private String title;
        private String topic;
        private List<Map<String, Object>> steps;
        private Boolean isActive;
        private Integer completedSteps;
        private List<Integer> completedStepIndexes;
        private Integer totalSteps;
        private Float progressPercentage;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LearningProfileDTO {
        private Long id;
        private Long userId;
        private List<String> studiedTopics;
        private String estimatedLevel;
        private List<String> interests;
    }
}
