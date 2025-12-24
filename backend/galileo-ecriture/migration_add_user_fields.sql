-- Migration pour ajouter les champs name, program, motivation à la table users
-- À exécuter sur la base de données PostgreSQL du service écriture

-- Ajouter la colonne program si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'program'
    ) THEN
        ALTER TABLE users ADD COLUMN program VARCHAR(255);
    END IF;
END $$;

-- Ajouter la colonne motivation si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'motivation'
    ) THEN
        ALTER TABLE users ADD COLUMN motivation TEXT;
    END IF;
END $$;

-- Vérifier que display_name existe (devrait déjà exister)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE users ADD COLUMN display_name VARCHAR(255);
    END IF;
END $$;


