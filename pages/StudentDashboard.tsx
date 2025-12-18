import React, { useEffect, useState } from 'react';
import { soumissionsService } from '../src/services/publicationsService';
import { useAuth } from '../contexts/AuthContext';
import { NavLink } from 'react-router-dom';

interface Soumission {
  id: number;
  titre?: string;
  statut?: string;
  dateCreation?: string;
  domaineRecherche?: string;
}

const statusColors: Record<string, string> = {
  'EN_ATTENTE': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  'ACCEPTEE': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  'REJETEE': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await soumissionsService.getMesSoumissions();
        setSoumissions(data || []);
      } catch (e) {
        setError("Impossible de charger vos soumissions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment retirer cette soumission ?')) return;
    
    setDeletingId(id);
    try {
      await soumissionsService.retirerSoumission(id);
      setSoumissions((prev) => prev.filter((s) => s.id !== id));
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mon espace étudiant</h1>
        <p className="text-gray-600 dark:text-gray-400">Connecté en tant que {user?.email}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6 flex justify-end">
        <NavLink
          to="/submit"
          className="px-6 py-3 bg-teal text-white font-semibold rounded-lg hover:bg-teal/90 transition-colors"
        >
          Nouvelle soumission
        </NavLink>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mes soumissions</h2>
        {soumissions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">Vous n'avez pas encore de soumission.</p>
            <NavLink
              to="/submit"
              className="inline-block px-6 py-3 bg-teal text-white font-semibold rounded-lg hover:bg-teal/90 transition-colors"
            >
              Soumettre une publication
            </NavLink>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {soumissions.map((s) => {
              const statusClass = statusColors[s.statut || 'EN_ATTENTE'] || statusColors['EN_ATTENTE'];
              return (
                <div key={s.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {s.titre || 'Sans titre'}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {s.domaineRecherche && <p><span className="font-medium">Domaine:</span> {s.domaineRecherche}</p>}
                    {s.dateCreation && (
                      <p><span className="font-medium">Soumise le:</span> {new Date(s.dateCreation).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${statusClass}`}>
                    {s.statut || 'EN_ATTENTE'}
                  </span>
                  {(s.statut === 'EN_ATTENTE' || !s.statut) && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="mt-2 w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === s.id ? 'Suppression...' : 'Retirer'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
