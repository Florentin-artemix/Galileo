package com.galileo.documents.repository;

import com.galileo.documents.entity.DocumentEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentEmbeddingRepository extends JpaRepository<DocumentEmbedding, Long> {
    Optional<DocumentEmbedding> findByChunkIdAndModel(Long chunkId, String model);
    List<DocumentEmbedding> findByChunkId(Long chunkId);
    void deleteByChunkId(Long chunkId);

    @Modifying
    @Query("DELETE FROM DocumentEmbedding de WHERE de.chunk.id IN (SELECT dc.id FROM DocumentChunk dc WHERE dc.document.id = :documentId)")
    void deleteByDocumentId(@Param("documentId") Long documentId);
}
