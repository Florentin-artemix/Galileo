ALTER TABLE ai_conversations
    ADD CONSTRAINT uq_ai_conversations_id_user UNIQUE (id, user_id);

CREATE TABLE ai_conversation_attachments (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    page_count INTEGER NOT NULL,
    extracted_characters INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ai_attachment_conversation_user
        FOREIGN KEY (conversation_id, user_id)
        REFERENCES ai_conversations (id, user_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ai_attachments_conversation_user
    ON ai_conversation_attachments (conversation_id, user_id, created_at);

CREATE TABLE ai_conversation_attachment_chunks (
    id BIGSERIAL PRIMARY KEY,
    attachment_id BIGINT NOT NULL REFERENCES ai_conversation_attachments(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1024),
    embedding_model VARCHAR(100),
    CONSTRAINT uq_ai_attachment_chunk UNIQUE (attachment_id, chunk_index)
);

CREATE INDEX idx_ai_attachment_chunks_attachment
    ON ai_conversation_attachment_chunks (attachment_id, chunk_index);

CREATE INDEX idx_ai_attachment_chunks_embedding
    ON ai_conversation_attachment_chunks USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;
