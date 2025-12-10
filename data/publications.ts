import type { Publication } from '../types';

// Note: PDF URLs have been updated to reflect a correct and systematic file structure,
// resolving previous 404 errors. The download and viewer functionalities are now fully operational.

export const publications: Publication[] = [
  {
    id: 1,
    title: {
      fr: "Simulation et analyse des performances d'un système d'excitation de génératrice synchrone: Cas du modèle IEEE de type ST1A",
      en: "Simulation and Performance Analysis of a Synchronous Generator Excitation System: Case of the IEEE ST1A Model",
    },
    authors: ['ACHIZA MUSHAGALUSA Josué'],
    date: '2025-11-20',
    domain: {
      fr: 'Électricité',
      en: 'Electricity',
    },
    summary: {
      fr: "Analyse approfondie de la stabilité, la rapidité, la précision et l'amortissement d'un régulateur de tension pour génératrice synchrone, en utilisant le modèle IEEE ST1A pour assurer la qualité et la fiabilité du système.",
      en: "In-depth analysis of the stability, speed, precision, and damping of a voltage regulator for a synchronous generator, using the IEEE ST1A model to ensure system quality and reliability.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_34-41.pdf',
    imageUrl: 'https://picsum.photos/seed/pub1/600/400',
    tags: ['Génératrice synchrone', 'IEEE ST1A', 'MATLAB/SIMULINK', 'Stabilité du réseau'],
  },
  {
    id: 2,
    title: {
      fr: "Évolution et environnement : Défis majeurs de l'Afrique en développement",
      en: "Evolution and Environment: Major Challenges for Africa in Development",
    },
    authors: ["ONESIA Marcelline M'Runagana"],
    date: '2025-11-18',
    domain: {
      fr: 'Environnement',
      en: 'Environment',
    },
    summary: {
      fr: "Exposé des problèmes majeurs auxquels l'Afrique en développement est confrontée, et les défis liés à la montée technologique et à la préservation de l'environnement.",
      en: "An overview of the major problems facing developing Africa, and the challenges related to technological growth and environmental preservation.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_51-53.pdf',
    imageUrl: 'https://picsum.photos/seed/pub2/600/400',
    tags: ['Développement durable', 'Afrique', 'Écosystèmes', 'Politiques environnementales'],
  },
   {
    id: 3,
    title: {
      fr: "Ingénieure en devenir: «Défis d'une étudiante dans un monde masculinisé»",
      en: "Engineer in the Making: Challenges of a Female Student in a Masculinized World",
    },
    authors: ['Ekutsu MOSEKA Ketsia'],
    date: '2025-11-15',
    domain: {
      fr: 'Société & Ingénierie',
      en: 'Society & Engineering',
    },
    summary: {
      fr: "Exploration des réalités et défis des étudiantes en Polytechnique dans un domaine encore perçu comme masculin, et mise en lumière de parcours inspirants de femmes congolaises.",
      en: "Exploration of the realities and challenges of female students in Polytechnic in a field still perceived as male, and highlighting the inspiring paths of Congolese women.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_58-59.pdf',
    imageUrl: 'https://picsum.photos/seed/pub3/600/400',
    tags: ['Témoignage', 'Diversité', 'Ingénierie', 'Femmes en STEM'],
  },
  {
    id: 4,
    title: {
      fr: "De l'interrupteur à l'intelligence: évolution des installations électriques des bâtiments et défis transitionnels pour la RDC",
      en: "From Switch to Intelligence: Evolution of Electrical Installations in Buildings and Transitional Challenges for the DRC",
    },
    authors: ['Costa KONINJILA TRESOR'],
    date: '2025-11-12',
    domain: {
      fr: 'Électricité',
      en: 'Electricity',
    },
    summary: {
      fr: "Analyse de l'intégration des systèmes de Gestion Technique des Bâtiments (GTB) pour augmenter l'efficacité énergétique en RDC, face aux défis de sa situation énergétique.",
      en: "Analysis of the integration of Building Management Systems (BMS) to increase energy efficiency in the DRC, facing the challenges of its energy situation.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_46-49.pdf',
    imageUrl: 'https://picsum.photos/seed/pub4/600/400',
    tags: ['GTB', 'Systèmes intelligents', 'Efficacité énergétique', 'RDC'],
  },
   {
    id: 5,
    title: {
      fr: "Briquettes de biomasse : combustibles essentiels pour la préservation de notre biosphère",
      en: "Biomass Briquettes: Essential Fuels for the Preservation of Our Biosphere",
    },
    authors: ['Ivan Wazena MUTANGILWA', 'Moïse Efuna MADIDI'],
    date: '2025-11-10',
    domain: {
      fr: 'Environnement',
      en: 'Environment',
    },
    summary: {
      fr: "Présentation d'une technique innovante pour obtenir des combustibles non polluants (briquettes de biomasse) à partir d'une source d'énergie inépuisable afin de préserver l'environnement.",
      en: "Presentation of an innovative technique for obtaining non-polluting fuels (biomass briquettes) from a renewable energy source to preserve the environment.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_2-4.pdf',
    imageUrl: 'https://picsum.photos/seed/pub16/600/400',
    tags: ['Biomasse', 'Énergie durable', 'Combustibles', 'Biosphère'],
  },
  {
    id: 6,
    title: {
      fr: "Effets des perturbations climatiques sur les systèmes géo-miniers au Maniema",
      en: "Effects of Climate Disturbances on Geo-mining Systems in Maniema",
    },
    authors: ['MUHASANYA Abela', 'MUTOMBO KASHIKU Hardy'],
    date: '2025-11-08',
    domain: {
      fr: 'Mines & Géologie',
      en: 'Mining & Geology',
    },
    summary: {
      fr: "Analyse des impacts du changement climatique sur l'exploitation minière artisanale au Maniema, incluant l'érosion, la déforestation et les risques pour les mineurs, avec des propositions de solutions d'adaptation.",
      en: "Analysis of the impacts of climate change on artisanal mining in Maniema, including erosion, deforestation, and risks to miners, with proposals for adaptation solutions.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_14-19.pdf',
    imageUrl: 'https://picsum.photos/seed/pub5/600/400',
    tags: ['Changement climatique', 'Exploitation minière', 'Érosion', 'Maniema'],
  },
  {
    id: 7,
    title: {
      fr: "Entropie et Dilatation Temporelle",
      en: "Entropy and Time Dilation",
    },
    authors: ['Typhon MORISHO', 'Gilbert BEMWIZ', 'Emmanuel MAMBO'],
    date: '2025-11-05',
    domain: {
      fr: 'Physique appliquée',
      en: 'Applied Physics',
    },
    summary: {
      fr: "Exploration du lien entre l'entropie et la dilatation temporelle via une approche combinée de la thermodynamique statistique et de la relativité, validée par des simulations numériques.",
      en: "Exploration of the link between entropy and time dilation through a combined approach of statistical thermodynamics and relativity, validated by numerical simulations.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_66-75.pdf',
    imageUrl: 'https://picsum.photos/seed/pub6/600/400',
    tags: ['Entropie', 'Dilatation temporelle', 'Thermodynamique', 'Relativité'],
  },
  {
    id: 8,
    title: {
      fr: "Infodynamique : modélisation physique des flux informationnels dans les systèmes computationnels",
      en: "Infodynamics: Physical Modeling of Informational Flows in Computational Systems",
    },
    authors: ['Gilbert BEMWIZ'],
    date: '2025-11-02',
    domain: {
      fr: 'Informatique',
      en: 'Computer Science',
    },
    summary: {
      fr: "Proposition d'un cadre théorique, l'infodynamique, unifiant physique et informatique pour modéliser les transformations dynamiques de l'information dans les systèmes computationnels.",
      en: "Proposal of a theoretical framework, infodynamics, unifying physics and computer science to model the dynamic transformations of information in computational systems.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_76-87.pdf',
    imageUrl: 'https://picsum.photos/seed/pub7/600/400',
    tags: ['Infodynamique', 'Temps computationnel', 'Modélisation physique', 'Systèmes complexes'],
  },
  {
    id: 9,
    title: {
      fr: "La Couleur oubliée: l'étonnant pouvoir d'un levier stratégique entre science, perception et ingénierie silencieuse",
      en: "The Forgotten Color: The Astonishing Power of a Strategic Lever Between Science, Perception, and Silent Engineering",
    },
    authors: ['Carlos Nlandu MENGI'],
    date: '2025-10-30',
    domain: {
      fr: 'Innovation/Design',
      en: 'Innovation/Design',
    },
    summary: {
      fr: "Exploration des raisons de la sous-estimation de la couleur en ingénierie, et comment elle peut être réintégrée comme un levier stratégique pour optimiser les performances techniques et le confort humain.",
      en: "Exploration of the reasons for the underestimation of color in engineering, and how it can be reintegrated as a strategic lever to optimize technical performance and human comfort.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_92-98.pdf', 
    imageUrl: 'https://picsum.photos/seed/pub8/600/400',
    tags: ['Couleur', 'Perception', 'Ingénierie', 'Design', 'Ergonomie'],
  },
  {
    id: 10,
    title: {
      fr: "Développement durable en Electro-énergie: vers une gestion écologique et responsable",
      en: "Sustainable Development in Electro-energy: Towards Ecological and Responsible Management",
    },
    authors: ['LUNDA MWENYEMALI Jeannette'],
    date: '2025-10-28',
    domain: {
      fr: 'Énergie & Environnement',
      en: 'Energy & Environment',
    },
    summary: {
      fr: "Témoignage et analyse sur la nécessité d'intégrer l'écoconception, l'efficacité énergétique et la gestion durable dans les projets d'électro-énergie pour un avenir plus responsable.",
      en: "Testimony and analysis on the need to integrate ecodesign, energy efficiency, and sustainable management in electro-energy projects for a more responsible future.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_54-56.pdf',
    imageUrl: 'https://picsum.photos/seed/pub9/600/400',
    tags: ["Développement durable", "Écoconception", "Efficacité énergétique", "Énergies renouvelables"],
  },
  {
    id: 11,
    title: {
      fr: "Résilience numérique : parcours d'un autodidacte technophile en zone à faible connectivité",
      en: "Digital Resilience: Journey of a Technophile Self-learner in a Low-Connectivity Area",
    },
    authors: ['Gilbert BEMWIZ'],
    date: '2025-10-25',
    domain: {
      fr: 'Société & Ingénierie',
      en: 'Society & Engineering',
    },
    summary: {
      fr: "Portrait d'un autodidacte technophile en Afrique, mettant en lumière la résilience et l'ingéniosité nécessaires pour innover dans un environnement à faible connectivité.",
      en: "Portrait of a technophile self-learner in Africa, highlighting the resilience and ingenuity needed to innovate in a low-connectivity environment.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_59-64.pdf',
    imageUrl: 'https://picsum.photos/seed/pub10/600/400',
    tags: ['Résilience numérique', 'Autodidacte', 'Fracture numérique', 'Innovation'],
  },
   {
    id: 12,
    title: {
      fr: "Derrière les préjugés sur la filière Polytechnique: Mythe, méfiance sociale et quête de sens scientifique",
      en: "Behind the Prejudices about the Polytechnic Field: Myth, Social Distrust, and Quest for Scientific Meaning",
    },
    authors: ['BAISINA NDEBA Constance'],
    date: '2025-10-22',
    domain: {
      fr: 'Société & Ingénierie',
      en: 'Society & Engineering',
    },
    summary: {
      fr: "Réflexion sur les stéréotypes entourant la filière polytechnique, son rôle social et scientifique, et la manière de redorer l'image de ce domaine d'étude.",
      en: "A reflection on the stereotypes surrounding the polytechnic field, its social and scientific role, and how to improve the image of this field of study.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_102-104.pdf',
    imageUrl: 'https://picsum.photos/seed/pub11/600/400',
    tags: ['Évolution', 'Ingénierie', 'Stéréotypes', 'Société'],
  },
  {
    id: 13,
    title: {
      fr: "Proposition d'un système de chasse d'eau automatique adapté aux réalités locales : cas des zones sans électricité dans la ville de Kindu",
      en: "Proposal of an Automatic Toilet Flushing System Adapted to Local Realities: Case of Areas without Electricity in the City of Kindu",
    },
    authors: ['Yemba LUKABYA Roger'],
    date: '2025-10-20',
    domain: {
      fr: 'Innovation Technologique',
      en: 'Technological Innovation',
    },
    summary: {
      fr: "Conception d'un système de chasse d'eau automatique alimenté par piles, avec un montage électronique pour élever la tension, afin de garantir l'hygiène dans les zones sans électricité.",
      en: "Design of a battery-powered automatic flushing system with an electronic circuit to boost the voltage, ensuring hygiene in areas without electricity.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_30-33.pdf',
    imageUrl: 'https://picsum.photos/seed/pub12/600/400',
    tags: ['Hygiène', 'Système autonome', 'Électronique', 'Low-tech'],
  },
  {
    id: 14,
    title: {
      fr: "Impact de l'analyse de données massives sur l'exploitation des réseaux électriques intelligents - LES BIG DATA",
      en: "Impact of Big Data Analysis on the Operation of Smart Grids - BIG DATA",
    },
    authors: ['MWANZA MULUMBA Harley'],
    date: '2025-10-18',
    domain: {
      fr: 'Informatique',
      en: 'Computer Science',
    },
    summary: {
      fr: "Analyse de l'impact transformateur des Big Data Analytics sur l'exploitation des réseaux électriques intelligents, optimisant la production, le transport, la distribution et l'utilisation de l'énergie.",
      en: "Analysis of the transformative impact of Big Data Analytics on the operation of smart grids, optimizing the production, transport, distribution, and use of energy.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_20-23.pdf',
    imageUrl: 'https://picsum.photos/seed/pub13/600/400',
    tags: ['Big Data', 'Réseaux intelligents', 'Smart Grids', 'Analyse de données'],
  },
  {
    id: 15,
    title: {
      fr: "Application de la maintenance prédictive basée sur l'intelligence artificielle sur les machines tournantes industrielles",
      en: "Application of Predictive Maintenance Based on Artificial Intelligence on Industrial Rotating Machines",
    },
    authors: ['AKONKWA BIRINDWA Didier', 'MULIMBANYA MURHAMBO Vainqueur', 'KADIATA NZENGEJI Anis'],
    date: '2025-10-15',
    domain: {
      fr: 'Informatique',
      en: 'Computer Science',
    },
    summary: {
      fr: "Développement d'un modèle mathématique en MATLAB pour anticiper les défaillances de machines tournantes industrielles via l'intelligence artificielle, illustré par un cas pratique.",
      en: "Development of a mathematical model in MATLAB to predict failures of industrial rotating machines using artificial intelligence, illustrated by a practical case.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_43-45.pdf',
    imageUrl: 'https://picsum.photos/seed/pub14/600/400',
    tags: ['Maintenance prédictive', 'Intelligence Artificielle', 'MATLAB', 'Machines tournantes'],
  },
  {
    id: 16,
    title: {
      fr: "La fréquence, un concept aux mille visages entre électricité, informatique, acoustique et vibration",
      en: "Frequency, a Concept with a Thousand Faces Between Electricity, Computer Science, Acoustics, and Vibration",
    },
    authors: ['AGISHA Daniel Gloire', 'Prince KANYATA'],
    date: '2025-10-12',
    domain: {
      fr: 'Physique appliquée',
      en: 'Applied Physics',
    },
    summary: {
      fr: "Analyse comparative de l'influence et des implications de la fréquence dans les domaines de l'électricité, l'informatique, l'acoustique et la vibration, soulignant son rôle transversal.",
      en: "A comparative analysis of the influence and implications of frequency in the fields of electricity, computer science, acoustics, and vibration, highlighting its cross-disciplinary role.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_99-100.pdf',
    imageUrl: 'https://picsum.photos/seed/pub15/600/400',
    tags: ['Fréquence', 'Traitement du signal', 'Acoustique', 'Vibration', 'Interdisciplinaire'],
  },
  {
    id: 17,
    title: {
      fr: "L'informatique et l'avocat : étude isomorphique pour une compréhension métaphorique des systèmes numériques",
      en: "Computer Science and the Avocado: An Isomorphic Study for a Metaphorical Understanding of Digital Systems",
    },
    authors: ['Gilbert BEMWIZ'],
    date: '2025-10-10',
    domain: {
      fr: 'Informatique',
      en: 'Computer Science',
    },
    summary: {
      fr: "Proposition d'une analogie biomorphique innovante (peau, chair, noyau de l'avocat) pour éclairer les fonctions clés des systèmes informatiques : protection, usage et création.",
      en: "Proposal of an innovative biomorphic analogy (skin, flesh, pit of the avocado) to clarify the key functions of computer systems: protection, usage, and creation.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_88-91.pdf',
    imageUrl: 'https://picsum.photos/seed/pub17/600/400',
    tags: ['Biomimétisme', 'Métaphore', 'Pédagogie', 'Cybersécurité'],
  },
  {
    id: 18,
    title: {
      fr: "Micro-réseau, un concept important dans l'implémentation des réseaux intelligents-SMART GRID",
      en: "Microgrid, an Important Concept in the Implementation of Smart Grids",
    },
    authors: ['MWANZA MULUMBA Harley'],
    date: '2025-10-08',
    domain: {
      fr: 'Électricité',
      en: 'Electricity',
    },
    summary: {
      fr: "Exploration détaillée du concept des micro-réseaux, leur définition, composantes, types, et les mécanismes de régulation et de protection associés dans le contexte des Smart Grids.",
      en: "Detailed exploration of the microgrid concept, their definition, components, types, and the associated regulation and protection mechanisms in the context of Smart Grids.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_24-29.pdf',
    imageUrl: 'https://picsum.photos/seed/pub18/600/400',
    tags: ['Micro-réseau', 'Smart Grid', 'Réseaux intelligents', 'Énergies renouvelables'],
  },
  {
    id: 19,
    title: {
      fr: "Développement d'un système intelligent de prédiction de défaillances et de consommation énergétique dans un réseau hybride",
      en: "Development of an Intelligent System for Predicting Failures and Energy Consumption in a Hybrid Network",
    },
    authors: ['LEON MUSHI Gloire', 'MUNKWA CIBENDA Obed', 'MWANZA MULUMBA Harley'],
    date: '2025-10-05',
    domain: {
      fr: 'Informatique',
      en: 'Computer Science',
    },
    summary: {
      fr: "Développement d'un système basé sur le Machine Learning pour la prédiction des défaillances et de la consommation dans un réseau énergétique hybride, utilisant des données synthétiques.",
      en: "Development of a Machine Learning-based system for predicting failures and consumption in a hybrid energy network, using synthetic data.",
    },
    pdfUrl: '/GALILEO_2025_vol_1_num_01_5-13.pdf',
    imageUrl: 'https://picsum.photos/seed/pub19/600/400',
    tags: ['Machine Learning', 'Réseau hybride', 'Prédiction', 'Apprentissage supervisé'],
  },
];