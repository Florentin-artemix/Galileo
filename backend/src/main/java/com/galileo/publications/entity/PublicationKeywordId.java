package com.galileo.publications.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicationKeywordId implements Serializable {

    @Column(name = "publication_id")
    private Long publicationId;

    @Column(name = "keyword_id")
    private Long keywordId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PublicationKeywordId that = (PublicationKeywordId) o;
        return Objects.equals(publicationId, that.publicationId) && Objects.equals(keywordId, that.keywordId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(publicationId, keywordId);
    }
}
