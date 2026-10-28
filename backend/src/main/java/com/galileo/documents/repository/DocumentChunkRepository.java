package com.galileo.documents.repository;

import com.galileo.documents.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);
    Optional<DocumentChunk> findByDocumentIdAndChunkIndex(Long documentId, Integer chunkIndex);

    @Modifying
    @Transactional
    void deleteByDocumentId(Long documentId);
}
