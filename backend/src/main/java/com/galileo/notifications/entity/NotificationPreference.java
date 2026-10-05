package com.galileo.notifications.entity;

import com.galileo.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "submission")
    @Builder.Default
    private Boolean submission = true;

    @Column(name = "validation")
    @Builder.Default
    private Boolean validation = true;

    @Column(name = "publication")
    @Builder.Default
    private Boolean publication = true;

    @Column(name = "comment")
    @Builder.Default
    private Boolean comment = true;

    @Column(name = "recommendation")
    @Builder.Default
    private Boolean recommendation = true;

    @Column(name = "ai_processing")
    @Builder.Default
    private Boolean aiProcessing = true;

    @Column(name = "follow_update")
    @Builder.Default
    private Boolean followUpdate = true;

    @PrePersist
    protected void onCreate() {
        if (this.submission == null) this.submission = true;
        if (this.validation == null) this.validation = true;
        if (this.publication == null) this.publication = true;
        if (this.comment == null) this.comment = true;
        if (this.recommendation == null) this.recommendation = true;
        if (this.aiProcessing == null) this.aiProcessing = true;
        if (this.followUpdate == null) this.followUpdate = true;
    }
}
