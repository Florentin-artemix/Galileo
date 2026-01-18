import React, { useState, useEffect } from 'react';
import { readingHistoryService } from '../src/services/readingHistoryService';

interface ReadingProgressProps {
  publicationId: number;
  totalPages?: number;
  showProgress?: boolean;
  className?: string;
}

/**
 * Composant de suivi de progression de lecture
 * Utilise galileo-user-profile pour persister la progression
 */
const ReadingProgress: React.FC<ReadingProgressProps> = ({
  publicationId,
  totalPages = 100,
  showProgress = true,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Charger la progression existante
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const history = await readingHistoryService.getMyHistory();
        const existing = history.find(h => h.publicationId === publicationId);
        if (existing && existing.readProgress) {
          setProgress(existing.readProgress);
          setCurrentPage(Math.ceil((existing.readProgress / 100) * totalPages));
        }
      } catch (error) {
        console.warn('Erreur chargement progression:', error);
      }
    };
    loadProgress();
  }, [publicationId, totalPages]);

  // Sauvegarder la progression (debounced)
  const saveProgress = async (page: number) => {
    const newProgress = Math.round((page / totalPages) * 100);
    setProgress(newProgress);
    setIsSaving(true);
    
    try {
      await readingHistoryService.updateProgress(publicationId, newProgress);
      setLastSaved(new Date());
    } catch (error) {
      console.warn('Erreur sauvegarde progression:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    saveProgress(validPage);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePageChange(parseInt(e.target.value, 10));
  };

  if (!showProgress) {
    // Mode simple: juste tracker la lecture sans UI
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Progression de lecture
        </h4>
        
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {isSaving && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sauvegarde...
            </span>
          )}
          {!isSaving && lastSaved && (
            <span className="text-green-500">
              ✓ Sauvegardé
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Slider invisible par-dessus */}
        <input
          type="range"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Indicateurs */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Page {currentPage} / {totalPages}</span>
        <span className="font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
      </div>

      {/* Navigation rapide */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          onClick={() => handlePageChange(1)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Début"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={() => handlePageChange(currentPage - 10)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="-10 pages"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <input
          type="number"
          value={currentPage}
          onChange={(e) => handlePageChange(parseInt(e.target.value, 10) || 1)}
          min={1}
          max={totalPages}
          className="w-16 px-2 py-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
        />
        
        <button
          onClick={() => handlePageChange(currentPage + 10)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="+10 pages"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <button
          onClick={() => handlePageChange(totalPages)}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Fin"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReadingProgress;
