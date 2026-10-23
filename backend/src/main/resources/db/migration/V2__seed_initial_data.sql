-- ═══════════════════════════════════════════════════
-- GALILEO v3.0 - DONNÉES INITIALES (INSTITUTION & DOMAINES)
-- V2__seed_initial_data.sql
-- ═══════════════════════════════════════════════════

-- 1. Institution principale : Faculté Polytechnique - Université Mapon
INSERT INTO institutions (name, short_name, country, city, website)
VALUES (
    'Faculté Polytechnique - Université Mapon',
    'UPOLY',
    'République Démocratique du Congo',
    'Kindu',
    'https://universitemapon.ac.cd'
) ON CONFLICT DO NOTHING;

-- 2. Domaines d'ingénierie et de recherche
INSERT INTO domains (name, slug, description)
VALUES 
    ('Génie Informatique & Intelligence Artificielle', 'genie-informatique', 'Systèmes logiciels, réseaux, cybersécurité, science des données et IA appliquée'),
    ('Génie Électrique & Énergie', 'genie-electrique', 'Électrotechnique, énergies renouvelables, réseaux électriques et automatismes'),
    ('Génie Mécanique & Matériaux', 'genie-mecanique', 'Conception mécanique, robotique, mécatronique et résistance des matériaux'),
    ('Génie des Mines & Géologie', 'genie-des-mines', 'Exploitation minière durable, géotechnique, minéralogie et hydrologie'),
    ('Génie des Procédés & Métallurgie', 'genie-metallurgie', 'Traitement des minerais, métallurgie extractive et procédés chimiques'),
    ('Génie Civil & Environnement', 'genie-civil', 'Infrastructures, hydraulique, transport et impact environnemental')
ON CONFLICT (slug) DO NOTHING;
