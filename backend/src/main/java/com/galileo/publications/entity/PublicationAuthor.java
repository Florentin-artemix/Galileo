package com.galileo.publications.entity;

import com.galileo.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "publication_authors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicationAuthor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publication_id", nullable = false)
    private Publication publication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "author_name", length = 200)
    private String authorName;

    @Column(name = "role", length = 50)
    @Builder.Default
    private String role = "AUTHOR";

    @Column(name = "position")
    @Builder.Default
    private Integer position = 0;
}
