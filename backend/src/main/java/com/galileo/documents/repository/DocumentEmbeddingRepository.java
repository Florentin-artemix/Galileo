package com.galileo.documents.repository;

import com.galileo.documents.entity.DocumentEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentEmbeddingRepository extends JpaRepository<DocumentEmbedding, Long> {
    Optional<DocumentEmbedding> findByChunkIdAndModel(Long chunkId, String model);
    List<DocumentEmbedding> findByChunkId(Long chunkId);
}
