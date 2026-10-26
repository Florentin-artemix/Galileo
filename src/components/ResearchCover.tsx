import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Publication } from '../types';
import './research-cover.css';

interface ResearchCoverProps {
  publication: Pick<Publication, 'title' | 'domain' | 'imageUrl'>;
  className?: string;
}

const ResearchCover: React.FC<ResearchCoverProps> = ({ publication, className = '' }) => {
  const { language } = useLanguage();
  const title = publication.title[language] || publication.title.fr || publication.title.en || '';
  const domain = publication.domain[language] || publication.domain.fr || publication.domain.en || '';
  const imageUrl = publication.imageUrl && !publication.imageUrl.includes('picsum.photos')
    ? publication.imageUrl
    : '';

  return (
    <div className={`research-cover ${imageUrl ? 'research-cover--image' : ''} ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="" loading="lazy" />
      ) : (
        <>
          <span className="research-cover__rule" />
          <span className="research-cover__series">GALILEO / RESEARCH</span>
          <span className="research-cover__title">{title}</span>
          <span className="research-cover__domain">{domain}</span>
          <span className="research-cover__grid" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="research-cover__footer">OPEN ACCESS · PDF</span>
        </>
      )}
    </div>
  );
};

export default ResearchCover;
