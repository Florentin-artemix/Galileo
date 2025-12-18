import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { searchService, SearchResult } from '../src/services/searchService';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onResultClick?: (result: SearchResult) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ className = '', placeholder, onResultClick }) => {
  const { translations, language } = useLanguage();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fermer les résultats quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await searchService.searchPublications(searchQuery, 0, 8);
      setResults(response.content || []);
      setIsOpen(true);
    } catch (err: any) {
      console.error('Erreur de recherche:', err);
      setError(err.message || 'Erreur lors de la recherche');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Navigation par défaut vers la publication
      navigate(`/publications/${result.publicationId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && results.length > 0) {
      handleResultClick(results[0]);
    }
  };

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-teal/30 text-inherit rounded px-0.5">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Champ de recherche */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || translations.search?.placeholder || 'Rechercher...'}
          className="w-full px-4 py-2.5 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 
                     bg-gray-50 dark:bg-navy-light text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-400 transition-all duration-200"
        />
        
        {/* Icône de recherche */}
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-teal" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {/* Bouton d'effacement */}
        {query && !isLoading && (
          <button
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown des résultats */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-navy-light rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto">
          {error ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{translations.search?.no_results || 'Aucun résultat trouvé'}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-navy/50 transition-colors duration-150"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icône de document */}
                      <div className="flex-shrink-0 w-10 h-10 bg-teal/10 dark:bg-teal/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Titre */}
                        <h4 className="text-sm font-medium text-light-text dark:text-off-white truncate">
                          {highlightMatch(result.titre, query)}
                        </h4>
                        
                        {/* Auteur et domaine */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {result.auteurPrincipal}
                          {result.domaine && (
                            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              {result.domaine}
                            </span>
                          )}
                        </p>
                        
                        {/* Résumé tronqué */}
                        {result.resume && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                            {result.resume.substring(0, 150)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          {/* Voir tous les résultats */}
          {results.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/publications?search=${encodeURIComponent(query)}`);
                }}
                className="w-full px-4 py-3 text-sm text-center text-teal hover:bg-teal/5 transition-colors duration-150"
              >
                {translations.search?.see_all || 'Voir tous les résultats'} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
