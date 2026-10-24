import React from 'react';
import { NavLink } from 'react-router-dom';
import StatCard from '../StatCard';
import StatusBadge from '../StatusBadge';
import QuickStats from '../../QuickStats';
import ReadingHistoryWidget from '../../ReadingHistoryWidget';
import FavoritesWidget from '../../FavoritesWidget';
import {
  UsersIcon,
  PublicationsIcon,
  SubmissionsIcon,
  EventsIcon,
  ChevronRightIcon,
} from '../DashboardIcons';

interface OverviewViewProps {
  stats: {
    totalUsers?: number;
    totalPublications?: number;
    totalEvents?: number;
    pendingSubmissions?: number;
    totalSoumissions?: number;
    enAttente?: number;
    acceptees?: number;
    rejetees?: number;
  };
  pending?: any[];
  events?: any[];
  publications?: any[];
  onNavigateTab?: (tab: string) => void;
  role?: string;
  userId?: string;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  pending = [],
  events = [],
  publications = [],
  onNavigateTab,
  role = 'STUDENT',
  userId,
}) => {
  const isAdminOrStaff = role === 'ADMIN' || role === 'STAFF';
  const isAdmin = role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && stats.totalUsers !== undefined && (
          <StatCard
            title="Utilisateurs inscrits"
            value={stats.totalUsers}
            subtitle="Comptes actifs"
            icon={<UsersIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            onClick={onNavigateTab ? () => onNavigateTab('users') : undefined}
          />
        )}

        {isAdminOrStaff ? (
          <>
            <StatCard
              title="Soumissions à valider"
              value={stats.pendingSubmissions ?? pending.length}
              subtitle="En attente de relecture"
              badge={stats.pendingSubmissions ? `${stats.pendingSubmissions} en cours` : undefined}
              icon={<SubmissionsIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              onClick={onNavigateTab ? () => onNavigateTab('pending') : undefined}
            />
            <StatCard
              title="Publications validées"
              value={stats.totalPublications ?? publications.length}
              subtitle="Catalogue académique"
              icon={<PublicationsIcon className="w-5 h-5 text-teal" />}
              onClick={onNavigateTab ? () => onNavigateTab('publications') : undefined}
            />
            <StatCard
              title="Événements"
              value={stats.totalEvents ?? events.length}
              subtitle="Conférences & séminaires"
              icon={<EventsIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              onClick={onNavigateTab ? () => onNavigateTab('events') : undefined}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Mes soumissions"
              value={stats.totalSoumissions ?? 0}
              subtitle="Total des articles soumis"
              icon={<SubmissionsIcon className="w-5 h-5 text-teal" />}
              onClick={onNavigateTab ? () => onNavigateTab('soumissions') : undefined}
            />
            <StatCard
              title="En attente"
              value={stats.enAttente ?? 0}
              subtitle="En cours d'évaluation"
              icon={<SubmissionsIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              onClick={onNavigateTab ? () => onNavigateTab('soumissions') : undefined}
            />
            <StatCard
              title="Acceptées"
              value={stats.acceptees ?? 0}
              subtitle="Articles publiés"
              icon={<PublicationsIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            />
            <StatCard
              title="Rejetées"
              value={stats.rejetees ?? 0}
              subtitle="Nécessitant révision"
              icon={<SubmissionsIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
            />
          </>
        )}
      </div>

      {/* Analytics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Activité & Statistiques Globales
          </h2>
          {isAdminOrStaff && (
            <NavLink
              to="/analytics"
              className="text-xs font-medium text-teal hover:underline inline-flex items-center gap-1"
            >
              <span>Tableau de bord d'analyse</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </NavLink>
          )}
        </div>
        <QuickStats userId={userId} role={role} />
      </div>

      {/* Widgets: Reading History & Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadingHistoryWidget />
        <FavoritesWidget />
      </div>

      {/* Bottom Grid: Recent Submissions & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Submissions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Soumissions récentes
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pending.length} article(s) en attente
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab(isAdminOrStaff ? 'pending' : 'soumissions')}
                className="text-xs font-medium text-teal hover:underline inline-flex items-center gap-1"
              >
                <span>Voir tout</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              Aucune soumission en attente actuellement.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pending.slice(0, 5).map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => onNavigateTab && onNavigateTab(isAdminOrStaff ? 'pending' : 'soumissions')}
                  className="p-3 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20 hover:bg-gray-100/70 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                      {s.titre || 'Sans titre'}
                    </p>
                    <StatusBadge status={s.statut || 'EN_ATTENTE'} size="sm" />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="truncate">{s.auteurPrincipal || 'Auteur non spécifié'}</span>
                    {s.dateCreation && (
                      <span>• {new Date(s.dateCreation).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events / Recent Publications */}
        {isAdminOrStaff ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Événements programmés
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {events.length} événement(s) au calendrier
                </p>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('events')}
                  className="text-xs font-medium text-teal hover:underline inline-flex items-center gap-1"
                >
                  <span>Gérer</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                Aucun événement programmé pour le moment.
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.slice(0, 5).map((e: any) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                        {e.title?.fr || e.title?.en || 'Événement'}
                      </p>
                      {e.type?.fr && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {e.type.fr}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{e.date}</span>
                      {e.location && <span>• {e.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Dernières publications
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Découvrez les travaux récents de la communauté
                </p>
              </div>
              <NavLink
                to="/publications"
                className="text-xs font-medium text-teal hover:underline inline-flex items-center gap-1"
              >
                <span>Explorer</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            {publications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                Aucune publication récente.
              </div>
            ) : (
              <div className="space-y-2.5">
                {publications.slice(0, 5).map((pub: any) => (
                  <NavLink
                    key={pub.id}
                    to={`/publications/${pub.id}`}
                    className="block p-3 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20 hover:bg-gray-100/70 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {pub.titre}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{pub.auteurPrincipal}</span>
                      {pub.domaine && <span>• {pub.domaine}</span>}
                      <span>• {pub.nombreVues || 0} vues</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewView;

