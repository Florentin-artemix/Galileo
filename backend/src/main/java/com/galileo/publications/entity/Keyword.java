package com.galileo.publications.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "keywords")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Keyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "label", nullable = false, unique = true, length = 100)
    private String label;

    @Column(name = "slug", nullable = false, unique = true, length = 100)
    private String slug;
}
