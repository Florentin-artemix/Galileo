import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { readingHistoryService, ReadingHistoryItem, PaginatedHistory } from '../src/services/readingHistoryService';

/**
 * Page Historique de Lecture
 * Exploite galileo-user-profile: GET /userprofile/{uid}/history
 */
const ReadingHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user, page]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: PaginatedHistory = await readingHistoryService.getMyHistoryPaginated(page, limit);
      
      if (page === 0) {
        setHistory(data.content);
      } else {
        setHistory(prev => [...prev, ...data.content]);
      }
      setHasMore(data.number < data.totalPages - 1);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      setError('Impossible de charger votre historique');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    // Note: clearHistory n'existe pas dans le service actuel
    // On peut simplement recharger la page pour l'instant
    alert('Fonctionnalité non disponible pour le moment');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes} min`;
  };

  // Grouper par date - utiliser readAt au lieu de lastReadAt
  const groupedHistory = history.reduce((groups, entry) => {
    const date = formatDate(entry.readAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, ReadingHistoryItem[]>);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
            Connectez-vous pour voir votre historique
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historique de Lecture
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {history.length} publication{history.length !== 1 ? 's' : ''} consultée{history.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Effacer l'historique
            </button>
          )}
        </div>

        {/* Contenu */}
        {isLoading && page === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
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
              onClick={() => { setPage(0); loadHistory(); }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
              Aucun historique
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Vos lectures apparaîtront ici
            </p>
            <a href="/publications" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Explorer les publications
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([date, entries]: [string, ReadingHistoryItem[]]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {date}
                </h2>
                
                <div className="space-y-3">
                  {entries.map((entry: ReadingHistoryItem) => (
                    <a
                      key={entry.publicationId}
                      href={`/publications/${entry.publicationId}`}
                      className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="p-4 flex items-start gap-4">
                        {/* Progression circle */}
                        <div className="flex-shrink-0 relative">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-200 dark:text-gray-700"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${(entry.readProgress || 0) * 1.26} 126`}
                              className="text-blue-500"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                            {entry.readProgress || 0}%
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {entry.publicationTitle || `Publication #${entry.publicationId}`}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {new Date(entry.readAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            
                            {entry.totalReadTime && entry.totalReadTime > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                {formatDuration(entry.totalReadTime)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      {/* Progress bar */}
                      {entry.readProgress !== undefined && entry.readProgress > 0 && (
                        <div className="h-1 bg-gray-100 dark:bg-gray-700">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${entry.readProgress}%` }}
                          />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {isLoading ? 'Chargement...' : 'Charger plus'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingHistoryPage;
