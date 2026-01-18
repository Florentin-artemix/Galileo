import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublications } from '../contexts/PublicationsContext';
import { useAuth } from '../contexts/AuthContext';
import { publicationsService } from '../src/services/publicationsService';
import { analyticsService } from '../src/services/analyticsService';
import { readingHistoryService } from '../src/services/readingHistoryService';
import type { Publication } from '../types';
import PdfViewer from '../components/PdfViewer';
import FavoriteButton from '../components/FavoriteButton';
import SimilarPublications from '../components/SimilarPublications';
import ReadingProgress from '../components/ReadingProgress';

// Composant pour le bouton de téléchargement avec enregistrement et tracking
const DownloadButton: React.FC<{ publicationId: number; title?: string }> = ({ publicationId, title }) => {
  const { translations } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await publicationsService.getDownloadUrl(publicationId);
      
      // Tracker le téléchargement pour analytics
      await analyticsService.trackDownload(publicationId, title || `publication-${publicationId}`, 'pdf');
      
      // Ouvrir le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = '';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError('Erreur lors du téléchargement');
      console.error('Erreur téléchargement:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-block bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-3 px-6 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '⏳ Téléchargement...' : translations.publications_page.download_pdf}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </>
  );
};

const SinglePublicationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, translations } = useLanguage();
  const { publications } = usePublications();
  const { isAuthenticated } = useAuth();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPublication = async () => {
      if (!id) return;
      
      // Essayer d'abord de trouver dans le contexte (déjà chargé)
      const cachedPub = publications.find(p => p.id.toString() === id);
      if (cachedPub) {
        setPublication(cachedPub);
        setLoading(false);
        // Tracker la vue et l'historique
        trackView(cachedPub.id, cachedPub.title[language]);
        return;
      }

      // Sinon, charger depuis l'API
      try {
        setLoading(true);
        const dto = await publicationsService.getPublicationById(parseInt(id));
        const pub = publicationsService.dtoToPublication(dto);
        setPublication(pub);
        // Tracker la vue et l'historique
        trackView(pub.id, pub.title[language]);
      } catch (err) {
        console.error('Erreur lors du chargement de la publication:', err);
        setError('Publication non trouvée');
      } finally {
        setLoading(false);
      }
    };

    loadPublication();
  }, [id, publications]);

  // Tracker la vue pour analytics et historique
  const trackView = async (pubId: number, title: string) => {
    try {
      await Promise.all([
        analyticsService.trackPublicationView(pubId, title),
        isAuthenticated ? readingHistoryService.recordReading(pubId) : Promise.resolve()
      ]);
    } catch (err) {
      console.debug('Tracking error:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !publication) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-poppins font-bold text-light-text dark:text-off-white">Publication non trouvée</h1>
        <NavLink to="/publications" className="text-light-accent dark:text-teal mt-4 inline-block">Retour aux publications</NavLink>
      </div>
    );
  }

  const relatedPublications = publications.filter(p => p.domain[language] === publication.domain[language] && p.id !== publication.id).slice(0, 3);

  return (
    <div className="animate-slide-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Contenu principal */}
          <div className="flex-1">
            <div className="max-w-4xl bg-light-card dark:bg-navy/30 border border-light-border dark:border-dark-border rounded-lg p-6 sm:p-8 shadow-2xl dark:shadow-teal/10 overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <p className="text-light-accent dark:text-teal font-bold">{publication.domain[language]}</p>
                {/* Bouton Favori */}
                {isAuthenticated && (
                  <FavoriteButton publicationId={publication.id} size="lg" />
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-4 text-light-text dark:text-off-white break-words">{publication.title[language]}</h1>
              <p className="text-light-text-secondary dark:text-gray-400 mb-2">
                  <strong>Auteurs :</strong> {publication.authors.join(', ')}
              </p>
              <p className="text-light-text-secondary dark:text-gray-400 mb-6">
                  <strong>Date de publication :</strong> {new Date(publication.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                  {publication.tags.map(tag => (
                      <span key={tag} className="bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal text-xs font-medium px-2.5 py-0.5 rounded-full">{tag}</span>
                  ))}
              </div>

              <div className="prose prose-lg max-w-none text-light-text-secondary dark:text-gray-300 prose-headings:font-poppins prose-headings:text-light-text dark:prose-headings:text-off-white overflow-hidden">
                  <h2 className="text-2xl font-poppins font-bold border-b border-light-border dark:border-dark-border pb-2 mb-4">Résumé</h2>
                  <p className="break-words whitespace-pre-wrap">{publication.summary[language]}</p>
              </div>

              <div className="mt-12 border-t border-light-border dark:border-dark-border pt-8">
                  <h2 className="text-2xl font-poppins font-bold mb-6 text-light-text dark:text-off-white">{translations.publications_page.consult_article}</h2>
                  {publication.pdfUrl ? (
                      <>
                          <div className="mb-6 flex flex-wrap gap-4 items-center">
                              <DownloadButton publicationId={publication.id} />
                              {isAuthenticated && (
                                <FavoriteButton publicationId={publication.id} showLabel />
                              )}
                          </div>
                          {/* Progression de lecture */}
                          {isAuthenticated && (
                            <ReadingProgress publicationId={publication.id} className="mb-6" />
                          )}
                          <PdfViewer fileUrl={publication.pdfUrl} />
                      </>
                  ) : (
                      <p className="text-gray-500">{translations.publications_page.pdf_not_available}</p>
                  )}
              </div>
            </div>
          </div>

          {/* Sidebar - Publications similaires */}
          <div className="lg:w-80 flex-shrink-0">
            <SimilarPublications publicationId={publication.id} limit={5} className="sticky top-24" />
          </div>
        </div>

        {relatedPublications.length > 0 && (
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-poppins font-bold mb-6 text-light-text dark:text-off-white">Articles similaires</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPublications.map(pub => (
                <NavLink key={pub.id} to={`/publication/${pub.id}`} className="block bg-light-card dark:bg-navy/50 p-4 rounded-lg border border-light-border dark:border-dark-border transform hover:-translate-y-1 transition-transform duration-300 shadow-lg hover:shadow-xl dark:hover:shadow-teal/20">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-poppins font-bold text-base line-clamp-2 text-light-text dark:text-off-white">{pub.title[language]}</h3>
                    {isAuthenticated && <FavoriteButton publicationId={pub.id} size="sm" />}
                  </div>
                  <p className="text-xs text-light-accent dark:text-teal">{pub.authors.join(', ')}</p>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePublicationPage;