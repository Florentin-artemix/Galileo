import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { readingHistoryService } from '../services/readingHistoryService';

interface ReadingProgressProps {
  publicationId: number;
  totalPages?: number | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  isAuthenticated: boolean;
  className?: string;
}

const ReadingProgress: React.FC<ReadingProgressProps> = ({
  publicationId,
  totalPages,
  currentPage,
  onPageChange,
  isAuthenticated,
  className = ''
}) => {
  const { language } = useLanguage();
  const [storedProgress, setStoredProgress] = useState<number | null>(null);
  const [hasPosition, setHasPosition] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error' | 'guest'>(
    isAuthenticated ? 'loading' : 'guest'
  );
  const loadedRef = useRef(false);
  const savedPageRef = useRef<number | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    loadedRef.current = false;
    savedPageRef.current = null;

    if (!isAuthenticated) {
      setHasPosition(false);
      setStoredProgress(null);
      setState('guest');
      return () => { active = false; };
    }

    setState('loading');
    readingHistoryService.getReadingPosition(publicationId)
      .then(position => {
        if (!active) return;
        setHasPosition(position !== null);
        if (typeof position?.progress === 'number'
          && (position.progress > 0 || !position.lastPage || position.lastPage <= 1)) {
          setStoredProgress(Math.max(0, Math.min(100, position.progress * 100)));
        } else {
          setStoredProgress(null);
        }
        const restoredPage = position?.lastPage && position.lastPage > 0 ? position.lastPage : 1;
        savedPageRef.current = restoredPage;
        if (position?.lastPage && position.lastPage > 0) onPageChange(position.lastPage);
        setState('ready');
      })
      .catch(() => {
        if (!active) return;
        savedPageRef.current = currentPage;
        setState('error');
      })
      .finally(() => {
        if (active) loadedRef.current = true;
      });

    return () => { active = false; };
  }, [publicationId, isAuthenticated, onPageChange]);

  useEffect(() => {
    if (!isAuthenticated || !loadedRef.current || currentPage === savedPageRef.current) return;

    const timeout = window.setTimeout(() => {
      const progress = totalPages && totalPages > 0
        ? Math.max(0, Math.min(1, currentPage / totalPages))
        : undefined;
      setState('saving');
      saveQueueRef.current = saveQueueRef.current.then(async () => {
        await readingHistoryService.saveReadingPosition(publicationId, currentPage, progress);
        savedPageRef.current = currentPage;
        setHasPosition(true);
        if (progress !== undefined) setStoredProgress(progress * 100);
        setState('saved');
      }).catch(() => {
        setState('error');
      });
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [publicationId, currentPage, totalPages, isAuthenticated]);

  const percentage = totalPages && totalPages > 0
    ? Math.max(0, Math.min(100, Math.round((currentPage / totalPages) * 100)))
    : storedProgress === null ? null : Math.round(storedProgress);
  const copy = language === 'fr'
    ? {
        title: 'Votre progression',
        pages: totalPages ? `Page ${currentPage} sur ${totalPages}` : `Page ${currentPage}`,
        guest: 'Connectez-vous pour synchroniser votre progression.',
        loading: 'Chargement de la progression…',
        empty: 'Aucune progression synchronisée pour le moment.',
        unknown: 'Le nombre total de pages n’est pas disponible.',
        saving: 'Enregistrement…',
        saved: 'Progression synchronisée',
        error: 'Progression non synchronisée',
        unavailable: 'La progression enregistrée n’a pas pu être chargée.',
        slider: 'Aller à une page'
      }
    : {
        title: 'Your progress',
        pages: totalPages ? `Page ${currentPage} of ${totalPages}` : `Page ${currentPage}`,
        guest: 'Sign in to sync your reading progress.',
        loading: 'Loading progress…',
        empty: 'No synchronized progress yet.',
        unknown: 'The total page count is unavailable.',
        saving: 'Saving…',
        saved: 'Progress synchronized',
        error: 'Progress not synchronized',
        unavailable: 'Your saved reading position could not be loaded.',
        slider: 'Go to page'
      };

  return (
    <section className={`publication-sidebar-card publication-progress ${className}`} aria-labelledby="reading-progress-title">
      <div className="publication-progress__heading">
        <h2 id="reading-progress-title" className="publication-sidebar-card__title">{copy.title}</h2>
        <span className="publication-progress__status" role="status">
          {state === 'loading' ? copy.loading : state === 'saving' ? copy.saving : state === 'saved' ? copy.saved : state === 'error' ? copy.error : ''}
        </span>
      </div>

      {percentage !== null && (
        <div
          className="publication-progress__track"
          role="progressbar"
          aria-label={copy.title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <span style={{ width: `${percentage}%` }} />
        </div>
      )}

      <p className="publication-progress__meta">
        {state === 'guest'
          ? copy.guest
          : state === 'loading'
            ? copy.loading
            : state === 'error'
              ? copy.unavailable
            : hasPosition || percentage !== null
              ? `${copy.pages}${percentage !== null ? ` · ${percentage}%` : ''}`
              : totalPages
                ? copy.empty
                : copy.unknown}
      </p>

      {totalPages && totalPages > 1 && (
        <input
          type="range"
          min={1}
          max={totalPages}
          value={Math.min(currentPage, totalPages)}
          onChange={event => onPageChange(Number(event.target.value))}
          aria-label={copy.slider}
          className="publication-progress__slider"
        />
      )}
    </section>
  );
};

export default ReadingProgress;
