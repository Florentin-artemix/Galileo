import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { readingHistoryService, type PaginatedHistory, type ReadingHistoryItem } from '../services/readingHistoryService';
import './personal-library.css';

const PAGE_SIZE = 20;

const ReadingHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isFrench = language === 'fr';
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const loadHistory = useCallback(async (requestedPage: number, append: boolean) => {
    setIsLoading(true);
    setError(null);
    setLoadMoreError(null);
    try {
      const data: PaginatedHistory = await readingHistoryService.getMyHistoryPaginated(requestedPage, PAGE_SIZE);
      setHistory(items => append ? [...items, ...data.content] : data.content);
      setTotalElements(data.totalElements);
      setHasMore(data.number < data.totalPages - 1);
      setPage(requestedPage);
    } catch {
      const message = isFrench ? 'Impossible de charger votre historique.' : 'Your reading history could not be loaded.';
      if (append) setLoadMoreError(message);
      else setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isFrench]);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setTotalElements(0);
      setIsLoading(false);
      return;
    }
    void loadHistory(0, false);
  }, [user, loadHistory]);

  const formatDate = (value: string) => {
    if (!value || !Number.isFinite(Date.parse(value))) return null;
    return new Date(value).toLocaleString(isFrench ? 'fr-FR' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (seconds?: number | null) => {
    if (seconds === undefined || seconds === null || seconds <= 0) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} h ${minutes} min`;
    if (minutes > 0) return `${minutes} min`;
    return `${seconds} s`;
  };

  if (!user) {
    return (
      <main className="personal-library personal-library--auth">
        <h1>{isFrench ? 'Connectez-vous pour voir votre historique' : 'Sign in to view your history'}</h1>
        <NavLink className="library-button library-button--primary" to="/auth">{isFrench ? 'Se connecter' : 'Sign in'}</NavLink>
      </main>
    );
  }

  return (
    <main className="personal-library">
      <header className="library-heading">
        <p className="library-eyebrow">{isFrench ? 'ESPACE PERSONNEL' : 'PERSONAL SPACE'}</p>
        <h1>{isFrench ? 'Historique de lecture' : 'Reading history'}</h1>
        <p>{isFrench ? 'Reprenez la consultation des publications que vous avez déjà ouvertes.' : 'Continue reading publications you have already opened.'}</p>
      </header>

      <div className="history-meta">
        <span>{isFrench ? `${totalElements} publication${totalElements === 1 ? '' : 's'} consultée${totalElements === 1 ? '' : 's'}` : `${totalElements} publication${totalElements === 1 ? '' : 's'} viewed`}</span>
        <span>{isFrench ? 'Progression et durée affichées selon les données enregistrées.' : 'Progress and duration reflect recorded data.'}</span>
      </div>

      {isLoading && page === 0 ? (
        <div className="library-list" aria-label={isFrench ? 'Chargement de l’historique' : 'Loading history'}>
          {[0, 1, 2].map(item => <div className="library-row library-row--loading" key={item} />)}
        </div>
      ) : error ? (
        <section className="library-state" role="alert">
          <p>{error}</p>
          <button type="button" className="library-button" onClick={() => void loadHistory(0, false)}>{isFrench ? 'Réessayer' : 'Retry'}</button>
        </section>
      ) : history.length === 0 ? (
        <section className="library-state">
          <h2>{isFrench ? 'Aucun historique' : 'No reading history'}</h2>
          <p>{isFrench ? 'Les publications consultées apparaîtront ici.' : 'Publications you open will appear here.'}</p>
          <NavLink to="/publications" className="library-button library-button--primary">{isFrench ? 'Explorer les publications' : 'Browse publications'}</NavLink>
        </section>
      ) : (
        <div className="library-list">
          {history.map((entry: ReadingHistoryItem) => {
            const readAt = formatDate(entry.readAt);
            const duration = formatDuration(entry.durationSeconds);
            const progress = typeof entry.readProgress === 'number' && Number.isFinite(entry.readProgress)
              ? Math.max(0, Math.min(100, entry.readProgress))
              : null;
            return (
              <article className="library-row library-row--history" key={entry.id}>
                <div className="library-document-mark" aria-hidden="true"><span>PDF</span></div>
                <div className="library-row__details">
                  <div className="library-row__meta">
                    {entry.publicationDomain && <span className="library-domain">{entry.publicationDomain}</span>}
                    <span>{readAt ? (isFrench ? `Dernière lecture : ${readAt}` : `Last read: ${readAt}`) : (isFrench ? 'Date de lecture indisponible' : 'Reading date unavailable')}</span>
                  </div>
                  <h2><NavLink to={`/publication/${entry.publicationId}`}>{entry.publicationTitle || (isFrench ? 'Titre indisponible' : 'Title unavailable')}</NavLink></h2>
                  {entry.publicationAuthors && <p className="library-row__authors">{entry.publicationAuthors}</p>}
                </div>
                <div className="history-progress">
                  <span>{progress === null ? (isFrench ? 'Progression non enregistrée' : 'Progress not recorded') : (isFrench ? 'Progression enregistrée' : 'Recorded progress')}</span>
                  {progress !== null && <div className="history-progress__track" role="progressbar" aria-label={isFrench ? 'Progression de lecture' : 'Reading progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>}
                  <small>{progress === null ? (duration ? `${isFrench ? 'Durée de lecture' : 'Reading time'} · ${duration}` : (isFrench ? 'Aucune durée disponible' : 'No duration available')) : `${progress}%${duration ? ` · ${duration}` : ''}`}</small>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {loadMoreError && <p className="library-alert" role="alert">{loadMoreError}</p>}
      <footer className="library-footer">
        <span>{isFrench ? 'L’historique est chargé depuis votre compte.' : 'History is loaded from your account.'}</span>
        {hasMore && (
          <button type="button" className="library-button" onClick={() => void loadHistory(page + 1, true)} disabled={isLoading}>
            {isLoading ? (isFrench ? 'Chargement…' : 'Loading…') : (isFrench ? 'Charger plus' : 'Load more')}
          </button>
        )}
      </footer>
    </main>
  );
};

export default ReadingHistoryPage;
