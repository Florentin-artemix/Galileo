package com.galileo.learning;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.ai.service.ClaudeAIService;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.common.exception.AIServiceUnavailableException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.learning.dto.LearningDTOs.*;
import com.galileo.learning.entity.Quiz;
import com.galileo.learning.entity.QuizAttempt;
import com.galileo.learning.entity.QuizQuestion;
import com.galileo.learning.repository.*;
import com.galileo.learning.service.LearningServiceImpl;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.repository.PublicationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LearningServiceTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizQuestionRepository questionRepository;

    @Mock
    private QuizAttemptRepository attemptRepository;

    @Mock
    private LearningProfileRepository profileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PublicationRepository publicationRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ClaudeAIService claudeAIService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private LearningServiceImpl learningService;

    @Test
    @DisplayName("Submitting quiz attempt should calculate accurate percentage and pass status")
    void testQuizGradingCalculation() {
        User student = User.builder().id(5L).email("student@mapon.cd").role(Role.STUDENT).build();
        Publication publication = Publication.builder().id(12L).title("Physique quantique").build();
        Quiz quiz = Quiz.builder().id(1L).publication(publication).build();

        QuizQuestion q1 = QuizQuestion.builder()
                .id(101L)
                .question("Quel est le principe d'incertitude ?")
                .answer("Heisenberg")
                .build();

        QuizQuestion q2 = QuizQuestion.builder()
                .id(102L)
                .question("Qui a introduit le concept de quanta ?")
                .answer("Planck")
                .build();

        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(questionRepository.findByQuizIdOrderByPositionAsc(1L)).thenReturn(List.of(q1, q2));
        when(attemptRepository.save(any(QuizAttempt.class))).thenAnswer(i -> i.getArgument(0));

        QuizSubmitRequest request = QuizSubmitRequest.builder()
                .answers(Map.of(
                        101L, "Heisenberg",
                        102L, "Einstein" // Incorrect
                ))
                .build();

        QuizResultDTO result = learningService.submitQuizAttempt(1L, request, 5L);

        assertNotNull(result);
        assertEquals(1, result.getCorrectCount());
        assertEquals(2, result.getTotalQuestions());
        assertEquals(50.0f, result.getScore());
        assertEquals(60, result.getPassingScore());
        assertFalse(result.isPassed()); // Needs >= 60%
    }

    @Test
    @DisplayName("A quiz answer must match the full correct option")
    void testQuizGradingRejectsAnswerPrefix() {
        User student = User.builder().id(5L).email("student@mapon.cd").role(Role.STUDENT).build();
        Publication publication = Publication.builder().id(12L).title("Physique quantique").build();
        Quiz quiz = Quiz.builder().id(1L).publication(publication).build();
        QuizQuestion question = QuizQuestion.builder().id(101L).answer("B. Bonne réponse").build();
        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(questionRepository.findByQuizIdOrderByPositionAsc(1L)).thenReturn(List.of(question));
        when(attemptRepository.save(any(QuizAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QuizSubmitRequest request = QuizSubmitRequest.builder().answers(Map.of(101L, "B.")).build();
        QuizResultDTO result = learningService.submitQuizAttempt(1L, request, 5L);

        assertEquals(0, result.getCorrectCount());
        assertFalse(result.isPassed());
    }

    @Test
    @DisplayName("A quiz generated from a topic is only accessible to its owner")
    void testPrivateTopicQuizRejectsOtherUsers() {
        User owner = User.builder().id(5L).email("owner@mapon.cd").role(Role.STUDENT).build();
        Quiz quiz = Quiz.builder().id(22L).user(owner).build();
        when(quizRepository.findById(22L)).thenReturn(Optional.of(quiz));

        assertThrows(ForbiddenException.class, () -> learningService.getQuiz(22L, 6L));
        assertThrows(ForbiddenException.class, () -> learningService.submitQuizAttempt(
                22L, QuizSubmitRequest.builder().answers(Map.of()).build(), 6L));
        verify(questionRepository, never()).findByQuizIdOrderByPositionAsc(22L);
        verify(userRepository, never()).findById(6L);
        verify(attemptRepository, never()).save(any(QuizAttempt.class));
    }

    @Test
    @DisplayName("Quiz generation does not persist synthetic questions when the AI provider fails")
    void testQuizGenerationRejectsProviderFailure() {
        User student = User.builder().id(5L).email("student@mapon.cd").role(Role.STUDENT).build();
        Publication publication = Publication.builder().id(12L).title("Physique quantique").build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(publicationRepository.findById(12L)).thenReturn(Optional.of(publication));
        when(documentRepository.findByPublicationId(12L)).thenReturn(List.of());
        when(claudeAIService.generateText(anyString(), anyString(), anyDouble(), anyInt()))
                .thenReturn(ClaudeAIService.ClaudeResult.builder()
                        .success(false)
                        .error("API_KEY_MISSING")
                        .content("Provider setup error")
                        .build());

        QuizGenerateRequest request = QuizGenerateRequest.builder()
                .publicationId(12L)
                .questionCount(3)
                .type("MCQ")
                .build();

        assertThrows(AIServiceUnavailableException.class, () -> learningService.generateQuiz(request, 5L));
        verify(quizRepository, never()).save(any(Quiz.class));
        verify(questionRepository, never()).save(any(QuizQuestion.class));
    }

    @Test
    @DisplayName("Quiz generation rejects incomplete AI output without persisting partial questions")
    void testQuizGenerationRejectsIncompleteOutput() {
        User student = User.builder().id(5L).email("student@mapon.cd").role(Role.STUDENT).build();
        Publication publication = Publication.builder().id(12L).title("Physique quantique").build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(publicationRepository.findById(12L)).thenReturn(Optional.of(publication));
        when(documentRepository.findByPublicationId(12L)).thenReturn(List.of());
        when(claudeAIService.generateText(anyString(), anyString(), anyDouble(), anyInt()))
                .thenReturn(ClaudeAIService.ClaudeResult.builder()
                        .success(true)
                        .content("[{\"question\":\"Question réelle\",\"options\":[\"A. Un\",\"B. Deux\"],\"answer\":\"A. Un\",\"explanation\":\"Justification\"}]")
                        .build());

        QuizGenerateRequest request = QuizGenerateRequest.builder()
                .publicationId(12L)
                .questionCount(3)
                .type("MCQ")
                .build();

        assertThrows(AIServiceUnavailableException.class, () -> learningService.generateQuiz(request, 5L));
        verify(quizRepository, never()).save(any(Quiz.class));
        verify(questionRepository, never()).save(any(QuizQuestion.class));
    }

    @Test
    @DisplayName("Quiz generation returns only backend-confirmed questions without exposing answers")
    void testQuizGenerationReturnsValidatedQuestionsWithoutAnswers() {
        User student = User.builder().id(5L).email("student@mapon.cd").role(Role.STUDENT).build();
        Publication publication = Publication.builder().id(12L).title("Physique quantique").build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(publicationRepository.findById(12L)).thenReturn(Optional.of(publication));
        when(documentRepository.findByPublicationId(12L)).thenReturn(List.of());
        when(claudeAIService.generateText(anyString(), anyString(), anyDouble(), anyInt()))
                .thenReturn(ClaudeAIService.ClaudeResult.builder()
                        .success(true)
                        .content("""
                                [
                                  {"question":"Question 1 réelle","options":["A. Un","B. Deux"],"answer":"A. Un","explanation":"Explication 1"},
                                  {"question":"Question 2 réelle","options":["A. Trois","B. Quatre"],"answer":"B. Quatre","explanation":"Explication 2"},
                                  {"question":"Question 3 réelle","options":["A. Cinq","B. Six"],"answer":"A. Cinq","explanation":"Explication 3"}
                                ]
                                """)
                        .build());
        when(quizRepository.save(any(Quiz.class))).thenAnswer(invocation -> {
            Quiz quiz = invocation.getArgument(0);
            quiz.setId(21L);
            return quiz;
        });
        long[] nextQuestionId = {101L};
        when(questionRepository.save(any(QuizQuestion.class))).thenAnswer(invocation -> {
            QuizQuestion question = invocation.getArgument(0);
            question.setId(nextQuestionId[0]++);
            return question;
        });

        QuizGenerateRequest request = QuizGenerateRequest.builder()
                .publicationId(12L)
                .questionCount(3)
                .type("MCQ")
                .build();

        QuizDTO result = learningService.generateQuiz(request, 5L);

        assertEquals(21L, result.getId());
        assertEquals("Physique quantique", result.getTopic());
        assertEquals("MCQ", result.getType());
        assertEquals(60, result.getPassingScore());
        assertEquals(3, result.getQuestions().size());
        assertTrue(result.getQuestions().stream().allMatch(question -> question.getAnswer() == null));
        assertTrue(result.getQuestions().stream().allMatch(question -> question.getExplanation() == null));
        verify(quizRepository, times(1)).save(any(Quiz.class));
        verify(questionRepository, times(3)).save(any(QuizQuestion.class));
    }
}
