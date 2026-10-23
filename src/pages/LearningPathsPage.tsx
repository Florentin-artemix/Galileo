import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { learningService, type LearningPathDTO, type LearningProfileDTO } from '../services/learningService';

const LearningPathsPage: React.FC = () => {
  const [paths, setPaths] = useState<LearningPathDTO[]>([]);
  const [profile, setProfile] = useState<LearningProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<LearningPathDTO | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pathsData, profileData] = await Promise.allSettled([
          learningService.getLearningPaths(),
          learningService.getLearningProfile()
        ]);

        if (pathsData.status === 'fulfilled') {
          setPaths(pathsData.value || []);
          if (pathsData.value && pathsData.value.length > 0) {
            setSelectedPath(pathsData.value[0]);
          }
        }

        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value);
        }
      } catch (err) {
        console.error('Failed to load learning paths', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-light-accent dark:text-teal text-sm font-bold uppercase tracking-wider mb-2">
          <span>🎓 Pédagogie & Progression</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-poppins font-bold text-light-text dark:text-off-white mb-3">
          Parcours d'Apprentissage & de Recherche
        </h1>
        <p className="text-base text-light-text-secondary dark:text-gray-400 max-w-3xl">
          Suivez des parcours académiques guidés et progressifs, conçus pour vous accompagner depuis les principes méthodologiques fondamentaux jusqu'aux articles de recherche de pointe.
        </p>
      </div>

      {/* User Learning Profile Card */}
      {profile && (
        <div className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-light-accent/10 via-teal/10 to-transparent border border-light-accent/20 dark:border-teal/30 flex flex-wrap items-center justify-between gap-6 shadow-sm">
          <div>
            <h3 className="font-poppins font-bold text-lg text-light-text dark:text-off-white">
              Votre Tableau de Progression Académique
            </h3>
            <p className="text-xs text-light-text-secondary dark:text-gray-400">
              Statistiques d'évaluation formative et validation des modules
            </p>
          </div>
          <div className="flex items-center space-x-6 text-center">
            <div>
              <div className="text-2xl font-extrabold text-light-accent dark:text-teal">{profile.totalQuizAttempts}</div>
              <div className="text-[11px] text-gray-500 uppercase font-semibold">Quiz tentés</div>
            </div>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
            <div>
              <div className="text-2xl font-extrabold text-light-accent dark:text-teal">{Math.round(profile.averageQuizScore || 0)}%</div>
              <div className="text-[11px] text-gray-500 uppercase font-semibold">Score moyen</div>
            </div>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
            <div>
              <div className="text-2xl font-extrabold text-light-accent dark:text-teal">{profile.completedPathsCount}</div>
              <div className="text-[11px] text-gray-500 uppercase font-semibold">Parcours validés</div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-4 border-light-accent dark:border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Chargement des parcours d'apprentissage...</p>
        </div>
      ) : paths.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-light-card dark:bg-navy/40 border border-light-border dark:border-dark-border">
          <p className="text-base text-gray-500">Aucun parcours d'apprentissage disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Paths List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-light-accent dark:text-teal mb-3">
              Parcours Disponibles ({paths.length})
            </h2>
            {paths.map(path => (
              <button
                key={path.id}
                onClick={() => setSelectedPath(path)}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  selectedPath?.id === path.id
                    ? 'bg-light-accent/15 dark:bg-teal/20 border-light-accent dark:border-teal shadow-md'
                    : 'bg-light-card dark:bg-navy/40 border-light-border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-navy/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-light-accent/10 dark:bg-teal/15 text-light-accent dark:text-teal">
                    {path.level || 'Tous niveaux'}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    ⏱ {path.estimatedHours}h estimées
                  </span>
                </div>
                <h3 className="font-poppins font-bold text-base text-light-text dark:text-off-white mb-1">
                  {path.title}
                </h3>
                {path.description && (
                  <p className="text-xs text-light-text-secondary dark:text-gray-400 line-clamp-2">
                    {path.description}
                  </p>
                )}
                <div className="mt-3 text-[11px] text-gray-400 font-medium">
                  {path.modules?.length || 0} module{path.modules?.length > 1 ? 's' : ''} d'apprentissage
                </div>
              </button>
            ))}
          </div>

          {/* Selected Path Details & Modules */}
          <div className="lg:col-span-2">
            {selectedPath && (
              <div className="p-6 sm:p-8 rounded-2xl bg-light-card dark:bg-navy/40 border border-light-border dark:border-dark-border shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-light-accent/20 dark:bg-teal/20 text-light-accent dark:text-teal">
                    Niveau : {selectedPath.level}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">
                    Durée totale recommandée : {selectedPath.estimatedHours} heures
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-light-text dark:text-off-white mb-3">
                  {selectedPath.title}
                </h2>
                <p className="text-sm text-light-text-secondary dark:text-gray-300 mb-8 leading-relaxed">
                  {selectedPath.description}
                </p>

                {/* Modules Timeline */}
                <h3 className="text-base font-bold font-poppins text-light-text dark:text-off-white mb-4">
                  Modules du parcours ({selectedPath.modules?.length || 0})
                </h3>

                <div className="space-y-4">
                  {selectedPath.modules?.map((module, mIndex) => (
                    <div
                      key={module.id || mIndex}
                      className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-navy/80 hover:shadow-md transition-shadow flex items-start space-x-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        {mIndex + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-poppins font-bold text-base text-light-text dark:text-off-white">
                            {module.title}
                          </h4>
                          {module.estimatedMinutes && (
                            <span className="text-xs text-gray-400">
                              ~{module.estimatedMinutes} min
                            </span>
                          )}
                        </div>

                        {module.description && (
                          <p className="text-xs text-light-text-secondary dark:text-gray-300 mb-3 leading-relaxed">
                            {module.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {module.publicationId ? (
                            <NavLink
                              to={`/publication/${module.publicationId}`}
                              className="text-xs font-bold text-light-accent dark:text-teal hover:underline flex items-center space-x-1"
                            >
                              <span>📖 Consulter la publication : {module.publicationTitle || 'Lire l\'article'} &rarr;</span>
                            </NavLink>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Contenu théorique et méthodologique</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-light-border dark:border-dark-border flex items-center justify-between">
                  <NavLink
                    to="/quiz"
                    className="px-6 py-3 rounded-xl bg-light-accent dark:bg-teal text-white dark:text-navy font-bold text-sm hover:opacity-90 transition-all shadow-md"
                  >
                    📝 Passer un quiz d'évaluation
                  </NavLink>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathsPage;
