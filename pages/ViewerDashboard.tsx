import React, { useEffect, useState } from 'react';
import { publicationsService, PublicationDTO } from '../src/services/publicationsService';
import { eventService } from '../src/services/eventService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NavLink } from 'react-router-dom';
import ProfileCard from '../components/ProfileCard';

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
}

type TabType = 'dashboard' | 'profile' | 'publications' | 'events';

const ViewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { translations, language } = useLanguage();
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<Stats>({
    totalPublications: 0,
    totalEvents: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pubData, eventsData] = await Promise.all([
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] })),
        eventService.getAllEventsNoPagination().catch(() => [])
      ]);

      setPublications(pubData.content || []);
      setEvents(eventsData || []);

      setStats({
        totalPublications: pubData.content?.length || 0,
        totalEvents: eventsData?.length || 0
      });
    } catch (e: any) {
      setError("Impossible de charger les données");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
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
            👁️ Dashboard Visiteur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenue <span className="font-semibold">{user?.email}</span>
          </p>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>ℹ️ Compte visiteur:</strong> Vous avez accès à la consultation des publications et événements.
              Pour soumettre des articles, contactez un administrateur pour obtenir le rôle Étudiant.
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-between animate-slide-in-down">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="ml-4 underline hover:no-underline">Fermer</button>
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
          <TabButton active={tab === 'publications'} onClick={() => setTab('publications')} icon="📚">
            Publications
          </TabButton>
          <TabButton active={tab === 'events'} onClick={() => setTab('events')} icon="🎯">
            Événements
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === 'dashboard' && (
            <DashboardView stats={stats} publications={publications} events={events} />
          )}

          {tab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <ProfileCard />
            </div>
          )}

          {tab === 'publications' && (
            <PublicationsView publications={publications} />
          )}

          {tab === 'events' && (
            <EventsView events={events} language={language} />
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

const TabButton = ({ active, onClick, icon, children }: any) => (
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
  </button>
);

const DashboardView = ({ stats, publications, events }: any) => (
  <div>
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <StatCard title="Publications disponibles" value={stats.totalPublications} icon="📚" color="border-green-500" />
      <StatCard title="Événements à venir" value={stats.totalEvents} icon="🎯" color="border-purple-500" />
    </div>

    {/* Quick Actions */}
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🚀 Explorer</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NavLink
          to="/publications"
          className="bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-bold text-lg mb-1">Publications</h3>
          <p className="text-sm opacity-90">Parcourir toutes les publications</p>
        </NavLink>

        <NavLink
          to="/events"
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-bold text-lg mb-1">Événements</h3>
          <p className="text-sm opacity-90">Voir les événements scientifiques</p>
        </NavLink>

        <NavLink
          to="/team"
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-bold text-lg mb-1">Équipe</h3>
          <p className="text-sm opacity-90">Découvrir notre équipe</p>
        </NavLink>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📚 Publications récentes</h3>
        {publications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune publication</p>
        ) : (
          <div className="space-y-3">
            {publications.slice(0, 5).map((pub: any) => (
              <NavLink
                key={pub.id}
                to={`/publication/${pub.id}`}
                className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
              >
                <p className="font-medium text-gray-900 dark:text-white truncate">{pub.titre}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pub.auteurPrincipal}</p>
              </NavLink>
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="mr-2">📅</span>{e.date}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
                    <NavLink to={`/publication/${pub.id}`} className="hover:text-teal underline">
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

const EventsView = ({ events, language }: any) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🎯 Événements à venir ({events.length})</h2>

    {events.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">Aucun événement programmé</p>
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
              <p className="flex items-center">
                <span className="mr-2">🔬</span>
                {event.domain?.[language] || event.domain?.fr}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ViewerDashboard;
