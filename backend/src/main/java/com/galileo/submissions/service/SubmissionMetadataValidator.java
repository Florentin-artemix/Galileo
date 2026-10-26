package com.galileo.submissions.service;

import com.galileo.common.exception.BadRequestException;

public final class SubmissionMetadataValidator {

    public static final int MIN_SUMMARY_LENGTH = 250;
    public static final int MAX_SUMMARY_LENGTH = 500;

    private SubmissionMetadataValidator() {
    }

    public static void validate(String title, String summary) {
        if (title == null || title.isBlank()) {
            throw new BadRequestException("Le titre du travail est obligatoire");
        }

        String trimmedSummary = summary == null ? "" : summary.trim();
        if (trimmedSummary.length() < MIN_SUMMARY_LENGTH || trimmedSummary.length() > MAX_SUMMARY_LENGTH) {
            throw new BadRequestException("Le résumé doit contenir entre 250 et 500 caractères");
        }
    }
}
