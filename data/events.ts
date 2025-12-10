
import type { Event } from '../types';

export const events: Event[] = [
  {
    id: 1,
    title: { fr: 'Atelier LaTeX', en: 'LaTeX Workshop' },
    date: '2025-09-05',
    type: { fr: 'Atelier', en: 'Workshop' },
    domain: { fr: 'Rédaction', en: 'Writing' },
    location: 'Kindu, Salle de conférence',
    summary: {
      fr: 'Formation pratique sur LaTeX : mise en page, équations, bibliographies et export PDF pour publications.',
      en: 'Practical training on LaTeX: layout, equations, bibliographies, and PDF export for publications.',
    },
    description: {
      fr: 'Cet atelier intensif a guidé les participants à travers les fondamentaux de LaTeX, l\'outil de composition de documents standard pour la recherche scientifique. De la structure de base d\'un document à la gestion complexe des équations mathématiques et des références bibliographiques, les étudiants ont acquis les compétences nécessaires pour produire des articles et des rapports d\'une qualité professionnelle irréprochable. La session s\'est conclue par des exercices pratiques de compilation de documents et des astuces pour optimiser le flux de travail.',
      en: 'This intensive workshop guided participants through the fundamentals of LaTeX, the standard document typesetting tool for scientific research. From basic document structure to complex management of mathematical equations and bibliographic references, students acquired the necessary skills to produce articles and reports of impeccable professional quality. The session concluded with practical exercises on document compilation and tips for optimizing workflow.',
    },
    speakers: [
      { name: 'Équipe Galileo', role: { fr: 'Designers & Rédacteurs', en: 'Designers & Editors' }, imageUrl: 'https://picsum.photos/seed/team1/100/100' }
    ],
    tags: ['LaTeX', 'Rédaction Scientifique', 'Outils'],
    imageUrl: 'https://picsum.photos/seed/event_latex/1200/800',
    photos: [
      'https://picsum.photos/seed/latex1/800/600',
      'https://picsum.photos/seed/latex2/800/600',
      'https://picsum.photos/seed/latex3/800/600',
    ],
    resources: [
      { name: 'Slides de présentation', url: '/fake-path/latex-slides.pdf', size: '2.5MB', format: 'PDF' },
      { name: 'Template d\'article Galileo', url: '/fake-path/template-galileo.zip', size: '450KB', format: 'ZIP' },
    ],
  },
  {
    id: 2,
    title: { fr: 'Formation Rédaction d’un article scientifique', en: 'Scientific Article Writing Training' },
    date: '2025-10-20',
    type: { fr: 'Atelier', en: 'Workshop' },
    domain: { fr: 'Rédaction', en: 'Writing' },
    location: 'Kindu, Bibliothèque universitaire',
    summary: {
      fr: 'Méthodologie IMRaD, structuration, relecture et soumission. Exercices pratiques.',
      en: 'IMRaD methodology, structuring, proofreading, and submission. Practical exercises.',
    },
    description: {
        fr: "La rédaction scientifique est un art qui exige clarté, précision et structure. Cette formation a couvert l'ensemble du processus de création d'un article de recherche, en se concentrant sur la structure IMRaD (Introduction, Méthodes, Résultats et Discussion). Les participants ont appris à formuler une problématique claire, à présenter leurs méthodes de manière reproductible, à analyser et visualiser leurs résultats, et à discuter de leurs implications. Des sessions interactives ont été consacrées aux techniques de relecture et aux stratégies pour une soumission réussie dans des revues à comité de lecture.",
        en: 'Scientific writing is an art that requires clarity, precision, and structure. This training covered the entire process of creating a research article, focusing on the IMRaD structure (Introduction, Methods, Results, and Discussion). Participants learned how to formulate a clear research question, present their methods in a reproducible manner, analyze and visualize their results, and discuss their implications. Interactive sessions were dedicated to proofreading techniques and strategies for successful submission to peer-reviewed journals.',
    },
    speakers: [
      { name: 'Leo Chen', role: { fr: 'Rédacteur en Chef', en: 'Editor-in-Chief' }, imageUrl: 'https://picsum.photos/seed/person2/100/100', linkedin: '#' }
    ],
    tags: ['Rédaction', 'IMRaD', 'Publication'],
    imageUrl: 'https://picsum.photos/seed/event_writing/1200/800',
    photos: [
      'https://picsum.photos/seed/writing1/800/600',
      'https://picsum.photos/seed/writing2/800/600',
    ],
    resources: [
       { name: 'Guide de style IMRaD', url: '/fake-path/imrad-guide.pdf', size: '1.2MB', format: 'PDF' },
       { name: 'Checklist de soumission', url: '/fake-path/submission-checklist.pdf', size: '300KB', format: 'PDF' },
    ],
  },
  {
    id: 3,
    title: { fr: 'Atelier IA & Python', en: 'AI & Python Workshop' },
    date: '2025-06-12',
    type: { fr: 'Atelier', en: 'Workshop' },
    domain: { fr: 'IA', en: 'AI' },
    location: 'En ligne (Zoom)',
    summary: {
      fr: 'Introduction aux pipelines ML, nettoyage, modélisation et déploiement simple en Python.',
      en: 'Introduction to ML pipelines, cleaning, modeling, and simple deployment in Python.',
    },
    description: {
        fr: "Cet atelier pratique a offert une introduction complète au Machine Learning avec Python. Les participants ont travaillé sur un projet de bout en bout, depuis l'importation et le nettoyage d'un jeu de données jusqu'à l'entraînement de plusieurs modèles prédictifs (régression, classification) et l'évaluation de leurs performances. Les bibliothèques clés de l'écosystème Data Science (Pandas, Scikit-learn, Matplotlib) ont été largement utilisées. L'atelier a également abordé les principes de base du déploiement de modèles via une simple API.",
        en: 'This hands-on workshop provided a comprehensive introduction to Machine Learning with Python. Participants worked on an end-to-end project, from importing and cleaning a dataset to training several predictive models (regression, classification) and evaluating their performance. Key libraries of the Data Science ecosystem (Pandas, Scikit-learn, Matplotlib) were extensively used. The workshop also covered the basic principles of model deployment via a simple API.',
    },
    speakers: [
       { name: 'Sophie Dubois', role: { fr: 'Éditrice spécialisée en IA', en: 'AI Specialist Editor' }, imageUrl: 'https://picsum.photos/seed/person5/100/100', linkedin: '#' }
    ],
    tags: ['IA', 'Python', 'Machine Learning'],
    imageUrl: 'https://picsum.photos/seed/event_python/1200/800',
    photos: [
      'https://picsum.photos/seed/python1/800/600',
      'https://picsum.photos/seed/python2/800/600',
      'https://picsum.photos/seed/python3/800/600',
      'https://picsum.photos/seed/python4/800/600',
    ],
    resources: [
      { name: 'Notebooks Jupyter', url: '/fake-path/ai-python-notebooks.zip', size: '5.7MB', format: 'ZIP' },
      { name: 'Datasets utilisés', url: '/fake-path/datasets.zip', size: '10.2MB', format: 'ZIP' },
    ],
  },
  {
    id: 4,
    title: { fr: 'Atelier Machine Learning (interne)', en: 'Machine Learning Workshop (Internal)' },
    date: '2025-11-18',
    type: { fr: 'Workshop', en: 'Workshop' },
    domain: { fr: 'ML', en: 'ML' },
    location: 'Laboratoire d\'informatique',
    summary: {
      fr: 'Approfondissement ML : architectures, évaluation, et bonnes pratiques pour projets étudiants.',
      en: 'Deep dive into ML: architectures, evaluation, and best practices for student projects.',
    },
    description: {
        fr: "Réservé aux membres actifs de GALILEO, cet atelier avancé a permis d'approfondir des concepts clés du Machine Learning. Les thèmes abordés incluaient l'ingénierie des features, la sélection de modèles, le réglage fin des hyperparamètres et les techniques de validation croisée. Une attention particulière a été portée aux bonnes pratiques pour structurer un projet ML, assurer la reproductibilité des résultats et éviter les biais courants. Les participants ont travaillé en petits groupes sur des cas d'étude complexes.",
        en: 'Reserved for active members of GALILEO, this advanced workshop provided a deep dive into key Machine Learning concepts. Topics covered included feature engineering, model selection, hyperparameter tuning, and cross-validation techniques. Special attention was paid to best practices for structuring an ML project, ensuring reproducibility of results, and avoiding common biases. Participants worked in small groups on complex case studies.',
    },
    speakers: [
       { name: 'Kenji Tanaka', role: { fr: 'Expert IA', en: 'AI Expert' }, imageUrl: 'https://picsum.photos/seed/person6/100/100' }
    ],
    tags: ['Machine Learning', 'Deep Learning', 'Bonnes Pratiques'],
    imageUrl: 'https://picsum.photos/seed/event_ml/1200/800',
    photos: [],
    resources: [],
  },
  {
    id: 5,
    title: { fr: 'Série de conférences IA & Innovation', en: 'AI & Innovation Conference Series' },
    date: '2025-05-15', // Using the first date for sorting
    type: { fr: 'Conférence', en: 'Conference' },
    domain: { fr: 'IA', en: 'AI' },
    location: 'Amphithéâtre A',
    summary: {
      fr: 'Conférences thématiques sur l\'impact de l\'IA et l\'innovation technologique en RDC, panels et retours d\'expérience.',
      en: 'Thematic conferences on the impact of AI and technological innovation in the DRC, panels, and experience sharing.',
    },
    description: {
        fr: "Cette série de conférences a rassemblé des étudiants, des académiques et des professionnels pour discuter du rôle transformateur de l'intelligence artificielle et de l'innovation en République Démocratique du Congo. Chaque session a abordé un thème spécifique, de l'IA dans la santé à son application dans l'agriculture et la gestion des ressources naturelles. Des panels de discussion ont permis d'échanger sur les défis locaux et les opportunités, tandis que des retours d'expérience d'entrepreneurs ont illustré le potentiel concret de la technologie pour le développement socio-économique.",
        en: 'This conference series brought together students, academics, and professionals to discuss the transformative role of artificial intelligence and innovation in the Democratic Republic of Congo. Each session addressed a specific theme, from AI in healthcare to its application in agriculture and natural resource management. Panel discussions facilitated exchanges on local challenges and opportunities, while testimonials from entrepreneurs illustrated the concrete potential of technology for socio-economic development.',
    },
    speakers: [
       { name: 'Dr. Elara Vance', role: { fr: 'Directrice', en: 'Director' }, imageUrl: 'https://picsum.photos/seed/person1/100/100' }
    ],
    tags: ['Conférence', 'IA', 'Innovation', 'RDC'],
    imageUrl: 'https://picsum.photos/seed/event_conf/1200/800',
    photos: [
        'https://picsum.photos/seed/conf1/800/600',
        'https://picsum.photos/seed/conf2/800/600',
        'https://picsum.photos/seed/conf3/800/600',
        'https://picsum.photos/seed/conf4/800/600',
        'https://picsum.photos/seed/conf5/800/600',
        'https://picsum.photos/seed/conf6/800/600',
    ],
    resources: [
        { name: 'Programme des conférences', url: '/fake-path/conference-program.pdf', size: '800KB', format: 'PDF' }
    ],
  },
];
