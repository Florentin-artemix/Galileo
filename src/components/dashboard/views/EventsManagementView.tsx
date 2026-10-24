import React, { useState, useMemo } from 'react';
import Modal from '../../Modal';
import { SearchIcon, PlusIcon, TrashIcon } from '../DashboardIcons';

export interface EventItem {
  id: number;
  title: { fr: string; en: string };
  date: string;
  type: { fr: string; en: string };
  domain: { fr: string; en: string };
  location: string;
  summary?: { fr: string; en: string };
  description?: { fr: string; en: string };
}

interface EventsManagementViewProps {
  events: EventItem[];
  language?: 'fr' | 'en';
  onDelete: (id: number) => Promise<void>;
  onCreate?: (eventData: any) => Promise<void>;
  loading?: boolean;
}

export const EventsManagementView: React.FC<EventsManagementViewProps> = ({
  events,
  language = 'fr',
  onDelete,
  onCreate,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    titleFr: '',
    titleEn: '',
    date: '',
    typeFr: '',
    typeEn: '',
    domainFr: '',
    domainEn: '',
    location: '',
    summaryFr: '',
    summaryEn: '',
    descriptionFr: '',
    descriptionEn: '',
  });

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return events;
    const term = searchTerm.toLowerCase();
    return events.filter((e) => {
      const title = (e.title?.[language] || e.title?.fr || '').toLowerCase();
      const loc = (e.location || '').toLowerCase();
      const type = (e.type?.[language] || e.type?.fr || '').toLowerCase();
      const dom = (e.domain?.[language] || e.domain?.fr || '').toLowerCase();
      return title.includes(term) || loc.includes(term) || type.includes(term) || dom.includes(term);
    });
  }, [events, searchTerm, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreate) return;

    if (!formData.titleFr || !formData.date || !formData.location) {
      alert('Veuillez renseigner au moins le titre, la date et le lieu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: { fr: formData.titleFr, en: formData.titleEn || formData.titleFr },
        date: formData.date,
        type: { fr: formData.typeFr || 'Conférence', en: formData.typeEn || 'Conference' },
        domain: { fr: formData.domainFr || 'Sciences', en: formData.domainEn || 'Science' },
        location: formData.location,
        summary: { fr: formData.summaryFr, en: formData.summaryEn || formData.summaryFr },
        description: { fr: formData.descriptionFr, en: formData.descriptionEn || formData.descriptionFr },
        speakers: [],
        tags: [],
        imageUrl: 'https://picsum.photos/800/400',
        photos: [],
        resources: [],
      };

      await onCreate(payload);
      setIsModalOpen(false);
      setFormData({
        titleFr: '',
        titleEn: '',
        date: '',
        typeFr: '',
        typeEn: '',
        domainFr: '',
        domainEn: '',
        location: '',
        summaryFr: '',
        summaryEn: '',
        descriptionFr: '',
        descriptionEn: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous certain de vouloir supprimer cet événement ?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
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
            placeholder="Rechercher par titre, lieu, domaine..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal"
          />
        </div>

        {onCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal hover:bg-teal-dark text-white shadow-xs transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Nouvel événement</span>
          </button>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement des événements...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            Aucun événement enregistré
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Créez votre première conférence ou séminaire universitaire.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const title = event.title?.[language] || event.title?.fr || 'Sans titre';
            const type = event.type?.[language] || event.type?.fr;
            const domain = event.domain?.[language] || event.domain?.fr;
            const isDeleting = deletingId === event.id;

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                      {title}
                    </h3>
                    {type && (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                        {type}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 mb-4">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">Date :</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{event.date}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-400">Lieu :</span>
                      <span>{event.location}</span>
                    </p>
                    {domain && (
                      <p className="flex items-center gap-2">
                        <span className="text-gray-400">Domaine :</span>
                        <span>{domain}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/70 flex items-center justify-end">
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Suppression...' : 'Supprimer'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Création d'un événement académique"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventTitleFrInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Titre (Français) *
              </label>
              <input
                id="eventTitleFrInput"
                type="text"
                required
                value={formData.titleFr}
                onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })}
                placeholder="Ex : Symposium sur l'IA Générative"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label htmlFor="eventTitleEnInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Titre (Anglais)
              </label>
              <input
                id="eventTitleEnInput"
                type="text"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                placeholder="Ex: Generative AI Symposium"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventDateInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Date & Heure *
              </label>
              <input
                id="eventDateInput"
                type="text"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="Ex : 2026-11-15 09:00 ou 15 Novembre 2026"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label htmlFor="eventLocationInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Lieu *
              </label>
              <input
                id="eventLocationInput"
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex : Amphithéâtre Turing / En ligne"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="eventTypeFrInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Type (ex: Conférence, Webinaire)
              </label>
              <input
                id="eventTypeFrInput"
                type="text"
                value={formData.typeFr}
                onChange={(e) => setFormData({ ...formData, typeFr: e.target.value })}
                placeholder="Conférence"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label htmlFor="eventDomainFrInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Domaine scientifique
              </label>
              <input
                id="eventDomainFrInput"
                type="text"
                value={formData.domainFr}
                onChange={(e) => setFormData({ ...formData, domainFr: e.target.value })}
                placeholder="Informatique, Physique..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label htmlFor="eventSummaryFrInput" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Résumé
            </label>
            <textarea
              id="eventSummaryFrInput"
              rows={2}
              value={formData.summaryFr}
              onChange={(e) => setFormData({ ...formData, summaryFr: e.target.value })}
              placeholder="Court résumé de l'événement..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal hover:bg-teal-dark text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'événement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventsManagementView;

