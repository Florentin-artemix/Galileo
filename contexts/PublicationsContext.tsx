
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { Publication } from '../types';
import { publicationsService } from '../src/services/publicationsService';

interface PublicationsContextType {
  publications: Publication[];
  loading: boolean;
  error: string | null;
  refreshPublications: () => Promise<void>;
  addPublication: (publication: Omit<Publication, 'id'>) => Publication;
}

const PublicationsContext = createContext<PublicationsContextType | undefined>(undefined);

export const PublicationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les publications depuis le backend
  const refreshPublications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicationsService.getPublications(0, 100);
      const pubs = response.content.map(dto => publicationsService.dtoToPublication(dto));
      setPublications(pubs);
    } catch (err: any) {
      console.error('Erreur lors du chargement des publications:', err);
      setError(err.message || 'Erreur lors du chargement des publications');
      // En cas d'erreur, garder les publications existantes (ou vides)
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les publications au démarrage
  useEffect(() => {
    refreshPublications();
  }, [refreshPublications]);

  // Fonction locale pour ajouter (utilisée après soumission réussie)
  const addPublication = useCallback((publicationData: Omit<Publication, 'id'>) => {
    const newPublication: Publication = {
      ...publicationData,
      id: publications.length > 0 ? Math.max(...publications.map(p => p.id)) + 1 : 1,
    };

    setPublications(prevPublications => [newPublication, ...prevPublications]);
    return newPublication;
  }, [publications]);

  return (
    <PublicationsContext.Provider value={{ publications, loading, error, refreshPublications, addPublication }}>
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
