import React from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublications } from '../contexts/PublicationsContext';
import PdfViewer from '../components/PdfViewer';

const SinglePublicationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, translations } = useLanguage();
  const { publications } = usePublications();
  const publication = publications.find(p => p.id.toString() === id);

  if (!publication) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-poppins font-bold">Publication not found</h1>
        <NavLink to="/publications" className="text-light-accent dark:text-teal mt-4 inline-block">Return to publications</NavLink>
      </div>
    );
  }

  const relatedPublications = publications.filter(p => p.domain[language] === publication.domain[language] && p.id !== publication.id).slice(0, 3);

  return (
    <div className="animate-slide-in-up">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto bg-light-card dark:bg-navy/30 border border-light-border dark:border-dark-border rounded-lg p-6 sm:p-8 shadow-2xl dark:shadow-teal/10">
          <p className="text-light-accent dark:text-teal font-bold mb-2">{publication.domain[language]}</p>
          <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-4 text-light-text dark:text-off-white">{publication.title[language]}</h1>
          <p className="text-light-text-secondary dark:text-gray-400 mb-2">
              <strong>Auteurs :</strong> {publication.authors.join(', ')}
          </p>
          <p className="text-light-text-secondary dark:text-gray-400 mb-6">
              <strong>Date de publication :</strong> {new Date(publication.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-8">
              {publication.tags.map(tag => (
                  <span key={tag} className="bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal text-xs font-medium px-2.5 py-0.5 rounded-full">{tag}</span>
              ))}
          </div>

          <div className="prose prose-lg max-w-none text-light-text-secondary dark:text-gray-300 prose-headings:font-poppins prose-headings:text-light-text dark:prose-headings:text-off-white">
              <h2 className="text-2xl font-poppins font-bold border-b border-light-border dark:border-dark-border pb-2 mb-4">Résumé</h2>
              <p>{publication.summary[language]}</p>
          </div>

          <div className="mt-12 border-t border-light-border dark:border-dark-border pt-8">
              <h2 className="text-2xl font-poppins font-bold mb-6 text-light-text dark:text-off-white">{translations.publications_page.consult_article}</h2>
              {publication.pdfUrl ? (
                  <>
                      <div className="mb-6">
                          <a href={publication.pdfUrl} download className="inline-block bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-3 px-6 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300">
                              {translations.publications_page.download_pdf}
                          </a>
                      </div>
                      <PdfViewer fileUrl={publication.pdfUrl} />
                  </>
              ) : (
                  <p className="text-gray-500">{translations.publications_page.pdf_not_available}</p>
              )}
          </div>
        </div>

        {relatedPublications.length > 0 && (
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-poppins font-bold mb-6 text-light-text dark:text-off-white">Articles similaires</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPublications.map(pub => (
                <NavLink key={pub.id} to={`/publication/${pub.id}`} className="block bg-light-card dark:bg-navy/50 p-4 rounded-lg border border-light-border dark:border-dark-border transform hover:-translate-y-1 transition-transform duration-300 shadow-lg hover:shadow-xl dark:hover:shadow-teal/20">
                  <h3 className="font-poppins font-bold text-base mb-2 line-clamp-2 text-light-text dark:text-off-white">{pub.title[language]}</h3>
                  <p className="text-xs text-light-accent dark:text-teal">{pub.authors.join(', ')}</p>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SinglePublicationPage;