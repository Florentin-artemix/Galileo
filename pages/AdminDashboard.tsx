import React, { useEffect, useState } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../src/services/publicationsService';
import { usersService, UserDTO } from '../src/services/usersService';
import { eventService } from '../src/services/eventService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole } from '../src/services/authService';
import { ROLE_LABELS } from '../src/constants/roles';
import RoleBadge from '../components/RoleBadge';
import ProfileCard from '../components/ProfileCard';

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
  totalUsers: number;
  totalPublications: number;
  totalEvents: number;
  pendingSubmissions: number;
}

type TabType = 'dashboard' | 'profile' | 'users' | 'events' | 'publications' | 'pending';

const AdminDashboard: React.FC = () => {
  const { user, role } = useAuth();
  const { translations, language } = useLanguage();
  const [pending, setPending] = useState<Soumission[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPublications: 0,
    totalEvents: 0,
    pendingSubmissions: 0
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
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
    descriptionEn: ''
  });

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, [role]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, pubData] = await Promise.all([
        soumissionsService.getSoumissionsEnAttente().catch(() => []),
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] }))
      ]);

      setPending(pendingData || []);
      setPublications(pubData.content || []);

      // Charger les utilisateurs et événements pour ADMIN
      if (role === 'ADMIN') {
        try {
          const [usersData, eventsData] = await Promise.all([
            usersService.getUsers().catch(() => []),
            eventService.getAllEventsNoPagination().catch(() => [])
          ]);
          setUsers(usersData || []);
          setEvents(eventsData || []);
          
          // Calculer les statistiques
          setStats({
            totalUsers: usersData?.length || 0,
            totalPublications: pubData.content?.length || 0,
            totalEvents: eventsData?.length || 0,
            pendingSubmissions: pendingData?.length || 0
          });
        } catch (e) {
          console.warn('Erreur chargement données admin:', e);
        }
      }
    } catch (e: any) {
      setError("Impossible de charger les données");
      console.error(e);
    } finally {
      setLoading(false);
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

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    setUpdatingUser(uid);
    try {
      await usersService.updateRole(uid, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      );
      setSuccess('Rôle modifié avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError("Impossible de modifier le rôle");
    } finally {
      setUpdatingUser(null);
    }
  };

  const createEvent = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const eventData = {
        title: { fr: newEvent.titleFr, en: newEvent.titleEn },
        date: newEvent.date,
        type: { fr: newEvent.typeFr, en: newEvent.typeEn },
        domain: { fr: newEvent.domainFr, en: newEvent.domainEn },
        location: newEvent.location,
        summary: { fr: newEvent.summaryFr, en: newEvent.summaryEn },
        description: { fr: newEvent.descriptionFr, en: newEvent.descriptionEn },
        speakers: [],
        tags: [],
        imageUrl: 'https://picsum.photos/800/400',
        photos: [],
        resources: []
      };

      const created = await eventService.createEvent(eventData, token);
      setEvents(prev => [created, ...prev]);
      setShowEventModal(false);
      setNewEvent({
        titleFr: '', titleEn: '', date: '', typeFr: '', typeEn: '',
        domainFr: '', domainEn: '', location: '', summaryFr: '', summaryEn: '',
        descriptionFr: '', descriptionEn: ''
      });
      setSuccess('Événement créé avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError('Erreur lors de la création: ' + (e.message || ''));
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
            🎛️ Dashboard {role === 'ADMIN' ? 'Administrateur' : 'Staff'}
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
          <TabButton active={tab === 'publications'} onClick={() => setTab('publications')} icon="📚">
            Publications
          </TabButton>
          {role === 'ADMIN' && (
            <>
              <TabButton active={tab === 'events'} onClick={() => setTab('events')} icon="🎯">
                Événements
              </TabButton>
              <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon="👥" badge={users.length}>
                Utilisateurs
              </TabButton>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === 'dashboard' && (
            <DashboardView stats={stats} pending={pending} publications={publications} events={events} />
          )}

          {tab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <ProfileCard />
            </div>
          )}

          {tab === 'pending' && (
            <PendingSubmissionsView pending={pending} onUpdateStatut={updateStatut} />
          )}

          {tab === 'publications' && (
            <PublicationsView publications={publications} />
          )}

          {tab === 'events' && role === 'ADMIN' && (
            <EventsView 
              events={events} 
              language={language} 
              onDelete={deleteEvent}
              onAdd={() => setShowEventModal(true)}
            />
          )}

          {tab === 'users' && role === 'ADMIN' && (
            <UsersView users={users} currentUserEmail={user?.email} updatingUser={updatingUser} onUpdateRole={updateUserRole} />
          )}
        </div>
      </div>

      {/* Modal de création d'événement */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Nouvel événement</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre (FR) *</label>
                  <input
                    type="text"
                    value={newEvent.titleFr}
                    onChange={(e) => setNewEvent({ ...newEvent, titleFr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre (EN) *</label>
                  <input
                    type="text"
                    value={newEvent.titleEn}
                    onChange={(e) => setNewEvent({ ...newEvent, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lieu *</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type (FR) *</label>
                  <input
                    type="text"
                    value={newEvent.typeFr}
                    onChange={(e) => setNewEvent({ ...newEvent, typeFr: e.target.value })}
                    placeholder="ex: Conférence, Atelier"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type (EN) *</label>
                  <input
                    type="text"
                    value={newEvent.typeEn}
                    onChange={(e) => setNewEvent({ ...newEvent, typeEn: e.target.value })}
                    placeholder="ex: Conference, Workshop"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domaine (FR) *</label>
                  <input
                    type="text"
                    value={newEvent.domainFr}
                    onChange={(e) => setNewEvent({ ...newEvent, domainFr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domaine (EN) *</label>
                  <input
                    type="text"
                    value={newEvent.domainEn}
                    onChange={(e) => setNewEvent({ ...newEvent, domainEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Résumé (FR) *</label>
                <textarea
                  value={newEvent.summaryFr}
                  onChange={(e) => setNewEvent({ ...newEvent, summaryFr: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Résumé (EN) *</label>
                <textarea
                  value={newEvent.summaryEn}
                  onChange={(e) => setNewEvent({ ...newEvent, summaryEn: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (FR) *</label>
                <textarea
                  value={newEvent.descriptionFr}
                  onChange={(e) => setNewEvent({ ...newEvent, descriptionFr: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (EN) *</label>
                <textarea
                  value={newEvent.descriptionEn}
                  onChange={(e) => setNewEvent({ ...newEvent, descriptionEn: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={createEvent}
                disabled={!newEvent.titleFr || !newEvent.titleEn || !newEvent.date}
                className="flex-1 px-4 py-2 bg-teal hover:bg-teal/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Créer l'événement
              </button>
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
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

const DashboardView = ({ stats, pending, publications, events }: any) => (
  <div>
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total Utilisateurs" value={stats.totalUsers} icon="👥" color="border-blue-500" />
      <StatCard title="Publications" value={stats.totalPublications} icon="📚" color="border-green-500" />
      <StatCard title="Événements" value={stats.totalEvents} icon="🎯" color="border-purple-500" />
      <StatCard title="En attente" value={stats.pendingSubmissions} icon="⏳" color="border-orange-500" />
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
                <th className="px-6 py-4 text-left font-semibold">ID</th>
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
                  <td className="px-6 py-4">{pub.id}</td>
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

const EventsView = ({ events, language, onDelete, onAdd }: any) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Événements ({events.length})</h2>
      <button 
        onClick={onAdd}
        className="px-4 py-2 bg-teal hover:bg-teal/90 text-white rounded-lg transition-colors font-medium"
      >
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

const UsersView = ({ users, currentUserEmail, updatingUser, onUpdateRole }: any) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">👥 Gestion des utilisateurs ({users.length})</h2>
    
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <p className="text-sm text-blue-700 dark:text-blue-300">
        <strong>ℹ️ Note:</strong> Les nouveaux utilisateurs commencent avec le rôle "Visiteur". 
        Modifiez leur rôle ci-dessous pour leur donner accès aux fonctionnalités.
        L'utilisateur devra se reconnecter pour que le nouveau rôle prenne effet.
      </p>
    </div>

    {users.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">Aucun utilisateur enregistré</p>
      </div>
    ) : (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Email</th>
                <th className="px-6 py-4 text-left font-semibold">Nom</th>
                <th className="px-6 py-4 text-left font-semibold">Rôle actuel</th>
                <th className="px-6 py-4 text-left font-semibold">Changer le rôle</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u: any) => (
                <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {u.email}
                    {u.email === currentUserEmail && (
                      <span className="ml-2 px-2 py-1 bg-teal/20 text-teal text-xs rounded-full">Vous</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{u.displayName || '-'}</td>
                  <td className="px-6 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => onUpdateRole(u.uid, e.target.value as UserRole)}
                      disabled={updatingUser === u.uid || u.email === currentUserEmail}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="VIEWER">{ROLE_LABELS.VIEWER}</option>
                      <option value="STUDENT">{ROLE_LABELS.STUDENT}</option>
                      <option value="STAFF">{ROLE_LABELS.STAFF}</option>
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    </select>
                    {updatingUser === u.uid && (
                      <span className="ml-2 text-xs text-gray-500">⏳</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      disabled={u.email === currentUserEmail}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🗑️ Supprimer
                    </button>
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

export default AdminDashboard;
