package com.galileo.learning.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "question", columnDefinition = "TEXT", nullable = false)
    private String question;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "JSONB")
    private String options;

    @Column(name = "answer", columnDefinition = "TEXT", nullable = false)
    private String answer;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "position")
    private Integer position;
}
