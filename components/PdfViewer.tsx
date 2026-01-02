import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PdfViewerProps {
  fileUrl: string;
  previewMode?: boolean; // Afficher en mode aperçu par défaut
}

const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl, previewMode = true }) => {
  const { translations } = useLanguage();
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFullPdf, setShowFullPdf] = useState(!previewMode);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // Reset state when fileUrl changes
  useEffect(() => {
    setPageNumber(1);
    setZoomLevel(1);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  }, [fileUrl]);

  const goToPrevPage = () => setPageNumber(Math.max(1, pageNumber - 1));
  const goToNextPage = () => setPageNumber(pageNumber + 1);

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(0.6, prev - 0.2));

  const iframeSrc = `${fileUrl}#page=${pageNumber}`;

  // Mode Prévisualisation (aperçu de la première page)
  if (!showFullPdf) {
    return (
      <div className="bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-xl overflow-hidden shadow-lg">
        {/* En-tête de prévisualisation */}
        <div className="bg-gradient-to-r from-light-accent/10 to-light-accent/5 dark:from-teal/20 dark:to-teal/10 px-6 py-4 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-light-accent dark:bg-teal rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-light-text dark:text-off-white">Aperçu du Document PDF</h3>
                <p className="text-sm text-light-text-secondary dark:text-gray-400">Première page</p>
              </div>
            </div>
            <button
              onClick={() => setShowFullPdf(true)}
              className="flex items-center gap-2 px-4 py-2 bg-light-accent dark:bg-teal text-white rounded-lg hover:bg-light-accent-hover dark:hover:bg-teal/80 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Lire le PDF complet
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-light-text dark:text-off-white border border-light-border dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ouvrir dans un nouvel onglet
            </a>
          </div>
        </div>

        {/* Aperçu de la première page */}
        <div className="relative aspect-[3/4] max-h-[500px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-light-accent dark:border-teal mx-auto mb-3"></div>
                <p className="text-light-text-secondary dark:text-gray-400">Chargement de l'aperçu...</p>
              </div>
            </div>
          )}
          <iframe
            key={`preview-${iframeKey}`}
            src={`${fileUrl}#page=1&view=FitH`}
            title="Aperçu PDF"
            className="w-full h-full"
            frameBorder="0"
            onLoad={() => setIsLoading(false)}
          />
          
          {/* Overlay pour indiquer qu'il faut cliquer */}
          <div 
            onClick={() => setShowFullPdf(true)}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent cursor-pointer group"
          >
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5 h-5 text-light-accent dark:text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="font-medium text-light-text dark:text-off-white">Cliquez pour voir le document complet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode Lecture complète
  return (
    <div className="bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-xl overflow-hidden shadow-lg">
      {/* Barre d'outils */}
      <div className="bg-light-card/80 dark:bg-navy/50 border-b border-light-border dark:border-dark-border p-3 flex items-center justify-between gap-4 sticky top-20 z-10 backdrop-blur-sm flex-wrap">
        {/* Navigation pages */}
        <div className="flex items-center gap-2">
          <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors flex items-center gap-1" aria-label={translations.pdf_viewer.previous}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">{translations.pdf_viewer.previous}</span>
          </button>
          <span className="text-light-text dark:text-off-white font-medium px-3 py-1 bg-light-accent/10 dark:bg-teal/10 rounded-lg">
            {translations.pdf_viewer.page} {pageNumber}
          </span>
          <button onClick={goToNextPage} className="px-3 py-1.5 rounded-lg hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors flex items-center gap-1" aria-label={translations.pdf_viewer.next}>
            <span className="hidden sm:inline">{translations.pdf_viewer.next}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} disabled={zoomLevel <= 0.6} className="w-8 h-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors text-lg font-bold flex items-center justify-center" aria-label={translations.pdf_viewer.zoom_out}>
            −
          </button>
          <span className="text-light-text dark:text-off-white w-16 text-center text-sm font-medium">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button onClick={zoomIn} disabled={zoomLevel >= 3} className="w-8 h-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors text-lg font-bold flex items-center justify-center" aria-label={translations.pdf_viewer.zoom_in}>
            +
          </button>
        </div>

        {/* Bouton retour aperçu */}
        <div className="flex items-center gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm rounded-lg border border-light-border dark:border-dark-border hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors flex items-center gap-1 text-light-text dark:text-off-white"
            title="Ouvrir dans un nouvel onglet"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="hidden md:inline">Nouvel onglet</span>
          </a>
          <button
            onClick={() => setShowFullPdf(false)}
            className="px-3 py-1.5 text-sm rounded-lg hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors flex items-center gap-1 text-light-text-secondary dark:text-gray-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Fermer
          </button>
        </div>
      </div>

      {/* Contenu PDF */}
      <div className="w-full aspect-[4/5] md:aspect-video overflow-auto bg-gray-200 dark:bg-gray-800">
        <div style={{ width: `${zoomLevel * 100}%`, height: `${zoomLevel * 100}%`, transition: 'width 0.3s, height 0.3s' }}>
          <iframe
            key={`full-${iframeKey}-${iframeSrc}`}
            src={iframeSrc}
            title={translations.pdf_viewer.title}
            className="w-full h-full"
            frameBorder="0"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;