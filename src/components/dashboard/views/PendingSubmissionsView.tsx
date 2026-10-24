import React, { useState, useMemo } from 'react';
import Modal from '../../Modal';
import StatusBadge from '../StatusBadge';
import { SearchIcon, CheckIcon, XIcon, EditIcon } from '../DashboardIcons';

export interface PendingSubmission {
  id: number;
  titre?: string;
  auteurPrincipal?: string;
  emailAuteur?: string;
  statut?: string;
  dateCreation?: string;
  domaineRecherche?: string;
}

interface PendingSubmissionsViewProps {
  pending: PendingSubmission[];
  onUpdateStatut: (id: number, statut: 'ACCEPTEE' | 'REJETEE' | 'EN_REVISION', commentaire?: string) => Promise<void>;
  loading?: boolean;
}

export const PendingSubmissionsView: React.FC<PendingSubmissionsViewProps> = ({
  pending,
  onUpdateStatut,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [targetSubmission, setTargetSubmission] = useState<PendingSubmission | null>(null);
  const [revisionComment, setRevisionComment] = useState('');
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  // Extraire les domaines uniques
  const domains = useMemo(() => {
    const set = new Set<string>();
    pending.forEach((s) => {
      if (s.domaineRecherche) set.add(s.domaineRecherche);
    });
    return Array.from(set);
  }, [pending]);

  // Filtrage
  const filtered = useMemo(() => {
    return pending.filter((item) => {
      const matchSearch =
        !searchTerm.trim() ||
        (item.titre && item.titre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.auteurPrincipal && item.auteurPrincipal.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.emailAuteur && item.emailAuteur.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDomain = selectedDomain === 'ALL' || item.domaineRecherche === selectedDomain;

      return matchSearch && matchDomain;
    });
  }, [pending, searchTerm, selectedDomain]);

  const handleAccept = async (id: number) => {
    setActionInProgressId(id);
    try {
      await onUpdateStatut(id, 'ACCEPTEE');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Êtes-vous certain de vouloir rejeter cette soumission ?')) return;
    setActionInProgressId(id);
    try {
      await onUpdateStatut(id, 'REJETEE');
    } finally {
      setActionInProgressId(null);
    }
  };

  const openRevisionModal = (submission: PendingSubmission) => {
    setTargetSubmission(submission);
    setRevisionComment('');
    setRevisionModalOpen(true);
  };

  const handleSendRevision = async () => {
    if (!targetSubmission || !revisionComment.trim()) return;
    const id = targetSubmission.id;
    setActionInProgressId(id);
    try {
      await onUpdateStatut(id, 'EN_REVISION', revisionComment.trim());
      setRevisionModalOpen(false);
      setTargetSubmission(null);
      setRevisionComment('');
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, auteur, email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal"
          />
        </div>

        {domains.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Domaine :</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-teal"
            >
              <option value="ALL">Tous les domaines ({pending.length})</option>
              {domains.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement des soumissions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {pending.length === 0
              ? 'Aucune soumission en attente'
              : 'Aucun résultat ne correspond à votre filtre'}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pending.length === 0
              ? 'Toutes les soumissions ont été traitées par le comité éditorial.'
              : 'Essayez de modifier votre mot-clé de recherche ou le filtre de domaine.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isProcessing = actionInProgressId === item.id;
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

                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 mb-5">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">Auteur :</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.auteurPrincipal || 'Non spécifié'}
                      </span>
                    </p>
                    {item.emailAuteur && (
                      <p className="flex items-center gap-2 truncate">
                        <span className="text-gray-400">Email :</span>
                        <span className="truncate">{item.emailAuteur}</span>
                      </p>
                    )}
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
                        <span className="text-gray-400">Date :</span>
                        <span>{new Date(item.dateCreation).toLocaleDateString('fr-FR')}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/70 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAccept(item.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Accepter</span>
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                      <span>Rejeter</span>
                    </button>
                  </div>
                  <button
                    onClick={() => openRevisionModal(item)}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors disabled:opacity-50"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                    <span>Demander des révisions</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revision Comment Modal */}
      <Modal
        isOpen={revisionModalOpen}
        onClose={() => {
          setRevisionModalOpen(false);
          setTargetSubmission(null);
        }}
        title="Demande de révisions éditoriales"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Article concerné :</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {targetSubmission?.titre}
            </p>
          </div>

          <div>
            <label
              htmlFor="revisionCommentInput"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Remarques et axes d'amélioration destinés à l'auteur :
            </label>
            <textarea
              id="revisionCommentInput"
              rows={5}
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              placeholder="Ex : Veuillez préciser la méthodologie employée dans la section 3 et fournir des sources complémentaires..."
              className="w-full p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => {
                setRevisionModalOpen(false);
                setTargetSubmission(null);
              }}
              className="px-4 py-2 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              onClick={handleSendRevision}
              disabled={!revisionComment.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50"
            >
              Transmettre la demande
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingSubmissionsView;

