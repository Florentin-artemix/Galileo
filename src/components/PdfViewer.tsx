import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { documentsService } from '../services/documentsService';

interface PdfViewerProps {
  documentId: number;
  pageCount?: number | null;
  pageNumber: number;
  onPageChange: (page: number) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ documentId, pageCount, pageNumber, onPageChange }) => {
  const { language, translations } = useLanguage();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setFileUrl(null);
    setStatus('loading');
    setFrameLoaded(false);

    documentsService.getDocumentBlob(documentId)
      .then(blob => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setFileUrl(objectUrl);
        setStatus('ready');
      })
      .catch(() => {
        if (active) {
          setFileUrl(null);
          setStatus('error');
        }
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, loadAttempt]);

  useEffect(() => {
    if (status !== 'ready' || !fileUrl || frameLoaded) return;
    const timer = window.setTimeout(() => {
      setFrameLoaded(true);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [status, fileUrl, frameLoaded, pageNumber, zoom]);

  const previous = () => {
    onPageChange(Math.max(1, pageNumber - 1));
  };
  const next = () => {
    onPageChange(pageCount ? Math.min(pageCount, pageNumber + 1) : pageNumber + 1);
  };
  const changeZoom = (amount: number) => {
    setZoom(value => Math.max(60, Math.min(300, value + amount)));
  };
  const labels = language === 'fr'
    ? { previous: 'Page précédente', next: 'Page suivante', zoomOut: 'Réduire le zoom', zoomIn: 'Augmenter le zoom', loading: 'Chargement du document…', error: 'Le document PDF est indisponible ou vous n’êtes pas autorisé à le consulter.', page: 'Page', openDirect: 'Ouvrir le PDF' }
    : { previous: 'Previous page', next: 'Next page', zoomOut: 'Zoom out', zoomIn: 'Zoom in', loading: 'Loading document…', error: 'The PDF is unavailable or you are not authorized to view it.', page: 'Page', openDirect: 'Open PDF' };

  return (
    <section className="publication-pdf" aria-label={translations.pdf_viewer.title}>
      <div className="publication-pdf__toolbar">
        <div className="publication-pdf__page-controls">
          <button type="button" onClick={previous} disabled={pageNumber <= 1} aria-label={labels.previous} title={labels.previous}>
            <span aria-hidden="true">‹</span>
          </button>
          <span className="publication-pdf__page-label">
            {labels.page} {pageNumber}{pageCount ? ` / ${pageCount}` : ''}
          </span>
          <button type="button" onClick={next} disabled={Boolean(pageCount && pageNumber >= pageCount)} aria-label={labels.next} title={labels.next}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <div className="publication-pdf__zoom-controls">
          <button type="button" onClick={() => changeZoom(-10)} disabled={zoom <= 60} aria-label={labels.zoomOut} title={labels.zoomOut}>−</button>
          <span aria-live="polite">{zoom}%</span>
          <button type="button" onClick={() => changeZoom(10)} disabled={zoom >= 300} aria-label={labels.zoomIn} title={labels.zoomIn}>+</button>
          {fileUrl && (
            <a
              href={fileUrl}
              download={`document-${documentId}.pdf`}
              className="publication-action publication-action--secondary"
            >
              {labels.openDirect}
            </a>
          )}
        </div>
      </div>

      <div className="publication-pdf__stage">
        {(status === 'loading' || (status === 'ready' && !frameLoaded)) && (
          <div className="publication-pdf__message" role="status">
            <span className="publication-pdf__spinner" aria-hidden="true" />
            {labels.loading}
          </div>
        )}
        {status === 'error' ? (
          <div className="publication-pdf__message publication-pdf__message--error" role="alert">
            <span>{labels.error}</span>
            <button
              type="button"
              className="publication-action publication-action--secondary"
              onClick={() => setLoadAttempt(attempt => attempt + 1)}
            >
              {language === 'fr' ? 'Réessayer' : 'Try again'}
            </button>
          </div>
        ) : fileUrl ? (
          <iframe
            key={`${documentId}-${pageNumber}-${zoom}`}
            src={`${fileUrl}#page=${pageNumber}&zoom=${zoom}`}
            title={translations.pdf_viewer.title}
            onLoad={() => setFrameLoaded(true)}
          />
        ) : null}
      </div>
    </section>
  );
};

export default PdfViewer;
