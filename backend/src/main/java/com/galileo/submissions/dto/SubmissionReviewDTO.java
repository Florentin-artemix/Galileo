package com.galileo.submissions.dto;

import com.galileo.submissions.entity.SubmissionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionReviewDTO {

    @NotNull(message = "Review status is required")
    private SubmissionStatus status;

    private String reviewerNotes;
}
