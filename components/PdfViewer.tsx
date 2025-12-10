import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PdfViewerProps {
  fileUrl: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl }) => {
  const { translations } = useLanguage();
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);

  const goToPrevPage = () => setPageNumber(Math.max(1, pageNumber - 1));
  const goToNextPage = () => setPageNumber(pageNumber + 1);

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(0.6, prev - 0.2));

  const iframeSrc = `${fileUrl}#page=${pageNumber}`;

  return (
    <div>
      <div className="bg-light-card/80 dark:bg-navy/50 border-x border-t border-light-border dark:border-dark-border rounded-t-lg p-2 flex items-center justify-center gap-4 text-sm sticky top-20 z-10 backdrop-blur-sm flex-wrap">
        <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors" aria-label={translations.pdf_viewer.previous}>
          &larr; {translations.pdf_viewer.previous}
        </button>
        <span className="text-light-text dark:text-off-white">{translations.pdf_viewer.page} {pageNumber}</span>
        <button onClick={goToNextPage} className="px-3 py-1 rounded-md hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors" aria-label={translations.pdf_viewer.next}>
          {translations.pdf_viewer.next} &rarr;
        </button>
        <span className="border-l border-light-border dark:border-dark-border h-6 mx-2 hidden sm:block"></span>
        <button onClick={zoomOut} disabled={zoomLevel <= 0.6} className="px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors text-lg font-bold" aria-label={translations.pdf_viewer.zoom_out}>
          -
        </button>
        <span className="text-light-text dark:text-off-white w-20 text-center">{translations.pdf_viewer.zoom}: {Math.round(zoomLevel * 100)}%</span>
        <button onClick={zoomIn} disabled={zoomLevel >= 3} className="px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-accent/10 dark:hover:bg-teal/20 transition-colors text-lg font-bold" aria-label={translations.pdf_viewer.zoom_in}>
          +
        </button>
      </div>

      <div className="w-full aspect-[4/5] md:aspect-video overflow-auto border-x border-b border-light-border dark:border-dark-border rounded-b-lg bg-gray-200 dark:bg-gray-800">
        <div style={{ width: `${zoomLevel * 100}%`, height: `${zoomLevel * 100}%`, transition: 'width 0.3s, height 0.3s' }}>
            <iframe
                key={iframeSrc}
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