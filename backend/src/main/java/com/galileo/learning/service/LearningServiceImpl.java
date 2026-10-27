package com.galileo.learning.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.galileo.ai.service.ClaudeAIService;
import com.galileo.auth.security.CustomUserDetails;
import com.galileo.common.exception.AIServiceTimeoutException;
import com.galileo.common.exception.AIServiceUnavailableException;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.common.exception.BadRequestException;
import com.galileo.common.exception.ForbiddenException;
import com.galileo.common.exception.ResourceNotFoundException;
import com.galileo.documents.entity.Document;
import com.galileo.documents.repository.DocumentRepository;
import com.galileo.learning.dto.LearningDTOs.*;
import com.galileo.learning.entity.*;
import com.galileo.learning.repository.*;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.publications.service.PublicationService;
import com.galileo.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LearningServiceImpl implements LearningService {

    private static final int QUIZ_PASSING_SCORE_PERCENT = 60;

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizAttemptRepository attemptRepository;
    private final LearningPathRepository pathRepository;
    private final LearningProfileRepository profileRepository;
    private final LearningProgressRepository progressRepository;
    private final PublicationRepository publicationRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final ClaudeAIService claudeAIService;
    private final PublicationService publicationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired(required = false)
    private StorageService storageService;

    @Override
    @Transactional
    public QuizDTO generateQuiz(QuizGenerateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));
        Publication pub = null;
        String contentForQuiz = "";

        if (request.getPublicationId() != null) {
            pub = publicationRepository.findById(request.getPublicationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", request.getPublicationId()));
            // Le quiz peut être généré depuis le texte intégral du PDF : on vérifie l'accès document complet.
            ensurePublicationFullDocumentAccess(pub, user);

            List<Document> docs = documentRepository.findByPublicationId(pub.getId());
            if (!docs.isEmpty()) {
                Document doc = docs.get(0);
                if ((doc.getExtractedText() == null || doc.getExtractedText().isBlank())
                        && storageService != null && doc.getFileKey() != null && !doc.getFileKey().isBlank()) {
                    extractAndSaveDocumentText(doc);
                }
                if (doc.getExtractedText() != null && !doc.getExtractedText().isBlank()) {
                    String full = doc.getExtractedText();
                    contentForQuiz = full.length() > 6000 ? full.substring(0, 6000) : full;
                }
            }
            if (contentForQuiz == null || contentForQuiz.isBlank()) {
                contentForQuiz = pub.getTitle() + "\n" + (pub.getAbstractText() != null ? pub.getAbstractText() : "");
            }
        } else if (request.getTopic() != null && !request.getTopic().trim().isEmpty()) {
            contentForQuiz = "Sujet académique : " + request.getTopic().trim();
        } else {
            throw new BadRequestException("Un identifiant de publication ou un sujet thématique est requis");
        }

        int count = request.getQuestionCount() != null ? Math.min(Math.max(request.getQuestionCount(), 3), 10) : 5;

        // 1. Invocation de Claude pour générer un QCM rigoureux au format JSON strict
        String systemPrompt = """
            Tu es un concepteur pédagogique universitaire expert.
            Génère un quiz QCM à choix multiples basé rigoureusement sur le contenu académique fourni.
            Tu DOIS répondre EXCLUSIVEMENT avec un tableau JSON valide (sans aucun texte d'introduction ni balises superflues).
            Format attendu :
            [
              {
                "question": "Énoncé précis de la question",
                "options": ["A. Proposition 1", "B. Proposition 2", "C. Proposition 3", "D. Proposition 4"],
                "answer": "A. Proposition 1",
                "explanation": "Justification académique de la réponse exacte"
              }
            ]
            """;

        String userPrompt = "Génère exactement " + count + " questions QCM à partir de ce texte :\n" + contentForQuiz;

        ClaudeAIService.ClaudeResult result = claudeAIService.generateText(systemPrompt, userPrompt, 0.2, 2048);
        if (result == null || !result.isSuccess()) {
            String error = result != null ? result.getError() : null;
            if (error != null && error.toLowerCase(Locale.ROOT).contains("timeout")) {
                throw new AIServiceTimeoutException("Le délai de génération du quiz a été dépassé. Veuillez réessayer.");
            }
            throw new AIServiceUnavailableException("Le service de génération du quiz est temporairement indisponible.");
        }

        List<GeneratedQuestion> parsedQuestions = parseQuizQuestions(result.getContent(), count);

        // 2. Sauvegarde du Quiz
        Quiz quiz = Quiz.builder()
                .user(user)
                .publication(pub)
                .topic(pub != null ? pub.getTitle() : request.getTopic())
                .type(request.getType() != null ? request.getType() : "MCQ")
                .build();
        quiz = quizRepository.save(quiz);

        // 3. Sauvegarde des questions
        List<QuizQuestion> savedQuestions = new ArrayList<>();
        int pos = 0;
        for (GeneratedQuestion gq : parsedQuestions) {
            String optionsJson = "[]";
            try {
                optionsJson = objectMapper.writeValueAsString(gq.options);
            } catch (Exception ignored) {}

            QuizQuestion question = QuizQuestion.builder()
                    .quiz(quiz)
                    .question(gq.question)
                    .options(optionsJson)
                    .answer(gq.answer)
                    .explanation(gq.explanation)
                    .position(pos++)
                    .build();
            savedQuestions.add(questionRepository.save(question));
        }

        return toQuizDTO(quiz, savedQuestions, false);
    }

    @Override
    @Transactional(readOnly = true)
    public QuizDTO getQuiz(Long quizId, Long userId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));
        ensureQuizAccess(quiz, userId);
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByPositionAsc(quizId);
        return toQuizDTO(quiz, questions, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizDTO> getQuizzesForPublication(Long publicationId, Long userId) {
        Publication publication = publicationRepository.findById(publicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Publication", "id", publicationId));
        // La liste des quizzes donne accès aux questions et corrections dérivées du PDF.
        ensurePublicationFullDocumentAccess(publication, findUser(userId));

        return quizRepository.findByPublicationId(publicationId).stream()
                .map(q -> toQuizDTO(q, questionRepository.findByQuizIdOrderByPositionAsc(q.getId()), false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizDTO> getMyQuizzes(Long userId) {
        List<QuizDTO> quizzes = new ArrayList<>();
        for (Quiz quiz : quizRepository.findByUserId(userId)) {
            ensureQuizAccess(quiz, userId);
            quizzes.add(toQuizDTO(quiz, questionRepository.findByQuizIdOrderByPositionAsc(quiz.getId()), true));
        }
        return quizzes;
    }

    @Override
    @Transactional
    public QuizResultDTO submitQuizAttempt(Long quizId, QuizSubmitRequest request, Long userId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));
        ensureQuizAccess(quiz, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByPositionAsc(quizId);
        if (questions.isEmpty()) {
            throw new BadRequestException("Ce quiz ne contient aucune question");
        }

        Map<Long, String> userAnswers = request.getAnswers() != null ? request.getAnswers() : Collections.emptyMap();
        int correctCount = 0;
        List<CorrectionDTO> corrections = new ArrayList<>();

        for (QuizQuestion q : questions) {
            String selected = userAnswers.get(q.getId());
            boolean isCorrect = selected != null && isAnswerMatching(selected, q.getAnswer());
            if (isCorrect) {
                correctCount++;
            }

            corrections.add(CorrectionDTO.builder()
                    .questionId(q.getId())
                    .question(q.getQuestion())
                    .userAnswer(selected != null ? selected : "Non répondu")
                    .correctAnswer(q.getAnswer())
                    .correct(isCorrect)
                    .explanation(q.getExplanation())
                    .build());
        }

        float score = ((float) correctCount / questions.size()) * 100.0f;
        boolean passed = score >= QUIZ_PASSING_SCORE_PERCENT;

        String answersJson = "{}";
        try {
            answersJson = objectMapper.writeValueAsString(userAnswers);
        } catch (Exception ignored) {}

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(user)
                .answers(answersJson)
                .score(score)
                .completed(true)
                .attemptedAt(LocalDateTime.now())
                .build();
        attempt = attemptRepository.save(attempt);

        // Mise à jour du profil d'apprentissage
        updateUserProfileAfterQuiz(user, quiz.getTopic(), score);

        return QuizResultDTO.builder()
                .attemptId(attempt.getId())
                .quizId(quiz.getId())
                .score(score)
                .passingScore(QUIZ_PASSING_SCORE_PERCENT)
                .totalQuestions(questions.size())
                .correctCount(correctCount)
                .passed(passed)
                .corrections(corrections)
                .build();
    }

    @Override
    @Transactional
    public LearningPathDTO generateLearningPath(String topic, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        if (topic == null || topic.trim().isEmpty()) {
            throw new BadRequestException("Le sujet du parcours d'apprentissage est obligatoire");
        }

        String systemPrompt = """
            Tu es un ingénieur pédagogique universitaire pour Galileo.
            Conçois un parcours d'apprentissage structuré en 4 à 5 étapes progressives sur le sujet demandé.
            Réponds EXCLUSIVEMENT avec un tableau JSON valide d'étapes :
            [
              {
                "stepIndex": 0,
                "title": "Titre de l'étape",
                "description": "Objectif d'apprentissage et synthèse des compétences",
                "estimatedMinutes": 45,
                "keyConcepts": ["Concept 1", "Concept 2"]
              }
            ]
            """;

        String userPrompt = "Thématique d'apprentissage : " + topic.trim();
        ClaudeAIService.ClaudeResult result = claudeAIService.generateText(systemPrompt, userPrompt, 0.3, 2048);

        if (result == null || !result.isSuccess()) {
            String error = result != null ? result.getError() : null;
            if (error != null && error.toLowerCase(Locale.ROOT).contains("timeout")) {
                throw new AIServiceTimeoutException("Le délai de génération du parcours a été dépassé. Veuillez réessayer.");
            }
            throw new AIServiceUnavailableException("Le service de génération du parcours est temporairement indisponible.");
        }

        String stepsJson = cleanJsonString(result.getContent());
        List<Map<String, Object>> stepsList = parseGeneratedStepsList(stepsJson);

        LearningPath path = LearningPath.builder()
                .user(user)
                .title("Parcours : " + topic.trim())
                .topic(topic.trim())
                .steps(stepsJson)
                .isActive(true)
                .build();
        path = pathRepository.save(path);

        // Initialisation de la progression
        for (int i = 0; i < stepsList.size(); i++) {
            LearningProgress prog = LearningProgress.builder()
                    .user(user)
                    .learningPath(path)
                    .stepIndex(i)
                    .completed(false)
                    .build();
            progressRepository.save(prog);
        }

        return toLearningPathDTO(path, stepsList, List.of());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningPathDTO> getUserLearningPaths(Long userId) {
        List<LearningPath> paths = pathRepository.findByUserId(userId);
        List<LearningPathDTO> result = new ArrayList<>();

        for (LearningPath p : paths) {
            List<Map<String, Object>> steps = parseStepsList(p.getSteps(), p.getTopic());
            List<LearningProgress> progs = progressRepository.findByLearningPathIdAndUserId(p.getId(), userId);
            result.add(toLearningPathDTO(p, steps, completedStepIndexes(progs, steps.size())));
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public LearningPathDTO getLearningPath(Long pathId, Long userId) {
        LearningPath path = pathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcours", "id", pathId));

        if (!path.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Ce parcours d'apprentissage ne vous appartient pas");
        }

        List<Map<String, Object>> steps = parseStepsList(path.getSteps(), path.getTopic());
        List<LearningProgress> progs = progressRepository.findByLearningPathIdAndUserId(pathId, userId);
        return toLearningPathDTO(path, steps, completedStepIndexes(progs, steps.size()));
    }

    @Override
    @Transactional
    public LearningPathDTO updateStepProgress(Long pathId, int stepIndex, boolean completed, Long userId) {
        LearningPath path = pathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Parcours", "id", pathId));

        if (!path.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Ce parcours d'apprentissage ne vous appartient pas");
        }

        List<Map<String, Object>> steps = parseStepsList(path.getSteps(), path.getTopic());
        if (stepIndex < 0 || stepIndex >= steps.size()) {
            throw new BadRequestException("L'indice de l'étape est hors des limites du parcours");
        }

        List<LearningProgress> progs = progressRepository.findByLearningPathIdAndUserId(pathId, userId);
        LearningProgress prog = progs.stream()
                .filter(p -> p.getStepIndex() != null && p.getStepIndex() == stepIndex)
                .findFirst()
                .orElseGet(() -> LearningProgress.builder()
                        .user(path.getUser())
                        .learningPath(path)
                        .stepIndex(stepIndex)
                        .build());

        prog.setCompleted(completed);
        prog.setCompletedAt(completed ? LocalDateTime.now() : null);
        progressRepository.save(prog);

        return getLearningPath(pathId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public LearningProfileDTO getUserLearningProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", "id", userId));

        LearningProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(LearningProfile.builder()
                        .user(user)
                        .estimatedLevel("INTERMEDIAIRE")
                        .studiedTopics(new String[0])
                        .interests(new String[0])
                        .build()));

        return LearningProfileDTO.builder()
                .id(profile.getId())
                .userId(userId)
                .estimatedLevel(profile.getEstimatedLevel() != null ? profile.getEstimatedLevel() : "INTERMEDIAIRE")
                .studiedTopics(profile.getStudiedTopics() != null ? Arrays.asList(profile.getStudiedTopics()) : Collections.emptyList())
                .interests(profile.getInterests() != null ? Arrays.asList(profile.getInterests()) : Collections.emptyList())
                .build();
    }

    private void updateUserProfileAfterQuiz(User user, String topic, float score) {
        try {
            LearningProfile profile = profileRepository.findByUserId(user.getId())
                    .orElseGet(() -> LearningProfile.builder().user(user).build());

            Set<String> topics = new LinkedHashSet<>(profile.getStudiedTopics() != null ? Arrays.asList(profile.getStudiedTopics()) : Collections.emptyList());
            if (topic != null && !topic.trim().isEmpty()) {
                topics.add(topic.trim());
            }
            profile.setStudiedTopics(topics.toArray(new String[0]));

            if (score >= 85) {
                profile.setEstimatedLevel("AVANCE");
            } else if (score >= 60) {
                profile.setEstimatedLevel("INTERMEDIAIRE");
            } else {
                profile.setEstimatedLevel("DEBUTANT");
            }

            profileRepository.save(profile);
        } catch (Exception e) {
            log.warn("Impossible d'actualiser le profil d'apprentissage : {}", e.getMessage());
        }
    }

    private boolean isAnswerMatching(String selected, String expected) {
        if (selected == null || expected == null) return false;
        String s = selected.trim();
        String e = expected.trim();
        if (s.equalsIgnoreCase(e)) return true;

        String sStripped = s.replaceFirst("^[A-Da-d][\\.\\)\\s]+", "").trim();
        String eStripped = e.replaceFirst("^[A-Da-d][\\.\\)\\s]+", "").trim();
        if (!sStripped.isEmpty() && sStripped.equalsIgnoreCase(eStripped)) return true;

        String sLetter = s.replaceAll("[^A-Za-z]", "").toUpperCase();
        String eLetter = e.replaceAll("[^A-Za-z]", "").toUpperCase();
        return sLetter.length() == 1 && sLetter.equals(eLetter);
    }

    private void extractAndSaveDocumentText(Document doc) {
        if (storageService == null || doc.getFileKey() == null || doc.getFileKey().isBlank()) {
            return;
        }
        try (InputStream is = storageService.downloadFile(doc.getFileKey());
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int n;
            while ((n = is.read(buffer)) != -1) {
                baos.write(buffer, 0, n);
            }
            byte[] pdfBytes = baos.toByteArray();
            if (pdfBytes.length == 0) return;

            try (PDDocument pdDoc = Loader.loadPDF(pdfBytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                String text = stripper.getText(pdDoc).trim();
                if (!text.isEmpty()) {
                    doc.setExtractedText(text.length() > 500_000 ? text.substring(0, 500_000) : text);
                    doc.setPageCount(pdDoc.getNumberOfPages());
                    documentRepository.save(doc);
                    log.info("Texte PDF extrait avec succès pour le document #{} ({} caractères)", doc.getId(), text.length());
                }
            }
        } catch (Exception e) {
            log.warn("Impossible d'extraire à la volée le texte PDF pour le document #{}: {}", doc.getId(), e.getMessage());
        }
    }

    private void ensureQuizAccess(Quiz quiz, Long userId) {
        if (quiz.getPublication() != null) {
            // Un quiz de publication dérive potentiellement du texte intégral du PDF :
            // on vérifie l'accès au document complet, pas seulement aux métadonnées.
            ensurePublicationFullDocumentAccess(quiz.getPublication(), findUser(userId));
            return;
        }

        if (quiz.getUser() == null || userId == null || !Objects.equals(quiz.getUser().getId(), userId)) {
            throw new ForbiddenException("Ce quiz privé n'est pas accessible avec ce compte.");
        }
    }

    private User findUser(Long userId) {
        return userId != null ? userRepository.findById(userId).orElse(null) : null;
    }

    /**
     * Vérifie l'accès aux métadonnées d'une publication (titre, résumé, auteurs).
     * Utilisé pour les opérations qui n'accèdent PAS au texte intégral extrait du PDF.
     */
    private void ensurePublicationMetadataAccess(Publication publication, User user) {
        CustomUserDetails userDetails = user != null ? new CustomUserDetails(user) : null;
        if (!publicationService.isAuthorizedToAccess(publication, userDetails)) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation d'accéder à cette publication");
        }
    }

    /**
     * Vérifie l'accès au texte intégral d'une publication (PDF extrait).
     * Utilisé pour les opérations qui consomment le contenu du PDF : génération de quiz,
     * lecture de quiz dérivé du PDF, soumission d'une tentative sur un tel quiz.
     */
    private void ensurePublicationFullDocumentAccess(Publication publication, User user) {
        CustomUserDetails userDetails = user != null ? new CustomUserDetails(user) : null;
        if (!publicationService.isAuthorizedToReadFullDocument(publication, userDetails)) {
            throw new ForbiddenException("Vous n'avez pas l'autorisation de lire le contenu intégral de cette publication");
        }
    }

    private List<GeneratedQuestion> parseQuizQuestions(String rawJson, int expectedCount) {
        List<GeneratedQuestion> questions = new ArrayList<>();
        JsonNode root;

        try {
            root = objectMapper.readTree(cleanJsonString(rawJson));
        } catch (Exception e) {
            log.error("Échec du parsing JSON du quiz généré : {}", e.getMessage());
            log.debug("Contenu brut du quiz : {}", rawJson);
            throw invalidGeneratedQuiz();
        }

        if (root != null && root.isObject()) {
            if (root.has("questions") && root.path("questions").isArray()) {
                root = root.path("questions");
            } else if (root.has("quiz") && root.path("quiz").isArray()) {
                root = root.path("quiz");
            }
        }

        if (root == null || !root.isArray() || root.isEmpty()) {
            log.error("Format JSON inattendu pour le quiz (non-tableau ou vide) : {}", rawJson);
            throw invalidGeneratedQuiz();
        }

        for (JsonNode qNode : root) {
            if (!qNode.isObject()) {
                continue;
            }

            String qText = qNode.path("question").asText("").trim();
            String answer = qNode.path("answer").asText("").trim();
            String explanation = qNode.path("explanation").asText("").trim();
            JsonNode rawOptions = qNode.path("options");
            if (!rawOptions.isArray()) {
                continue;
            }

            List<String> options = new ArrayList<>();
            for (JsonNode option : rawOptions) {
                String value = option.asText("").trim();
                if (!value.isEmpty()) {
                    options.add(value);
                }
            }

            if (qText.isEmpty() || options.size() < 2 || answer.isEmpty()) {
                continue;
            }

            String matchedAnswer = resolveMatchingAnswer(answer, options);
            if (matchedAnswer == null) {
                log.warn("Réponse '{}' non réconciliée avec les options {} pour la question '{}'", answer, options, qText);
                continue;
            }

            if (explanation.isEmpty()) {
                explanation = "La bonne réponse est : " + matchedAnswer;
            }

            questions.add(new GeneratedQuestion(qText, options, matchedAnswer, explanation));
            if (questions.size() >= expectedCount) {
                break;
            }
        }

        if (questions.size() < expectedCount) {
            log.error("Nombre insuffisant de questions validées : {}/{} attendues. Contenu brut : {}",
                    questions.size(), expectedCount, rawJson);
            throw invalidGeneratedQuiz();
        }

        return questions;
    }

    private String resolveMatchingAnswer(String answer, List<String> options) {
        if (answer == null || options == null) return null;
        String trimmed = answer.trim();

        // 1. Égalité exacte insensible à la casse
        for (String opt : options) {
            if (opt.equalsIgnoreCase(trimmed)) {
                return opt;
            }
        }

        // 2. Si answer est une lettre simple (ex: "A", "A.", "A)", "B")
        String letterOnly = trimmed.replaceAll("[^A-Za-z]", "").toUpperCase();
        if (letterOnly.length() == 1) {
            char targetChar = letterOnly.charAt(0);
            for (String opt : options) {
                String optTrim = opt.trim();
                if (optTrim.toUpperCase().startsWith(targetChar + ".")
                        || optTrim.toUpperCase().startsWith(targetChar + ")")
                        || optTrim.toUpperCase().startsWith(targetChar + " ")) {
                    return opt;
                }
            }
        }

        // 3. Si l'option commence par une lettre "A. Text" et que answer est "Text"
        for (String opt : options) {
            String stripped = opt.replaceFirst("^[A-Da-d][\\.\\)\\s]+", "").trim();
            if (!stripped.isEmpty() && stripped.equalsIgnoreCase(trimmed)) {
                return opt;
            }
        }

        // 4. Correspondance par sous-chaîne
        for (String opt : options) {
            String stripped = opt.replaceFirst("^[A-Da-d][\\.\\)\\s]+", "").trim();
            if (!stripped.isEmpty() && (stripped.toLowerCase().contains(trimmed.toLowerCase())
                    || trimmed.toLowerCase().contains(stripped.toLowerCase()))) {
                return opt;
            }
        }

        return null;
    }

    private AIServiceUnavailableException invalidGeneratedQuiz() {
        return new AIServiceUnavailableException("Le service de génération a renvoyé un questionnaire incomplet. Veuillez réessayer.");
    }

    private String cleanJsonString(String raw) {
        if (raw == null) return "[]";
        String s = raw.trim();
        int firstBracket = s.indexOf('[');
        int lastBracket = s.lastIndexOf(']');
        if (firstBracket != -1 && lastBracket > firstBracket) {
            return s.substring(firstBracket, lastBracket + 1).trim();
        }
        int firstBrace = s.indexOf('{');
        int lastBrace = s.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace > firstBrace) {
            return s.substring(firstBrace, lastBrace + 1).trim();
        }
        if (s.startsWith("```json")) s = s.substring(7);
        else if (s.startsWith("```")) s = s.substring(3);
        if (s.endsWith("```")) s = s.substring(0, s.length() - 3);
        return s.trim();
    }

    private List<Map<String, Object>> parseStepsList(String json, String defaultTopic) {
        try {
            String cleaned = cleanJsonString(json);
            return objectMapper.readValue(cleaned, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return List.of(
                    Map.of("stepIndex", 0, "title", "Fondamentaux de " + defaultTopic, "description", "Assimilation des concepts clés et terminologies", "estimatedMinutes", 45),
                    Map.of("stepIndex", 1, "title", "Méthodologie & Théorie", "description", "Étude des approches conceptuelles", "estimatedMinutes", 60),
                    Map.of("stepIndex", 2, "title", "Applications pratiques", "description", "Cas d'usage et mise en œuvre", "estimatedMinutes", 90),
                    Map.of("stepIndex", 3, "title", "Validation des acquis", "description", "Quiz récapitulatif et évaluation finale", "estimatedMinutes", 30)
            );
        }
    }

    private List<Map<String, Object>> parseGeneratedStepsList(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            if (root == null || !root.isArray() || root.size() < 4 || root.size() > 5) {
                throw invalidGeneratedLearningPath();
            }

            List<Map<String, Object>> steps = objectMapper.convertValue(root, new TypeReference<>() {});
            for (int i = 0; i < steps.size(); i++) {
                Map<String, Object> step = steps.get(i);
                Object index = step.get("stepIndex");
                Object minutes = step.get("estimatedMinutes");
                Object concepts = step.get("keyConcepts");
                if (!(index instanceof Number stepIndex) || !Double.isFinite(stepIndex.doubleValue())
                        || stepIndex.doubleValue() != i
                        || isBlank(step.get("title")) || isBlank(step.get("description"))
                        || !(minutes instanceof Number estimatedMinutes) || !Double.isFinite(estimatedMinutes.doubleValue())
                        || estimatedMinutes.doubleValue() < 1 || estimatedMinutes.doubleValue() != Math.rint(estimatedMinutes.doubleValue())
                        || !(concepts instanceof List<?> keyConcepts) || keyConcepts.isEmpty()
                        || keyConcepts.stream().anyMatch(concept -> !(concept instanceof String text) || text.isBlank())) {
                    throw invalidGeneratedLearningPath();
                }
            }
            return steps;
        } catch (AIServiceUnavailableException e) {
            throw e;
        } catch (Exception e) {
            throw invalidGeneratedLearningPath();
        }
    }

    private boolean isBlank(Object value) {
        return !(value instanceof String text) || text.isBlank();
    }

    private AIServiceUnavailableException invalidGeneratedLearningPath() {
        return new AIServiceUnavailableException("Le service de génération a renvoyé un parcours incomplet. Veuillez réessayer.");
    }

    private QuizDTO toQuizDTO(Quiz q, List<QuizQuestion> questions, boolean showAnswer) {
        List<QuestionDTO> qDtos = questions.stream().map(qn -> {
            List<String> opts = Collections.emptyList();
            try {
                if (qn.getOptions() != null) {
                    opts = objectMapper.readValue(qn.getOptions(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}

            return QuestionDTO.builder()
                    .id(qn.getId())
                    .question(qn.getQuestion())
                    .options(opts)
                    .answer(showAnswer ? qn.getAnswer() : null)
                    .explanation(showAnswer ? qn.getExplanation() : null)
                    .position(qn.getPosition())
                    .build();
        }).toList();

        return QuizDTO.builder()
                .id(q.getId())
                .publicationId(q.getPublication() != null ? q.getPublication().getId() : null)
                .publicationTitle(q.getPublication() != null ? q.getPublication().getTitle() : null)
                .topic(q.getTopic())
                .type(q.getType())
                .passingScore(QUIZ_PASSING_SCORE_PERCENT)
                .questions(qDtos)
                .createdAt(q.getCreatedAt())
                .build();
    }

    private List<Integer> completedStepIndexes(List<LearningProgress> progress, int totalSteps) {
        return progress.stream()
                .filter(item -> Boolean.TRUE.equals(item.getCompleted()))
                .map(LearningProgress::getStepIndex)
                .filter(index -> index != null && index >= 0 && index < totalSteps)
                .distinct()
                .sorted()
                .toList();
    }

    private LearningPathDTO toLearningPathDTO(LearningPath p, List<Map<String, Object>> steps, List<Integer> completedStepIndexes) {
        int total = steps.size();
        int completedCount = completedStepIndexes.size();
        float pct = total > 0 ? ((float) completedCount / total) * 100.0f : 0f;

        return LearningPathDTO.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .title(p.getTitle())
                .topic(p.getTopic())
                .steps(steps)
                .isActive(p.getIsActive())
                .completedSteps(completedCount)
                .completedStepIndexes(completedStepIndexes)
                .totalSteps(total)
                .progressPercentage(pct)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private record GeneratedQuestion(String question, List<String> options, String answer, String explanation) {}
}
