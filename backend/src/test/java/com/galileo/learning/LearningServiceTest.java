package com.galileo.learning;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.learning.dto.LearningDTOs.*;
import com.galileo.learning.entity.Quiz;
import com.galileo.learning.entity.QuizAttempt;
import com.galileo.learning.entity.QuizQuestion;
import com.galileo.learning.repository.*;
import com.galileo.learning.service.LearningServiceImpl;
import com.galileo.publications.entity.Publication;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LearningServiceTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizQuestionRepository questionRepository;

    @Mock
    private QuizAttemptRepository attemptRepository;

    @Mock
    private UserRepository userRepository;

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
        assertFalse(result.isPassed()); // Needs >= 60%
    }
}
