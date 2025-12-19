-- Script d'initialisation des données pour Galileo
-- Insertion des publications depuis les données statiques

INSERT INTO publications (titre, resume, auteur_principal, co_auteurs, domaine, mots_cles, url_pdf, url_image_couverture, date_publication, date_creation, publiee, nombre_vues, nombre_telechargements)
VALUES 
(
    'Simulation et analyse des performances d''un système d''excitation de génératrice synchrone: Cas du modèle IEEE de type ST1A',
    'Analyse approfondie de la stabilité, la rapidité, la précision et l''amortissement d''un régulateur de tension pour génératrice synchrone, en utilisant le modèle IEEE ST1A pour assurer la qualité et la fiabilité du système.',
    'ACHIZA MUSHAGALUSA Josué',
    NULL,
    'Électricité',
    'Génératrice synchrone, IEEE ST1A, MATLAB/SIMULINK, Stabilité du réseau',
    '/GALILEO_2025_vol_1_num_01_34-41.pdf',
    'https://picsum.photos/seed/pub1/600/400',
    '2025-11-20 00:00:00',
    NOW(),
    true,
    0,
    0
),
(
    'Évolution et environnement : Défis majeurs de l''Afrique en développement',
    'Exposé des problèmes majeurs auxquels l''Afrique en développement est confrontée, et les défis liés à la montée technologique et à la préservation de l''environnement.',
    'ONESIA Marcelline M''Runagana',
    NULL,
    'Environnement',
    'Développement durable, Afrique, Écosystèmes, Politiques environnementales',
    '/GALILEO_2025_vol_1_num_01_51-53.pdf',
    'https://picsum.photos/seed/pub2/600/400',
    '2025-11-18 00:00:00',
    NOW(),
    true,
    0,
    0
),
(
    'Ingénieure en devenir: «Défis d''une étudiante dans un monde masculinisé»',
    'Exploration des réalités et défis des étudiantes en Polytechnique dans un domaine encore perçu comme masculin, et mise en lumière de parcours inspirants de femmes congolaises.',
    'Ekutsu MOSEKA Ketsia',
    NULL,
    'Société & Ingénierie',
    'Témoignage, Diversité, Ingénierie, Femmes en STEM',
    '/GALILEO_2025_vol_1_num_01_58-59.pdf',
    'https://picsum.photos/seed/pub3/600/400',
    '2025-11-15 00:00:00',
    NOW(),
    true,
    0,
    0
),
(
    'De l''interrupteur à l''intelligence: évolution des installations électriques des bâtiments et défis transitionnels pour la RDC',
    'Analyse de l''intégration des systèmes de Gestion Technique des Bâtiments (GTB) pour augmenter l''efficacité énergétique en RDC, face aux défis de sa situation énergétique.',
    'Costa KONINJILA TRESOR',
    NULL,
    'Électricité',
    'GTB, Systèmes intelligents, Efficacité énergétique, RDC',
    '/GALILEO_2025_vol_1_num_01_46-49.pdf',
    'https://picsum.photos/seed/pub4/600/400',
    '2025-11-12 00:00:00',
    NOW(),
    true,
    0,
    0
),
(
    'Briquettes de biomasse : combustibles essentiels pour la préservation de notre biosphère',
    'Présentation d''une technique innovante pour obtenir des combustibles non polluants (briquettes de biomasse) à partir d''une source d''énergie inépuisable afin de préserver l''environnement.',
    'Ivan Wazena MUTANGILWA',
    'Moïse Efuna MADIDI',
    'Environnement',
    'Biomasse, Énergie renouvelable, Durabilité, Innovation verte',
    '/GALILEO_2025_vol_1_num_01_42-45.pdf',
    'https://picsum.photos/seed/pub5/600/400',
    '2025-11-10 00:00:00',
    NOW(),
    true,
    0,
    0
),
(
    'Optimisation des réseaux électriques par intelligence artificielle',
    'Étude sur l''application des algorithmes d''apprentissage automatique pour optimiser la distribution d''énergie électrique dans les zones urbaines.',
    'Jean-Pierre KABONGO',
    'Marie LUKUSA',
    'Électricité',
    'IA, Réseaux électriques, Optimisation, Smart Grid',
    '/GALILEO_2025_vol_1_num_01_60-65.pdf',
    'https://picsum.photos/seed/pub6/600/400',
    '2025-11-08 00:00:00',
    NOW(),
    true,
    0,
    0
),
(
    'Gestion durable des ressources hydriques au Kivu',
    'Analyse des défis et solutions pour une gestion durable de l''eau dans la région du Kivu, face aux changements climatiques.',
    'Patience AMANI',
    NULL,
    'Environnement',
    'Eau, Kivu, Climat, Gestion durable',
    '/GALILEO_2025_vol_1_num_01_66-70.pdf',
    'https://picsum.photos/seed/pub7/600/400',
    '2025-11-05 00:00:00',
    NOW(),
    true,
    0,
    0
),
(
    'Conception d''un système de surveillance de la qualité de l''air',
    'Développement d''un capteur IoT pour mesurer et surveiller la pollution atmosphérique en temps réel dans les zones industrielles.',
    'Patrick MULAMBA',
    'Sarah NDAYE',
    'Électronique',
    'IoT, Capteurs, Qualité air, Pollution',
    '/GALILEO_2025_vol_1_num_01_71-75.pdf',
    'https://picsum.photos/seed/pub8/600/400',
    '2025-11-02 00:00:00',
    NOW(),
    true,
    0,
    0
);

-- Vérification
SELECT COUNT(*) as total_publications FROM publications;
