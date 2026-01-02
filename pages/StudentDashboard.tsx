import React, { useEffect, useState } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../src/services/publicationsService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';
import { favoritesService, FavoriteDTO } from '../src/services/favoritesService';
import { readingHistoryService, ReadingHistoryDTO } from '../src/services/readingHistoryService';
import { notificationService, NotificationDTO, NotificationStatsDTO } from '../src/services/notificationService';

interface Soumission {
  id: number;
  titre?: string;
  statut?: string;
  dateCreation?: string;
  domaineRecherche?: string;
  auteurPrincipal?: string;
}

interface Stats {
  totalSoumissions: number;
  enAttente: number;
  acceptees: number;
  rejetees: number;
  totalFavorites: number;
  readingInProgress: number;
  unreadNotifications: number;
}

type TabType = 'dashboard' | 'profile' | 'soumissions' | 'publications' | 'favorites' | 'history' | 'notifications';

const statusColors: Record<string, string> = {
  'EN_ATTENTE': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-400',
  'ACCEPTEE': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-400',
  'REJETEE': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-400',
};

const statusIcons: Record<string, string> = {
  'EN_ATTENTE': '⏳',
  'ACCEPTEE': '✅',
  'REJETEE': '❌',
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { translations, language } = useLanguage();
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [favorites, setFavorites] = useState<FavoriteDTO[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryDTO[]>([]);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<Stats>({
    totalSoumissions: 0,
    enAttente: 0,
    acceptees: 0,
    rejetees: 0,
    totalFavorites: 0,
    readingInProgress: 0,
    unreadNotifications: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = user?.uid || '';
      
      const [soumissionsData, publicationsData, favoritesData, historyData, notificationsData, notifStatsData] = await Promise.all([
        soumissionsService.getMesSoumissions().catch(() => []),
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] })),
        userId ? favoritesService.getFavorites(userId).catch(() => []) : Promise.resolve([]),
        userId ? readingHistoryService.getInProgress(userId).catch(() => []) : Promise.resolve([]),
        userId ? notificationService.getNotifications(userId).catch(() => []) : Promise.resolve([]),
        userId ? notificationService.getStats(userId).catch(() => null) : Promise.resolve(null)
      ]);

      setSoumissions(soumissionsData || []);
      setPublications(publicationsData.content || []);
      setFavorites(favoritesData || []);
      setReadingHistory(historyData || []);
      setNotifications(notificationsData || []);
      setNotificationStats(notifStatsData);

      // Calculer les statistiques
      const enAttente = soumissionsData?.filter((s: Soumission) => s.statut === 'EN_ATTENTE').length || 0;
      const acceptees = soumissionsData?.filter((s: Soumission) => s.statut === 'ACCEPTEE').length || 0;
      const rejetees = soumissionsData?.filter((s: Soumission) => s.statut === 'REJETEE').length || 0;

      setStats({
        totalSoumissions: soumissionsData?.length || 0,
        enAttente,
        acceptees,
        rejetees,
        totalFavorites: favoritesData?.length || 0,
        readingInProgress: historyData?.length || 0,
        unreadNotifications: notifStatsData?.unreadCount || 0
      });
    } catch (e: any) {
      setError("Impossible de charger les données");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setStats(prev => ({ ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - 1) }));
    } catch (e) {
      console.error('Erreur lors du marquage de la notification:', e);
    }
  };

  const handleRemoveFavorite = async (publicationId: number) => {
    if (!user?.uid) return;
    try {
      await favoritesService.removeFavorite(user.uid, publicationId);
      setFavorites(prev => prev.filter(f => f.publicationId !== publicationId));
      setStats(prev => ({ ...prev, totalFavorites: prev.totalFavorites - 1 }));
      setSuccess('Publication retirée des favoris');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Erreur lors de la suppression du favori');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment retirer cette soumission ?')) return;
    
    setDeletingId(id);
    try {
      await soumissionsService.retirerSoumission(id);
      setSoumissions((prev) => prev.filter((s) => s.id !== id));
      setSuccess('Soumission retirée avec succès');
      setTimeout(() => setSuccess(null), 3000);
      setError(null);
    } catch (e) {
      setError("Impossible de retirer cette soumission");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de votre dashboard...</p>
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
            🎓 Dashboard Étudiant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenue <span className="font-semibold">{user?.email}</span>
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
          <TabButton active={tab === 'soumissions'} onClick={() => setTab('soumissions')} icon="📝" badge={stats.enAttente}>
            Mes soumissions
          </TabButton>
          <TabButton active={tab === 'publications'} onClick={() => setTab('publications')} icon="📚">
            Publications
          </TabButton>
          <TabButton active={tab === 'favorites'} onClick={() => setTab('favorites')} icon="⭐" badge={stats.totalFavorites}>
            Favoris
          </TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon="📖" badge={stats.readingInProgress}>
            Historique
          </TabButton>
          <TabButton active={tab === 'notifications'} onClick={() => setTab('notifications')} icon="🔔" badge={stats.unreadNotifications}>
            Notifications
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === 'dashboard' && (
            <DashboardView stats={stats} soumissions={soumissions} publications={publications} favorites={favorites} readingHistory={readingHistory} notifications={notifications} />
          )}

          {tab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <ProfileCard />
            </div>
          )}

          {tab === 'soumissions' && (
            <SoumissionsView soumissions={soumissions} onDelete={handleDelete} deletingId={deletingId} />
          )}

          {tab === 'publications' && (
            <PublicationsView publications={publications} />
          )}

          {tab === 'favorites' && (
            <FavoritesView favorites={favorites} onRemove={handleRemoveFavorite} />
          )}

          {tab === 'history' && (
            <ReadingHistoryView history={readingHistory} />
          )}

          {tab === 'notifications' && (
            <NotificationsView notifications={notifications} onMarkRead={handleMarkNotificationRead} />
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
      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const DashboardView = ({ stats, soumissions, publications, favorites, readingHistory, notifications }: any) => (
  <div>
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total Soumissions" value={stats.totalSoumissions} icon="📝" color="border-blue-500" />
      <StatCard title="En attente" value={stats.enAttente} icon="⏳" color="border-orange-500" />
      <StatCard title="Acceptées" value={stats.acceptees} icon="✅" color="border-green-500" />
      <StatCard title="Favoris" value={stats.totalFavorites} icon="⭐" color="border-yellow-500" />
    </div>

    {/* Second row of stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard title="Lectures en cours" value={stats.readingInProgress} icon="📖" color="border-purple-500" />
      <StatCard title="Notifications" value={stats.unreadNotifications} icon="🔔" color="border-red-500" />
      <StatCard title="Rejetées" value={stats.rejetees} icon="❌" color="border-gray-500" />
    </div>

    {/* Quick Actions */}
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🚀 Actions rapides</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NavLink
          to="/submit"
          className="bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="text-3xl mb-2">📄</div>
          <h3 className="font-bold text-lg mb-1">Nouvelle soumission</h3>
          <p className="text-sm opacity-90">Soumettre un nouvel article</p>
        </NavLink>

        <NavLink
          to="/publications"
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-bold text-lg mb-1">Parcourir</h3>
          <p className="text-sm opacity-90">Explorer les publications</p>
        </NavLink>

        <NavLink
          to="/resources"
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="text-3xl mb-2">📖</div>
          <h3 className="font-bold text-lg mb-1">Ressources</h3>
          <p className="text-sm opacity-90">Guides et documentation</p>
        </NavLink>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📝 Mes soumissions récentes</h3>
        {soumissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune soumission</p>
            <NavLink
              to="/submit"
              className="inline-block px-4 py-2 bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors"
            >
              Soumettre un article
            </NavLink>
          </div>
        ) : (
          <div className="space-y-3">
            {soumissions.slice(0, 5).map((s: any) => (
              <div key={s.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{s.titre || 'Sans titre'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {s.dateCreation && new Date(s.dateCreation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${statusColors[s.statut || 'EN_ATTENTE']}`}>
                    {statusIcons[s.statut || 'EN_ATTENTE']} {s.statut || 'EN_ATTENTE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📚 Publications récentes</h3>
        {publications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune publication</p>
        ) : (
          <div className="space-y-3">
            {publications.slice(0, 5).map((pub: any) => (
              <div key={pub.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <p className="font-medium text-gray-900 dark:text-white truncate">{pub.titre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pub.auteurPrincipal}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const SoumissionsView = ({ soumissions, onDelete, deletingId }: any) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📝 Mes soumissions ({soumissions.length})</h2>
      <NavLink
        to="/submit"
        className="px-4 py-2 bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors font-medium"
      >
        ➕ Nouvelle soumission
      </NavLink>
    </div>

    {soumissions.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">Vous n'avez pas encore de soumission</p>
        <NavLink
          to="/submit"
          className="inline-block px-6 py-3 bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors font-medium"
        >
          Soumettre votre premier article
        </NavLink>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {soumissions.map((soumission: any) => (
          <div key={soumission.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                {soumission.titre || 'Sans titre'}
              </h3>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full border ${statusColors[soumission.statut || 'EN_ATTENTE']}`}>
                {statusIcons[soumission.statut || 'EN_ATTENTE']}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
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
              <p className="flex items-center">
                <span className="font-medium mr-2">📊</span>
                Statut: <span className="ml-1 font-semibold">{soumission.statut || 'EN_ATTENTE'}</span>
              </p>
            </div>

            {soumission.statut === 'EN_ATTENTE' && (
              <button
                onClick={() => onDelete(soumission.id)}
                disabled={deletingId === soumission.id}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === soumission.id ? '⏳ Retrait...' : '🗑️ Retirer la soumission'}
              </button>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const PublicationsView = ({ publications }: any) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📚 Toutes les publications ({publications.length})</h2>
    {publications.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">Aucune publication disponible</p>
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
                    <NavLink to={`/publications/${pub.id}`} className="hover:text-teal underline">
                      {pub.titre}
                    </NavLink>
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

// ========== FAVORIS VIEW ==========
const FavoritesView = ({ favorites, onRemove }: { favorites: FavoriteDTO[]; onRemove: (id: number) => void }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">⭐ Mes favoris ({favorites.length})</h2>
    {favorites.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-6xl mb-4">⭐</div>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">Aucun favori enregistré</p>
        <NavLink
          to="/publications"
          className="inline-block px-6 py-3 bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors font-medium"
        >
          Explorer les publications
        </NavLink>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((fav) => (
          <div key={fav.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                {fav.publicationTitle || 'Publication'}
              </h3>
              <span className="ml-2 text-yellow-500 text-xl">⭐</span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              {fav.publicationAuthors && (
                <p className="flex items-center">
                  <span className="font-medium mr-2">👤</span>
                  {fav.publicationAuthors.join(', ')}
                </p>
              )}
              {fav.publicationCategory && (
                <p className="flex items-center">
                  <span className="font-medium mr-2">🏷️</span>
                  {fav.publicationCategory}
                </p>
              )}
              <p className="flex items-center">
                <span className="font-medium mr-2">📅</span>
                Ajouté le {new Date(fav.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="flex gap-3">
              <NavLink
                to={`/publications/${fav.publicationId}`}
                className="flex-1 px-4 py-2 bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors font-medium text-center"
              >
                📖 Lire
              </NavLink>
              <button
                onClick={() => onRemove(fav.publicationId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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

// ========== READING HISTORY VIEW ==========
const ReadingHistoryView = ({ history }: { history: ReadingHistoryDTO[] }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📖 Historique de lecture ({history.length})</h2>
    {history.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-6xl mb-4">📖</div>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">Aucune lecture en cours</p>
        <NavLink
          to="/publications"
          className="inline-block px-6 py-3 bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors font-medium"
        >
          Découvrir des publications
        </NavLink>
      </div>
    ) : (
      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.publicationTitle || 'Publication'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Dernière lecture: {new Date(item.lastReadAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.completed 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}>
                  {item.completed ? '✅ Terminé' : `📖 ${item.progress}%`}
                </span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-teal h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Progression</span>
                <span>{Math.floor(item.totalReadingTime / 60)} min de lecture</span>
              </div>
            </div>

            <NavLink
              to={`/publications/${item.publicationId}`}
              className="inline-block px-4 py-2 bg-teal hover:bg-teal-dark text-white rounded-lg transition-colors font-medium"
            >
              {item.completed ? '🔄 Relire' : '▶️ Continuer'}
            </NavLink>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ========== NOTIFICATIONS VIEW ==========
const NotificationsView = ({ notifications, onMarkRead }: { notifications: NotificationDTO[]; onMarkRead: (id: string) => void }) => {
  const typeIcons: Record<string, string> = {
    'INFO': 'ℹ️',
    'SUCCESS': '✅',
    'WARNING': '⚠️',
    'ERROR': '❌',
    'SUBMISSION_STATUS': '📝',
    'NEW_PUBLICATION': '📚'
  };

  const typeColors: Record<string, string> = {
    'INFO': 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    'SUCCESS': 'border-green-500 bg-green-50 dark:bg-green-900/20',
    'WARNING': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    'ERROR': 'border-red-500 bg-red-50 dark:bg-red-900/20',
    'SUBMISSION_STATUS': 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
    'NEW_PUBLICATION': 'border-teal bg-teal/10'
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🔔 Notifications ({notifications.length})</h2>
      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-6xl mb-4">🔔</div>
          <p className="text-lg text-gray-500 dark:text-gray-400">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 ${typeColors[notif.type] || 'border-gray-500'} ${!notif.read ? 'ring-2 ring-teal ring-opacity-50' : 'opacity-75'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{typeIcons[notif.type] || '📬'}</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">Nouveau</span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{notif.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {new Date(notif.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                {!notif.read && (
                  <button
                    onClick={() => onMarkRead(notif.id)}
                    className="ml-4 px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                  >
                    Marquer lu
                  </button>
                )}
              </div>
              {notif.link && (
                <NavLink
                  to={notif.link}
                  className="inline-block mt-3 text-teal hover:text-teal-dark font-medium text-sm"
                >
                  Voir plus →
                </NavLink>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
