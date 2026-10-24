import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import { SearchIcon, PlusIcon, RefreshIcon, TrashIcon } from '../DashboardIcons';

export interface StudentSubmission {
  id: number;
  titre?: string;
  statut?: string;
  dateCreation?: string;
  domaineRecherche?: string;
  auteurPrincipal?: string;
  documentId?: number;
  publicationId?: number;
  documentStatus?: string;
  processingStatus?: string;
  processingError?: string;
  reviewerNotes?: string;
  commentaire?: string;
}

interface StudentSubmissionsViewProps {
  soumissions: StudentSubmission[];
  onDelete: (id: number) => Promise<void>;
  deletingId: number | null;
  onRetry: (documentId?: number, pubId?: number) => Promise<void>;
  retryingId: number | null;
  loading?: boolean;
}

export const StudentSubmissionsView: React.FC<StudentSubmissionsViewProps> = ({
  soumissions,
  onDelete,
  deletingId,
  onRetry,
  retryingId,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return soumissions.filter((item) => {
      const matchSearch =
        !searchTerm.trim() ||
        (item.titre && item.titre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.domaineRecherche && item.domaineRecherche.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || item.statut === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [soumissions, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher parmi vos soumissions..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-teal"
          >
            <option value="ALL">Tous les statuts ({soumissions.length})</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="ACCEPTEE">Acceptée</option>
            <option value="EN_REVISION">En révision</option>
            <option value="REJETEE">Rejetée</option>
          </select>

          <NavLink
            to="/submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal hover:bg-teal-dark text-white shadow-xs transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Nouvelle soumission</span>
          </NavLink>
        </div>
      </div>

      {/* Grid of Submissions */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement de vos soumissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {soumissions.length === 0
              ? 'Vous n\'avez pas encore soumis de travaux académiques'
              : 'Aucune soumission ne correspond à votre filtre'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
            {soumissions.length === 0
              ? 'Partagez vos recherches avec la communauté universitaire en déposant un article.'
              : 'Modifiez vos critères de recherche.'}
          </p>
          {soumissions.length === 0 && (
            <NavLink
              to="/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal hover:bg-teal-dark text-white transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Soumettre votre premier article</span>
            </NavLink>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const docStatus = item.documentStatus || item.processingStatus || 'COMPLETED';
            const isDocFailed = docStatus === 'FAILED';
            const isRetrying = retryingId === (item.documentId || item.publicationId || item.id);
            const isDeleting = deletingId === item.id;
            const canDelete = item.statut === 'EN_ATTENTE' || item.statut === 'PENDING';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                      {item.titre || 'Sans titre'}
                    </h3>
                    <StatusBadge status={item.statut || 'EN_ATTENTE'} size="sm" />
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 mb-4">
                    {item.domaineRecherche && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-400">Domaine :</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                          {item.domaineRecherche}
                        </span>
                      </p>
                    )}
                    {item.dateCreation && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-400">Date de dépôt :</span>
                        <span>{new Date(item.dateCreation).toLocaleDateString('fr-FR')}</span>
                      </p>
                    )}

                    {/* État de l'indexation IA pgvector */}
                    <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700/70">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Indexation IA :</span>
                        <StatusBadge docStatus={docStatus} size="sm" />
                      </div>
                    </div>

                    {/* Commentaire éditorial si révision demandée ou rejet */}
                    {(item.commentaire || item.reviewerNotes) && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                        <p className="font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
                          Remarques du comité éditorial :
                        </p>
                        <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                          {item.commentaire || item.reviewerNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/70 space-y-2">
                  {isDocFailed && (
                    <button
                      onClick={() => onRetry(item.documentId, item.publicationId)}
                      disabled={isRetrying}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors disabled:opacity-50"
                    >
                      <RefreshIcon className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                      <span>{isRetrying ? 'Relance en cours...' : 'Relancer l\'indexation IA'}</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => onDelete(item.id)}
                      disabled={isDeleting}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'Retrait en cours...' : 'Retirer cette soumission'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentSubmissionsView;

