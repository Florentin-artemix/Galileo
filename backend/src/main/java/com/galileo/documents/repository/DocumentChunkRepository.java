package com.galileo.documents.repository;

import com.galileo.documents.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);
    Optional<DocumentChunk> findByDocumentIdAndChunkIndex(Long documentId, Integer chunkIndex);
    void deleteByDocumentId(Long documentId);
}
