import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { analyticsService } from '../services/analyticsService';
import { documentsService, type DocumentDTO } from '../services/documentsService';
import { publicationsService } from '../services/publicationsService';
import { readingHistoryService } from '../services/readingHistoryService';
import type { Publication } from '../types';
import FavoriteButton from '../components/FavoriteButton';
import PdfViewer from '../components/PdfViewer';
import PublicationAIPanel from '../components/PublicationAIPanel';
import ReadingProgress from '../components/ReadingProgress';
import SimilarPublications from '../components/SimilarPublications';
import './publication-detail.css';

type DetailState = 'loading' | 'ready' | 'not-found';
type DocumentState = 'loading' | 'ready' | 'missing' | 'error' | 'restricted';

const SinglePublicationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isAuthenticated, loading: authLoading, role } = useAuth();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [detailState, setDetailState] = useState<DetailState>('loading');
  const [document, setDocument] = useState<DocumentDTO | null>(null);
  const [documentState, setDocumentState] = useState<DocumentState>('loading');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'document' | 'ai' | 'info'>('document');

  const publicationId = Number(id);
  const canReadFullText = !authLoading && isAuthenticated && role !== 'VIEWER';
  const onPageChange = useCallback((page: number) => setCurrentPage(page), []);
  const handleOpenPageFromAI = useCallback((page: number) => {
    setCurrentPage(page);
    setMobileActiveTab('document');
  }, []);

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
    setMobileActiveTab('document');

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
    void analyticsService.trackPublicationView(publication.id, publication.title.fr || publication.title.en);
  }, [publication?.id]);

  useEffect(() => {
    if (!publication || !canReadFullText) return;
    void readingHistoryService.recordReading(publication.id).catch(() => undefined);
  }, [publication?.id, canReadFullText]);

  useEffect(() => {
    let active = true;
    if (!publication) return () => { active = false; };

    if (authLoading) {
      setDocument(null);
      setDocumentState('loading');
      return () => { active = false; };
    }

    if (!canReadFullText) {
      setDocument(null);
      setDocumentState('restricted');
      return () => { active = false; };
    }

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
  }, [publication?.id, authLoading, canReadFullText]);

  useEffect(() => {
    if (document?.pageCount && document.pageCount > 0) {
      setCurrentPage(page => Math.min(page, document.pageCount!));
    }
  }, [document?.pageCount]);

  const title = useMemo(() => {
    if (!publication) return '';
    return publication.title?.[language] || publication.title?.fr || publication.title?.en || '';
  }, [language, publication]);
  const authors = useMemo(() => (publication?.authors ?? []).filter(Boolean), [publication]);
  const domain = publication?.domain?.[language] || publication?.domain?.fr || publication?.domain?.en || '';
  const abstract = publication?.summary?.[language] || publication?.summary?.fr || publication?.summary?.en || '';
  const publishedDate = publication?.date && Number.isFinite(Date.parse(publication.date))
    ? new Date(publication.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : '';
  const isFrench = language === 'fr';
  const infoItems = [
    publication?.type || '',
    publication?.academicYear || (publication?.date && Number.isFinite(Date.parse(publication.date)) ? new Date(publication.date).getFullYear().toString() : ''),
    domain,
    document?.pageCount ? `${document.pageCount} ${isFrench ? 'pages' : 'pages'}` : ''
  ].filter(Boolean);

  const downloadDocument = async () => {
    if (!canReadFullText || !document || isDownloading) return;
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
      <header className="publication-reader-topbar">
        <NavLink to="/" className="publication-reader-topbar__brand" aria-label="Galileo, accueil">
          <span aria-hidden="true">G</span>
          <strong>Galileo</strong>
        </NavLink>
        <NavLink to="/publications" className="publication-reader-topbar__back">
          <span aria-hidden="true">←</span>{isFrench ? 'Résultats' : 'Results'}
        </NavLink>
        <p className="publication-reader-topbar__title">{title}</p>
        <div className="publication-reader-topbar__actions">
          {isAuthenticated ? (
            <FavoriteButton
              publication={{ id: publication.id, titre: title, auteurs: authors.join(', '), domaine: domain }}
              size="large"
            />
          ) : (
            <NavLink className="publication-action publication-action--secondary" to="/auth">{isFrench ? 'Enregistrer' : 'Save'}</NavLink>
          )}
          {canReadFullText && documentState === 'ready' && document && (
            <button type="button" className="publication-action publication-action--primary" onClick={downloadDocument} disabled={isDownloading}>
              {isDownloading ? (isFrench ? 'Téléchargement…' : 'Downloading…') : (isFrench ? 'Télécharger PDF' : 'Download PDF')}
            </button>
          )}
        </div>
      </header>

      <div className="publication-detail__content">
        {downloadError && <p className="publication-reader__error publication-reader__error--top" role="alert">{isFrench ? 'Le téléchargement a échoué. Vérifiez votre accès au document.' : 'Download failed. Check your access to this document.'}</p>}

        <nav className="publication-mobile-tabs" aria-label={isFrench ? 'Vue de lecture mobile' : 'Mobile reading view'}>
          <button
            type="button"
            className={`publication-mobile-tabs__btn${mobileActiveTab === 'document' ? ' is-active' : ''}`}
            aria-pressed={mobileActiveTab === 'document'}
            onClick={() => setMobileActiveTab('document')}
          >
            {isFrench ? 'Document PDF' : 'PDF Document'}
          </button>
          {canReadFullText && (
            <button
              type="button"
              className={`publication-mobile-tabs__btn${mobileActiveTab === 'ai' ? ' is-active' : ''}`}
              aria-pressed={mobileActiveTab === 'ai'}
              onClick={() => setMobileActiveTab('ai')}
            >
              {isFrench ? 'Assistant IA' : 'AI Assistant'}
            </button>
          )}
          <button
            type="button"
            className={`publication-mobile-tabs__btn${mobileActiveTab === 'info' ? ' is-active' : ''}`}
            aria-pressed={mobileActiveTab === 'info'}
            onClick={() => setMobileActiveTab('info')}
          >
            {isFrench ? 'Infos & Sommaire' : 'Info & Outline'}
          </button>
        </nav>

        <div className={`publication-reader-layout${canReadFullText ? '' : ' publication-reader-layout--restricted'}`}>
          <aside className={`publication-reader-outline${mobileActiveTab === 'info' ? ' is-mobile-active' : ' is-mobile-hidden'}`} aria-label={isFrench ? 'Navigation et informations du document' : 'Document navigation and information'}>
            <section className="publication-reader-outline__section">
              <p className="publication-reader-outline__eyebrow">{isFrench ? 'DANS CE DOCUMENT' : 'IN THIS DOCUMENT'}</p>
              <nav aria-label={isFrench ? 'Sections du document' : 'Document sections'}>
                {abstract.trim() && (
                  <a
                    className="publication-reader-outline__link publication-reader-outline__link--active"
                    href="#publication-summary"
                    onClick={() => setMobileActiveTab('document')}
                  >
                    {isFrench ? 'Résumé' : 'Abstract'}<span>1</span>
                  </a>
                )}
                {canReadFullText && (
                  <a
                    className="publication-reader-outline__link"
                    href="#publication-document"
                    onClick={() => setMobileActiveTab('document')}
                  >
                    {isFrench ? 'Document PDF' : 'PDF document'}<span>{currentPage}</span>
                  </a>
                )}
              </nav>
            </section>

            <section className="publication-reader-outline__section publication-reader-outline__metadata">
              <p className="publication-reader-outline__eyebrow">{isFrench ? 'INFORMATIONS' : 'INFORMATION'}</p>
              {authors.length > 0 && <p className="publication-reader-outline__authors">{authors.join(', ')}</p>}
              <ul>
                {infoItems.filter(Boolean).map(item => <li key={item}>{item}</li>)}
                {publishedDate && <li>{publishedDate}</li>}
              </ul>
              <span className={`publication-reader-outline__availability${documentState === 'ready' ? ' publication-reader-outline__availability--ready' : ''}`}>
                {documentState === 'ready'
                  ? (isFrench ? 'PDF disponible' : 'PDF available')
                  : documentState === 'loading'
                    ? (isFrench ? 'Recherche du PDF…' : 'Checking PDF…')
                    : documentState === 'missing'
                      ? (isFrench ? 'PDF indisponible' : 'PDF unavailable')
                    : documentState === 'restricted'
                      ? (isFrench ? 'Accès au texte intégral restreint' : 'Full-text access restricted')
                      : (isFrench ? 'Accès au PDF indisponible' : 'PDF access unavailable')}
              </span>
            </section>

            {canReadFullText && <ReadingProgress
                publicationId={publication.id}
                totalPages={document?.pageCount}
                currentPage={currentPage}
                onPageChange={onPageChange}
                isAuthenticated={isAuthenticated}
                className="publication-reader-outline__progress"
              />}
          </aside>

          <main className={`publication-reader-document${mobileActiveTab === 'document' ? ' is-mobile-active' : ' is-mobile-hidden'}`}>
            <div className="publication-reader-document__heading">
              <p className="publication-reader-document__eyebrow">
                {[isFrench ? 'PUBLICATION' : 'PUBLICATION', domain, publication.type].filter(Boolean).join(' / ')}
              </p>
              <h1>{title}</h1>
              {(authors.length > 0 || publishedDate) && (
                <p className="publication-reader-document__byline">
                  {authors.join(', ')}{authors.length > 0 && publishedDate ? ' · ' : ''}{publishedDate || publication.academicYear}
                </p>
              )}
            </div>

            {abstract.trim() && (
              <section id="publication-summary" className="publication-detail__abstract" aria-labelledby="publication-abstract-title">
                <h2 id="publication-abstract-title">{isFrench ? 'Résumé' : 'Abstract'}</h2>
                <p>{abstract}</p>
              </section>
            )}

            {(publication.tags ?? []).length > 0 && (
              <ul className="publication-detail__tags" aria-label={isFrench ? 'Mots-clés' : 'Keywords'}>
                {(publication.tags ?? []).map(tag => <li key={tag}>{tag}</li>)}
              </ul>
            )}

            <section id="publication-document" className="publication-reader" aria-labelledby="publication-reader-title">
              <div className="publication-reader__header">
                <h2 id="publication-reader-title">{isFrench ? 'Document original' : 'Original document'}</h2>
                {canReadFullText && (
                  <NavLink className="publication-action publication-action--secondary" to={`/quiz?publicationId=${publication.id}`}>
                    {isFrench ? 'Auto-évaluation' : 'Self-assessment'}
                  </NavLink>
                )}
              </div>
              {!canReadFullText && !authLoading && (
                <div className="publication-reader__message" role="note">
                  <p>{isAuthenticated
                    ? (isFrench ? 'Votre compte Visiteur ne permet pas la lecture intégrale. Contactez Galileo pour demander un accès.' : 'Your Viewer account does not include full-text access. Contact Galileo to request access.')
                    : (isFrench ? 'La lecture intégrale nécessite un compte autorisé.' : 'Full-text access requires an authorized account.')}</p>
                  <NavLink className="publication-action publication-action--secondary" to={isAuthenticated ? '/contact' : '/auth'}>
                    {isAuthenticated ? (isFrench ? 'Demander un accès' : 'Request access') : (isFrench ? 'Se connecter' : 'Sign in')}
                  </NavLink>
                </div>
              )}
              {documentState === 'loading' && <p className="publication-reader__message" role="status">{authLoading
                ? (isFrench ? 'Vérification de l’accès…' : 'Checking access…')
                : (isFrench ? 'Recherche du document…' : 'Looking for the document…')}</p>}
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

          {canReadFullText && (
            <div className={`publication-ai-panel-wrapper${mobileActiveTab === 'ai' ? ' is-mobile-active' : ' is-mobile-hidden'}`}>
              <PublicationAIPanel publicationId={publication.id} pageCount={document?.pageCount} onOpenPage={handleOpenPageFromAI} />
            </div>
          )}
        </div>
        <section className="publication-detail__related" aria-label={isFrench ? 'Publications similaires' : 'Related publications'}>
          <SimilarPublications publicationId={publication.id} limit={5} className="publication-similar--horizontal" />
        </section>
      </div>
    </div>
  );
};

export default SinglePublicationPage;
