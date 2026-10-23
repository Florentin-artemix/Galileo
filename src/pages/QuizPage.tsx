import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { learningService, type QuizDTO, type QuizAttemptDTO } from '../services/learningService';
import { publicationsService, type PublicationDTO } from '../services/publicationsService';

const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<QuizDTO | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [attemptResult, setAttemptResult] = useState<QuizAttemptDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [selectedPubForGen, setSelectedPubForGen] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadPublications = async () => {
      try {
        const res = await publicationsService.getPublications(0, 20);
        setPublications(res.content || []);
      } catch (err) {
        console.error('Failed to load publications', err);
      }
    };
    loadPublications();
  }, []);

  useEffect(() => {
    const loadQuiz = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      setAttemptResult(null);
      setSelectedAnswers({});
      try {
        const data = await learningService.getQuiz(Number(id));
        setQuiz(data);
      } catch (err) {
        setError("Impossible de charger le quiz demandé.");
      } finally {
        setLoading(false);
      }
    };
    loadQuiz();
  }, [id]);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (attemptResult) return; // Prevent modifying after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    try {
      const res = await learningService.submitQuizAttempt(quiz.id, selectedAnswers);
      setAttemptResult(res);
    } catch (err) {
      alert("Erreur lors de la soumission de vos réponses.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPubForGen || isGenerating) return;
    setIsGenerating(true);
    try {
      const generated = await learningService.generateQuiz(selectedPubForGen, 5, 'INTERMEDIATE');
      setQuiz(generated);
      setSelectedAnswers({});
      setAttemptResult(null);
    } catch (err) {
      alert("Erreur lors de la génération du quiz par l'IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-light-accent dark:text-teal text-sm font-bold uppercase tracking-wider mb-1">
            <span>📝 Évaluation formative</span>
          </div>
          <h1 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white">
            Quiz d'Auto-Évaluation Académique
          </h1>
        </div>

        <NavLink
          to="/learning-paths"
          className="text-sm font-medium text-light-accent dark:text-teal hover:underline flex items-center space-x-1"
        >
          <span>Explorer les parcours d'apprentissage &rarr;</span>
        </NavLink>
      </div>

      {/* Generator Section */}
      <div className="p-6 mb-8 rounded-2xl bg-light-card dark:bg-navy/40 border border-light-border dark:border-dark-border shadow-sm">
        <h3 className="font-poppins font-bold text-base text-light-text dark:text-off-white mb-2">
          Générer un quiz d'évaluation à partir d'une publication
        </h3>
        <p className="text-xs text-light-text-secondary dark:text-gray-400 mb-4">
          L'IA Claude extrait les concepts fondamentaux de la publication sélectionnée et conçoit un questionnaire d'évaluation scientifique.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={selectedPubForGen || ''}
            onChange={e => setSelectedPubForGen(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full sm:flex-1 text-sm p-3 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-navy text-light-text dark:text-off-white"
          >
            <option value="">-- Choisissez une publication académique --</option>
            {publications.map(p => (
              <option key={p.id} value={p.id}>
                {p.titre}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!selectedPubForGen || isGenerating}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-light-accent dark:bg-teal text-white dark:text-navy font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <span>Génération Claude...</span>
            ) : (
              <span>✨ Générer le Quiz</span>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-light-accent dark:border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Chargement des questions du quiz...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {quiz && !loading && (
        <div className="space-y-6">
          {/* Quiz Details Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-light-accent/10 to-teal/10 dark:from-teal/15 dark:to-navy border border-light-accent/20 dark:border-teal/30">
            <h2 className="text-2xl font-poppins font-bold text-light-text dark:text-off-white mb-2">
              {quiz.title}
            </h2>
            {quiz.description && (
              <p className="text-sm text-light-text-secondary dark:text-gray-300 mb-3">
                {quiz.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-light-accent/20 dark:bg-teal/20 text-light-accent dark:text-teal">
                Niveau : {quiz.difficultyLevel}
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                Seuil de réussite : {quiz.passingScore}%
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300">
                {quiz.questions.length} questions
              </span>
            </div>
          </div>

          {/* Attempt Result Banner */}
          {attemptResult && (
            <div
              className={`p-6 rounded-2xl border ${
                attemptResult.passed
                  ? 'bg-green-500/10 border-green-500/40 text-green-900 dark:text-green-300'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold font-poppins">
                  {attemptResult.passed ? '🎉 Félicitations, test validé !' : '⚠️ Score insuffisant'}
                </span>
                <span className="text-2xl font-extrabold">{attemptResult.percentage}%</span>
              </div>
              <p className="text-sm">
                Score obtenu : {attemptResult.score} / {attemptResult.totalPoints} points.
                {attemptResult.passed
                  ? ' Vous maîtrisez les concepts fondamentaux de cette publication.'
                  : ' Nous vous recommandons de relire attentivement les passages sources avant de retenter le quiz.'}
              </p>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-6">
            {quiz.questions.map((q, qIndex) => {
              const selectedOpt = selectedAnswers[qIndex];
              return (
                <div
                  key={q.id || qIndex}
                  className="p-6 rounded-2xl bg-light-card dark:bg-navy/40 border border-light-border dark:border-dark-border shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-base font-bold text-light-text dark:text-off-white">
                      Question {qIndex + 1}. {q.questionText}
                    </h4>
                    <span className="text-xs text-light-accent dark:text-teal font-semibold px-2 py-0.5 rounded bg-light-accent/10 dark:bg-teal/10">
                      {q.points} pt{q.points > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => {
                      const isSelected = selectedOpt === optIndex;
                      return (
                        <button
                          key={optIndex}
                          type="button"
                          onClick={() => handleSelectOption(qIndex, optIndex)}
                          disabled={Boolean(attemptResult)}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-light-accent/15 dark:bg-teal/20 border-light-accent dark:border-teal font-semibold text-light-accent dark:text-teal'
                              : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy/70'
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                              isSelected
                                ? 'border-light-accent dark:border-teal bg-light-accent dark:bg-teal text-white dark:text-navy font-bold'
                                : 'border-gray-400'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation after submission */}
                  {attemptResult && q.explanation && (
                    <div className="mt-4 p-3.5 rounded-xl bg-gray-50 dark:bg-navy border border-light-border dark:border-dark-border text-xs text-light-text-secondary dark:text-gray-300">
                      <strong>Explication académique :</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Action */}
          {!attemptResult && (
            <div className="pt-4 text-center">
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(selectedAnswers).length === 0}
                className="px-10 py-4 rounded-xl bg-light-accent dark:bg-teal text-white dark:text-navy font-bold text-base hover:opacity-90 disabled:opacity-40 transition-all shadow-xl"
              >
                {submitting ? 'Validation des réponses...' : 'Soumettre le Quiz'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
