
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { publications as initialPublications } from '../data/publications';
import type { Publication } from '../types';

interface PublicationsContextType {
  publications: Publication[];
  addPublication: (publication: Omit<Publication, 'id'>) => Publication;
}

const PublicationsContext = createContext<PublicationsContextType | undefined>(undefined);

export const PublicationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [publications, setPublications] = useState<Publication[]>(initialPublications);

  const addPublication = useCallback((publicationData: Omit<Publication, 'id'>) => {
    const newPublication: Publication = {
      ...publicationData,
      id: publications.length > 0 ? Math.max(...publications.map(p => p.id)) + 1 : 1,
    };

    setPublications(prevPublications => [newPublication, ...prevPublications]);
    return newPublication;
  }, [publications]);

  return (
    <PublicationsContext.Provider value={{ publications, addPublication }}>
      {children}
    </PublicationsContext.Provider>
  );
};

export const usePublications = (): PublicationsContextType => {
  const context = useContext(PublicationsContext);
  if (!context) {
    throw new Error('usePublications must be used within a PublicationsProvider');
  }
  return context;
};
