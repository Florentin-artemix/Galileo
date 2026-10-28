-- ============================================================================
-- GALILEO — V5 : Corrections de compatibilité PostgreSQL, Hibernate 6 & Contraintes FK
-- ============================================================================

-- 1. Alignement des colonnes FLOAT (float8 / DOUBLE PRECISION en PostgreSQL)
--    avec le type Java Float (REAL / float4 attendu par Hibernate 6 ddl-auto=validate)
ALTER TABLE reading_history
    ALTER COLUMN progress TYPE REAL USING progress::real;

ALTER TABLE recommendations
    ALTER COLUMN score TYPE REAL USING score::real;

ALTER TABLE quiz_attempts
    ALTER COLUMN score TYPE REAL USING score::real;

-- 2. Dédoublonnage et contrainte d'unicité sur reading_history(user_id, publication_id)
--    pour éviter IncorrectResultSizeDataAccessException lors de findByUserIdAndPublicationId
DELETE FROM reading_history a
USING reading_history b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.publication_id = b.publication_id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_reading_history_user_publication'
    ) THEN
        ALTER TABLE reading_history
            ADD CONSTRAINT uq_reading_history_user_publication UNIQUE (user_id, publication_id);
    END IF;
END $$;

-- 3. Correction des clés étrangères vers publications(id) pour éviter les blocages
--    PSQLException (23503) lors de la suppression d'une publication
ALTER TABLE analytics_events
    DROP CONSTRAINT IF EXISTS analytics_events_publication_id_fkey,
    ADD CONSTRAINT analytics_events_publication_id_fkey
        FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE SET NULL;

ALTER TABLE ai_conversations
    DROP CONSTRAINT IF EXISTS ai_conversations_publication_id_fkey,
    ADD CONSTRAINT ai_conversations_publication_id_fkey
        FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE SET NULL;

ALTER TABLE quizzes
    DROP CONSTRAINT IF EXISTS quizzes_publication_id_fkey,
    ADD CONSTRAINT quizzes_publication_id_fkey
        FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE;

-- 4. Correction des clés étrangères vers domains(id) pour permettre la suppression
--    propre d'un domaine par l'administration sans violation de contrainte FK
ALTER TABLE publications
    DROP CONSTRAINT IF EXISTS publications_domain_id_fkey,
    ADD CONSTRAINT publications_domain_id_fkey
        FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL;

ALTER TABLE followed_topics
    DROP CONSTRAINT IF EXISTS followed_topics_domain_id_fkey,
    ADD CONSTRAINT followed_topics_domain_id_fkey
        FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE;

ALTER TABLE domains
    DROP CONSTRAINT IF EXISTS domains_parent_id_fkey,
    ADD CONSTRAINT domains_parent_id_fkey
        FOREIGN KEY (parent_id) REFERENCES domains(id) ON DELETE SET NULL;
