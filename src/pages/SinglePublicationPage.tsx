import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { analyticsService } from '../services/analyticsService';
import { documentsService, type DocumentDTO } from '../services/documentsService';
import { publicationsService } from '../services/publicationsService';
import { readingHistoryService } from '../services/readingHistoryService';
import type { Publication } from '../types';
import AIAssistantWidget from '../components/AIAssistantWidget';
import FavoriteButton from '../components/FavoriteButton';
import PdfViewer from '../components/PdfViewer';
import ReadingProgress from '../components/ReadingProgress';
import SimilarPublications from '../components/SimilarPublications';
import './publication-detail.css';

type DetailState = 'loading' | 'ready' | 'not-found';
type DocumentState = 'loading' | 'ready' | 'missing' | 'error';

const SinglePublicationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [detailState, setDetailState] = useState<DetailState>('loading');
  const [document, setDocument] = useState<DocumentDTO | null>(null);
  const [documentState, setDocumentState] = useState<DocumentState>('loading');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const publicationId = Number(id);
  const onPageChange = useCallback((page: number) => setCurrentPage(page), []);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(publicationId) || publicationId < 1) {
      setPublication(null);
      setDetailState('not-found');
      return () => { active = false; };
    }

    setPublication(null);
    setDocument(null);
    setDetailState('loading');
    setDocumentState('loading');
    setCurrentPage(1);

    publicationsService.getPublicationById(publicationId)
      .then(dto => {
        if (!active) return;
        const result = publicationsService.dtoToPublication(dto);
        setPublication(result);
        setDetailState('ready');
      })
      .catch(() => {
        if (active) setDetailState('not-found');
      });

    return () => { active = false; };
  }, [publicationId]);

  useEffect(() => {
    if (!publication) return;
    void Promise.all([
      analyticsService.trackPublicationView(publication.id, publication.title.fr || publication.title.en),
      isAuthenticated ? readingHistoryService.recordReading(publication.id) : Promise.resolve()
    ]).catch(() => undefined);
  }, [publication?.id, isAuthenticated]);

  useEffect(() => {
    let active = true;
    if (!publication) return () => { active = false; };

    setDocumentState('loading');
    documentsService.getDocumentForPublication(publication.id)
      .then(result => {
        if (!active) return;
        setDocument(result);
        setDocumentState('ready');
      })
      .catch(error => {
        if (!active) return;
        setDocument(null);
        setDocumentState(error?.response?.status === 404 ? 'missing' : 'error');
      });

    return () => { active = false; };
  }, [publication?.id]);

  useEffect(() => {
    if (document?.pageCount && document.pageCount > 0) {
      setCurrentPage(page => Math.min(page, document.pageCount!));
    }
  }, [document?.pageCount]);

  const title = useMemo(() => {
    if (!publication) return '';
    return publication.title[language] || publication.title.fr || publication.title.en || '';
  }, [language, publication]);
  const authors = useMemo(() => publication?.authors.filter(Boolean) ?? [], [publication]);
  const domain = publication?.domain[language] || publication?.domain.fr || publication?.domain.en || '';
  const abstract = publication?.summary[language] || publication?.summary.fr || publication?.summary.en || '';
  const publishedDate = publication?.date && Number.isFinite(Date.parse(publication.date))
    ? new Date(publication.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : '';
  const isFrench = language === 'fr';

  const downloadDocument = async () => {
    if (!document || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(false);
    try {
      const blob = await documentsService.getDocumentBlob(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName || `publication-${publication?.id}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      void publicationsService.recordDownload(publication!.id).catch(() => undefined);
      void analyticsService.trackDownload(publication!.id, title, 'pdf');
    } catch {
      setDownloadError(true);
    } finally {
      setIsDownloading(false);
    }
  };

  if (detailState === 'loading') {
    return <div className="publication-detail__status" role="status">{isFrench ? 'Chargement de la publication…' : 'Loading publication…'}</div>;
  }

  if (detailState === 'not-found' || !publication) {
    return (
      <div className="publication-detail__status publication-detail__status--error" role="alert">
        <h1>{isFrench ? 'Publication introuvable' : 'Publication not found'}</h1>
        <NavLink to="/publications">{isFrench ? 'Retour aux publications' : 'Back to publications'}</NavLink>
      </div>
    );
  }

  return (
    <div className="publication-detail">
      <div className="publication-detail__content">
        <nav className="publication-detail__breadcrumb" aria-label={isFrench ? 'Fil d’Ariane' : 'Breadcrumb'}>
          <NavLink to="/publications">{isFrench ? 'Publications' : 'Publications'}</NavLink>
          <span aria-hidden="true">/</span>
          <span>{isFrench ? 'Détail de la publication' : 'Publication details'}</span>
        </nav>

        <header className="publication-detail__heading">
          <div className="publication-detail__domain-line">
            {domain && <span className="publication-detail__domain">{domain}</span>}
            {publishedDate && <span>{isFrench ? 'Publié le' : 'Published'} {publishedDate}</span>}
          </div>
          <div className="publication-detail__title-row">
            <h1>{title}</h1>
            {isAuthenticated && (
              <FavoriteButton
                publication={{ id: publication.id, titre: title, auteurs: authors.join(', '), domaine: domain }}
                size="large"
              />
            )}
          </div>
          {(authors.length > 0 || publication.type || publication.academicYear) && (
            <p className="publication-detail__authors">
              {authors.length > 0 ? authors.join(', ') : null}
              {publication.type && <span>{publication.type}</span>}
              {publication.academicYear && <span>{publication.academicYear}</span>}
            </p>
          )}
          {publication.tags.length > 0 && (
            <ul className="publication-detail__tags" aria-label={isFrench ? 'Mots-clés' : 'Keywords'}>
              {publication.tags.map(tag => <li key={tag}>{tag}</li>)}
            </ul>
          )}
        </header>

        <div className="publication-detail__layout">
          <main className="publication-detail__main">
            {abstract.trim() && (
              <section className="publication-detail__abstract" aria-labelledby="publication-abstract-title">
                <h2 id="publication-abstract-title">{isFrench ? 'Résumé' : 'Abstract'}</h2>
                <p>{abstract}</p>
              </section>
            )}

            <section className="publication-reader" aria-labelledby="publication-reader-title">
              <div className="publication-reader__header">
                <h2 id="publication-reader-title">{isFrench ? 'Aperçu du document PDF' : 'PDF document'}</h2>
                <div className="publication-reader__actions">
                  {documentState === 'ready' && document && (
                    <button type="button" className="publication-action publication-action--secondary" onClick={downloadDocument} disabled={isDownloading}>
                      {isDownloading ? (isFrench ? 'Téléchargement…' : 'Downloading…') : (isFrench ? 'Télécharger PDF' : 'Download PDF')}
                    </button>
                  )}
                  {isAuthenticated ? (
                    <button type="button" className="publication-action publication-action--primary" onClick={() => setIsAIOpen(true)}>
                      {isFrench ? 'Assistant IA' : 'AI assistant'}
                    </button>
                  ) : (
                    <NavLink className="publication-action publication-action--primary" to="/auth">
                      {isFrench ? 'Se connecter pour utiliser l’assistant' : 'Sign in to use the assistant'}
                    </NavLink>
                  )}
                  {isAuthenticated ? (
                    <NavLink className="publication-action publication-action--secondary" to={`/quiz?publicationId=${publication.id}`}>
                      {isFrench ? 'Auto-évaluation' : 'Self-assessment'}
                    </NavLink>
                  ) : (
                    <NavLink className="publication-action publication-action--secondary" to="/auth">
                      {isFrench ? 'Se connecter pour s’auto-évaluer' : 'Sign in for self-assessment'}
                    </NavLink>
                  )}
                </div>
              </div>

              {downloadError && <p className="publication-reader__error" role="alert">{isFrench ? 'Le téléchargement a échoué. Vérifiez votre accès au document.' : 'Download failed. Check your access to this document.'}</p>}
              {documentState === 'loading' && <p className="publication-reader__message" role="status">{isFrench ? 'Recherche du document…' : 'Looking for the document…'}</p>}
              {documentState === 'missing' && <p className="publication-reader__message">{isFrench ? 'Aucun document PDF n’est associé à cette publication.' : 'No PDF is attached to this publication.'}</p>}
              {documentState === 'error' && <p className="publication-reader__error" role="alert">{isFrench ? 'Le document est indisponible ou son accès est refusé.' : 'The document is unavailable or access was denied.'}</p>}
              {documentState === 'ready' && document && (
                <PdfViewer
                  key={document.id}
                  documentId={document.id}
                  pageCount={document.pageCount}
                  pageNumber={currentPage}
                  onPageChange={onPageChange}
                />
              )}
            </section>
          </main>

          <aside className="publication-detail__sidebar" aria-label={isFrench ? 'Informations de lecture' : 'Reading information'}>
            <ReadingProgress
              publicationId={publication.id}
              totalPages={document?.pageCount}
              currentPage={currentPage}
              onPageChange={onPageChange}
              isAuthenticated={isAuthenticated}
            />

            <section className="publication-sidebar-card publication-assistant">
              <h2 className="publication-sidebar-card__title">{isFrench ? 'Assistant IA sur cet article' : 'AI assistant for this article'}</h2>
              <p>{isFrench ? 'Posez une question sur le contenu de la publication. Les réponses dépendent du texte indexé.' : 'Ask about this publication. Responses depend on its indexed text.'}</p>
              {isAuthenticated ? (
                <button type="button" className="publication-assistant__open" onClick={() => setIsAIOpen(true)}>
                  {isFrench ? 'Poser une question' : 'Ask a question'}
                  <span aria-hidden="true">→</span>
                </button>
              ) : (
                <NavLink className="publication-assistant__open" to="/auth">
                  {isFrench ? 'Se connecter' : 'Sign in'}
                  <span aria-hidden="true">→</span>
                </NavLink>
              )}
              <small>{isFrench ? 'Les réponses peuvent contenir des erreurs; vérifiez les sources.' : 'AI responses can be inaccurate; verify cited sources.'}</small>
            </section>

            <SimilarPublications publicationId={publication.id} limit={5} />
          </aside>
        </div>
      </div>

      <AIAssistantWidget
        publicationId={publication.id}
        publicationTitle={title}
        initialMode="DOCUMENT"
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />
    </div>
  );
};

export default SinglePublicationPage;
