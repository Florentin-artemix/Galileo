import React, { useEffect, useState } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../src/services/publicationsService';
import { usersService, UserDTO } from '../src/services/usersService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole } from '../src/services/authService';
import { ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS } from '../src/constants/roles';
import RoleBadge from '../components/RoleBadge';

interface Soumission {
  id: number;
  titre?: string;
  auteurPrincipal?: string;
  emailAuteur?: string;
  statut?: string;
  dateCreation?: string;
  domaineRecherche?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, role } = useAuth();
  const { translations } = useLanguage();
  const [pending, setPending] = useState<Soumission[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'publications' | 'users'>('pending');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pendingData, pubData] = await Promise.all([
          soumissionsService.getSoumissionsEnAttente(),
          publicationsService.getPublications(0, 10),
        ]);
        setPending(pendingData || []);
        setPublications(pubData.content || []);

        // Charger les utilisateurs seulement pour ADMIN
        if (role === 'ADMIN') {
          try {
            const usersData = await usersService.getUsers();
            setUsers(usersData || []);
          } catch (e) {
            console.warn('Impossible de charger les utilisateurs');
          }
        }
      } catch (e) {
        setError("Impossible de charger les données");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role]);

  const updateStatut = async (id: number, statut: 'ACCEPTEE' | 'REJETEE') => {
    try {
      if (statut === 'ACCEPTEE') {
        await soumissionsService.validerSoumission(id);
      } else {
        await soumissionsService.rejeterSoumission(id);
      }
      setPending((prev) => prev.filter((s) => s.id !== id));
      setError(null);
    } catch (e: any) {
      setError(e.response?.data?.message || "Mise à jour impossible");
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    setUpdatingUser(uid);
    try {
      await usersService.updateRole(uid, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      );
    } catch (e) {
      setError("Impossible de modifier le rôle");
    } finally {
      setUpdatingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard {role === 'ADMIN' ? 'Administrateur' : 'Staff'}</h1>
        <p className="text-gray-600 dark:text-gray-400">Connecté en tant que {user?.email}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Fermer</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setTab('pending')}
          className={`pb-2 px-1 font-medium whitespace-nowrap ${tab === 'pending' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Soumissions en attente ({pending.length})
        </button>
        <button
          onClick={() => setTab('publications')}
          className={`pb-2 px-1 font-medium whitespace-nowrap ${tab === 'publications' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 dark:text-gray-400'}`}
        >
          Publications récentes
        </button>
        {role === 'ADMIN' && (
          <button
            onClick={() => setTab('users')}
            className={`pb-2 px-1 font-medium whitespace-nowrap ${tab === 'users' ? 'text-teal border-b-2 border-teal' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Gestion des utilisateurs ({users.length})
          </button>
        )}
      </div>

      {tab === 'pending' && (
        <section>
          {pending.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">Aucune soumission en attente de validation.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pending.map((soumission) => (
                <div key={soumission.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {soumission.titre || 'Sans titre'}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <p><span className="font-medium">Auteur:</span> {soumission.auteurPrincipal || 'Inconnu'}</p>
                    <p><span className="font-medium">Email:</span> {soumission.emailAuteur || 'N/A'}</p>
                    <p><span className="font-medium">Domaine:</span> {soumission.domaineRecherche || 'Non spécifié'}</p>
                    {soumission.dateCreation && (
                      <p><span className="font-medium">Date:</span> {new Date(soumission.dateCreation).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                  <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 mb-4">
                    {soumission.statut || 'EN_ATTENTE'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatut(soumission.id, 'ACCEPTEE')}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => updateStatut(soumission.id, 'REJETEE')}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'publications' && (
        <section>
          {publications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">Aucune publication pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Titre</th>
                    <th className="px-4 py-3">Auteur</th>
                    <th className="px-4 py-3">Domaine</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Vues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {publications.map((pub) => (
                    <tr key={pub.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">{pub.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">{pub.titre}</td>
                      <td className="px-4 py-3">{pub.auteurPrincipal}</td>
                      <td className="px-4 py-3">{pub.domaine}</td>
                      <td className="px-4 py-3">{new Date(pub.datePublication).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">{pub.nombreVues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'users' && role === 'ADMIN' && (
        <section>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Les nouveaux utilisateurs commencent avec le rôle "Visiteur". 
              Modifiez leur rôle ci-dessous pour leur donner accès aux fonctionnalités.
              L'utilisateur devra se reconnecter pour que le nouveau rôle prenne effet.
            </p>
          </div>
          
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg">Aucun utilisateur enregistré.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Rôle actuel</th>
                    <th className="px-4 py-3">Changer le rôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((u) => (
                    <tr key={u.uid} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.email}</td>
                      <td className="px-4 py-3">{u.displayName || '-'}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)}
                          disabled={updatingUser === u.uid || u.email === user?.email}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                        >
                          <option value="VIEWER">{ROLE_LABELS.VIEWER}</option>
                          <option value="STUDENT">{ROLE_LABELS.STUDENT}</option>
                          <option value="STAFF">{ROLE_LABELS.STAFF}</option>
                          <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                        </select>
                        {updatingUser === u.uid && (
                          <span className="ml-2 text-xs text-gray-500">Mise à jour...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;
