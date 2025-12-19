
import React, { useState, useMemo, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublications } from '../contexts/PublicationsContext';
import type { Publication } from '../types';
import Modal from '../components/Modal';

const PublicationCard: React.FC<{ 
    pub: Publication, 
    viewMode: 'grid' | 'list',
    onPreview: (pub: Publication) => void,
    onCite: (pub: Publication) => void,
}> = ({ pub, viewMode, onPreview, onCite }) => {
    const { language, translations } = useLanguage();
    
    const containerClasses = viewMode === 'grid' 
        ? "bg-light-card dark:bg-navy/50 flex flex-col"
        : "bg-light-card dark:bg-navy/50 grid grid-cols-1 md:grid-cols-3 gap-6 items-center";
    
    return (
        <div className={`border border-light-border dark:border-dark-border rounded-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 shadow-lg hover:shadow-xl dark:hover:shadow-teal/20 backdrop-blur-sm animate-slide-in-up ${containerClasses}`} style={{animationDelay: `${(pub.id % 6) * 50}ms`, animationFillMode: 'backwards'}}>
            <img loading="lazy" src={pub.imageUrl} alt={`Vignette pour ${pub.title[language]}`} className={viewMode === 'grid' ? "w-full h-48 object-cover" : "w-full h-full object-cover rounded-l-lg"} />
            
            <div className={viewMode === 'grid' ? "p-4 flex flex-col flex-grow" : "p-4 md:col-span-2"}>
                <div>
                    <p className="text-sm text-light-accent dark:text-teal mb-1">{pub.domain[language]}</p>
                    <h3 className="font-poppins text-lg font-bold mb-2 leading-tight text-light-text dark:text-off-white">{pub.title[language]}</h3>
                    <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-2">{pub.authors.join(', ')} - {new Date(pub.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-light-text-secondary dark:text-gray-300 text-sm mb-4 line-clamp-2">{pub.summary[language]}</p>
                </div>
                <div className={viewMode === 'grid' ? "mt-auto pt-4" : "mt-4"}>
                     <div className="flex flex-wrap gap-2 text-xs">
                        <NavLink to={`/publication/${pub.id}`} className="flex-1 text-center bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal font-semibold py-2 px-3 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300 min-w-[80px]">
                            {translations.publications_page.read_article}
                        </NavLink>
                        <button onClick={() => onPreview(pub)} className="flex-1 text-center bg-light-bg dark:bg-navy-dark border border-light-border dark:border-dark-border text-light-text-secondary dark:text-off-white font-semibold py-2 px-3 rounded-full hover:bg-slate-200 dark:hover:bg-teal/20 transition-colors duration-300 min-w-[80px]">
                            {translations.publications_page.preview}
                        </button>
                        {pub.pdfUrl ? (
                            <a href={pub.pdfUrl} download className="flex-1 text-center bg-light-bg dark:bg-navy-dark border border-light-border dark:border-dark-border text-light-text-secondary dark:text-off-white font-semibold py-2 px-3 rounded-full hover:bg-slate-200 dark:hover:bg-teal/20 transition-colors duration-300 min-w-[80px]">
                                {translations.publications_page.download_pdf}
                            </a>
                        ) : (
                            <button disabled className="flex-1 text-center bg-gray-200 dark:bg-gray-800 text-gray-500 font-semibold py-2 px-3 rounded-full cursor-not-allowed min-w-[80px]">
                                {translations.publications_page.pdf_not_available}
                            </button>
                        )}
                         <button onClick={() => onCite(pub)}  className="flex-1 text-center bg-light-bg dark:bg-navy-dark border border-light-border dark:border-dark-border text-light-text-secondary dark:text-off-white font-semibold py-2 px-3 rounded-full hover:bg-slate-200 dark:hover:bg-teal/20 transition-colors duration-300 min-w-[80px]">
                            {translations.publications_page.cite}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const PublicationsPage: React.FC = () => {
    const { language, translations } = useLanguage();
    const { publications, loading, error, refreshPublications } = usePublications();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [domainFilter, setDomainFilter] = useState('All');
    const [authorFilter, setAuthorFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');
    const [sortBy, setSortBy] = useState('date-desc');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    
    const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
    const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
    const [isCiteModalOpen, setCiteModalOpen] = useState(false);
    
    const [copiedCite, setCopiedCite] = useState('');

    // Rafraîchir les publications au montage de la page
    useEffect(() => {
        refreshPublications();
    }, []);

    // Ce hook doit être appelé avant tout return conditionnel
    const { domains, authors, years, filteredPublications } = useMemo(() => {
        const uniqueDomains = [...new Set(publications.map(p => p.domain[language]))].sort();
        const uniqueAuthors = [...new Set(publications.flatMap(p => p.authors))].sort();
        const uniqueYears = [...new Set(publications.map(p => new Date(p.date).getFullYear().toString()))].sort((a,b) => b.localeCompare(a));

        let processedPubs = publications.filter(pub => {
            const pubYear = new Date(pub.date).getFullYear().toString();
            const matchesDomain = domainFilter === 'All' || pub.domain[language] === domainFilter;
            const matchesAuthor = authorFilter === 'All' || pub.authors.includes(authorFilter);
            const matchesYear = yearFilter === 'All' || pubYear === yearFilter;
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                                  pub.title[language].toLowerCase().includes(lowerCaseSearchTerm) ||
                                  pub.authors.some(author => author.toLowerCase().includes(lowerCaseSearchTerm)) ||
                                  pub.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm));
            return matchesDomain && matchesAuthor && matchesYear && matchesSearch;
        });
        
        processedPubs.sort((a, b) => {
            switch (sortBy) {
                case 'title-asc':
                    return a.title[language].localeCompare(b.title[language]);
                case 'views-desc':
                     return (b.id % 5) - (a.id % 5);
                case 'date-desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

        return { domains: uniqueDomains, authors: uniqueAuthors, years: uniqueYears, filteredPublications: processedPubs };
    }, [searchTerm, domainFilter, authorFilter, yearFilter, sortBy, language, publications]);

    const itemsPerPage = 12;
    const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);
    const paginatedPublications = filteredPublications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleReset = () => {
        setSearchTerm('');
        setDomainFilter('All');
        setAuthorFilter('All');
        setYearFilter('All');
        setSortBy('date-desc');
        setCurrentPage(1);
    };

    const handlePreview = (pub: Publication) => {
        setSelectedPub(pub);
        setPreviewModalOpen(true);
    }
    
    const handleCite = (pub: Publication) => {
        setSelectedPub(pub);
        setCiteModalOpen(true);
    }

    const generateCitation = (pub: Publication, format: 'bibtex' | 'ris') => {
        const year = new Date(pub.date).getFullYear();
        const authors = pub.authors.join(' and ');
        if (format === 'bibtex') {
            return `@article{${pub.authors[0].split(' ')[0]}${year}${pub.title[language].split(' ')[0].replace(/[^a-zA-Z]/g, "")},
  title={${pub.title[language]}},
  author={${authors}},
  journal={GALILEO - Revue Scientifique Étudiante},
  year={${year}}
}`;
        }
        if (format === 'ris') {
            return `TY  - JOUR
AU  - ${pub.authors.join('\nAU  - ')}
TI  - ${pub.title[language]}
PY  - ${year}
JO  - GALILEO - Revue Scientifique Étudiante
ER  -`;
        }
        return '';
    };

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCite(type);
        setTimeout(() => setCopiedCite(''), 2000);
    }

    // Afficher un loader pendant le chargement (APRÈS tous les hooks)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 mx-auto text-light-accent dark:text-teal" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-light-text dark:text-off-white">{translations.publications_page?.loading || 'Chargement des publications...'}</p>
                </div>
            </div>
        );
    }

    // Afficher une erreur si nécessaire (APRÈS tous les hooks)
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={refreshPublications} className="bg-light-accent dark:bg-teal text-white px-4 py-2 rounded-full">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const inputClasses = "w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal";

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 animate-slide-in-up">
            <h1 className="text-4xl font-poppins font-bold text-center mb-12 text-light-text dark:text-off-white">{translations.publications_page.title}</h1>
            
            <div className="bg-light-bg dark:bg-navy/30 border border-light-border dark:border-dark-border rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="lg:col-span-2">
                     <label htmlFor="search-input" className="text-xs text-light-text-secondary dark:text-gray-400">{translations.publications_page.search_placeholder}</label>
                    <input
                        id="search-input"
                        type="text"
                        placeholder={translations.publications_page.search_placeholder}
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className={inputClasses}
                        aria-label={translations.publications_page.search_placeholder}
                    />
                </div>
                 <div>
                    <label className="text-xs text-light-text-secondary dark:text-gray-400">{translations.publications_page.filter_domain}</label>
                    <select value={domainFilter} onChange={e => { setDomainFilter(e.target.value); setCurrentPage(1); }} className={inputClasses}>
                        <option value="All">{translations.publications_page.all_domains}</option>
                        {domains.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                     <label className="text-xs text-light-text-secondary dark:text-gray-400">{translations.publications_page.filter_author}</label>
                     <select value={authorFilter} onChange={e => { setAuthorFilter(e.target.value); setCurrentPage(1); }} className={inputClasses}>
                        <option value="All">{translations.publications_page.all_authors}</option>
                        {authors.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <button onClick={handleReset} className="w-full bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal font-semibold py-2 px-3 rounded-md hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300 h-10">{translations.publications_page.reset_filters}</button>
            </div>
            
             <div className="flex justify-between items-center mb-6">
                 <div className="text-sm text-light-text-secondary dark:text-gray-400">
                    {filteredPublications.length} {filteredPublications.length > 1 ? 'résultats' : 'résultat'}
                </div>
                 <div className="flex items-center gap-4">
                     <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`${inputClasses} text-sm !py-1`}>
                         <option value="date-desc">{translations.publications_page.sort_newest}</option>
                         <option value="views-desc">{translations.publications_page.sort_views}</option>
                         <option value="title-asc">{translations.publications_page.sort_az}</option>
                     </select>
                    <div className="flex items-center gap-1 bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md p-1">
                         <button onClick={() => setViewMode('grid')} className={`px-2 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-light-accent dark:bg-teal text-white dark:text-navy' : 'text-light-text-secondary dark:text-gray-400'}`}>Grid</button>
                         <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-light-accent dark:bg-teal text-white dark:text-navy' : 'text-light-text-secondary dark:text-gray-400'}`}>List</button>
                    </div>
                </div>
            </div>

            <div className={viewMode === 'grid' ? "grid md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-6"}>
                {paginatedPublications.map(pub => (
                    <PublicationCard key={pub.id} pub={pub} viewMode={viewMode} onPreview={handlePreview} onCite={handleCite} />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-full transition-colors ${currentPage === page ? 'bg-light-accent dark:bg-teal text-white dark:text-navy' : 'bg-light-card dark:bg-navy/50 hover:bg-light-accent/20 dark:hover:bg-teal/20'}`}>
                            {page}
                        </button>
                    ))}
                </div>
            )}
            
            {selectedPub && (
                 <>
                 <Modal isOpen={isPreviewModalOpen} onClose={() => setPreviewModalOpen(false)} title={selectedPub.title[language]}>
                     <div className="space-y-4">
                         <p className="text-sm text-light-accent dark:text-teal">{selectedPub.authors.join(', ')}</p>
                         <p className="text-light-text-secondary dark:text-gray-300">{selectedPub.summary[language]}</p>
                         <div className="flex flex-wrap gap-2 pt-4 border-t border-light-border dark:border-dark-border">
                              <NavLink to={`/publication/${selectedPub.id}`} className="flex-1 text-center bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-2 px-4 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300">
                                {translations.publications_page.read_article}
                            </NavLink>
                             {selectedPub.pdfUrl ? (
                                <a href={selectedPub.pdfUrl} download className="flex-1 text-center border border-light-accent dark:border-teal text-light-accent dark:text-teal font-bold py-2 px-4 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300">
                                    {translations.publications_page.download_pdf}
                                </a>
                            ) : null}
                         </div>
                     </div>
                 </Modal>

                 <Modal isOpen={isCiteModalOpen} onClose={() => setCiteModalOpen(false)} title={translations.publications_page.citation_title}>
                     <div className="space-y-4">
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-light-text dark:text-off-white">BibTeX</h4>
                                <button onClick={() => handleCopy(generateCitation(selectedPub, 'bibtex'), 'bibtex')} className="text-xs bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal px-2 py-1 rounded-md">{copiedCite === 'bibtex' ? translations.publications_page.copied : translations.publications_page.copy}</button>
                            </div>
                            <pre className="bg-light-bg dark:bg-navy-dark p-2 rounded text-xs text-light-text-secondary dark:text-gray-400 whitespace-pre-wrap break-all"><code>{generateCitation(selectedPub, 'bibtex')}</code></pre>
                         </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-light-text dark:text-off-white">RIS</h4>
                                 <button onClick={() => handleCopy(generateCitation(selectedPub, 'ris'), 'ris')} className="text-xs bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal px-2 py-1 rounded-md">{copiedCite === 'ris' ? translations.publications_page.copied : translations.publications_page.copy}</button>
                            </div>
                            <pre className="bg-light-bg dark:bg-navy-dark p-2 rounded text-xs text-light-text-secondary dark:text-gray-400 whitespace-pre-wrap break-all"><code>{generateCitation(selectedPub, 'ris')}</code></pre>
                         </div>
                     </div>
                 </Modal>
                 </>
            )}

        </div>
    );
};

export default PublicationsPage;
