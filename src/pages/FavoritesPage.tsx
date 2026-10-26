import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { favoritesService, type Favorite } from '../services/favoritesService';
import './personal-library.css';

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isFrench = language === 'fr';
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [filterDomain, setFilterDomain] = useState('all');

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await favoritesService.getMyFavorites();
      setFavorites(data);
    } catch {
      setError(isFrench ? 'Impossible de charger vos favoris.' : 'Your favorites could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [isFrench]);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }
    void loadFavorites();
  }, [user, loadFavorites]);

  const handleRemove = async (publicationId: number) => {
    setRemovingId(publicationId);
    setActionError(null);
    try {
      await favoritesService.removeFavorite(publicationId);
      setFavorites(items => items.filter(item => item.publicationId !== publicationId));
    } catch {
      setActionError(isFrench
        ? 'Le favori n’a pas pu être retiré. La liste n’a pas été modifiée.'
        : 'The favorite could not be removed. The list was not changed.');
    } finally {
      setRemovingId(null);
    }
  };

  const domains = useMemo(() => Array.from(new Set<string>(favorites
    .map(item => item.publicationDomain?.trim())
    .filter((domain): domain is string => Boolean(domain)))).sort((a, b) => a.localeCompare(b, language)), [favorites, language]);

  const visibleFavorites = useMemo(() => favorites
    .filter(item => filterDomain === 'all' || item.publicationDomain === filterDomain)
    .sort((a, b) => {
      if (sortBy === 'title') return (a.publicationTitle || '').localeCompare(b.publicationTitle || '', language);
      return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
    }), [favorites, filterDomain, language, sortBy]);

  if (!user) {
    return (
      <main className="personal-library personal-library--auth">
        <h1>{isFrench ? 'Connectez-vous pour voir vos favoris' : 'Sign in to view your favorites'}</h1>
        <NavLink className="library-button library-button--primary" to="/auth">{isFrench ? 'Se connecter' : 'Sign in'}</NavLink>
      </main>
    );
  }

  return (
    <main className="personal-library">
      <header className="library-heading">
        <p className="library-eyebrow">{isFrench ? 'ESPACE PERSONNEL' : 'PERSONAL SPACE'}</p>
        <h1>{isFrench ? 'Mes favoris' : 'My favorites'}</h1>
        <p>{isFrench ? 'Retrouvez les publications que vous avez enregistrées.' : 'Find the publications you have saved.'}</p>
      </header>

      <div className="library-controls" aria-label={isFrench ? 'Filtres et tri des favoris' : 'Favorite filters and sorting'}>
        {domains.length > 0 && (
          <label className="library-select">
            <span className="sr-only">{isFrench ? 'Domaine' : 'Domain'}</span>
            <select value={filterDomain} onChange={event => setFilterDomain(event.target.value)}>
              <option value="all">{isFrench ? 'Tous les domaines' : 'All domains'}</option>
              {domains.map(domain => <option key={domain} value={domain}>{domain}</option>)}
            </select>
          </label>
        )}
        <label className="library-select">
          <span className="sr-only">{isFrench ? 'Trier les favoris' : 'Sort favorites'}</span>
          <select value={sortBy} onChange={event => setSortBy(event.target.value as 'recent' | 'title')}>
            <option value="recent">{isFrench ? 'Tri : ajout récent' : 'Sort: recently added'}</option>
            <option value="title">{isFrench ? 'Tri : titre A à Z' : 'Sort: title A to Z'}</option>
          </select>
        </label>
      </div>

      {actionError && <p className="library-alert" role="alert">{actionError}</p>}

      {isLoading ? (
        <div className="library-list" aria-label={isFrench ? 'Chargement des favoris' : 'Loading favorites'}>
          {[0, 1, 2].map(item => <div className="library-row library-row--loading" key={item} />)}
        </div>
      ) : error ? (
        <section className="library-state" role="alert">
          <p>{error}</p>
          <button type="button" className="library-button" onClick={() => void loadFavorites()}>{isFrench ? 'Réessayer' : 'Retry'}</button>
        </section>
      ) : visibleFavorites.length === 0 ? (
        <section className="library-state">
          <h2>{favorites.length === 0 ? (isFrench ? 'Aucun favori pour le moment' : 'No favorites yet') : (isFrench ? 'Aucun résultat pour ce domaine' : 'No results for this domain')}</h2>
          <p>{favorites.length === 0 ? (isFrench ? 'Enregistrez une publication pour la retrouver ici.' : 'Save a publication to find it here.') : (isFrench ? 'Choisissez un autre domaine.' : 'Choose a different domain.')}</p>
          {favorites.length === 0 && <NavLink to="/publications" className="library-button library-button--primary">{isFrench ? 'Explorer les publications' : 'Browse publications'}</NavLink>}
        </section>
      ) : (
        <div className="library-list" aria-label={isFrench ? 'Liste des favoris' : 'Favorites list'}>
          {visibleFavorites.map(favorite => {
            const addedAt = favorite.createdAt && Number.isFinite(Date.parse(favorite.createdAt))
              ? new Date(favorite.createdAt).toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
              : null;
            return (
              <article className="library-row" key={favorite.id}>
                <div className="library-document-mark" aria-hidden="true"><span>PDF</span></div>
                <div className="library-row__details">
                  <div className="library-row__meta">
                    {favorite.publicationDomain && <span className="library-domain">{favorite.publicationDomain}</span>}
                    {addedAt && <span>{isFrench ? `Ajouté le ${addedAt}` : `Added ${addedAt}`}</span>}
                  </div>
                  <h2><NavLink to={`/publication/${favorite.publicationId}`}>{favorite.publicationTitle || (isFrench ? 'Titre indisponible' : 'Title unavailable')}</NavLink></h2>
                  {favorite.publicationAuthors && <p className="library-row__authors">{favorite.publicationAuthors}</p>}
                </div>
                <div className="library-row__actions">
                  <NavLink className="library-button" to={`/publication/${favorite.publicationId}`}>{isFrench ? 'Ouvrir la publication' : 'Open publication'}</NavLink>
                  <button
                    type="button"
                    className="library-icon-button"
                    onClick={() => void handleRemove(favorite.publicationId)}
                    disabled={removingId === favorite.publicationId}
                    aria-label={isFrench ? 'Retirer des favoris' : 'Remove favorite'}
                    title={isFrench ? 'Retirer des favoris' : 'Remove favorite'}
                  >
                    {removingId === favorite.publicationId ? '…' : '×'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <footer className="library-footer">
        <span>{isFrench ? 'Vos favoris sont disponibles depuis votre compte connecté.' : 'Your favorites are available from your signed-in account.'}</span>
        <button type="button" className="library-button" onClick={() => void loadFavorites()} disabled={isLoading}>
          {isLoading ? (isFrench ? 'Actualisation…' : 'Refreshing…') : (isFrench ? 'Actualiser la liste' : 'Refresh list')}
        </button>
      </footer>
    </main>
  );
};

export default FavoritesPage;
