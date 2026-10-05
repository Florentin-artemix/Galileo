-- ═══════════════════════════════════════════════════
-- GALILEO v3.0 - SCHEMA RELATIONNEL POSTGRESQL (36 TABLES)
-- V1__init_schema.sql
-- ═══════════════════════════════════════════════════

-- Extension vectorielle pgvector pour les embeddings sémantiques (dimension 1024)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── 1. INSTITUTIONS ───
CREATE TABLE institutions (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(300) NOT NULL,
    short_name  VARCHAR(50),
    country     VARCHAR(100),
    city        VARCHAR(100),
    website     VARCHAR(500),
    logo_url    VARCHAR(500),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─── 2. USERS ───
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    is_active       BOOLEAN DEFAULT TRUE,
    email_verified  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_user_role CHECK (role IN ('STUDENT', 'RESEARCHER', 'TEACHER', 'STAFF', 'ADMIN'))
);

-- ─── 3. REFRESH TOKENS ───
CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(500) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked = FALSE;

-- ─── 4. PASSWORD RESET TOKENS ───
CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(500) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─── 5. EMAIL VERIFICATION TOKENS ───
CREATE TABLE email_verification_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(500) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─── 6. USER PROFILES ───
CREATE TABLE user_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    display_name    VARCHAR(200),
    bio             TEXT,
    avatar_url      VARCHAR(500),
    institution_id  BIGINT REFERENCES institutions(id),
    department      VARCHAR(200),
    program         VARCHAR(200),
    academic_year   VARCHAR(50),
    level           VARCHAR(50),
    interests       TEXT[],
    website_url     VARCHAR(500),
    orcid           VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 7. DOMAINS ───
CREATE TABLE domains (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    slug        VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    parent_id   BIGINT REFERENCES domains(id),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─── 8. KEYWORDS ───
CREATE TABLE keywords (
    id      BIGSERIAL PRIMARY KEY,
    label   VARCHAR(100) UNIQUE NOT NULL,
    slug    VARCHAR(100) UNIQUE NOT NULL
);

-- ─── 9. PUBLICATIONS ───
CREATE TABLE publications (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) UNIQUE NOT NULL,
    abstract_text   TEXT,
    type            VARCHAR(50) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    access_level    VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    domain_id       BIGINT REFERENCES domains(id),
    institution_id  BIGINT REFERENCES institutions(id),
    language        VARCHAR(10) DEFAULT 'fr',
    published_at    TIMESTAMP,
    academic_year   VARCHAR(20),
    supervisor      VARCHAR(200),
    methodology     TEXT,
    doi             VARCHAR(100),
    license         VARCHAR(100),
    references_text TEXT,
    view_count      INTEGER DEFAULT 0,
    download_count  INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_publication_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT chk_publication_access CHECK (access_level IN ('PUBLIC', 'PRIVATE', 'INSTITUTIONAL', 'RESTRICTED'))
);

-- ─── 10. PUBLICATION AUTHORS ───
CREATE TABLE publication_authors (
    id              BIGSERIAL PRIMARY KEY,
    publication_id  BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    user_id         BIGINT REFERENCES users(id),
    author_name     VARCHAR(200),
    role            VARCHAR(50) DEFAULT 'AUTHOR',
    position        INTEGER DEFAULT 0,
    CONSTRAINT chk_author_identity CHECK (user_id IS NOT NULL OR author_name IS NOT NULL)
);

-- ─── 11. PUBLICATION KEYWORDS ───
CREATE TABLE publication_keywords (
    publication_id  BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    keyword_id      BIGINT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    PRIMARY KEY (publication_id, keyword_id)
);

-- ─── 12. SUBMISSIONS ───
CREATE TABLE submissions (
    id              BIGSERIAL PRIMARY KEY,
    publication_id  BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    submitted_by    BIGINT NOT NULL REFERENCES users(id),
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reviewer_id     BIGINT REFERENCES users(id),
    reviewer_notes  TEXT,
    ai_analysis     JSONB,
    submitted_at    TIMESTAMP DEFAULT NOW(),
    reviewed_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_submission_status CHECK (status IN ('PENDING', 'ANALYZING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'))
);

-- ─── 13. DOCUMENTS ───
CREATE TABLE documents (
    id                  BIGSERIAL PRIMARY KEY,
    publication_id      BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    file_name           VARCHAR(500),
    file_key            VARCHAR(500) NOT NULL,
    file_size           BIGINT,
    mime_type           VARCHAR(100),
    page_count          INTEGER,
    extracted_text      TEXT,
    processing_status   VARCHAR(50) NOT NULL DEFAULT 'UPLOADED',
    processing_error    TEXT,
    version             INTEGER DEFAULT 1,
    processed_at        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_document_processing CHECK (processing_status IN ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

-- ─── 14. DOCUMENT CHUNKS ───
CREATE TABLE document_chunks (
    id              BIGSERIAL PRIMARY KEY,
    document_id     BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,
    content         TEXT NOT NULL,
    page_start      INTEGER,
    page_end        INTEGER,
    token_count     INTEGER,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

-- ─── 15. DOCUMENT EMBEDDINGS (pgvector 1024) ───
CREATE TABLE document_embeddings (
    id          BIGSERIAL PRIMARY KEY,
    chunk_id    BIGINT NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
    embedding   vector(1024),
    model       VARCHAR(100) NOT NULL DEFAULT 'text-embedding-v4',
    provider    VARCHAR(100) NOT NULL DEFAULT 'qwen-cloud',
    dimension   INTEGER NOT NULL DEFAULT 1024,
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(chunk_id, model)
);

-- ─── 16. FAVORITES ───
CREATE TABLE favorites (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    publication_id  BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, publication_id)
);

-- ─── 17. READING HISTORY ───
CREATE TABLE reading_history (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    publication_id      BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    last_page           INTEGER,
    progress            FLOAT DEFAULT 0,
    read_at             TIMESTAMP DEFAULT NOW(),
    duration_seconds    INTEGER
);

-- ─── 18. SEARCH HISTORY ───
CREATE TABLE search_history (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
    query           TEXT NOT NULL,
    filters         JSONB,
    result_count    INTEGER,
    searched_at     TIMESTAMP DEFAULT NOW()
);

-- ─── 19. FOLLOWED TOPICS ───
CREATE TABLE followed_topics (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic       VARCHAR(200) NOT NULL,
    domain_id   BIGINT REFERENCES domains(id),
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, topic)
);

-- ─── 20. FOLLOWED AUTHORS ───
CREATE TABLE followed_authors (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, followed_user_id),
    CONSTRAINT chk_no_self_follow CHECK (user_id != followed_user_id)
);

-- ─── 21. RECOMMENDATIONS ───
CREATE TABLE recommendations (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    publication_id  BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    reason          VARCHAR(200),
    score           FLOAT,
    is_seen         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 22. LEARNING PROFILES ───
CREATE TABLE learning_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    studied_topics  TEXT[],
    estimated_level VARCHAR(50),
    interests       TEXT[],
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 23. LEARNING PATHS ───
CREATE TABLE learning_paths (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(300),
    topic       VARCHAR(200),
    steps       JSONB NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─── 24. LEARNING PROGRESS ───
CREATE TABLE learning_progress (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    learning_path_id    BIGINT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    step_index          INTEGER,
    completed           BOOLEAN DEFAULT FALSE,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ─── 25. QUIZZES ───
CREATE TABLE quizzes (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id),
    publication_id  BIGINT REFERENCES publications(id),
    topic           VARCHAR(200),
    type            VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 26. QUIZ QUESTIONS ───
CREATE TABLE quiz_questions (
    id          BIGSERIAL PRIMARY KEY,
    quiz_id     BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    options     JSONB,
    answer      TEXT NOT NULL,
    explanation TEXT,
    position    INTEGER
);

-- ─── 27. QUIZ ATTEMPTS ───
CREATE TABLE quiz_attempts (
    id              BIGSERIAL PRIMARY KEY,
    quiz_id         BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers         JSONB NOT NULL,
    score           FLOAT,
    completed       BOOLEAN DEFAULT FALSE,
    attempted_at    TIMESTAMP DEFAULT NOW()
);

-- ─── 28. AI CONVERSATIONS ───
CREATE TABLE ai_conversations (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    publication_id  BIGINT REFERENCES publications(id),
    mode            VARCHAR(50) NOT NULL,
    title           VARCHAR(300),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_ai_mode CHECK (mode IN ('GENERAL', 'DOCUMENT', 'RESEARCH', 'LEARNING'))
);

-- ─── 29. AI MESSAGES ───
CREATE TABLE ai_messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_message_role CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM'))
);

-- ─── 30. AI INTERACTIONS ───
CREATE TABLE ai_interactions (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT REFERENCES users(id),
    interaction_type VARCHAR(20) NOT NULL,
    function_name    VARCHAR(100),
    provider         VARCHAR(100) NOT NULL,
    model            VARCHAR(100) NOT NULL,
    input_tokens     INTEGER,
    output_tokens    INTEGER,
    dimension        INTEGER,
    number_of_chunks INTEGER,
    estimated_cost   DECIMAL(10, 6),
    duration_ms      INTEGER,
    created_at       TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_interaction_type CHECK (interaction_type IN ('LLM', 'EMBEDDING'))
);

-- ─── 31. PUBLICATION SUMMARY CACHE ───
CREATE TABLE publication_summary_cache (
    id               BIGSERIAL PRIMARY KEY,
    publication_id   BIGINT NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
    summary_type     VARCHAR(50) NOT NULL,
    model            VARCHAR(100) NOT NULL,
    content          TEXT NOT NULL,
    document_version INTEGER NOT NULL,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE(publication_id, summary_type)
);

-- ─── 32. NOTIFICATIONS ───
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(300),
    message     TEXT,
    link        VARCHAR(500),
    is_read     BOOLEAN DEFAULT FALSE,
    data        JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ─── 33. NOTIFICATION PREFERENCES ───
CREATE TABLE notification_preferences (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission      BOOLEAN DEFAULT TRUE,
    validation      BOOLEAN DEFAULT TRUE,
    publication     BOOLEAN DEFAULT TRUE,
    comment         BOOLEAN DEFAULT TRUE,
    recommendation  BOOLEAN DEFAULT TRUE,
    ai_processing   BOOLEAN DEFAULT TRUE,
    follow_update   BOOLEAN DEFAULT TRUE
);

-- ─── 34. BLOG POSTS ───
CREATE TABLE blog_posts (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(300) NOT NULL,
    slug            VARCHAR(300) UNIQUE NOT NULL,
    content         TEXT,
    excerpt         TEXT,
    cover_url       VARCHAR(500),
    author_id       BIGINT REFERENCES users(id),
    is_published    BOOLEAN DEFAULT FALSE,
    published_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 35. EVENTS ───
CREATE TABLE events (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    location        VARCHAR(300),
    event_date      TIMESTAMP,
    end_date        TIMESTAMP,
    cover_url       VARCHAR(500),
    organizer       VARCHAR(200),
    is_published    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── 36. ANALYTICS EVENTS ───
CREATE TABLE analytics_events (
    id              BIGSERIAL PRIMARY KEY,
    event_type      VARCHAR(50) NOT NULL,
    user_id         BIGINT REFERENCES users(id),
    publication_id  BIGINT REFERENCES publications(id),
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ───
CREATE INDEX idx_embeddings_vector ON document_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_publications_fts ON publications
    USING gin(to_tsvector('french', coalesce(title, '') || ' ' || coalesce(abstract_text, '')));

CREATE INDEX idx_chunks_fts ON document_chunks
    USING gin(to_tsvector('french', content));

CREATE INDEX idx_analytics_type_date ON analytics_events (event_type, created_at);
CREATE INDEX idx_analytics_publication ON analytics_events (publication_id) WHERE publication_id IS NOT NULL;
