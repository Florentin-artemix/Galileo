package com.galileo.learning.service;

import com.galileo.learning.dto.LearningDTOs.*;

import java.util.List;

public interface LearningService {

    QuizDTO generateQuiz(QuizGenerateRequest request, Long userId);

    QuizDTO getQuiz(Long quizId, Long userId);

    List<QuizDTO> getQuizzesForPublication(Long publicationId, Long userId);

    List<QuizDTO> getMyQuizzes(Long userId);

    QuizResultDTO submitQuizAttempt(Long quizId, QuizSubmitRequest request, Long userId);

    LearningPathDTO generateLearningPath(String topic, Long userId);

    List<LearningPathDTO> getUserLearningPaths(Long userId);

    LearningPathDTO getLearningPath(Long pathId, Long userId);

    LearningPathDTO updateStepProgress(Long pathId, int stepIndex, boolean completed, Long userId);

    LearningProfileDTO getUserLearningProfile(Long userId);
}
