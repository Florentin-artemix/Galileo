import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublications } from '../contexts/PublicationsContext';
import ResearchCover from '../components/ResearchCover';
import { readingHistoryService, type ReadingHistoryItem } from '../services/readingHistoryService';
import type { Publication } from '../types';
import './discovery-home.css';

const titleFor = (publication: Publication, language: string) =>
  publication.title[language] || publication.title.fr || publication.title.en || '';

const yearFor = (value: string) => {
  const year = new Date(value).getFullYear();
  return Number.isFinite(year) ? year : '';
};

const uniqueRecentHistory = (items: ReadingHistoryItem[]) => {
  const seen = new Set<number>();
  return [...items]
    .sort((a, b) => (Date.parse(b.readAt) || 0) - (Date.parse(a.readAt) || 0))
    .filter(item => {
      if (seen.has(item.publicationId)) return false;
      seen.add(item.publicationId);
      return true;
    });
};

const DiscoveryHomePage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { publications, loading, error } = usePublications();
  const isFrench = language === 'fr';
  const accountId = user?.uid || user?.id || null;
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [historyOwnerId, setHistoryOwnerId] = useState<string | null>(null);
  const [historyStatus, setHistoryStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [selectedDomain, setSelectedDomain] = useState('');

  useEffect(() => {
    let active = true;
    if (!accountId) {
      setHistory([]);
      setHistoryOwnerId(null);
      setHistoryStatus('idle');
      return () => { active = false; };
    }

    setHistory([]);
    setHistoryOwnerId(accountId);
    setHistoryStatus('loading');
    readingHistoryService.getMyHistory()
      .then(items => {
        if (!active) return;
        setHistory(items);
        setHistoryStatus('ready');
      })
      .catch(() => { if (active) setHistoryStatus('error'); });
    return () => { active = false; };
  }, [accountId]);

  const historyBelongsToCurrentUser = historyOwnerId === accountId;
  const currentHistory = historyBelongsToCurrentUser ? history : [];
  const currentHistoryStatus = historyBelongsToCurrentUser ? historyStatus : accountId ? 'loading' : 'idle';
  const recentHistory = useMemo(() => uniqueRecentHistory(currentHistory), [currentHistory]);
  const historyDomains = useMemo(() => new Set(
    recentHistory.map(item => item.publicationDomain?.trim()).filter(Boolean) as string[]
  ), [recentHistory]);
  const domains = useMemo(() => [...new Set(
    publications.map(publication => publication.domain[language]).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, language)), [language, publications]);

  const feature = useMemo(() => {
    const isAIResearch = (publication: Publication) => {
      const searchable = [
        titleFor(publication, language),
        publication.domain[language],
        ...publication.tags
      ].join(' ').toLocaleLowerCase(language);
      return /intelligence artificielle|\bia\b|machine learning|deep learning|artificial intelligence/.test(searchable);
    };
    return publications.find(isAIResearch) || null;
  }, [language, publications]);

  const resumeEntry = recentHistory[0];
  const resumePublication = resumeEntry && publications.find(item => item.id === resumeEntry.publicationId);
  const readIds = new Set(recentHistory.map(item => item.publicationId));
  const recommendations = useMemo(() => {
    const remaining = publications.filter(item => !readIds.has(item.id));
    return [...remaining].sort((a, b) => {
      const aPreferred = historyDomains.has(a.domain[language] || '');
      const bPreferred = historyDomains.has(b.domain[language] || '');
      if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
      return (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0);
    });
  }, [historyDomains, language, publications, recentHistory]);
  const visibleRecommendations = recommendations
    .filter(item => !selectedDomain || item.domain[language] === selectedDomain)
    .slice(0, 3);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', { year: 'numeric' })
      : '';
  };
  const formatReadAt = (value: string) => {
    const date = new Date(value);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })
      : (isFrench ? 'Date indisponible' : 'Date unavailable');
  };

  return (
    <main className="discovery-page">
      <div className="discovery-page__content">
        <section className="discovery-hero" aria-labelledby="discovery-title">
          <div className="discovery-hero__copy">
            <p className="discovery-eyebrow">{isFrench ? 'VOTRE ESPACE DE RECHERCHE' : 'YOUR RESEARCH SPACE'}</p>
            <h1 id="discovery-title">{isFrench ? <>La connaissance,<br />à portée de question.</> : <>Knowledge,<br />within reach.</>}</h1>
            <p className="discovery-hero__description">
              {isFrench
                ? 'Explorez des travaux scientifiques fiables. Lisez, comprenez et reliez les idées avec l’aide de l’IA.'
                : 'Explore reliable research. Read, understand, and connect ideas with help from AI.'}
            </p>
            <div className="discovery-hero__actions">
              <NavLink className="discovery-button discovery-button--primary" to="/publications">
                {isFrench ? 'Explorer les publications' : 'Explore publications'}
              </NavLink>
              <NavLink className="discovery-button discovery-button--secondary" to="/ai-assistant">
                {isFrench ? 'Poser une question à l’IA' : 'Ask AI a question'}
              </NavLink>
            </div>
          </div>

          <article className="discovery-feature">
            <div className="discovery-feature__body">
              <span className="discovery-chip">{isFrench ? 'À LA UNE' : 'FEATURED'}</span>
              <h2>{feature ? titleFor(feature, language) : (isFrench ? 'L’intelligence artificielle au service de la recherche' : 'Artificial intelligence for research')}</h2>
              <p>{feature
                ? feature.summary[language] || feature.summary.fr || feature.summary.en || (isFrench ? 'Publication académique sélectionnée dans le catalogue.' : 'A selected academic publication from the catalog.')
                : (isFrench ? 'Un espace pour explorer la recherche et interroger vos documents avec l’IA.' : 'Explore research and ask questions about your documents with AI.')}</p>
              <NavLink to={feature ? `/publication/${feature.id}` : '/ai-assistant'} className="discovery-button discovery-button--primary">
                {feature ? (isFrench ? 'Lire la publication' : 'Read publication') : (isFrench ? 'Découvrir l’IA' : 'Explore AI')}
                <span aria-hidden="true">→</span>
              </NavLink>
            </div>
            {feature ? (
              <ResearchCover publication={feature} className="discovery-feature__cover" />
            ) : (
              <div className="discovery-feature__cover discovery-feature__cover--empty" aria-hidden="true">IA<br />&amp;<br />SCIENCE</div>
            )}
          </article>
        </section>

        <section className="discovery-resume" aria-labelledby="resume-title">
          <p className="discovery-section-label" id="resume-title">{isFrench ? 'REPRENDRE VOTRE LECTURE' : 'CONTINUE READING'}</p>
          {currentHistoryStatus === 'loading' ? (
            <div className="resume-card resume-card--empty" role="status">{isFrench ? 'Chargement de vos lectures…' : 'Loading your reading history…'}</div>
          ) : currentHistoryStatus === 'error' ? (
            <div className="resume-card resume-card--empty" role="status">{isFrench ? 'Votre historique de lecture est temporairement indisponible.' : 'Your reading history is temporarily unavailable.'}</div>
          ) : resumeEntry ? (
            <article className="resume-card">
              {resumePublication ? <ResearchCover publication={resumePublication} className="resume-card__cover" /> : <div className="resume-card__mark" aria-hidden="true">PDF</div>}
              <div className="resume-card__details">
                <h2>{resumePublication ? titleFor(resumePublication, language) : resumeEntry.publicationTitle || (isFrench ? 'Publication consultée' : 'Recently viewed publication')}</h2>
                <p>
                  {[resumeEntry.publicationDomain, resumeEntry.readProgress !== null && resumeEntry.readProgress !== undefined
                    ? `${Math.max(0, Math.min(100, Math.round(resumeEntry.readProgress)))}% ${isFrench ? 'consulté' : 'read'}`
                    : (isFrench ? 'Progression non enregistrée' : 'Progress not recorded'),
                  `${isFrench ? 'Dernière lecture' : 'Last read'} : ${formatReadAt(resumeEntry.readAt)}`].filter(Boolean).join(' · ')}
                </p>
                {typeof resumeEntry.readProgress === 'number' && (
                  <div className="resume-card__track" role="progressbar" aria-label={isFrench ? 'Progression de lecture' : 'Reading progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, resumeEntry.readProgress))}>
                    <span style={{ width: `${Math.max(0, Math.min(100, resumeEntry.readProgress))}%` }} />
                  </div>
                )}
              </div>
              <NavLink className="discovery-button discovery-button--primary resume-card__action" to={`/publication/${resumeEntry.publicationId}`}>
                {isFrench ? 'Continuer la lecture' : 'Continue reading'}
              </NavLink>
            </article>
          ) : (
            <div className="resume-card resume-card--empty">
              <div>
                <h2>{isFrench ? 'Votre prochaine lecture commence ici' : 'Your next read starts here'}</h2>
                <p>{isFrench ? 'Les publications consultées apparaîtront ici avec la progression réellement enregistrée.' : 'Publications you open will appear here with their recorded reading progress.'}</p>
              </div>
              <NavLink className="discovery-button discovery-button--primary" to="/publications">
                {isFrench ? 'Parcourir le catalogue' : 'Browse the catalog'}
              </NavLink>
            </div>
          )}
        </section>

        <section className="discovery-recommendations" id="domains" aria-labelledby="recommendations-title">
          <header className="discovery-section-heading">
            <div>
              <h2 id="recommendations-title">{historyDomains.size > 0 && currentHistoryStatus === 'ready' ? (isFrench ? 'Pour vous' : 'For you') : (isFrench ? 'À découvrir' : 'Discover')}</h2>
              <p>{currentHistoryStatus === 'loading'
                ? (isFrench ? 'Chargement de vos lectures récentes.' : 'Loading your recent reading.')
                : currentHistoryStatus === 'error'
                  ? (isFrench ? 'Votre historique est indisponible; les publications restent classées par date.' : 'Your history is unavailable; publications are still sorted by date.')
                  : historyDomains.size > 0
                ? (isFrench ? 'Sélection de publications dans les domaines de vos lectures récentes.' : 'Selected publications from domains in your recent reading.')
                : (isFrench ? 'Parcourez les publications récentes du catalogue.' : 'Browse recent publications from the catalog.')}</p>
            </div>
          </header>
          <div className="discovery-domain-filters" role="group" aria-label={isFrench ? 'Filtrer par domaine' : 'Filter by domain'}>
            <button type="button" className={!selectedDomain ? 'is-selected' : ''} onClick={() => setSelectedDomain('')}>
              {isFrench ? 'Tout' : 'All'}
            </button>
            {domains.slice(0, 6).map(domain => (
              <button type="button" className={selectedDomain === domain ? 'is-selected' : ''} key={domain} onClick={() => setSelectedDomain(domain)}>{domain}</button>
            ))}
          </div>

          {loading ? (
            <div className="discovery-publication-grid" aria-busy="true"><div className="discovery-card-skeleton" /><div className="discovery-card-skeleton" /><div className="discovery-card-skeleton" /></div>
          ) : error ? (
            <p className="discovery-inline-state" role="status">{isFrench ? 'Les publications ne sont pas disponibles pour le moment.' : 'Publications are unavailable right now.'}</p>
          ) : visibleRecommendations.length > 0 ? (
            <div className="discovery-publication-grid">
              {visibleRecommendations.map(publication => (
                <article className="discovery-publication-card" key={publication.id}>
                  <NavLink to={`/publication/${publication.id}`} className="discovery-publication-card__main">
                    <ResearchCover publication={publication} className="discovery-publication-card__cover" />
                    <div className="discovery-publication-card__content">
                      <p className="discovery-publication-card__type">{publication.type || (isFrench ? 'PUBLICATION' : 'PUBLICATION')}</p>
                      <h3>{titleFor(publication, language)}</h3>
                      <p className="discovery-publication-card__meta">
                        {[publication.authors.join(', '), yearFor(publication.date), publication.pageCount ? `${publication.pageCount} ${isFrench ? 'pages' : 'pages'}` : ''].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </NavLink>
                  {Boolean(publication.summary[language] || publication.summary.fr || publication.summary.en) && (
                    <p className="discovery-publication-card__summary">{publication.summary[language] || publication.summary.fr || publication.summary.en}</p>
                  )}
                  <div className="discovery-publication-card__footer">
                    {publication.pdfUrl ? <span className="discovery-status">{isFrench ? 'PDF disponible' : 'PDF available'}</span> : <span />}
                    {formatDate(publication.date) && <time dateTime={publication.date}>{formatDate(publication.date)}</time>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="discovery-inline-state">{isFrench ? 'Aucune publication ne correspond à ce domaine pour le moment.' : 'No publications match this domain yet.'}</p>
          )}
        </section>

        <p className="discovery-note">
          {isFrench
            ? 'Quand l’IA répond à partir d’un document, consultez les références retournées et le document original.'
            : 'When AI answers from a document, review the returned references and the original document.'}
        </p>
      </div>
    </main>
  );
};

export default DiscoveryHomePage;
