-- Migration pour ajouter les tables feedback et audit_logs
-- À exécuter sur la base de données galileo_ecriture

-- Table pour les feedbacks de modération
CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGSERIAL PRIMARY KEY,
    soumission_id BIGINT NOT NULL,
    moderator_email VARCHAR(255) NOT NULL,
    moderator_name VARCHAR(255),
    commentaire TEXT,
    statut VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_feedback_soumission 
        FOREIGN KEY (soumission_id) 
        REFERENCES soumissions(id) 
        ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_feedbacks_soumission_id ON feedbacks(soumission_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_moderator_email ON feedbacks(moderator_email);
CREATE INDEX IF NOT EXISTS idx_feedbacks_statut ON feedbacks(statut);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- Table pour l'audit logging
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Ajouter des commentaires pour la documentation
COMMENT ON TABLE feedbacks IS 'Table pour stocker les feedbacks de modération sur les soumissions';
COMMENT ON COLUMN feedbacks.is_internal IS 'TRUE = visible seulement par STAFF/ADMIN, FALSE = visible par STUDENT';
COMMENT ON COLUMN feedbacks.statut IS 'APPROVED, REJECTED, REVISION_REQUESTED, INTERNAL_NOTE';

COMMENT ON TABLE audit_logs IS 'Table pour l''audit logging des actions administratives';
COMMENT ON COLUMN audit_logs.action IS 'Type d''action: CREATE, UPDATE, DELETE, APPROVE, REJECT, etc.';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type de ressource: USER, SOUMISSION, PUBLICATION, etc.';
COMMENT ON COLUMN audit_logs.details IS 'Détails de l''action au format JSON';

-- Vérifier l'état des tables
SELECT 
    'feedbacks' as table_name,
    COUNT(*) as row_count 
FROM feedbacks
UNION ALL
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as row_count 
FROM audit_logs;
