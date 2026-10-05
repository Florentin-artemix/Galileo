package com.galileo.documents.repository;

import com.galileo.documents.entity.Document;
import com.galileo.documents.entity.DocumentProcessingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByPublicationId(Long publicationId);
    Optional<Document> findByPublicationIdAndVersion(Long publicationId, Integer version);
    List<Document> findByProcessingStatus(DocumentProcessingStatus status);
}
