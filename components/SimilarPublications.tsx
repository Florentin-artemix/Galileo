import React, { useState, useEffect } from 'react';
import { searchService, SearchResult } from '../src/services/searchService';

interface SimilarPublicationsProps {
  publicationId: number;
  limit?: number;
  className?: string;
}

/**
 * Widget affichant les publications similaires
 * Utilise l'endpoint /search/publications/{id}/similar
 */
const SimilarPublications: React.FC<SimilarPublicationsProps> = ({
  publicationId,
  limit = 5,
  className = ''
}) => {
  const [publications, setPublications] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await searchService.getSimilarPublications(publicationId, limit);
        setPublications(results);
      } catch (err) {
        console.warn('Erreur chargement publications similaires:', err);
        setError('Impossible de charger les publications similaires');
      } finally {
        setIsLoading(false);
      }
    };

    if (publicationId) {
      fetchSimilar();
    }
  }, [publicationId, limit]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Publications similaires
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - not critical
  }

  if (publications.length === 0) {
    return null; // No similar publications to show
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Publications similaires
      </h3>
      
      <ul className="space-y-3">
        {publications.map((pub) => (
          <li key={pub.id}>
            <a
              href={`/publications/${pub.publicationId}`}
              className="block group hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors"
            >
              <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                {pub.titre}
              </h4>
              
              {pub.auteurPrincipal && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {pub.auteurPrincipal}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                {pub.domaine && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {pub.domaine}
                  </span>
                )}
                {pub.datePublication && (
                  <span>{new Date(pub.datePublication).getFullYear()}</span>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
      
      <a
        href={`/publications?similar=${publicationId}`}
        className="mt-4 block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        Voir plus →
      </a>
    </div>
  );
};

export default SimilarPublications;
