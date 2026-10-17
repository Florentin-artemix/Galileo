import apiClient from './apiService';
import type { ResourceCategory } from '../types';

export const resourcesService = {
  /**
   * Récupère la liste dynamique des ressources académiques et guides officiels
   */
  async getResources(): Promise<ResourceCategory[]> {
    try {
      const response = await apiClient.get('/content/resources');
      return response.data;
    } catch (err) {
      console.warn('Fallback fetching resources via content API:', err);
      // Fallback gracieux en cas de déconnexion réseau
      return [
        {
          title: { fr: 'Modèles & Templates', en: 'Models & Templates' },
          description: {
            fr: 'Utilisez nos modèles officiels pour formater votre manuscrit selon les standards de la revue.',
            en: "Use our official templates to format your manuscript according to the journal standards."
          },
          items: [
            {
              name: { fr: "Modèle d'article (LaTeX)", en: 'Article Template (LaTeX)' },
              description: {
                fr: 'Archive .zip contenant le template LaTeX complet avec la classe de style Galileo et un exemple.',
                en: '.zip archive containing the full LaTeX template with the Galileo style class and an example.'
              },
              url: '/resources/GALILEO_Template_LaTeX.zip',
              format: 'LaTeX'
            },
            {
              name: { fr: "Modèle d'article (Word)", en: 'Article Template (Word)' },
              description: {
                fr: 'Document .docx pré-formaté avec les styles de titres, de paragraphes et de citations recommandés.',
                en: 'Pre-formatted .docx document with recommended styles for titles, paragraphs, and citations.'
              },
              url: '/resources/GALILEO_Template_Word.docx',
              format: 'Word'
            }
          ]
        }
      ];
    }
  }
};
