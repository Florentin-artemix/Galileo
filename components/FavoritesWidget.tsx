import React, { useEffect, useState } from 'react';
import { lectureService, type FavoritePublication } from '../src/services/lectureService';
import { useAuth } from '../contexts/AuthContext';

const FavoritesWidget: React.FC = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritePublication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return;
      try {
        const data = await lectureService.getUserFavorites(user.uid);
        setFavorites(data.slice(0, 4)); // Top 4
      } catch (error) {
        console.debug('[Favorites] Pas de favoris disponibles');
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
          <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mes Favoris</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{favorites.length} publication{favorites.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun favori</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ajoutez vos publications préférées</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((item, index) => (
            <div
              key={index}
              className="relative p-4 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border border-rose-200 dark:border-rose-800 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-rose-500 dark:text-rose-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div className="pr-6">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {item.publicationTitle || 'Publication'}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.addedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {favorites.length > 0 && (
        <button className="w-full mt-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
          Gérer les favoris →
        </button>
      )}
    </div>
  );
};

export default FavoritesWidget;
