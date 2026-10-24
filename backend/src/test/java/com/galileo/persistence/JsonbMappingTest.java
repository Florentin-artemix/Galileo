package com.galileo.persistence;

import com.galileo.ai.entity.AIConversation;
import com.galileo.ai.entity.AIMessage;
import com.galileo.ai.entity.AIMode;
import com.galileo.analytics.entity.AnalyticsEvent;
import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.learning.entity.LearningPath;
import com.galileo.learning.entity.Quiz;
import com.galileo.learning.entity.QuizAttempt;
import com.galileo.learning.entity.QuizQuestion;
import com.galileo.notifications.entity.Notification;
import com.galileo.notifications.entity.NotificationType;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.entity.PublicationType;
import com.galileo.recommendations.entity.SearchHistory;
import com.galileo.submissions.entity.Submission;
import com.galileo.submissions.entity.SubmissionStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class JsonbMappingTest {

    @Autowired
    private EntityManager entityManager;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test.jsonb@galileo.local")
                .passwordHash("$2a$10$dummyHashForTestingJsonbMappings")
                .role(Role.STUDENT)
                .isActive(true)
                .emailVerified(true)
                .build();
        entityManager.persist(testUser);
        entityManager.flush();
    }

    @Test
    @DisplayName("1. AIMessage.metadata: persistance et relecture d'un JSON valide et d'une valeur nulle")
    void testAIMessageJsonbMapping() {
        AIConversation conv = AIConversation.builder()
                .user(testUser)
                .mode(AIMode.GENERAL)
                .title("Conversation test")
                .build();
        entityManager.persist(conv);

        String jsonMetadata = "{\"sourcesCount\":3,\"tokens\":150,\"citations\":[\"p1\",\"p2\"]}";
        AIMessage msg = AIMessage.builder()
                .conversation(conv)
                .role("ASSISTANT")
                .content("Réponse générée par IA")
                .metadata(jsonMetadata)
                .build();
        entityManager.persist(msg);

        AIMessage msgNull = AIMessage.builder()
                .conversation(conv)
                .role("USER")
                .content("Question utilisateur")
                .metadata(null)
                .build();
        entityManager.persist(msgNull);

        entityManager.flush();
        entityManager.clear();

        AIMessage reloaded = entityManager.find(AIMessage.class, msg.getId());
        assertNotNull(reloaded);
        assertEquals(jsonMetadata, reloaded.getMetadata());

        AIMessage reloadedNull = entityManager.find(AIMessage.class, msgNull.getId());
        assertNotNull(reloadedNull);
        assertNull(reloadedNull.getMetadata());
    }

    @Test
    @DisplayName("2. Submission.aiAnalysis: persistance et relecture du rapport JSON d'analyse IA")
    void testSubmissionJsonbMapping() {
        Publication pub = Publication.builder()
                .title("Étude de l'Intelligence Artificielle en RDC")
                .slug("etude-ia-rdc-" + System.currentTimeMillis())
                .type(PublicationType.ARTICLE)
                .status(PublicationStatus.DRAFT)
                .build();
        entityManager.persist(pub);

        String analysisJson = "{\"score\":0.92,\"plagiarismRisk\":\"LOW\",\"summary\":\"Travail de recherche validé\"}";
        Submission submission = Submission.builder()
                .publication(pub)
                .submittedBy(testUser)
                .status(SubmissionStatus.PENDING)
                .aiAnalysis(analysisJson)
                .build();
        entityManager.persist(submission);
        entityManager.flush();
        entityManager.clear();

        Submission reloaded = entityManager.find(Submission.class, submission.getId());
        assertNotNull(reloaded);
        assertEquals(analysisJson, reloaded.getAiAnalysis());
    }

    @Test
    @DisplayName("3. AnalyticsEvent.metadata: persistance des métadonnées d'événement analytique")
    void testAnalyticsEventJsonbMapping() {
        String metaJson = "{\"ip\":\"127.0.0.1\",\"userAgent\":\"Mozilla/5.0\",\"durationMs\":4200}";
        AnalyticsEvent event = AnalyticsEvent.builder()
                .eventType("PUBLICATION_VIEW")
                .user(testUser)
                .metadata(metaJson)
                .build();
        entityManager.persist(event);
        entityManager.flush();
        entityManager.clear();

        AnalyticsEvent reloaded = entityManager.find(AnalyticsEvent.class, event.getId());
        assertNotNull(reloaded);
        assertEquals(metaJson, reloaded.getMetadata());
    }

    @Test
    @DisplayName("4. SearchHistory.filters: persistance des filtres de recherche")
    void testSearchHistoryJsonbMapping() {
        String filtersJson = "{\"domain\":\"genie-informatique\",\"type\":\"THESE\",\"year\":2026}";
        SearchHistory history = SearchHistory.builder()
                .user(testUser)
                .query("apprentissage profond")
                .filters(filtersJson)
                .resultCount(14)
                .build();
        entityManager.persist(history);
        entityManager.flush();
        entityManager.clear();

        SearchHistory reloaded = entityManager.find(SearchHistory.class, history.getId());
        assertNotNull(reloaded);
        assertEquals(filtersJson, reloaded.getFilters());
    }

    @Test
    @DisplayName("5. Notification.data: persistance des données contextuelles de notification")
    void testNotificationJsonbMapping() {
        String notifData = "{\"submissionId\":42,\"reviewer\":\"Dr. Kalala\",\"actionUrl\":\"/submissions/42\"}";
        Notification notif = Notification.builder()
                .user(testUser)
                .type(NotificationType.PUBLICATION_APPROVED)
                .title("Publication validée")
                .message("Votre article a été accepté.")
                .data(notifData)
                .build();
        entityManager.persist(notif);
        entityManager.flush();
        entityManager.clear();

        Notification reloaded = entityManager.find(Notification.class, notif.getId());
        assertNotNull(reloaded);
        assertEquals(notifData, reloaded.getData());
    }

    @Test
    @DisplayName("6. QuizAttempt.answers: persistance du dictionnaire de réponses utilisateur")
    void testQuizAttemptJsonbMapping() {
        Quiz quiz = Quiz.builder()
                .user(testUser)
                .topic("Réseaux Électriques")
                .type("MULTIPLE_CHOICE")
                .build();
        entityManager.persist(quiz);

        String answersJson = "{\"1\":\"A\",\"2\":\"C\",\"3\":\"D\"}";
        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(testUser)
                .answers(answersJson)
                .score(85.0f)
                .completed(true)
                .build();
        entityManager.persist(attempt);
        entityManager.flush();
        entityManager.clear();

        QuizAttempt reloaded = entityManager.find(QuizAttempt.class, attempt.getId());
        assertNotNull(reloaded);
        assertEquals(answersJson, reloaded.getAnswers());
    }

    @Test
    @DisplayName("7. QuizQuestion.options: persistance du tableau des choix multiples")
    void testQuizQuestionJsonbMapping() {
        Quiz quiz = Quiz.builder()
                .user(testUser)
                .topic("Génie Logiciel")
                .type("MULTIPLE_CHOICE")
                .build();
        entityManager.persist(quiz);

        String optionsJson = "[\"A. TCP\",\"B. UDP\",\"C. ICMP\",\"D. ARP\"]";
        QuizQuestion question = QuizQuestion.builder()
                .quiz(quiz)
                .question("Quel protocole garantit la livraison ordonnée des paquets ?")
                .options(optionsJson)
                .answer("A. TCP")
                .build();
        entityManager.persist(question);
        entityManager.flush();
        entityManager.clear();

        QuizQuestion reloaded = entityManager.find(QuizQuestion.class, question.getId());
        assertNotNull(reloaded);
        assertEquals(optionsJson, reloaded.getOptions());
    }

    @Test
    @DisplayName("8. LearningPath.steps: persistance de la liste ordonnée d'étapes d'apprentissage")
    void testLearningPathJsonbMapping() {
        String stepsJson = "[{\"step\":1,\"title\":\"Introduction\",\"duration\":30},{\"step\":2,\"title\":\"Exercices pratiques\",\"duration\":60}]";
        LearningPath path = LearningPath.builder()
                .user(testUser)
                .title("Parcours Robotique et Mécatronique")
                .topic("Robotique")
                .steps(stepsJson)
                .isActive(true)
                .build();
        entityManager.persist(path);
        entityManager.flush();
        entityManager.clear();

        LearningPath reloaded = entityManager.find(LearningPath.class, path.getId());
        assertNotNull(reloaded);
        assertEquals(stepsJson, reloaded.getSteps());
    }
}
