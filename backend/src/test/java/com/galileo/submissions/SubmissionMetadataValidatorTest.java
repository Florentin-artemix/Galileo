package com.galileo.submissions;

import com.galileo.common.exception.BadRequestException;
import com.galileo.submissions.service.SubmissionMetadataValidator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SubmissionMetadataValidatorTest {

    @Test
    void acceptsTitleAndSummaryWithinTheFormLimits() {
        assertDoesNotThrow(() -> SubmissionMetadataValidator.validate("Étude", "a".repeat(250)));
        assertDoesNotThrow(() -> SubmissionMetadataValidator.validate("Étude", "a".repeat(500)));
    }

    @Test
    void rejectsBlankTitle() {
        assertThrows(BadRequestException.class,
                () -> SubmissionMetadataValidator.validate("  ", "a".repeat(250)));
    }

    @Test
    void rejectsSummaryOutsideTheFormLimits() {
        assertThrows(BadRequestException.class,
                () -> SubmissionMetadataValidator.validate("Étude", "a".repeat(249)));
        assertThrows(BadRequestException.class,
                () -> SubmissionMetadataValidator.validate("Étude", "a".repeat(501)));
    }
}
