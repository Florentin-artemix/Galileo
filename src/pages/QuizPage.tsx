import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { learningService, type QuizAttemptDTO, type QuizDTO } from '../services/learningService';
import { publicationsService, type PublicationDTO } from '../services/publicationsService';
import './quiz.css';

const documentIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAACXBIWXMAAAPoAAAD6AG1e1JrAAABYUlEQVQ4T2N8/PXrfwYaABZcEk8+fcElxSDDx8NAlsE77j5kSN24kwEXCNNWY+h1d2Ag2eBPP36CaQ8VRQY+djYUuVVXbzKsunoLzMZnOM6gAIEkQ20GS1kpBnSD+TjYCRqO12BcwENZgUGaj4eh//hZnIYzMZABrrx+A6Zl+HjBLi/eeYByF/OxszFce/UWjGEAZHiIlhpKsJFs8PHkKIZPPyGRC0tBjQeOYagj2WA+DjYwhvPRUg1FYUwMIOjiOecuM8w9dwWrXLGlMQPZBjMyMDDI8vNildMSFWa48hoRiSQZnGykC8a4ANkGf/75C6dmSxlJBlyAoMG9x8/gDOMGB0sGXnZ28gxOMdRj0BYVwSrnrqzAsOPuA/IMluHnYQjlV2MgFeA1uO/4WQbZa7fxKWF48ukT8Qbzc0DC7cST52BMDJDlQ02SjLjqvE8/fqGUCfgAHzs7SjYHAZwGUwoAkElxiT9DoTAAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAAABJRU5ErkJggg==';
const checkIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAA9ElEQVRIS93WMQsBYRzH8d/9U1IGg5TB6F3ca+AF2GTzArwGJgabjGRkuImFMxmumLjNlVIWRWz0yJV0lzvPc/7lOz/16f/veerRnPP5hh9HYIjAEIEhAkOEf0FP1wuqvQaak/5v0AfYr8ParmEs59GjLmjvHSTjCbRLtWhRLzCfyUWHhgGVoGFBafQb0BcdLMYwVt43TxYUxeBR6/m+dscDKnpRKeg7qQt1zRE65lAp6IuW9YInrAL0Xa8LiwQoYNHMtqRBkfbp5/C+Ylkw0JN5XbUKMNCkbtONhWwqLQ2GQlVGYIjAEIEhAkMEhujTgShiQe+zHJ3JKcCrHAAAAA50RVh0U29mdHdhcmUARmlnbWGesZZjAAAAAElFTkSuQmCC';

function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown } } })?.response?.data;
  return typeof data?.message === 'string' ? data.message : fallback;
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value) + '%';
}

function displayOption(option: string): string {
  return option.replace(/^[A-Z][.)]\s*/, '');
}

const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [selectedPubForGen, setSelectedPubForGen] = useState<number | undefined>(() => {
    const publicationId = Number(searchParams.get('publicationId'));
    return Number.isInteger(publicationId) && publicationId > 0 ? publicationId : undefined;
  });
  const [isLoadingPublications, setIsLoadingPublications] = useState(true);
  const [publicationError, setPublicationError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizDTO | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [attemptResult, setAttemptResult] = useState<QuizAttemptDTO | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const publicationId = Number(searchParams.get('publicationId'));
    if (Number.isInteger(publicationId) && publicationId > 0) setSelectedPubForGen(publicationId);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    publicationsService.getPublications(0, 50)
      .then(response => { if (active) setPublications(response.content || []); })
      .catch(err => { if (active) setPublicationError(getApiErrorMessage(err, 'Impossible de charger les publications.')); })
      .finally(() => { if (active) setIsLoadingPublications(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedPubForGen || publications.some(publication => publication.id === selectedPubForGen)) return;
    let active = true;
    publicationsService.getPublicationById(selectedPubForGen)
      .then(publication => {
        if (!active) return;
        setPublications(current => current.some(item => item.id === publication.id) ? current : [publication, ...current]);
        setPublicationError(null);
      })
      .catch(err => { if (active) setPublicationError(getApiErrorMessage(err, 'La publication demandée est indisponible.')); });
    return () => { active = false; };
  }, [publications, selectedPubForGen]);

  useEffect(() => {
    let active = true;
    setQuiz(null);
    setAttemptResult(null);
    setSelectedAnswers({});
    setError(null);
    if (!id) {
      setIsLoadingQuiz(false);
      return () => { active = false; };
    }

    const quizId = Number(id);
    if (!Number.isSafeInteger(quizId) || quizId <= 0) {
      setIsLoadingQuiz(false);
      setError('Identifiant de quiz invalide.');
      return () => { active = false; };
    }

    setIsLoadingQuiz(true);
    learningService.getQuiz(quizId)
      .then(data => { if (active) setQuiz(data); })
      .catch(err => { if (active) setError(getApiErrorMessage(err, 'Impossible de charger le questionnaire.')); })
      .finally(() => { if (active) setIsLoadingQuiz(false); });
    return () => { active = false; };
  }, [id]);

  const handleGenerate = async () => {
    if (!selectedPublicationExists || isGenerating) return;
    setError(null);
    setIsGenerating(true);
    try {
      const generated = await learningService.generateQuiz({
        publicationId: selectedPubForGen,
        questionCount: 5,
        type: 'MCQ'
      });
      if (!Number.isSafeInteger(generated.id) || generated.id <= 0) {
        setError('Le service n’a pas confirmé la création du quiz.');
        return;
      }
      navigate('/quiz/' + generated.id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'La génération du questionnaire a échoué.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || isSubmitting || Object.keys(selectedAnswers).length === 0) return;
    const answers: Record<number, string> = {};
    Object.keys(selectedAnswers).forEach(questionId => {
      const numericId = Number(questionId);
      const answer = selectedAnswers[numericId];
      if (answer !== undefined) answers[numericId] = answer;
    });
    setError(null);
    setIsSubmitting(true);
    try {
      setAttemptResult(await learningService.submitQuizAttempt(quiz.id, answers));
    } catch (err) {
      setError(getApiErrorMessage(err, 'La soumission a échoué. Vos réponses sont conservées.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const restartQuiz = () => {
    setSelectedAnswers({});
    setAttemptResult(null);
    setError(null);
  };
  const answeredCount = Object.keys(selectedAnswers).length;
  const selectedPublicationExists = Boolean(selectedPubForGen && publications.some(publication => publication.id === selectedPubForGen));

  return (
    <main className="quiz-flow">
      <div className="quiz-flow__inner">
        {!id ? (
          <>
            <header className="quiz-page-heading">
              <p className="quiz-eyebrow">Auto-évaluation</p>
              <h1>Quiz académiques</h1>
              <p>Générez un quiz à partir d’une publication, puis soumettez vos réponses pour obtenir votre résultat.</p>
            </header>
            <div className="quiz-generator-layout">
              <section className="quiz-panel quiz-generator">
                <div className="quiz-generator__heading">
                  <span className="quiz-document-icon"><img src={documentIcon} alt="" width="22" height="22" /></span>
                  <div><h2>Générer une auto-évaluation</h2><p>Sélectionnez un document publié pour créer cinq questions.</p></div>
                </div>
                <div className="quiz-generator__source">
                  <p className="quiz-field-eyebrow">Publication source</p>
                  <label className="quiz-field-label" htmlFor="quiz-publication">Publication</label>
                  <select
                    id="quiz-publication"
                    value={selectedPubForGen || ''}
                    onChange={event => {
                      setSelectedPubForGen(event.target.value ? Number(event.target.value) : undefined);
                      setPublicationError(null);
                    }}
                    disabled={isLoadingPublications || isGenerating}
                  >
                    <option value="">{isLoadingPublications ? 'Chargement des publications…' : 'Choisir une publication du catalogue'}</option>
                    {publications.map(publication => <option key={publication.id} value={publication.id}>{publication.titre}</option>)}
                  </select>
                  {publicationError && <p className="quiz-inline-error" role="alert">{publicationError}</p>}
                </div>
                <div className="quiz-generator__explanation">
                  <h3>Le quiz sera généré à partir du document sélectionné</h3>
                  <p>Les questions, les choix de réponse et les explications proviennent du service d’apprentissage.</p>
                </div>
                {error && <p className="quiz-error" role="alert">{error}</p>}
                <div className="quiz-generator__actions">
                  <p>5 questions · QCM (configuration actuelle)</p>
                  <button type="button" className="quiz-button quiz-button--primary" onClick={handleGenerate} disabled={!selectedPublicationExists || isGenerating || isLoadingPublications}>
                    {isGenerating ? 'Génération en cours…' : 'Générer le quiz'}
                  </button>
                </div>
              </section>
              <aside className="quiz-panel quiz-explainer">
                <p className="quiz-eyebrow">Comment ça marche</p>
                <h2>Évaluez votre compréhension.</h2>
                <p className="quiz-explainer__intro">Le quiz s’appuie sur une publication du catalogue et enregistre votre tentative.</p>
                <ol className="quiz-steps">
                  <li><span>01</span><div><strong>Choisir une publication</strong><small>Le service récupère les publications disponibles.</small></div></li>
                  <li><span>02</span><div><strong>Générer les questions</strong><small>Le quiz est généré à partir du document sélectionné.</small></div></li>
                  <li><span>03</span><div><strong>Répondre et soumettre</strong><small>Le résultat est calculé et renvoyé par l’API.</small></div></li>
                </ol>
              </aside>
            </div>
            <p className="quiz-note">Après génération, le questionnaire apparaît ici. Les réponses soumises affichent le résultat renvoyé par le service.</p>
          </>
        ) : isLoadingQuiz ? (
          <div className="quiz-loading" role="status" aria-busy="true">Chargement du questionnaire…</div>
        ) : error && !quiz ? (
          <section className="quiz-state">
            <p className="quiz-error" role="alert">{error}</p>
            <NavLink className="quiz-button quiz-button--secondary" to="/quiz">Retour aux quiz</NavLink>
          </section>
        ) : quiz && attemptResult ? (
          <>
            <div className="quiz-breadcrumb"><NavLink to="/quiz">Quiz académiques</NavLink><span>/</span><span>Résultat</span></div>
            <section className="quiz-result-hero">
              <span className="quiz-result-hero__icon"><img src={checkIcon} alt="" width="29" height="29" /></span>
              <p className="quiz-eyebrow">Résultat de la tentative</p>
              <h1>Résultat du quiz</h1>
              <p>{attemptResult.passed ? 'Tentative réussie.' : 'Tentative non validée.'} Le résultat final a été renvoyé par le service après la soumission.</p>
            </section>
            <dl className="quiz-result-metrics">
              <div><dt>Score obtenu</dt><dd>{formatPercent(attemptResult.score)}</dd></div>
              <div><dt>Bonnes réponses</dt><dd>{attemptResult.correctCount} / {attemptResult.totalQuestions}</dd></div>
              <div><dt>Seuil de réussite</dt><dd>{formatPercent(attemptResult.passingScore)}</dd></div>
            </dl>
            <section className="quiz-review">
              <header><h2>Vos réponses et explications</h2><p>La correction affichée ci-dessous provient de la tentative enregistrée par le service.</p></header>
              <div className="quiz-corrections">
                {attemptResult.corrections.map((correction, index) => (
                  <article className="quiz-correction" key={correction.questionId}>
                    <div className="quiz-correction__heading">
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <h3>{correction.question}</h3>
                      <strong className={correction.correct ? 'is-correct' : 'is-incorrect'}>{correction.correct ? 'Correcte' : 'À revoir'}</strong>
                    </div>
                    <p><b>Votre réponse :</b> {correction.userAnswer}</p>
                    {!correction.correct && <p><b>Réponse attendue :</b> {correction.correctAnswer}</p>}
                    {correction.explanation && <p>{correction.explanation}</p>}
                  </article>
                ))}
              </div>
            </section>
            <div className="quiz-result-actions">
              <button type="button" className="quiz-button quiz-button--secondary" onClick={restartQuiz}>Recommencer le quiz</button>
              <NavLink className="quiz-button quiz-button--primary" to="/quiz">Retour aux quiz</NavLink>
            </div>
          </>
        ) : quiz ? (
          <>
            <div className="quiz-breadcrumb"><NavLink to="/quiz">Quiz académiques</NavLink><span>/</span><span>Questionnaire</span></div>
            <header className="quiz-page-heading quiz-page-heading--session">
              <p className="quiz-eyebrow">Auto-évaluation</p>
              <h1>Questionnaire scientifique</h1>
              <p>Répondez aux questions générées à partir de la publication sélectionnée.</p>
            </header>
            {error && <p className="quiz-error" role="alert">{error}</p>}
            <section className="quiz-metadata">
              <div><h2>Publication associée au quiz</h2><p>{quiz.publicationTitle || quiz.topic}</p></div>
              <div className="quiz-metadata__chips">
                <span><small>Type</small><strong>{quiz.type}</strong></span>
                <span><small>Seuil API</small><strong>{formatPercent(quiz.passingScore)}</strong></span>
                <span><small>N questions</small><strong>{quiz.questions.length}</strong></span>
              </div>
            </section>
            <div className="quiz-session-layout">
              <section className="quiz-question-column">
                <div className="quiz-question-column__heading"><h2>Questions du questionnaire</h2><p>Progression : {answeredCount} réponse{answeredCount === 1 ? '' : 's'} sélectionnée{answeredCount === 1 ? '' : 's'}</p></div>
                {quiz.questions.length === 0 ? <p className="quiz-error" role="alert">Le quiz reçu ne contient aucune question.</p> : quiz.questions.map((question, questionIndex) => {
                  const selected = selectedAnswers[question.id];
                  return (
                    <article className="quiz-question" key={question.id}>
                      <div className="quiz-question__heading"><span>{String(questionIndex + 1).padStart(2, '0')}</span><h3>{question.question}</h3></div>
                      <fieldset className="quiz-options">
                        <legend className="sr-only">Choisissez une réponse à la question {questionIndex + 1}</legend>
                        {question.options.map((option, optionIndex) => (
                          <label className={'quiz-option' + (selected === option ? ' is-selected' : '')} key={optionIndex}>
                            <input type="radio" name={'question-' + question.id} value={option} checked={selected === option} onChange={() => setSelectedAnswers(current => ({ ...current, [question.id]: option }))} disabled={isSubmitting} />
                            <span className="quiz-option__letter">{String.fromCharCode(65 + optionIndex)}</span>
                            <span className="quiz-option__text">{displayOption(option)}</span>
                            <span className="quiz-option__radio" aria-hidden="true" />
                          </label>
                        ))}
                      </fieldset>
                    </article>
                  );
                })}
              </section>
              <aside className="quiz-session-sidebar">
                <p className="quiz-eyebrow">Votre tentative</p>
                <h2>Prenez le temps de réfléchir.</h2>
                <p>Vos réponses sont conservées dans la session pendant que vous parcourez le questionnaire.</p>
                <ul className="quiz-guidelines">
                  <li><img src={checkIcon} alt="" width="13" height="13" />Choisissez une réponse par question</li>
                  <li><img src={checkIcon} alt="" width="13" height="13" />Relisez vos choix avant l’envoi</li>
                  <li><img src={checkIcon} alt="" width="13" height="13" />Soumettez pour calculer le résultat</li>
                </ul>
                <p>Le score et le statut de réussite seront calculés après la soumission.</p>
                <button type="button" className="quiz-button quiz-button--primary quiz-submit" onClick={handleSubmit} disabled={isSubmitting || answeredCount === 0 || quiz.questions.length === 0}>
                  {isSubmitting ? 'Soumission en cours…' : 'Soumettre le quiz'}
                </button>
                <small>Une réponse au minimum est requise pour soumettre la tentative.</small>
              </aside>
            </div>
          </>
        ) : <div className="quiz-loading" role="status">Chargement du questionnaire…</div>}
      </div>
    </main>
  );
};

export default QuizPage;
