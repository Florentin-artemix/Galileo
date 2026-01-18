import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesService, Favorite } from '../src/services/favoritesService';
import FavoriteButton from '../components/FavoriteButton';

/**
 * Page Mes Favoris
 * Exploite galileo-user-profile: GET /userprofile/{uid}/favorites
 */
const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'addedAt' | 'title'>('addedAt');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await favoritesService.getMyFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
      setError('Impossible de charger vos favoris');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (publicationId: number) => {
    try {
      await favoritesService.removeFavorite(publicationId);
      setFavorites(prev => prev.filter(f => f.publicationId !== publicationId));
    } catch (err) {
      console.error('Erreur suppression favori:', err);
    }
  };

  // Filtrage et tri
  const filteredFavorites = favorites
    .filter(f => filterType === 'all' || f.publicationType === filterType)
    .sort((a, b) => {
      if (sortBy === 'addedAt') {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
      return (a.publicationTitle || '').localeCompare(b.publicationTitle || '');
    });

  // Types uniques pour le filtre
  const uniqueTypes = [...new Set(favorites.map(f => f.publicationType).filter(Boolean))];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
            Connectez-vous pour voir vos favoris
          </h2>
          <a href="/auth" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Mes Favoris
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {favorites.length} publication{favorites.length !== 1 ? 's' : ''} sauvegardée{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'addedAt' | 'title')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="addedAt">Date d'ajout</option>
              <option value="title">Titre</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              <option value="all">Tous les types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadFavorites}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
              {favorites.length === 0 ? 'Aucun favori pour le moment' : 'Aucun résultat avec ces filtres'}
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {favorites.length === 0 
                ? 'Ajoutez des publications à vos favoris en cliquant sur le ❤️'
                : 'Essayez de modifier vos filtres'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((favorite) => (
              <div
                key={favorite.publicationId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {favorite.publicationType || 'Publication'}
                    </span>
                    <FavoriteButton
                      publicationId={favorite.publicationId}
                      onToggle={(isFav) => !isFav && handleRemove(favorite.publicationId)}
                    />
                  </div>
                  
                  <a
                    href={`/publications/${favorite.publicationId}`}
                    className="block"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                      {favorite.publicationTitle || `Publication #${favorite.publicationId}`}
                    </h3>
                  </a>
                  
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Ajouté le {new Date(favorite.addedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                  <a
                    href={`/publications/${favorite.publicationId}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Voir la publication →
                  </a>
                  
                  <button
                    onClick={() => handleRemove(favorite.publicationId)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
