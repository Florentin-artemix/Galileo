import React, { useEffect, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { learningService, type LearningPathDTO, type LearningStepDTO } from '../services/learningService';

function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
  return typeof data?.message === 'string' ? data.message : fallback;
}

function formatDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

function getStepIndex(step: LearningStepDTO, fallbackIndex: number): number {
  return Number.isSafeInteger(step.stepIndex) && (step.stepIndex ?? -1) >= 0
    ? step.stepIndex as number
    : fallbackIndex;
}

const LearningPathsPage: React.FC = () => {
  const [paths, setPaths] = useState<LearningPathDTO[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPathDTO | null>(null);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [savingStepKey, setSavingStepKey] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<{ pathId: number; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);

    learningService.getLearningPaths()
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Le service a renvoyé une liste de parcours invalide.');
        if (!active) return;
        setPaths(data);
        setSelectedPath(current => current ? data.find(path => path.id === current.id) || data[0] || null : data[0] || null);
      })
      .catch(error => {
        if (active) setLoadError(getApiErrorMessage(error, 'Impossible de charger vos parcours.'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [reloadCount]);

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestedTopic = topic.trim();
    if (!requestedTopic || isGenerating) return;

    setGenerationError(null);
    setIsGenerating(true);
    try {
      const generatedPath = await learningService.generateLearningPath(requestedTopic);
      setPaths(current => [generatedPath, ...current.filter(path => path.id !== generatedPath.id)]);
      setSelectedPath(generatedPath);
      setLoadError(null);
      setTopic('');
    } catch (error) {
      setGenerationError(getApiErrorMessage(error, 'La génération du parcours a échoué.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteStep = async (path: LearningPathDTO, stepIndex: number) => {
    if (savingStepKey) return;
    const key = `${path.id}:${stepIndex}`;
    setSavingStepKey(key);
    setProgressError(null);
    try {
      const updatedPath = await learningService.updateStepProgress(path.id, stepIndex, true);
      setPaths(current => current.map(item => item.id === updatedPath.id ? updatedPath : item));
      setSelectedPath(current => current?.id === updatedPath.id ? updatedPath : current);
    } catch (error) {
      setProgressError({
        pathId: path.id,
        message: getApiErrorMessage(error, 'La progression de cette étape n’a pas été enregistrée.')
      });
    } finally {
      setSavingStepKey(null);
    }
  };

  const selectedSteps = Array.isArray(selectedPath?.steps) ? selectedPath.steps : [];
  const progressPercentage = selectedPath && Number.isFinite(selectedPath.progressPercentage)
    ? Math.min(100, Math.max(0, selectedPath.progressPercentage))
    : null;
  const confirmedForSelectedPath = Array.isArray(selectedPath?.completedStepIndexes)
    ? selectedPath.completedStepIndexes
    : [];

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase text-light-accent dark:text-teal">🎓 Pédagogie & progression</p>
        <h1 className="mb-3 font-poppins text-3xl font-bold text-light-text dark:text-off-white sm:text-4xl">
          Parcours d’apprentissage
        </h1>
        <p className="max-w-3xl text-base text-light-text-secondary dark:text-gray-400">
          Créez un parcours sur un sujet et suivez les étapes enregistrées à votre compte.
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-light-border bg-light-card p-5 dark:border-dark-border dark:bg-navy/40 sm:p-6" aria-labelledby="generate-path-heading">
        <h2 id="generate-path-heading" className="mb-2 font-poppins text-lg font-bold text-light-text dark:text-off-white">
          Générer un parcours
        </h2>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleGenerate}>
          <label className="sr-only" htmlFor="learning-topic">Sujet du parcours</label>
          <input
            id="learning-topic"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-light-border bg-white px-3 text-sm text-light-text focus:outline-none focus:ring-2 focus:ring-light-accent dark:border-dark-border dark:bg-navy dark:text-off-white"
            value={topic}
            onChange={event => setTopic(event.target.value)}
            placeholder="Ex. mécanique des fluides"
            maxLength={160}
            required
            disabled={isGenerating}
          />
          <button
            className="min-h-11 rounded-lg bg-light-accent px-5 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal dark:text-navy"
            type="submit"
            disabled={isGenerating || !topic.trim()}
          >
            {isGenerating ? 'Génération en cours…' : 'Générer le parcours'}
          </button>
        </form>
        {generationError && <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">{generationError}</p>}
      </section>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-500" role="status" aria-busy="true">
          Chargement de vos parcours…
        </div>
      ) : loadError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30" role="alert">
          <p className="text-sm text-red-800 dark:text-red-200">{loadError}</p>
          <button
            className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 dark:border-red-800 dark:text-red-200"
            type="button"
            onClick={() => setReloadCount(count => count + 1)}
          >
            Réessayer
          </button>
        </section>
      ) : paths.length === 0 ? (
        <section className="rounded-xl border border-light-border bg-light-card p-8 text-center dark:border-dark-border dark:bg-navy/40">
          <h2 className="font-poppins text-lg font-bold text-light-text dark:text-off-white">Aucun parcours enregistré</h2>
          <p className="mt-2 text-sm text-light-text-secondary dark:text-gray-400">Saisissez un sujet ci-dessus pour créer votre premier parcours.</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-3 lg:col-span-1" aria-labelledby="my-paths-heading">
            <h2 id="my-paths-heading" className="text-sm font-bold uppercase text-light-accent dark:text-teal">
              Mes parcours ({paths.length})
            </h2>
            {paths.map(path => (
              <button
                key={path.id}
                type="button"
                aria-pressed={selectedPath?.id === path.id}
                onClick={() => {
                  setSelectedPath(path);
                  setProgressError(null);
                }}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedPath?.id === path.id
                  ? 'border-light-accent bg-light-accent/10 dark:border-teal dark:bg-teal/10'
                  : 'border-light-border bg-light-card hover:bg-gray-50 dark:border-dark-border dark:bg-navy/40 dark:hover:bg-navy/70'
                }`}
              >
                <span className="block font-poppins text-base font-bold text-light-text dark:text-off-white">{path.title}</span>
                <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                  {Number.isFinite(path.totalSteps) ? `${path.totalSteps} étapes` : 'Étapes indisponibles'} · {path.topic}
                </span>
              </button>
            ))}
          </section>

          {selectedPath && (
            <section className="min-w-0 rounded-xl border border-light-border bg-light-card p-5 dark:border-dark-border dark:bg-navy/40 sm:p-7 lg:col-span-2" aria-labelledby="selected-path-heading">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-light-accent dark:text-teal">Sujet · {selectedPath.topic}</p>
                  <h2 id="selected-path-heading" className="mt-1 font-poppins text-2xl font-bold text-light-text dark:text-off-white">{selectedPath.title}</h2>
                  {formatDate(selectedPath.createdAt) && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Créé le {formatDate(selectedPath.createdAt)}</p>
                  )}
                </div>
                {typeof selectedPath.isActive === 'boolean' && (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-navy dark:text-gray-300">
                    {selectedPath.isActive ? 'Actif' : 'Inactif'}
                  </span>
                )}
              </div>

              <div className="mb-7 rounded-lg border border-light-border bg-white p-4 dark:border-dark-border dark:bg-navy/60">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <h3 className="font-semibold text-light-text dark:text-off-white">Progression enregistrée</h3>
                  <span className="text-light-text-secondary dark:text-gray-300">
                    {Number.isFinite(selectedPath.completedSteps) && Number.isFinite(selectedPath.totalSteps)
                      ? `${selectedPath.completedSteps} / ${selectedPath.totalSteps} étapes`
                      : 'Nombre d’étapes indisponible'}
                    {progressPercentage === null ? '' : ` · ${Math.round(progressPercentage)}%`}
                  </span>
                </div>
                {progressPercentage === null ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">La progression n’a pas été communiquée par le service.</p>
                ) : (
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-label="Progression du parcours" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercentage}>
                    <div className="h-full rounded-full bg-light-accent dark:bg-teal" style={{ width: `${progressPercentage}%` }} />
                  </div>
                )}
              </div>

              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <h3 className="font-poppins text-lg font-bold text-light-text dark:text-off-white">Étapes ({selectedSteps.length})</h3>
              </div>
              {selectedSteps.length === 0 ? (
                <p className="rounded-lg border border-light-border bg-white p-4 text-sm text-gray-500 dark:border-dark-border dark:bg-navy/60 dark:text-gray-400">
                  Ce parcours ne contient aucune étape exploitable.
                </p>
              ) : (
                <ol className="space-y-3">
                  {selectedSteps.map((step, index) => {
                    const stepIndex = getStepIndex(step, index);
                    const isConfirmed = confirmedForSelectedPath.includes(stepIndex);
                    const isSaving = savingStepKey === `${selectedPath.id}:${stepIndex}`;
                    const concepts = Array.isArray(step.keyConcepts)
                      ? step.keyConcepts.filter((concept): concept is string => typeof concept === 'string')
                      : [];

                    return (
                      <li key={`${stepIndex}-${index}`} className="rounded-lg border border-light-border bg-white p-4 dark:border-dark-border dark:bg-navy/60">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-light-text dark:text-off-white">{step.title || `Étape ${index + 1}`}</h4>
                            {step.description && <p className="mt-1 text-sm leading-relaxed text-light-text-secondary dark:text-gray-300">{step.description}</p>}
                            {Number.isFinite(step.estimatedMinutes) && (step.estimatedMinutes ?? 0) > 0 && (
                              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Durée estimée · {step.estimatedMinutes} min</p>
                            )}
                            {concepts.length > 0 && (
                              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Notions · {concepts.join(', ')}</p>
                            )}
                          </div>
                          <button
                            className="min-h-10 shrink-0 rounded-lg border border-light-border px-3 text-xs font-semibold text-light-text hover:bg-gray-50 disabled:cursor-default disabled:opacity-60 dark:border-dark-border dark:text-off-white dark:hover:bg-navy"
                            type="button"
                            disabled={Boolean(savingStepKey) || isConfirmed}
                            onClick={() => handleCompleteStep(selectedPath, stepIndex)}
                          >
                            {isSaving ? 'Enregistrement…' : isConfirmed ? 'Étape confirmée' : 'Marquer terminée'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              {progressError?.pathId === selectedPath.id && <p className="mt-4 text-sm text-red-700 dark:text-red-300" role="alert">{progressError.message}</p>}

              <div className="mt-7 border-t border-light-border pt-5 dark:border-dark-border">
                <NavLink to="/quiz" className="inline-flex min-h-11 items-center rounded-lg bg-light-accent px-4 text-sm font-bold text-white hover:opacity-90 dark:bg-teal dark:text-navy">
                  Accéder aux quiz
                </NavLink>
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
};

export default LearningPathsPage;
