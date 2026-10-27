import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { usePublications } from '../contexts/PublicationsContext';
import Modal from '../components/Modal';
import SearchBarWithAutocomplete from '../components/SearchBarWithAutocomplete';
import { searchService, type CatalogPublicationResult } from '../services/searchService';
import { documentsService } from '../services/documentsService';
import { publicationsService } from '../services/publicationsService';
import './catalog.css';

type SortBy = 'publishedAt' | 'title' | 'viewCount';
type ViewMode = 'grid' | 'list';

const PAGE_SIZE = 6;

const publicationTypes: Record<string, string> = {
  THESIS: 'Thèse',
  MASTER_THESIS: 'Mémoire de master',
  RESEARCH_PAPER: 'Article de recherche',
  REPORT: 'Rapport',
  INTERNSHIP_REPORT: 'Rapport de stage',
  PROJECT: 'Projet',
  CONFERENCE_PAPER: 'Article de conférence',
  ARTICLE: 'Article',
  OTHER: 'Autre'
};

const formatDate = (value: string | null | undefined, language: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};

const PublicationCard: React.FC<{
  publication: CatalogPublicationResult;
  viewMode: ViewMode;
  canReadFullText: boolean;
  downloading: boolean;
  onPreview: (publication: CatalogPublicationResult) => void;
  onCite: (publication: CatalogPublicationResult) => void;
  onDownload: (publication: CatalogPublicationResult) => void;
}> = ({ publication, viewMode, canReadFullText, downloading, onPreview, onCite, onDownload }) => {
  const { language, translations } = useLanguage();
  const title = publication.title || translations.publications_page.title;
  const type = publication.type ? publicationTypes[publication.type] || publication.type.replaceAll('_', ' ').toLowerCase() : null;
  const date = formatDate(publication.publishedAt, language);

  return (
    <article className={`catalog-publication-card ${viewMode === 'list' ? 'catalog-publication-card--list' : ''}`}>
      <div className="catalog-cover" aria-hidden="true">
        <span className="catalog-cover__brand">GALILEO / PUBLICATION</span>
        <span className="catalog-cover__rule" />
        {type && <span className="catalog-cover__type">{type}</span>}
      </div>
      <div className="catalog-publication-card__content">
        <div className="catalog-publication-card__details">
          {publication.domainName && <p className="catalog-publication-card__domain">{publication.domainName}</p>}
          <h2 className="catalog-publication-card__title">
            <NavLink to={`/publication/${publication.id}`}>{title}</NavLink>
          </h2>
          {(publication.authors.length > 0 || date) && (
            <p className="catalog-publication-card__meta">
              {[publication.authors.join(', '), date].filter(Boolean).join(' · ')}
            </p>
          )}
          {publication.abstractText && <p className="catalog-publication-card__summary">{publication.abstractText}</p>}
        </div>
        <div className="catalog-publication-card__actions">
          <NavLink to={`/publication/${publication.id}`} className="catalog-read-link">
            {canReadFullText
              ? translations.publications_page.read_article
              : (language === 'fr' ? 'Voir la notice' : 'View details')}
            <span aria-hidden="true">→</span>
          </NavLink>
          <div className="catalog-secondary-actions">
            <button type="button" onClick={() => onPreview(publication)} title={translations.publications_page.preview}>
              {translations.publications_page.preview}
            </button>
            <button type="button" onClick={() => onCite(publication)} title={translations.publications_page.cite}>
              {translations.publications_page.cite}
            </button>
            {canReadFullText && publication.hasDocument && <button type="button" onClick={() => onDownload(publication)} disabled={downloading} title={translations.publications_page.download_pdf}>
              {downloading ? '…' : 'PDF'}
            </button>}
          </div>
        </div>
      </div>
    </article>
  );
};

const PublicationsPage: React.FC = () => {
  const { language, translations } = useLanguage();
  const { isAuthenticated, role } = useAuth();
  const { publications } = usePublications();
  const canReadFullText = isAuthenticated && role !== 'VIEWER';
  const [searchParams, setSearchParams] = useSearchParams();
  const routeQuery = searchParams.get('q') || '';
  const [searchDraft, setSearchDraft] = useState(routeQuery);
  const [query, setQuery] = useState(routeQuery);
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('publishedAt');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(0);
  const [results, setResults] = useState<CatalogPublicationResult[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPublication, setSelectedPublication] = useState<CatalogPublicationResult | null>(null);
  const [modal, setModal] = useState<'preview' | 'cite' | null>(null);
  const [copiedFormat, setCopiedFormat] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    setSearchDraft(routeQuery);
    setQuery(routeQuery);
    setPage(0);
  }, [routeQuery]);

  const domains = useMemo(() => [...new Set(
    publications.map(publication => publication.domain[language]).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, language)), [language, publications]);

  const academicYears = useMemo(() => [...new Set(
    publications.map(publication => publication.academicYear).filter((year): year is string => Boolean(year))
  )].sort((a, b) => b.localeCompare(a)), [publications]);

  const loadCatalog = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await searchService.searchCatalog({
        query,
        domain,
        type,
        academicYear,
        page,
        size: PAGE_SIZE,
        sortBy,
        direction,
        signal
      });
      if (!signal?.aborted) {
        setResults(response.publications || []);
        setTotalHits(response.totalHits || 0);
        setTotalPages(response.totalPages || 0);
      }
    } catch {
      if (!signal?.aborted) setError(language === 'fr' ? 'Impossible de charger les publications.' : 'Publications could not be loaded.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [academicYear, direction, domain, language, page, query, sortBy, type]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => loadCatalog(controller.signal), 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadCatalog]);

  const submitSearch = (value: string) => {
    setQuery(value.trim());
    setPage(0);
    if (value.trim()) setSearchParams({ q: value.trim() });
    else setSearchParams({});
  };

  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
  };

  const generateCitation = (publication: CatalogPublicationResult, format: 'bibtex' | 'ris') => {
    const year = publication.publishedAt ? new Date(publication.publishedAt).getFullYear() : '';
    const authors = publication.authors || [];
    if (format === 'bibtex') {
      const key = `${authors[0]?.split(' ').at(-1) || 'Galileo'}${year}${publication.id}`;
      return `@article{${key},\n  title={${publication.title}},\n  author={${authors.join(' and ')}},\n  journal={GALILEO},\n  year={${year}}\n}`;
    }
    return `TY  - JOUR\n${authors.map(author => `AU  - ${author}`).join('\n')}\nTI  - ${publication.title}\n${year ? `PY  - ${year}\n` : ''}JO  - GALILEO\nER  -`;
  };

  const copyCitation = async (format: 'bibtex' | 'ris') => {
    if (!selectedPublication) return;
    await navigator.clipboard.writeText(generateCitation(selectedPublication, format));
    setCopiedFormat(format);
    window.setTimeout(() => setCopiedFormat(''), 1800);
  };

  const openModal = (publication: CatalogPublicationResult, kind: 'preview' | 'cite') => {
    setSelectedPublication(publication);
    setModal(kind);
  };

  const retry = () => void loadCatalog();

  const downloadPublication = async (publication: CatalogPublicationResult) => {
    if (!canReadFullText) return;
    setDownloadingId(publication.id);
    setDownloadError('');
    try {
      const document = await documentsService.getDocumentForPublication(publication.id);
      const blob = await documentsService.getDocumentBlob(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.fileName || `publication-${publication.id}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      void publicationsService.recordDownload(publication.id).catch(() => undefined);
    } catch {
      setDownloadError(language === 'fr' ? 'Le PDF est momentanément indisponible.' : 'The PDF is temporarily unavailable.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <main id="catalog-page" className="catalog-page min-h-[calc(100vh-74px)]">
      <div className="catalog-content">
        <header className="catalog-heading">
          <p className="catalog-eyebrow">{language === 'fr' ? 'CATALOGUE SCIENTIFIQUE' : 'SCIENTIFIC CATALOG'}</p>
          <h1>{translations.publications_page.title}</h1>
          <p>{language === 'fr'
            ? 'Parcourez les travaux publiés et recherchez par titre, auteur, domaine ou type de publication.'
            : 'Browse published research and search by title, author, domain, or publication type.'}</p>
        </header>

        <section className="catalog-controls" aria-label={language === 'fr' ? 'Recherche et filtres' : 'Search and filters'}>
          <SearchBarWithAutocomplete
            className="catalog-search"
            placeholder={translations.publications_page.search_placeholder}
            value={searchDraft}
            onChange={setSearchDraft}
            onSearch={submitSearch}
          />
          <label className="catalog-select catalog-select--domain">
            <span className="sr-only">{translations.publications_page.filter_domain}</span>
            <select value={domain} onChange={event => setFilter(setDomain, event.target.value)}>
              <option value="">{translations.publications_page.all_domains}</option>
              {domains.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="catalog-select catalog-select--type">
            <span className="sr-only">Type de document</span>
            <select value={type} onChange={event => setFilter(setType, event.target.value)}>
              <option value="">Type de document</option>
              {Object.entries(publicationTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="catalog-select catalog-select--year">
            <span className="sr-only">Année académique</span>
            <select value={academicYear} onChange={event => setFilter(setAcademicYear, event.target.value)}>
              <option value="">Année</option>
              {academicYears.map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="catalog-select catalog-select--sort">
            <span className="sr-only">Trier les publications</span>
            <select
              value={`${sortBy}:${direction}`}
              onChange={event => {
                const [field, order] = event.target.value.split(':') as [SortBy, 'asc' | 'desc'];
                setSortBy(field);
                setDirection(order);
                setPage(0);
              }}
            >
              <option value="publishedAt:desc">Plus récents</option>
              <option value="title:asc">Titre A-Z</option>
              <option value="viewCount:desc">Plus consultés</option>
            </select>
          </label>
        </section>

        <div className="catalog-results-meta">
          <p aria-live="polite">
            {loading
              ? (language === 'fr' ? 'Chargement des publications…' : 'Loading publications…')
              : `${totalHits} ${totalHits === 1 ? 'publication disponible' : 'publications disponibles'}`}
          </p>
          <div className="catalog-view-toggle" role="group" aria-label="Mode d’affichage">
            <span>Affichage :</span>
            <button type="button" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}>Grille</button>
            <button type="button" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}>Liste</button>
          </div>
        </div>
        {downloadError && <p className="catalog-download-error" role="alert">{downloadError}</p>}

        {error ? (
          <div className="catalog-state catalog-state--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={retry}>{language === 'fr' ? 'Réessayer' : 'Retry'}</button>
          </div>
        ) : loading ? (
          <div className={`catalog-grid ${viewMode === 'list' ? 'catalog-grid--list' : ''}`} aria-label="Chargement">
            {Array.from({ length: PAGE_SIZE }, (_, index) => <div className="catalog-skeleton" key={index} />)}
          </div>
        ) : results.length === 0 ? (
          <div className="catalog-state">
            <h2>{language === 'fr' ? 'Aucune publication trouvée' : 'No publications found'}</h2>
            <p>{language === 'fr' ? 'Essayez de modifier votre recherche ou vos filtres.' : 'Try changing your search or filters.'}</p>
            {(query || domain || type || academicYear) && <button type="button" onClick={() => {
              setSearchDraft('');
              setQuery('');
              setDomain('');
              setType('');
              setAcademicYear('');
              setPage(0);
              setSearchParams({});
            }}>{language === 'fr' ? 'Effacer les filtres' : 'Clear filters'}</button>}
          </div>
        ) : (
          <div className={`catalog-grid ${viewMode === 'list' ? 'catalog-grid--list' : ''}`}>
            {results.map(publication => <PublicationCard
              key={publication.id}
              publication={publication}
              viewMode={viewMode}
              canReadFullText={canReadFullText}
              downloading={downloadingId === publication.id}
              onPreview={publication => openModal(publication, 'preview')}
              onCite={publication => openModal(publication, 'cite')}
              onDownload={publication => void downloadPublication(publication)}
            />)}
          </div>
        )}

        {!error && totalPages > 1 && (
          <nav className="catalog-pagination" aria-label="Pagination du catalogue">
            <button type="button" disabled={page === 0 || loading} onClick={() => setPage(value => Math.max(0, value - 1))}>Précédent</button>
            <span>Page {page + 1} sur {totalPages}</span>
            <button type="button" disabled={page >= totalPages - 1 || loading} onClick={() => setPage(value => Math.min(totalPages - 1, value + 1))}>Suivant</button>
          </nav>
        )}
      </div>

      {selectedPublication && (
        <>
          <Modal isOpen={modal === 'preview'} onClose={() => setModal(null)} title={selectedPublication.title}>
            <div className="space-y-4">
              {selectedPublication.authors.length > 0 && <p className="text-sm text-[#00838f]">{selectedPublication.authors.join(', ')}</p>}
              {selectedPublication.domainName && <p className="text-sm text-gray-500">{selectedPublication.domainName}</p>}
              {selectedPublication.abstractText && <p className="break-words text-sm text-gray-700 dark:text-gray-300">{selectedPublication.abstractText}</p>}
              <NavLink to={`/publication/${selectedPublication.id}`} className="inline-flex rounded-[7px] bg-[#00838f] px-4 py-2 text-sm font-semibold text-white">
                {canReadFullText
                  ? translations.publications_page.read_article
                  : (language === 'fr' ? 'Voir la notice' : 'View details')}
              </NavLink>
            </div>
          </Modal>
          <Modal isOpen={modal === 'cite'} onClose={() => setModal(null)} title={translations.publications_page.citation_title}>
            <div className="space-y-4">
              {(['bibtex', 'ris'] as const).map(format => (
                <section key={format}>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-semibold">{format.toUpperCase()}</h3>
                    <button type="button" onClick={() => void copyCitation(format)} className="rounded-[6px] border border-[#e3e8ed] px-2 py-1 text-xs text-[#14786e]">
                      {copiedFormat === format ? translations.publications_page.copied : translations.publications_page.copy}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-all rounded-[6px] bg-[#f5f8fa] p-3 text-xs text-[#494f58]">{generateCitation(selectedPublication, format)}</pre>
                </section>
              ))}
            </div>
          </Modal>
        </>
      )}
    </main>
  );
};

export default PublicationsPage;
