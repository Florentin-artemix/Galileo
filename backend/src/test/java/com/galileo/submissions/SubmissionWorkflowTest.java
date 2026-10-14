package com.galileo.submissions;

import com.galileo.auth.entity.Role;
import com.galileo.auth.entity.User;
import com.galileo.auth.repository.UserRepository;
import com.galileo.notifications.entity.Notification;
import com.galileo.notifications.repository.NotificationRepository;
import com.galileo.publications.entity.Publication;
import com.galileo.publications.entity.PublicationStatus;
import com.galileo.publications.repository.PublicationRepository;
import com.galileo.submissions.entity.Submission;
import com.galileo.submissions.entity.SubmissionStatus;
import com.galileo.submissions.repository.SubmissionRepository;
import com.galileo.submissions.service.SubmissionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionWorkflowTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private PublicationRepository publicationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private SubmissionService submissionService;

    @Test
    @DisplayName("Validating a submission should approve submission, publish publication, and notify author")
    void testValidateSubmissionWorkflow() {
        User author = User.builder().id(10L).email("author@mapon.cd").role(Role.STUDENT).build();
        User reviewer = User.builder().id(2L).email("staff@mapon.cd").role(Role.STAFF).build();

        Publication publication = Publication.builder()
                .id(100L)
                .title("Étude sur les alliages métalliques")
                .status(PublicationStatus.DRAFT)
                .build();

        Submission submission = Submission.builder()
                .id(50L)
                .publication(publication)
                .submittedBy(author)
                .status(SubmissionStatus.PENDING)
                .build();

        when(submissionRepository.findById(50L)).thenReturn(Optional.of(submission));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reviewer));

        Map<String, Object> result = submissionService.validateSubmission(50L, 2L, "Excellent travail académique");

        assertNotNull(result);
        assertEquals(SubmissionStatus.ACCEPTED, submission.getStatus());
        assertEquals("Excellent travail académique", submission.getReviewerNotes());
        assertEquals(reviewer, submission.getReviewer());

        // La publication doit être passée à PUBLISHED
        assertEquals(PublicationStatus.PUBLISHED, publication.getStatus());
        assertNotNull(publication.getPublishedAt());

        verify(publicationRepository).save(publication);
        verify(submissionRepository).save(submission);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Rejecting a submission should update status and notify author with justification")
    void testRejectSubmissionWorkflow() {
        User author = User.builder().id(10L).email("author@mapon.cd").role(Role.STUDENT).build();
        User reviewer = User.builder().id(2L).email("staff@mapon.cd").role(Role.STAFF).build();

        Publication publication = Publication.builder()
                .id(101L)
                .title("Mémoire non conforme")
                .status(PublicationStatus.DRAFT)
                .build();

        Submission submission = Submission.builder()
                .id(51L)
                .publication(publication)
                .submittedBy(author)
                .status(SubmissionStatus.PENDING)
                .build();

        when(submissionRepository.findById(51L)).thenReturn(Optional.of(submission));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reviewer));

        Map<String, Object> result = submissionService.rejectSubmission(51L, 2L, "Format bibliographique manquant");

        assertNotNull(result);
        assertEquals(SubmissionStatus.REJECTED, submission.getStatus());
        assertEquals("Format bibliographique manquant", submission.getReviewerNotes());

        verify(submissionRepository).save(submission);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    @DisplayName("Requesting revision should update status to REVISION_REQUESTED and notify author")
    void testRequestRevisionWorkflow() {
        User author = User.builder().id(10L).email("author@mapon.cd").role(Role.STUDENT).build();
        User reviewer = User.builder().id(2L).email("staff@mapon.cd").role(Role.STAFF).build();

        Publication publication = Publication.builder()
                .id(102L)
                .title("Recherche à perfectionner")
                .status(PublicationStatus.DRAFT)
                .build();

        Submission submission = Submission.builder()
                .id(52L)
                .publication(publication)
                .submittedBy(author)
                .status(SubmissionStatus.PENDING)
                .build();

        when(submissionRepository.findById(52L)).thenReturn(Optional.of(submission));
        when(userRepository.findById(2L)).thenReturn(Optional.of(reviewer));

        Map<String, Object> result = submissionService.requestRevision(52L, 2L, "Veuillez clarifier la méthodologie");

        assertNotNull(result);
        assertEquals(SubmissionStatus.REVISION_REQUESTED, submission.getStatus());
        assertEquals("Veuillez clarifier la méthodologie", submission.getReviewerNotes());

        verify(submissionRepository).save(submission);
        verify(notificationRepository).save(any(Notification.class));
    }
}
