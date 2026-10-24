import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { PublicationDTO } from '../../../services/publicationsService';
import DataTable, { Column } from '../DataTable';
import { EyeIcon } from '../DashboardIcons';

interface PublicationsManagementViewProps {
  publications: PublicationDTO[];
  loading?: boolean;
}

export const PublicationsManagementView: React.FC<PublicationsManagementViewProps> = ({
  publications,
  loading = false,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  const domains = useMemo(() => {
    const set = new Set<string>();
    publications.forEach((p) => {
      if (p.domaine) set.add(p.domaine);
    });
    return Array.from(set);
  }, [publications]);

  const filteredPublications = useMemo(() => {
    if (selectedDomain === 'ALL') return publications;
    return publications.filter((p) => p.domaine === selectedDomain);
  }, [publications, selectedDomain]);

  const columns: Column<PublicationDTO>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '70px',
      sortable: true,
      render: (p) => <span className="text-xs text-gray-400 font-mono">#{p.id}</span>,
    },
    {
      key: 'titre',
      header: 'Titre & Résumé',
      sortable: true,
      render: (p) => (
        <div className="max-w-md">
          <NavLink
            to={`/publications/${p.id}`}
            className="font-medium text-gray-900 dark:text-white hover:text-teal line-clamp-1 transition-colors"
            title={p.titre}
          >
            {p.titre}
          </NavLink>
          {p.resume && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
              {p.resume}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'auteurPrincipal',
      header: 'Auteur',
      sortable: true,
      render: (p) => (
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
          {p.auteurPrincipal || 'Non spécifié'}
        </span>
      ),
    },
    {
      key: 'domaine',
      header: 'Domaine',
      sortable: true,
      render: (p) => (
        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
          {p.domaine || 'Général'}
        </span>
      ),
    },
    {
      key: 'datePublication',
      header: 'Date',
      sortable: true,
      render: (p) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {p.datePublication ? new Date(p.datePublication).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: 'nombreVues',
      header: 'Lectures',
      sortable: true,
      render: (p) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal">
          <EyeIcon className="w-3.5 h-3.5 opacity-70" />
          <span>{p.nombreVues ?? 0}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filteredPublications}
        keyExtractor={(p) => p.id}
        searchPlaceholder="Rechercher par titre, auteur, domaine..."
        searchKeys={['titre', 'auteurPrincipal', 'domaine', 'resume']}
        loading={loading}
        emptyMessage="Aucune publication répertoriée dans le catalogue."
        filterComponent={
          domains.length > 0 ? (
            <div className="flex items-center gap-2">
              <label htmlFor="pubDomainSelect" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Domaine :
              </label>
              <select
                id="pubDomainSelect"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-teal"
              >
                <option value="ALL">Tous les domaines ({publications.length})</option>
                {domains.map((dom) => {
                  const count = publications.filter((p) => p.domaine === dom).length;
                  return (
                    <option key={dom} value={dom}>
                      {dom} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          ) : undefined
        }
        actions={(p) => (
          <NavLink
            to={`/publications/${p.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal/50 text-gray-600 dark:text-gray-300 hover:text-teal transition-colors"
          >
            <span>Consulter</span>
          </NavLink>
        )}
      />
    </div>
  );
};

export default PublicationsManagementView;

