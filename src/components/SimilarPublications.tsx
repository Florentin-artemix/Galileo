import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { searchService, type CatalogPublicationResult } from '../services/searchService';

interface SimilarPublicationsProps {
  publicationId: number;
  limit?: number;
  className?: string;
}

const SimilarPublications: React.FC<SimilarPublicationsProps> = ({
  publicationId,
  limit = 5,
  className = ''
}) => {
  const [publications, setPublications] = useState<CatalogPublicationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setHasError(false);

    searchService.getSimilarPublications(publicationId, limit)
      .then(results => {
        if (active) setPublications(results);
      })
      .catch(() => {
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [publicationId, limit]);

  if (!isLoading && !hasError && publications.length === 0) return null;

  return (
    <section className={`publication-sidebar-card publication-similar ${className}`} aria-labelledby="similar-publications-title">
      <h2 id="similar-publications-title" className="publication-sidebar-card__title">
        Publications similaires
      </h2>
      {isLoading ? (
        <p className="publication-sidebar-card__muted" role="status">Chargement…</p>
      ) : hasError ? (
        <p className="publication-sidebar-card__muted" role="status">Les publications similaires sont indisponibles.</p>
      ) : (
        <ul className="publication-similar__list">
          {publications.map(publication => (
            <li key={publication.id}>
              <NavLink className="publication-similar__link" to={`/publication/${publication.id}`}>
                <span className="publication-similar__domain">{publication.domainName || 'Publication'}</span>
                <span className="publication-similar__title">{publication.title}</span>
                {publication.authors.length > 0 && (
                  <span className="publication-similar__authors">{publication.authors.join(', ')}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default SimilarPublications;
