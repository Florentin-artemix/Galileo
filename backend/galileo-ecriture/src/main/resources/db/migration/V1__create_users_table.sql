-- Table pour stocker les utilisateurs synchronisés avec Firebase
-- Permet de lister les utilisateurs sans avoir besoin de Firebase Admin SDK
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(128) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    disabled BOOLEAN NOT NULL DEFAULT FALSE,
    creation_time TIMESTAMP,
    last_sign_in_time TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);


