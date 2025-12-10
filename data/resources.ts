import type { ResourceCategory } from '../types';

export const resourcesData: ResourceCategory[] = [
  {
    title: {
      fr: 'Modèles & Templates',
      en: 'Models & Templates',
    },
    description: {
      fr: 'Utilisez nos modèles officiels pour formater votre manuscrit selon les standards de la revue.',
      en: 'Use our official templates to format your manuscript according to the journal\'s standards.',
    },
    items: [
      {
        name: { fr: 'Modèle d\'article (LaTeX)', en: 'Article Template (LaTeX)' },
        description: { fr: 'Archive .zip contenant le template LaTeX complet avec la classe de style Galileo et un exemple.', en: '.zip archive containing the full LaTeX template with the Galileo style class and an example.' },
        url: '/resources/GALILEO_Template_LaTeX.zip',
        format: 'LaTeX',
      },
      {
        name: { fr: 'Modèle d\'article (Word)', en: 'Article Template (Word)' },
        description: { fr: 'Document .docx pré-formaté avec les styles de titres, de paragraphes et de citations recommandés.', en: 'Pre-formatted .docx document with recommended styles for titles, paragraphs, and citations.' },
        url: '/resources/GALILEO_Template_Word.docx',
        format: 'Word',
      },
    ],
  },
  {
    title: {
      fr: 'Guides de Rédaction',
      en: 'Writing Guides',
    },
    description: {
      fr: 'Consultez nos guides pour améliorer la clarté, la structure et l\'impact de votre article.',
      en: 'Consult our guides to improve the clarity, structure, and impact of your article.',
    },
    items: [
      {
        name: { fr: 'Guide de Style (IEEE)', en: 'Style Guide (IEEE)' },
        description: { fr: 'Résumé des normes de citation et de référencement IEEE à respecter dans votre manuscrit.', en: 'Summary of the IEEE citation and referencing standards to follow in your manuscript.' },
        url: '/resources/GALILEO_Guide_Style_IEEE.pdf',
        format: 'PDF',
      },
      {
        name: { fr: 'Checklist de Soumission', en: 'Submission Checklist' },
        description: { fr: 'Document interactif pour vérifier que votre soumission est complète avant de l\'envoyer.', en: 'Interactive document to ensure your submission is complete before sending it.' },
        url: '/resources/GALILEO_Checklist.pdf',
        format: 'PDF',
      },
      {
        name: { fr: 'Principes d\'Éthique', en: 'Ethical Principles' },
        description: { fr: 'Rappel de nos standards en matière d\'originalité, de plagiat et d\'intégrité scientifique.', en: 'Reminder of our standards regarding originality, plagiarism, and scientific integrity.' },
        url: '/about#ethics',
        format: 'Lien Web',
      },
    ],
  },
  {
    title: {
      fr: 'Outils Recommandés',
      en: 'Recommended Tools',
    },
    description: {
      fr: 'Une sélection d\'outils pour la gestion de références, la vérification grammaticale et la création de figures.',
      en: 'A selection of tools for reference management, grammar checking, and figure creation.',
    },
    items: [
      {
        name: { fr: 'Zotero', en: 'Zotero' },
        description: { fr: 'Outil gratuit et open-source pour collecter, organiser, citer et partager vos sources de recherche.', en: 'Free, open-source tool to collect, organize, cite, and share your research sources.' },
        url: 'https://www.zotero.org/',
        format: 'Externe',
      },
      {
        name: { fr: 'Grammarly', en: 'Grammarly' },
        description: { fr: 'Assistant d\'écriture basé sur l\'IA pour vérifier la grammaire, l\'orthographe et le style (utile pour les auteurs non-natifs).', en: 'AI-powered writing assistant to check grammar, spelling, and style (useful for non-native authors).' },
        url: 'https://www.grammarly.com/',
        format: 'Externe',
      },
       {
        name: { fr: 'BioRender', en: 'BioRender' },
        description: { fr: 'Plateforme en ligne pour créer des figures scientifiques professionnelles, des schémas et des illustrations.', en: 'Online platform to create professional scientific figures, diagrams, and illustrations.' },
        url: 'https://www.biorender.com/',
        format: 'Externe',
      },
    ],
  },
  {
    title: {
      fr: 'Liens Utiles',
      en: 'Useful Links',
    },
    description: {
      fr: 'Accédez rapidement à des bases de données de recherche et des archives ouvertes.',
      en: 'Quickly access research databases and open archives.',
    },
    items: [
      {
        name: { fr: 'Google Scholar', en: 'Google Scholar' },
        description: { fr: 'Moteur de recherche de Google qui indexe le texte intégral ou les métadonnées de la littérature scientifique.', en: 'Google\'s search engine that indexes the full text or metadata of scholarly literature.' },
        url: 'https://scholar.google.com/',
        format: 'Externe',
      },
      {
        name: { fr: 'arXiv.org', en: 'arXiv.org' },
        description: { fr: 'Archive ouverte pour les prépublications scientifiques dans les domaines de la physique, des mathématiques, de l\'informatique, etc.', en: 'Open archive for scientific preprints in physics, mathematics, computer science, etc.' },
        url: 'https://arxiv.org/',
        format: 'Externe',
      },
      {
        name: { fr: 'Connected Papers', en: 'Connected Papers' },
        description: { fr: 'Outil visuel pour explorer les articles académiques et découvrir les travaux les plus pertinents dans un domaine.', en: 'A visual tool to explore academic papers and discover the most relevant works in a field.' },
        url: 'https://www.connectedpapers.com/',
        format: 'Externe',
      },
    ],
  },
];