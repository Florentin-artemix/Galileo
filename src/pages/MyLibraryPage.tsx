import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import ResearchCover from '../components/ResearchCover';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublications } from '../contexts/PublicationsContext';
import { favoritesService, type Favorite } from '../services/favoritesService';
import { readingHistoryService, type ReadingHistoryItem } from '../services/readingHistoryService';
import type { Publication } from '../types';
import './my-library.css';

type LibrarySort = 'recent' | 'oldest' | 'title';

const titleFor = (publication: Publication | undefined, fallback: string | undefined, language: string) =>
  publication?.title[language] || publication?.title.fr || publication?.title.en || fallback || '';

const uniqueRecentHistory = (items: ReadingHistoryItem[]) => {
  const seen = new Set<number>();
  return [...items]
    .sort((a, b) => (Date.parse(b.readAt) || 0) - (Date.parse(a.readAt) || 0))
    .filter(item => {
      if (seen.has(item.publicationId)) return false;
      seen.add(item.publicationId);
      return true;
    });
};

const MyLibraryPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { publications } = usePublications();
  const isFrench = language === 'fr';
  const currentUserId = user?.uid || user?.id || null;
  const activeUserIdRef = useRef(currentUserId);
  activeUserIdRef.current = currentUserId;
  const requestIdRef = useRef(0);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadedForUser, setLoadedForUser] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [favoritesError, setFavoritesError] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<LibrarySort>('recent');
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadLibrary = useCallback(async () => {
    const requestedUserId = activeUserIdRef.current;
    if (!requestedUserId) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setHistoryError(false);
    setFavoritesError(false);
    const [historyResult, favoritesResult] = await Promise.allSettled([
      readingHistoryService.getMyHistory(),
      favoritesService.getMyFavorites()
    ]);
    if (requestId !== requestIdRef.current || activeUserIdRef.current !== requestedUserId) return;
    if (historyResult.status === 'fulfilled') setHistory(historyResult.value);
    else { setHistory([]); setHistoryError(true); }
    if (favoritesResult.status === 'fulfilled') setFavorites(favoritesResult.value);
    else { setFavorites([]); setFavoritesError(true); }
    setLoadedForUser(requestedUserId);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      requestIdRef.current += 1;
      setHistory([]);
      setFavorites([]);
      setLoadedForUser(null);
      setHistoryError(false);
      setFavoritesError(false);
      setIsLoading(false);
      return undefined;
    }
    setHistory([]);
    setFavorites([]);
    setLoadedForUser(null);
    setRemovingId(null);
    setActionError('');
    void loadLibrary();
    return () => { requestIdRef.current += 1; };
  }, [currentUserId, loadLibrary]);

  const hasCurrentUserData = currentUserId === null || loadedForUser === currentUserId;
  const visibleHistory = hasCurrentUserData ? history : [];
  const visibleFavorites = hasCurrentUserData ? favorites : [];
  const visibleHistoryError = hasCurrentUserData && historyError;
  const visibleFavoritesError = hasCurrentUserData && favoritesError;
  const visibleLoading = isLoading || (currentUserId !== null && !hasCurrentUserData);
  const recentHistory = useMemo(() => uniqueRecentHistory(visibleHistory), [visibleHistory]);
  const publicationById = useMemo(() => new Map(publications.map(item => [item.id, item])), [publications]);
  const matchingHistory = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase(language);
    const result = recentHistory.filter(item => {
      if (!normalized) return true;
      const publication = publicationById.get(item.publicationId);
      return [
        item.publicationTitle,
        item.publicationAuthors,
        item.publicationDomain,
        publication?.title[language],
        publication?.title.fr,
        publication?.domain[language],
        ...(publication?.authors ?? [])
      ].filter(Boolean).join(' ').toLocaleLowerCase(language).includes(normalized);
    });
    if (sortBy === 'title') return result.sort((a, b) => titleFor(publicationById.get(a.publicationId), a.publicationTitle, language).localeCompare(titleFor(publicationById.get(b.publicationId), b.publicationTitle, language), language));
    if (sortBy === 'oldest') return result.sort((a, b) => (Date.parse(a.readAt) || 0) - (Date.parse(b.readAt) || 0));
    return result;
  }, [language, publicationById, recentHistory, search, sortBy]);

  const matchingFavorites = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase(language);
    return [...visibleFavorites]
      .filter(favorite => !normalized || [
        favorite.publicationTitle,
        favorite.publicationAuthors,
        favorite.publicationDomain
      ].filter(Boolean).join(' ').toLocaleLowerCase(language).includes(normalized))
      .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  }, [language, search, visibleFavorites]);

  const uniqueDocumentCount = new Set(visibleHistory.map(item => item.publicationId)).size;
  const recordedDuration = visibleHistory.reduce((sum, item) => sum + (typeof item.durationSeconds === 'number' && item.durationSeconds > 0 ? item.durationSeconds : 0), 0);
  const hasRecordedDuration = visibleHistory.some(item => typeof item.durationSeconds === 'number' && item.durationSeconds >= 0);
  const timeLabel = hasRecordedDuration
    ? recordedDuration >= 3600
      ? `${Math.floor(recordedDuration / 3600)} h ${Math.floor((recordedDuration % 3600) / 60)} min`
      : `${Math.floor(recordedDuration / 60)} min`
    : '—';

  const formatDate = (value?: string) => {
    if (!value || !Number.isFinite(Date.parse(value))) return isFrench ? 'Date indisponible' : 'Date unavailable';
    return new Date(value).toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatYear = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).getFullYear() : '';
  const formatDuration = (seconds?: number | null) => {
    if (seconds === null || seconds === undefined || seconds <= 0) return null;
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes} min` : `${seconds} s`;
  };

  const removeFavorite = async (publicationId: number) => {
    const requestedUserId = currentUserId;
    setRemovingId(publicationId);
    setActionError('');
    try {
      await favoritesService.removeFavorite(publicationId);
      if (activeUserIdRef.current === requestedUserId) {
        setFavorites(items => items.filter(item => item.publicationId !== publicationId));
      }
    } catch {
      if (activeUserIdRef.current === requestedUserId) {
        setActionError(isFrench ? 'Le favori n’a pas pu être retiré.' : 'The favorite could not be removed.');
      }
    } finally {
      if (activeUserIdRef.current === requestedUserId) setRemovingId(null);
    }
  };

  return (
    <main className="my-library">
      <div className="my-library__content">
        <header className="my-library__heading">
          <div>
            <h1>{isFrench ? 'Votre bibliothèque de recherche' : 'Your research library'}</h1>
            <p>{isFrench ? 'Retrouvez vos lectures, favoris et documents importés au même endroit.' : 'Find your reading, favorites, and imported documents in one place.'}</p>
          </div>
          <div className="my-library__tools">
            <label className="my-library__search">
              <span className="sr-only">{isFrench ? 'Rechercher dans votre bibliothèque' : 'Search your library'}</span>
              <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={isFrench ? 'Rechercher dans vos documents' : 'Search your documents'} />
            </label>
            <NavLink to="/submit" className="my-library__import">{isFrench ? 'Importer un document' : 'Import a document'}</NavLink>
          </div>
        </header>

        <div className="my-library__stats" aria-label={isFrench ? 'Statistiques de la bibliothèque' : 'Library statistics'}>
          <article><strong>{visibleLoading || visibleHistoryError ? '—' : uniqueDocumentCount}</strong><span>{isFrench ? 'Documents consultés' : 'Documents viewed'}</span></article>
          <article><strong>{visibleLoading || visibleFavoritesError ? '—' : visibleFavorites.length}</strong><span>{isFrench ? 'Favoris' : 'Favorites'}</span></article>
          <article><strong>{visibleLoading || visibleHistoryError ? '—' : timeLabel}</strong><span>{isFrench ? 'Temps de lecture enregistré' : 'Recorded reading time'}</span></article>
        </div>

        {actionError && <p className="my-library__alert" role="alert">{actionError}</p>}

        <section className="my-library__section" aria-labelledby="my-library-recent">
          <div className="my-library__section-heading">
            <h2 id="my-library-recent">{isFrench ? 'Récemment consultés' : 'Recently viewed'}</h2>
            <label>
              <span className="sr-only">{isFrench ? 'Trier les lectures' : 'Sort reading history'}</span>
              <select value={sortBy} onChange={event => setSortBy(event.target.value as LibrarySort)}>
                <option value="recent">{isFrench ? 'Trier : dernière lecture' : 'Sort: last read'}</option>
                <option value="oldest">{isFrench ? 'Trier : lecture la plus ancienne' : 'Sort: oldest read'}</option>
                <option value="title">{isFrench ? 'Trier : titre A à Z' : 'Sort: title A to Z'}</option>
              </select>
            </label>
          </div>

          {visibleLoading ? (
            <div className="my-library__cards" aria-busy="true"><div className="my-library__skeleton" /><div className="my-library__skeleton" /><div className="my-library__skeleton" /></div>
          ) : visibleHistoryError ? (
            <div className="my-library__empty" role="alert"><p>{isFrench ? 'L’historique n’a pas pu être chargé.' : 'Reading history could not be loaded.'}<button type="button" onClick={() => void loadLibrary()}>{isFrench ? 'Réessayer' : 'Retry'}</button></p></div>
          ) : matchingHistory.length > 0 ? (
            <div className="my-library__cards">
              {matchingHistory.slice(0, 3).map(entry => {
                const publication = publicationById.get(entry.publicationId);
                const title = titleFor(publication, entry.publicationTitle, language);
                const authors = publication?.authors.join(', ') || entry.publicationAuthors;
                const year = formatYear(publication?.date);
                const duration = formatDuration(entry.durationSeconds);
                return (
                  <article className="my-library-card" key={entry.id}>
                    <NavLink to={`/publication/${entry.publicationId}`} className="my-library-card__main">
                      {publication ? <ResearchCover publication={publication} className="my-library-card__cover" /> : <div className="my-library-card__cover-mark">PDF</div>}
                      <div className="my-library-card__details">
                        <span className="my-library-card__type">{publication?.type || entry.publicationDomain || (isFrench ? 'PUBLICATION' : 'PUBLICATION')}</span>
                        <h3>{title || (isFrench ? 'Publication consultée' : 'Viewed publication')}</h3>
                        <p className="my-library-card__meta">{[authors, year || formatDate(entry.readAt), publication?.pageCount ? `${publication.pageCount} pages` : ''].filter(Boolean).join(' · ')}</p>
                      </div>
                    </NavLink>
                    {publication?.summary[language] && <p className="my-library-card__summary">{publication.summary[language]}</p>}
                    <div className="my-library-card__footer">
                      {publication?.pdfUrl ? <span className="my-library__badge">{isFrench ? 'PDF disponible' : 'PDF available'}</span> : <span />}
                      <span>{duration || formatDate(entry.readAt)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="my-library__empty">
              <p>{search
                ? (isFrench ? 'Aucune lecture ne correspond à cette recherche.' : 'No reading history matches this search.')
                : (isFrench ? 'Vos publications consultées apparaîtront ici.' : 'Publications you view will appear here.')}</p>
              {!search && <NavLink to="/publications">{isFrench ? 'Explorer les publications' : 'Explore publications'}</NavLink>}
            </div>
          )}
        </section>

        <section className="my-library__section my-library__favorites" aria-labelledby="my-library-favorites">
          <div className="my-library__section-heading"><h2 id="my-library-favorites">{isFrench ? 'Vos favoris' : 'Your favorites'}</h2></div>
          {visibleFavoritesError ? (
            <div className="my-library__empty" role="alert"><p>{isFrench ? 'Les favoris n’ont pas pu être chargés.' : 'Favorites could not be loaded.'}</p><button type="button" onClick={() => void loadLibrary()}>{isFrench ? 'Réessayer' : 'Retry'}</button></div>
          ) : matchingFavorites.length > 0 ? (
            <div className="my-library__favorite-list">
              {matchingFavorites.slice(0, 8).map(favorite => (
                <article className="my-library-favorite" key={favorite.id}>
                  <span className="my-library-favorite__mark" aria-hidden="true">PDF</span>
                  <NavLink to={`/publication/${favorite.publicationId}`} className="my-library-favorite__details">
                    <span>{favorite.publicationDomain || (isFrench ? 'Publication' : 'Publication')} · {formatYear(publicationById.get(favorite.publicationId)?.date) || (isFrench ? 'Favori' : 'Saved')}</span>
                    <strong>{titleFor(publicationById.get(favorite.publicationId), favorite.publicationTitle, language)}</strong>
                  </NavLink>
                  <button type="button" onClick={() => void removeFavorite(favorite.publicationId)} disabled={removingId === favorite.publicationId} aria-label={isFrench ? 'Retirer des favoris' : 'Remove favorite'} title={isFrench ? 'Retirer des favoris' : 'Remove favorite'}>
                    {removingId === favorite.publicationId ? '…' : 'Retirer'}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="my-library__empty">
              <p>{search
                ? (isFrench ? 'Aucun favori ne correspond à cette recherche.' : 'No favorites match this search.')
                : (isFrench ? 'Vos publications favorites apparaîtront ici.' : 'Your favorite publications will appear here.')}</p>
              {!search && <NavLink to="/publications">{isFrench ? 'Découvrir les publications' : 'Discover publications'}</NavLink>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default MyLibraryPage;
