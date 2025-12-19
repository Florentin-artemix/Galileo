import React, { useEffect, useState } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../src/services/publicationsService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';

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
}

type TabType = 'dashboard' | 'profile' | 'soumissions' | 'publications';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<Stats>({
    totalSoumissions: 0,
    enAttente: 0,
    acceptees: 0,
    rejetees: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [soumissionsData, publicationsData] = await Promise.all([
        soumissionsService.getMesSoumissions().catch(() => []),
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] }))
      ]);

      setSoumissions(soumissionsData || []);
      setPublications(publicationsData.content || []);

      // Calculer les statistiques
      const enAttente = soumissionsData?.filter((s: Soumission) => s.statut === 'EN_ATTENTE').length || 0;
      const acceptees = soumissionsData?.filter((s: Soumission) => s.statut === 'ACCEPTEE').length || 0;
      const rejetees = soumissionsData?.filter((s: Soumission) => s.statut === 'REJETEE').length || 0;

      setStats({
        totalSoumissions: soumissionsData?.length || 0,
        enAttente,
        acceptees,
        rejetees
      });
    } catch (e: any) {
      setError("Impossible de charger les données");
      console.error(e);
    } finally {
      setLoading(false);
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
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === 'dashboard' && (
            <DashboardView stats={stats} soumissions={soumissions} publications={publications} />
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

const DashboardView = ({ stats, soumissions, publications }: any) => (
  <div>
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total Soumissions" value={stats.totalSoumissions} icon="📝" color="border-blue-500" />
      <StatCard title="En attente" value={stats.enAttente} icon="⏳" color="border-orange-500" />
      <StatCard title="Acceptées" value={stats.acceptees} icon="✅" color="border-green-500" />
      <StatCard title="Rejetées" value={stats.rejetees} icon="❌" color="border-red-500" />
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

export default StudentDashboard;
