import React, { useState, useMemo } from 'react';
import StatusBadge from '../StatusBadge';
import { authService } from '../../../services/authService';

export interface PendingSubmissionItem {
  id: number;
  publicationId?: number;
  documentId?: number;
  urlPdf?: string;
  titre: string;
  auteurPrincipal: string;
  domaineRecherche?: string;
  domaine?: string;
  dateCreation: string;
  statut: string;
  resume?: string;
  commentaire?: string;
}

export type PendingSubmission = PendingSubmissionItem;

interface PendingSubmissionsViewProps {
  pending: PendingSubmissionItem[];
  onUpdateStatut: (
    id: number,
    statut: 'ACCEPTEE' | 'REJETEE' | 'EN_REVISION',
    commentaire?: string
  ) => Promise<void> | void;
  loading?: boolean;
}

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const PendingSubmissionsView: React.FC<PendingSubmissionsViewProps> = ({
  pending,
  onUpdateStatut,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<{
    id: number;
    type: 'REJETEE' | 'EN_REVISION';
  } | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const domains = useMemo(() => {
    const set = new Set<string>();
    pending.forEach((item) => {
      const dom = item.domaineRecherche || item.domaine;
      if (dom) set.add(dom);
    });
    return Array.from(set);
  }, [pending]);

  const filtered = useMemo(() => {
    return pending.filter((item) => {
      const dom = item.domaineRecherche || item.domaine || '';
      const matchSearch =
        !searchTerm.trim() ||
        (item.titre && item.titre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.auteurPrincipal && item.auteurPrincipal.toLowerCase().includes(searchTerm.toLowerCase())) ||
        dom.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDomain = selectedDomain === 'ALL' || dom === selectedDomain;
      return matchSearch && matchDomain;
    });
  }, [pending, searchTerm, selectedDomain]);

  const handleOpenDecision = (id: number, type: 'REJETEE' | 'EN_REVISION') => {
    if (decisionTarget?.id === id && decisionTarget?.type === type) {
      setDecisionTarget(null);
      setDecisionComment('');
      setDecisionError(null);
    } else {
      setDecisionTarget({ id, type });
      setDecisionComment('');
      setDecisionError(null);
    }
  };

  const handleSubmitDecision = async (id: number, type: 'REJETEE' | 'EN_REVISION') => {
    const trimmed = decisionComment.trim();
    if (!trimmed) {
      setDecisionError(
        type === 'REJETEE'
          ? 'Le motif de rejet est obligatoire.'
          : 'Veuillez préciser les consignes de révision.'
      );
      return;
    }
    setDecisionError(null);
    await onUpdateStatut(id, type, trimmed);
    setDecisionTarget(null);
    setDecisionComment('');
  };

  const handleInspectPdf = async (item: PendingSubmissionItem) => {
    const pdfUrl = item.urlPdf || (item.documentId ? `/api/documents/${item.documentId}/download` : null);
    if (!pdfUrl) return;
    try {
      setDecisionError(null);
      const token = authService.getAccessToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(pdfUrl, { headers });
      if (!response.ok) {
        throw new Error(`Impossible de charger le fichier PDF (HTTP ${response.status})`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setDecisionError(err?.message || 'Erreur lors de la lecture du fichier PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, auteur ou domaine..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {domains.length > 0 && (
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-teal"
            >
              <option value="ALL">Tous les domaines ({pending.length})</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {decisionError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          {decisionError}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement des soumissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckIcon className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {pending.length === 0
              ? 'Aucune soumission en attente'
              : 'Aucune soumission ne correspond à vos filtres'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pending.length === 0
              ? 'Toutes les soumissions ont été traitées par le comité éditorial.'
              : 'Essayez de modifier votre recherche ou le filtre de domaine.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const isDecisionOpen = decisionTarget?.id === item.id;
            const domainLabel = item.domaineRecherche || item.domaine || 'Non spécifié';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm overflow-hidden transition-all"
              >
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.statut || 'EN_ATTENTE'} size="sm" />
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
                        {domainLabel}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ID #{item.id}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                      {item.titre || 'Sans titre'}
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Soumis par{' '}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {item.auteurPrincipal || 'Auteur inconnu'}
                      </span>{' '}
                      •{' '}
                      {item.dateCreation
                        ? new Date(item.dateCreation).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Date inconnue'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(item.urlPdf || item.documentId) && (
                      <button
                        type="button"
                        onClick={() => handleInspectPdf(item)}
                        className="px-3 py-1.5 text-xs font-medium text-teal bg-teal/10 hover:bg-teal/20 rounded-lg transition-colors"
                      >
                        Ouvrir le PDF
                      </button>
                    )}

                    {item.resume && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        {isExpanded ? 'Masquer résumé' : 'Voir résumé'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onUpdateStatut(item.id, 'ACCEPTEE', 'Validé pour publication')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDecision(item.id, 'EN_REVISION')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                      <span>Révision</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDecision(item.id, 'REJETEE')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                      <span>Rejeter</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Abstract */}
                {isExpanded && item.resume && (
                  <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700/60">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                      Résumé du document
                    </h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {item.resume}
                    </p>
                  </div>
                )}

                {/* Decision Box (Revision or Rejection Motif) */}
                {isDecisionOpen && decisionTarget && (
                  <div
                    className={`px-5 py-4 border-t ${
                      decisionTarget.type === 'REJETEE'
                        ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200/60 dark:border-red-800/40'
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40'
                    }`}
                  >
                    <label className="block text-xs font-semibold text-gray-900 dark:text-gray-200 mb-1.5">
                      {decisionTarget.type === 'REJETEE'
                        ? "Motif obligatoire du rejet (transmis à l'auteur) :"
                        : "Instructions de révision pour l'auteur :"}
                    </label>
                    <textarea
                      rows={3}
                      value={decisionComment}
                      onChange={(e) => setDecisionComment(e.target.value)}
                      placeholder={
                        decisionTarget.type === 'REJETEE'
                          ? 'Précisez la raison du refus éditorial...'
                          : 'Précisez les modifications attendues avant validation...'
                      }
                      className="w-full p-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
                    />
                    <div className="mt-2.5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDecisionTarget(null);
                          setDecisionComment('');
                          setDecisionError(null);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitDecision(item.id, decisionTarget.type)}
                        disabled={!decisionComment.trim()}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-colors ${
                          decisionTarget.type === 'REJETEE'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        {decisionTarget.type === 'REJETEE'
                          ? 'Confirmer le rejet'
                          : 'Envoyer la demande'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingSubmissionsView;
