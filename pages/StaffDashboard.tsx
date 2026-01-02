import React, { useEffect, useState } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../src/services/publicationsService';
import { eventService } from '../src/services/eventService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProfileCard from '../components/ProfileCard';
import { moderationService, ModerationItemDTO, ModerationStatsDTO } from '../src/services/moderationService';
import { notificationService, NotificationDTO } from '../src/services/notificationService';
import { favoritesService, FavoriteDTO } from '../src/services/favoritesService';
import { readingHistoryService, ReadingHistoryDTO } from '../src/services/readingHistoryService';

interface Soumission {
  id: number;
  titre?: string;
  auteurPrincipal?: string;
  emailAuteur?: string;
  statut?: string;
  dateCreation?: string;
  domaineRecherche?: string;
}

interface Event {
  id: number;
  title: { fr: string; en: string };
  date: string;
  type: { fr: string; en: string };
  domain: { fr: string; en: string };
  location: string;
}

interface Stats {
  totalPublications: number;
  totalEvents: number;
  pendingSubmissions: number;
  moderationPending: number;
  approvedToday: number;
}

type TabType = 'dashboard' | 'profile' | 'pending' | 'publications' | 'events' | 'moderation' | 'favorites' | 'history';

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { translations, language } = useLanguage();
  const [pending, setPending] = useState<Soumission[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [moderationQueue, setModerationQueue] = useState<ModerationItemDTO[]>([]);
  const [moderationStats, setModerationStats] = useState<ModerationStatsDTO | null>(null);
  const [favorites, setFavorites] = useState<FavoriteDTO[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<Stats>({
    totalPublications: 0,
    totalEvents: 0,
    pendingSubmissions: 0,
    moderationPending: 0,
    approvedToday: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const userId = user?.uid;
    try {
      const [pendingData, pubData, eventsData, modQueueData, modStatsData, favoritesData, historyData] = await Promise.all([
        soumissionsService.getSoumissionsEnAttente().catch(() => []),
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] })),
        eventService.getAllEventsNoPagination().catch(() => []),
        moderationService.getPendingItems().catch(() => []),
        moderationService.getStats().catch(() => null),
        userId ? favoritesService.getFavorites(userId).catch(() => []) : Promise.resolve([]),
        userId ? readingHistoryService.getInProgress(userId).catch(() => []) : Promise.resolve([])
      ]);

      setPending(pendingData || []);
      setPublications(pubData.content || []);
      setEvents(eventsData || []);
      setModerationQueue(modQueueData || []);
      setModerationStats(modStatsData);
      setFavorites(favoritesData || []);
      setReadingHistory(historyData || []);

      setStats({
        totalPublications: pubData.content?.length || 0,
        totalEvents: eventsData?.length || 0,
        pendingSubmissions: pendingData?.length || 0,
        moderationPending: modStatsData?.pendingCount || modQueueData?.length || 0,
        approvedToday: modStatsData?.approvedToday || 0
      });
    } catch (e: any) {
      setError("Impossible de charger les données");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationApprove = async (itemId: number, feedback?: string) => {
    try {
      await moderationService.approve(itemId, feedback);
      setModerationQueue(prev => prev.filter(item => item.id !== itemId));
      setStats(prev => ({ 
        ...prev, 
        moderationPending: prev.moderationPending - 1,
        approvedToday: prev.approvedToday + 1 
      }));
      setSuccess('Élément approuvé avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Erreur lors de l\'approbation');
    }
  };

  const handleModerationReject = async (itemId: number, feedback: string) => {
    try {
      await moderationService.reject(itemId, feedback);
      setModerationQueue(prev => prev.filter(item => item.id !== itemId));
      setStats(prev => ({ ...prev, moderationPending: prev.moderationPending - 1 }));
      setSuccess('Élément rejeté');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Erreur lors du rejet');
    }
  };

  const handleRequestRevision = async (itemId: number, feedback: string) => {
    try {
      await moderationService.requestRevision(itemId, feedback);
      setModerationQueue(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: 'NEEDS_REVISION' } : item
      ));
      setSuccess('Révision demandée');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Erreur lors de la demande de révision');
    }
  };

  const updateStatut = async (id: number, statut: 'ACCEPTEE' | 'REJETEE') => {
    try {
      if (statut === 'ACCEPTEE') {
        await soumissionsService.validerSoumission(id);
        setSuccess('Soumission acceptée avec succès');
      } else {
        await soumissionsService.rejeterSoumission(id);
        setSuccess('Soumission rejetée');
      }
      setPending((prev) => prev.filter((s) => s.id !== id));
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }
      await eventService.deleteEvent(eventId, token);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setSuccess('Événement supprimé');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            👔 Dashboard Personnel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connecté en tant que <span className="font-semibold">{user?.email}</span>
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-between animate-slide-in-down">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="ml-4 underline hover:no-underline">Fermer</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 flex items-center justify-between animate-slide-in-down">
            <span>✅ {success}</span>
            <button onClick={() => setSuccess(null)} className="ml-4 underline hover:no-underline">Fermer</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-2">
          <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon="📊">
            Vue d'ensemble
          </TabButton>
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon="👤">
            Mon Profil
          </TabButton>
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')} icon="⏳" badge={pending.length}>
            Soumissions
          </TabButton>
          <TabButton active={tab === 'moderation'} onClick={() => setTab('moderation')} icon="🛡️" badge={stats.moderationPending}>
            Modération
          </TabButton>
          <TabButton active={tab === 'publications'} onClick={() => setTab('publications')} icon="📚">
            Publications
          </TabButton>
          <TabButton active={tab === 'events'} onClick={() => setTab('events')} icon="🎯">
            Événements
          </TabButton>
          <TabButton active={tab === 'favorites'} onClick={() => setTab('favorites')} icon="⭐" badge={favorites.length}>
            Favoris
          </TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon="📖" badge={readingHistory.length}>
            Historique
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === 'dashboard' && (
            <DashboardView stats={stats} pending={pending} publications={publications} events={events} moderationQueue={moderationQueue} />
          )}

          {tab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <ProfileCard />
            </div>
          )}

          {tab === 'pending' && (
            <PendingSubmissionsView pending={pending} onUpdateStatut={updateStatut} />
          )}

          {tab === 'moderation' && (
            <ModerationView 
              queue={moderationQueue} 
              stats={moderationStats}
              onApprove={handleModerationApprove}
              onReject={handleModerationReject}
              onRequestRevision={handleRequestRevision}
            />
          )}

          {tab === 'publications' && (
            <PublicationsView publications={publications} />
          )}

          {tab === 'events' && (
            <EventsView events={events} language={language} onDelete={deleteEvent} />
          )}

          {tab === 'favorites' && (
            <FavoritesView favorites={favorites} onRemove={async (pubId) => {
              if (user?.uid) {
                try {
                  await favoritesService.removeFavorite(user.uid, pubId);
                  setFavorites(prev => prev.filter(f => f.publicationId !== pubId));
                  setSuccess('Publication retirée des favoris');
                  setTimeout(() => setSuccess(null), 3000);
                } catch (e) {
                  setError('Erreur lors de la suppression du favori');
                }
              }
            }} />
          )}

          {tab === 'history' && (
            <HistoryView history={readingHistory} />
          )}
        </div>
      </div>
    </div>
  );
};

// Composants enfants
const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
      </div>
      <div className="text-4xl opacity-20">{icon}</div>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, badge, children }: any) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-2 font-medium whitespace-nowrap rounded-t-lg transition-all ${
      active
        ? 'text-teal bg-white dark:bg-gray-800 border-b-2 border-teal'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`}
  >
    <span className="mr-2">{icon}</span>
    {children}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const DashboardView = ({ stats, pending, publications, events, moderationQueue }: any) => (
  <div>
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
      <StatCard title="Publications" value={stats.totalPublications} icon="📚" color="border-green-500" />
      <StatCard title="Événements" value={stats.totalEvents} icon="🎯" color="border-purple-500" />
      <StatCard title="Soumissions" value={stats.pendingSubmissions} icon="⏳" color="border-orange-500" />
      <StatCard title="Modération" value={stats.moderationPending} icon="🛡️" color="border-red-500" />
      <StatCard title="Approuvés aujourd'hui" value={stats.approvedToday} icon="✅" color="border-teal" />
    </div>

    {/* Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📝 Soumissions récentes</h3>
        {pending.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune soumission en attente</p>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((s: any) => (
              <div key={s.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <p className="font-medium text-gray-900 dark:text-white truncate">{s.titre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{s.auteurPrincipal}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🎯 Événements à venir</h3>
        {events.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucun événement</p>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map((e: any) => (
              <div key={e.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <p className="font-medium text-gray-900 dark:text-white truncate">{e.title?.fr || 'Sans titre'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{e.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const PendingSubmissionsView = ({ pending, onUpdateStatut }: any) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">⏳ Soumissions en attente ({pending.length})</h2>
    {pending.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">✅ Aucune soumission en attente de validation</p>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pending.map((soumission: any) => (
          <div key={soumission.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                {soumission.titre || 'Sans titre'}
              </h3>
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 whitespace-nowrap">
                En attente
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <p className="flex items-center">
                <span className="font-medium mr-2">👤</span>
                {soumission.auteurPrincipal || 'Inconnu'}
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">📧</span>
                {soumission.emailAuteur || 'N/A'}
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">🔬</span>
                {soumission.domaineRecherche || 'Non spécifié'}
              </p>
              {soumission.dateCreation && (
                <p className="flex items-center">
                  <span className="font-medium mr-2">📅</span>
                  {new Date(soumission.dateCreation).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onUpdateStatut(soumission.id, 'ACCEPTEE')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                ✓ Accepter
              </button>
              <button
                onClick={() => onUpdateStatut(soumission.id, 'REJETEE')}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                ✗ Rejeter
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const PublicationsView = ({ publications }: any) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📚 Publications ({publications.length})</h2>
    {publications.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">Aucune publication pour le moment</p>
      </div>
    ) : (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Titre</th>
                <th className="px-6 py-4 text-left font-semibold">Auteur</th>
                <th className="px-6 py-4 text-left font-semibold">Domaine</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Vues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {publications.map((pub: any) => (
                <tr key={pub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-md">
                    <div className="truncate">{pub.titre}</div>
                  </td>
                  <td className="px-6 py-4">{pub.auteurPrincipal}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      {pub.domaine}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(pub.datePublication).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-teal">{pub.nombreVues}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const EventsView = ({ events, language, onDelete }: any) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Événements ({events.length})</h2>
      <button className="px-4 py-2 bg-teal hover:bg-teal/90 text-white rounded-lg transition-colors font-medium">
        ➕ Nouvel événement
      </button>
    </div>

    {events.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">Aucun événement créé</p>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event: any) => (
          <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {event.title?.[language] || event.title?.fr || 'Sans titre'}
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <p className="flex items-center">
                <span className="mr-2">📅</span>
                {event.date}
              </p>
              <p className="flex items-center">
                <span className="mr-2">📍</span>
                {event.location}
              </p>
              <p className="flex items-center">
                <span className="mr-2">🏷️</span>
                {event.type?.[language] || event.type?.fr}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                ✏️ Modifier
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ========== MODERATION VIEW ==========
const ModerationView = ({ queue, stats, onApprove, onReject, onRequestRevision }: {
  queue: ModerationItemDTO[];
  stats: ModerationStatsDTO | null;
  onApprove: (id: number, feedback?: string) => void;
  onReject: (id: number, feedback: string) => void;
  onRequestRevision: (id: number, feedback: string) => void;
}) => {
  const [feedbackModal, setFeedbackModal] = useState<{ id: number; action: 'reject' | 'revision' } | null>(null);
  const [feedback, setFeedback] = useState('');

  const priorityColors: Record<string, string> = {
    'LOW': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    'NORMAL': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300',
    'HIGH': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300',
    'URGENT': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300'
  };

  const handleSubmitFeedback = () => {
    if (!feedbackModal || !feedback.trim()) return;
    if (feedbackModal.action === 'reject') {
      onReject(feedbackModal.id, feedback);
    } else {
      onRequestRevision(feedbackModal.id, feedback);
    }
    setFeedbackModal(null);
    setFeedback('');
  };

  return (
    <div>
      {/* Stats de modération */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Approuvés aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approvedToday}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Rejetés aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejectedToday}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 dark:text-gray-400">Temps moyen</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.averageProcessingTime / 60)}min</p>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🛡️ File de modération ({queue.length})</h2>
      
      {queue.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg text-gray-500 dark:text-gray-400">Aucun élément en attente de modération</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[item.priority]}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">{item.content}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    <span>👤 {item.authorName}</span>
                    <span>📧 {item.authorEmail}</span>
                    <span>📅 {new Date(item.submittedAt).toLocaleDateString('fr-FR')}</span>
                    {item.category && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{item.category}</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onApprove(item.id)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  ✓ Approuver
                </button>
                <button
                  onClick={() => { setFeedbackModal({ id: item.id, action: 'revision' }); setFeedback(''); }}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                >
                  ✏️ Révision
                </button>
                <button
                  onClick={() => { setFeedbackModal({ id: item.id, action: 'reject' }); setFeedback(''); }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  ✗ Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {feedbackModal.action === 'reject' ? '❌ Rejeter' : '✏️ Demander une révision'}
            </h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Expliquez la raison..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setFeedbackModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim()}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  feedbackModal.action === 'reject' 
                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' 
                    : 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
                }`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour afficher les favoris
const FavoritesView = ({ favorites, onRemove }: { favorites: FavoriteDTO[]; onRemove: (pubId: number) => void }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
      <span className="text-3xl">⭐</span> Mes Favoris
      <span className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full">
        {favorites.length} publication{favorites.length > 1 ? 's' : ''}
      </span>
    </h2>

    {favorites.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <span className="text-6xl mb-4 block">📚</span>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Aucun favori pour le moment</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Ajoutez des publications à vos favoris pour les retrouver ici</p>
      </div>
    ) : (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((fav) => (
          <div key={fav.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                {fav.publicationTitle || `Publication #${fav.publicationId}`}
              </h3>
              <button
                onClick={() => onRemove(fav.publicationId)}
                className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded-full transition-colors"
                title="Retirer des favoris"
              >
                ✕
              </button>
            </div>
            {fav.publicationAuthors && fav.publicationAuthors.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">👤 {fav.publicationAuthors.join(', ')}</p>
            )}
            {fav.publicationCategory && (
              <span className="inline-block text-xs bg-teal/10 text-teal dark:bg-teal/20 px-2 py-1 rounded-full mb-3">
                {fav.publicationCategory}
              </span>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span>Ajouté le {fav.createdAt ? new Date(fav.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
              <a
                href={`/publication/${fav.publicationId}`}
                className="text-teal hover:text-teal/80 font-medium"
              >
                Voir →
              </a>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Composant pour afficher l'historique de lecture
const HistoryView = ({ history }: { history: ReadingHistoryDTO[] }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
      <span className="text-3xl">📖</span> Historique de Lecture
      <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
        {history.length} en cours
      </span>
    </h2>

    {history.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <span className="text-6xl mb-4 block">📚</span>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Aucun historique de lecture</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Commencez à lire des publications pour voir votre progression ici</p>
      </div>
    ) : (
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {item.publicationTitle || `Publication #${item.publicationId}`}
                </h3>
                {item.publicationDomain && (
                  <span className="inline-block text-xs bg-teal/10 text-teal dark:bg-teal/20 px-2 py-1 rounded-full">
                    {item.publicationDomain}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {item.readAt ? new Date(item.readAt).toLocaleDateString('fr-FR') : 'N/A'}
                </div>
                <a
                  href={`/publication/${item.publicationId}`}
                  className="inline-block px-3 py-1 bg-teal text-white text-sm rounded-lg hover:bg-teal/90 transition-colors"
                >
                  Reprendre →
                </a>
              </div>
            </div>
            {/* Barre de progression */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progression</span>
                <span>{item.progressPercentage || item.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-teal rounded-full h-2 transition-all"
                  style={{ width: `${item.progressPercentage || item.progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default StaffDashboard;
