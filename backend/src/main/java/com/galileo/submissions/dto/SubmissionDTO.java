package com.galileo.submissions.dto;

import com.galileo.submissions.entity.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDTO {
    private Long id;
    private Long publicationId;
    private String publicationTitle;
    private Long submittedById;
    private String submittedByEmail;
    private SubmissionStatus status;
    private Long reviewerId;
    private String reviewerNotes;
    private String aiAnalysis;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
}
