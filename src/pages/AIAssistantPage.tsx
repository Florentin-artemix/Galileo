import React, { useEffect, useRef, useState } from 'react';
import {
  aiService,
  getAIErrorMessage,
  type AIMode,
  type AIExplanationLevel,
  type AISummaryType,
  type SourceReference
} from '../services/aiService';
import { publicationsService, type PublicationDTO } from '../services/publicationsService';
import FormattedAIMessage from '../components/FormattedAIMessage';
import './ai-assistant.css';

type AssistantAction = 'CHAT' | 'SUMMARIZE' | 'EXPLAIN' | 'COMPARE';

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  mode?: AIMode;
  sources?: SourceReference[];
  timestamp: string;
}

const modeOptions: { key: AIMode; label: string; description: string }[] = [
  { key: 'GENERAL', label: 'Général', description: 'Questions académiques ouvertes' },
  { key: 'DOCUMENT', label: 'Document', description: 'Questions sur le PDF d’une publication liée' },
  { key: 'RESEARCH', label: 'Recherche', description: 'Explorer les travaux académiques' },
  { key: 'LEARNING', label: 'Apprentissage', description: 'Soutien à l’apprentissage' }
];

const summaryTypes: { value: AISummaryType; label: string }[] = [
  { value: 'RAPIDE', label: 'Synthèse rapide' },
  { value: 'STRUCTURE', label: 'Résumé structuré' },
  { value: 'PEDAGOGIQUE', label: 'Synthèse pédagogique' }
];

const explanationLevels: { value: AIExplanationLevel; label: string }[] = [
  { value: 'SIMPLIFIE', label: 'Simplifié' },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire' },
  { value: 'AVANCE', label: 'Avancé' }
];

const formatTime = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const hasPlatformPdf = (publication?: PublicationDTO): boolean => {
  if (!publication) return true;
  if (publication.documentId === null && !publication.urlPdf) {
    return false;
  }
  return true;
};

const AIAssistantPage: React.FC = () => {
  const [mode, setMode] = useState<AIMode>('GENERAL');
  const [action, setAction] = useState<AssistantAction>('CHAT');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [publicationsLoading, setPublicationsLoading] = useState(true);
  const [publicationsError, setPublicationsError] = useState<string | null>(null);
  const [selectedPublicationId, setSelectedPublicationId] = useState<number | undefined>();
  const [selectedPublicationTitle, setSelectedPublicationTitle] = useState<string | undefined>();
  const [comparePublicationId, setComparePublicationId] = useState<number | undefined>();
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [latestSources, setLatestSources] = useState<SourceReference[]>([]);
  const [historicalReferencesUnavailable, setHistoricalReferencesUnavailable] = useState(false);
  const [summaryType, setSummaryType] = useState<AISummaryType>('RAPIDE');
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [explainText, setExplainText] = useState('');
  const [explainLevel, setExplainLevel] = useState<AIExplanationLevel>('INTERMEDIAIRE');
  const [explainResult, setExplainResult] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;

    const loadPageData = async () => {
      const [publicationResult, conversationResult] = await Promise.allSettled([
        publicationsService.getPublications(0, 100),
        aiService.getConversations()
      ]);

      if (disposed) return;

      if (publicationResult.status === 'fulfilled') {
        setPublications(publicationResult.value.content || []);
        setPublicationsError(null);
      } else {
        setPublicationsError('Les publications ne sont pas disponibles pour le moment.');
      }
      setPublicationsLoading(false);

      if (conversationResult.status === 'rejected') {
        setHistoryError('L’historique des conversations n’a pas pu être chargé. Une nouvelle discussion reste disponible.');
        setHistoryLoading(false);
        return;
      }

      const latestConversation = conversationResult.value[0];
      if (!latestConversation) {
        setHistoryLoading(false);
        return;
      }

      try {
        const history = await aiService.getConversationMessages(latestConversation.id);
        if (disposed) return;

        setConversationId(latestConversation.id);
        setMode(latestConversation.mode || 'GENERAL');
        setSelectedPublicationId(latestConversation.publicationId);
        setSelectedPublicationTitle(latestConversation.publicationTitle || undefined);
        setMessages(history
          .filter(message => message.role === 'USER' || message.role === 'ASSISTANT')
          .map(message => ({
            id: String(message.id),
            sender: message.role === 'USER' ? 'user' : 'assistant',
            text: message.content,
            timestamp: formatTime(message.createdAt)
          })));
        const lastAssistantMessage = [...history].reverse().find(message => message.role === 'ASSISTANT');
        let historicalSourceCount = 0;
        try {
          const metadata = lastAssistantMessage?.metadata ? JSON.parse(lastAssistantMessage.metadata) : null;
          historicalSourceCount = Number(metadata?.sourcesCount || 0);
        } catch {
          historicalSourceCount = 0;
        }
        setHistoricalReferencesUnavailable(Boolean(lastAssistantMessage && historicalSourceCount > 0));
      } catch {
        if (!disposed) {
          setHistoryError('La dernière conversation n’a pas pu être restaurée. Vous pouvez démarrer une nouvelle discussion.');
        }
      } finally {
        if (!disposed) setHistoryLoading(false);
      }
    };

    void loadPageData();
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pendingMessage]);

  const selectedPublication = publications.find(publication => publication.id === selectedPublicationId);
  const comparePublication = publications.find(publication => publication.id === comparePublicationId);
  const selectedPublicationPdfMissing = Boolean(selectedPublication && !hasPlatformPdf(selectedPublication));
  const comparePublicationPdfMissing = Boolean(comparePublication && !hasPlatformPdf(comparePublication));

  const handleModeChange = (nextMode: AIMode) => {
    setMode(nextMode);
    setChatError(null);
  };

  const handlePublicationChange = (value: string) => {
    const nextId = value ? Number(value) : undefined;
    const selected = publications.find(publication => publication.id === nextId);
    setSelectedPublicationId(nextId);
    setSelectedPublicationTitle(selected?.titre);
    setComparePublicationId(undefined);
    setChatError(null);
    setSummaryError(null);
    setSummaryResult(null);
    setComparisonError(null);
    setComparisonResult(null);
    if (nextId !== selectedPublicationId) {
      setConversationId(undefined);
      setMessages([]);
      setLatestSources([]);
      setHistoricalReferencesUnavailable(false);
    }
    if (nextId) setMode('DOCUMENT');
    else if (mode === 'DOCUMENT') setMode('GENERAL');
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const textToSend = input.trim();
    if (!textToSend || pendingMessage) return;
    if (mode === 'DOCUMENT' && !selectedPublicationId) {
      setChatError('Sélectionnez une publication disponible sur la plateforme dans le panneau Contexte pour utiliser le mode Document.');
      return;
    }
    if (selectedPublicationId && selectedPublicationPdfMissing) {
      setChatError('Le fichier PDF de cette publication est indisponible sur la plateforme. L’assistant ne peut pas répondre sans le document PDF.');
      return;
    }

    setChatError(null);
    setPendingMessage(textToSend);

    try {
      const response = await aiService.sendMessage({
        conversationId,
        mode,
        publicationId: selectedPublicationId,
        message: textToSend
      });

      setMessages(previous => [...previous,
        {
          id: `user-${response.messageId}-${Date.now()}`,
          sender: 'user',
          text: textToSend,
          timestamp: formatTime()
        },
        {
          id: String(response.messageId || `assistant-${Date.now()}`),
          sender: 'assistant',
          text: response.response,
          mode: response.mode,
          sources: response.sourceReferences || [],
          timestamp: formatTime()
        }
      ]);
      setConversationId(response.conversationId);
      setMode(response.mode || mode);
      setLatestSources(response.sourceReferences || []);
      setHistoricalReferencesUnavailable(false);
      setInput('');
    } catch (error) {
      setChatError(getAIErrorMessage(error));
    } finally {
      setPendingMessage(null);
    }
  };

  const handleSummarize = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPublicationId || isSummarizing) return;
    if (selectedPublicationPdfMissing) {
      setSummaryError('Le fichier PDF de cette publication est indisponible sur la plateforme.');
      return;
    }

    setSummaryError(null);
    setSummaryResult(null);
    setIsSummarizing(true);
    try {
      const response = await aiService.summarizePublication({
        publicationId: selectedPublicationId,
        summaryType
      });
      setSummaryResult(response.content);
    } catch (error) {
      setSummaryError(getAIErrorMessage(error));
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExplain = async (event: React.FormEvent) => {
    event.preventDefault();
    const passage = explainText.trim();
    if (!passage || isExplaining) return;
    if (selectedPublicationId && selectedPublicationPdfMissing) {
      setExplainError('Le fichier PDF de la publication liée est indisponible sur la plateforme.');
      return;
    }

    setExplainError(null);
    setExplainResult(null);
    setIsExplaining(true);
    try {
      const response = await aiService.explainPassage({
        passage,
        level: explainLevel,
        publicationId: selectedPublicationId
      });
      setExplainResult(response.explanation);
    } catch (error) {
      setExplainError(getAIErrorMessage(error));
    } finally {
      setIsExplaining(false);
    }
  };

  const handleCompare = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPublicationId || !comparePublicationId || isComparing) return;
    if (selectedPublicationPdfMissing || comparePublicationPdfMissing) {
      setComparisonError('Les deux publications doivent disposer d’un fichier PDF lisible sur la plateforme pour être comparées.');
      return;
    }

    setComparisonError(null);
    setComparisonResult(null);
    setIsComparing(true);
    try {
      const response = await aiService.comparePublications({
        publicationIds: [selectedPublicationId, comparePublicationId]
      });
      setComparisonResult(response.comparison);
    } catch (error) {
      setComparisonError(getAIErrorMessage(error));
    } finally {
      setIsComparing(false);
    }
  };

  const activePublicationTitle = selectedPublicationTitle
    || selectedPublication?.titre;

  return (
    <main className="ai-assistant-page">
      <header className="ai-assistant-heading">
        <div>
          <p className="ai-assistant-eyebrow">ASSISTANT DOCUMENTAIRE</p>
          <h1>Assistant IA Galileo</h1>
          <p>Interrogez directement les documents PDF des publications hébergées sur la plateforme Galileo, obtenez un résumé ou comparez des travaux.</p>
        </div>
      </header>

      <nav className="ai-mode-selector" aria-label="Mode de l’assistant">
        {modeOptions.map(option => (
          <button
            key={option.key}
            type="button"
            className={`ai-mode-pill${mode === option.key ? ' is-active' : ''}`}
            aria-pressed={mode === option.key}
            onClick={() => handleModeChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </nav>

      {historyError && <div className="ai-status ai-status-warning" role="status">{historyError}</div>}

      <div className="ai-workspace">
        <section className="ai-conversation-panel" aria-label="Espace de conversation IA">
          <header className="ai-conversation-header">
            <h2>Conversation</h2>
            <div className="ai-action-selector" role="tablist" aria-label="Action IA">
              {([
                ['CHAT', 'Discuter'],
                ['SUMMARIZE', 'Résumer'],
                ['EXPLAIN', 'Expliquer'],
                ['COMPARE', 'Comparer']
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={action === key}
                  className={action === key ? 'is-active' : ''}
                  onClick={() => setAction(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          <div className="ai-mobile-context-bar">
            <label htmlFor="ai-mobile-publication-select">Document PDF lié :</label>
            <select
              id="ai-mobile-publication-select"
              value={selectedPublicationId ?? ''}
              onChange={event => handlePublicationChange(event.target.value)}
              disabled={publicationsLoading || Boolean(publicationsError)}
            >
              <option value="">Aucune publication (mode général)</option>
              {selectedPublicationId && !publications.some(publication => publication.id === selectedPublicationId) && (
                <option value={selectedPublicationId}>{activePublicationTitle || 'Publication liée'}</option>
              )}
              {publications.map(publication => (
                <option key={publication.id} value={publication.id}>
                  {publication.titre}{!hasPlatformPdf(publication) ? ' (PDF indisponible)' : ''}
                </option>
              ))}
            </select>
          </div>

          {action === 'CHAT' && (
            <>
              {!historyLoading && messages.length === 0 && !pendingMessage && (
                <div className="ai-welcome-state">
                  <div className="ai-welcome-head">
                    <img src="/assets/figma-ai-sparkles.svg" alt="" aria-hidden="true" />
                    <h3>Bonjour, comment puis-je vous aider ?</h3>
                  </div>
                  <p>Liez une publication disponible sur la plateforme dans le panneau Contexte pour interroger directement le contenu intégral de son document PDF.</p>
                </div>
              )}
              <div className="ai-message-list" aria-live="polite" aria-busy={Boolean(pendingMessage) || historyLoading}>
                {historyLoading ? (
                  <div className="ai-empty-state" role="status">Chargement de la conversation…</div>
                ) : messages.length === 0 ? (
                  <div className="ai-empty-state">
                    <span className="ai-empty-illustration" aria-hidden="true">
                      <img src="/assets/figma-ai-book.svg" alt="" />
                    </span>
                    <h3>Votre échange apparaîtra ici</h3>
                    <p>Les réponses et références paginées extraites du PDF de la plateforme sont ajoutées après l’envoi d’une question.</p>
                  </div>
                ) : messages.map(message => (
                  <article key={message.id} className={`ai-message-row ${message.sender}`}>
                    <div className="ai-message-bubble">
                      {message.sender === 'assistant' ? (
                        <FormattedAIMessage text={message.text} />
                      ) : (
                        <p>{message.text}</p>
                      )}
                      {message.sources && message.sources.length > 0 && (
                        <div className="ai-message-sources">
                          <strong>Références du PDF de la plateforme</strong>
                          {message.sources.map((source, index) => (
                            <p key={`${source.attachmentChunkId || source.chunkId}-${index}`}>
                              <span>{source.fileName ? `${source.fileName} · page ${source.pageNumber}` : `Page ${source.pageNumber}`}</span> {source.excerpt}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <time>{message.timestamp}</time>
                  </article>
                ))}
                {pendingMessage && (
                  <>
                    <article className="ai-message-row user">
                      <div className="ai-message-bubble"><p>{pendingMessage}</p></div>
                    </article>
                    <div className="ai-generating" role="status">Réponse en cours…</div>
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="ai-composer" onSubmit={handleSendMessage}>
                {chatError && <div className="ai-status ai-status-error" role="alert">{chatError}</div>}
                {mode === 'DOCUMENT' && selectedPublicationPdfMissing && !chatError && (
                  <div className="ai-status ai-status-error" role="alert">
                    Le fichier PDF de cette publication est indisponible sur la plateforme. L’assistant ne peut pas interroger ce document.
                  </div>
                )}
                <label className="ai-sr-only" htmlFor="ai-chat-input">Votre message</label>
                <textarea
                  id="ai-chat-input"
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder={mode === 'DOCUMENT' ? 'Posez une question sur le document PDF de la publication liée…' : 'Écrivez votre message…'}
                  maxLength={4000}
                  disabled={Boolean(pendingMessage) || historyLoading || (mode === 'DOCUMENT' && selectedPublicationPdfMissing)}
                  rows={2}
                />
                <div className="ai-composer-footer">
                  <span>{mode === 'DOCUMENT'
                    ? activePublicationTitle
                      ? `Document PDF plateforme : ${activePublicationTitle}`
                      : 'Sélectionnez une publication liée dans le panneau Contexte'
                    : 'Contexte documentaire : sélectionnez une publication liée à droite'}</span>
                  <button
                    type="submit"
                    disabled={
                      !input.trim()
                      || Boolean(pendingMessage)
                      || historyLoading
                      || (mode === 'DOCUMENT' && (!selectedPublicationId || selectedPublicationPdfMissing))
                    }
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            </>
          )}

          {action === 'SUMMARIZE' && (
            <form className="ai-tool-panel" onSubmit={handleSummarize}>
              <div className="ai-tool-intro">
                <h3>Résumer le PDF d’une publication</h3>
                <p>La synthèse est générée exclusivement à partir du texte intégral extrait du fichier PDF hébergé sur la plateforme.</p>
              </div>
              {!selectedPublicationId && (
                <div className="ai-context-hint">Sélectionnez une publication de la plateforme dans le panneau Contexte à droite.</div>
              )}
              {selectedPublicationPdfMissing && (
                <div className="ai-status ai-status-error" role="alert">
                  Le fichier PDF de cette publication est indisponible sur la plateforme.
                </div>
              )}
              <fieldset className="ai-level-selector">
                <legend>Type de synthèse</legend>
                {summaryTypes.map(item => (
                  <label key={item.value} className={summaryType === item.value ? 'is-active' : ''}>
                    <input
                      type="radio"
                      name="summary-type"
                      value={item.value}
                      checked={summaryType === item.value}
                      onChange={() => setSummaryType(item.value)}
                    />
                    {item.label}
                  </label>
                ))}
              </fieldset>
              <div className="ai-composer-footer">
                <span>{activePublicationTitle ? `Publication : ${activePublicationTitle}` : 'Aucune publication sélectionnée'}</span>
                <button type="submit" disabled={!selectedPublicationId || selectedPublicationPdfMissing || isSummarizing}>
                  {isSummarizing ? 'Synthèse en cours…' : 'Générer le résumé'}
                </button>
              </div>
              {summaryError && <div className="ai-status ai-status-error" role="alert">{summaryError}</div>}
              {summaryResult && <div className="ai-tool-result" aria-live="polite"><h4>Résumé du document PDF</h4><FormattedAIMessage text={summaryResult} /></div>}
            </form>
          )}

          {action === 'EXPLAIN' && (
            <form className="ai-tool-panel" onSubmit={handleExplain}>
              <div className="ai-tool-intro">
                <h3>Expliquer un passage</h3>
                <p>Le service analyse le passage fourni au niveau choisi{activePublicationTitle ? ` en s’appuyant sur le PDF de « ${activePublicationTitle} »` : ''}.</p>
              </div>
              {selectedPublicationId && selectedPublicationPdfMissing && (
                <div className="ai-status ai-status-error" role="alert">
                  Le fichier PDF de la publication liée est indisponible sur la plateforme.
                </div>
              )}
              <fieldset className="ai-level-selector">
                <legend>Niveau</legend>
                {explanationLevels.map(level => (
                  <label key={level.value} className={explainLevel === level.value ? 'is-active' : ''}>
                    <input
                      type="radio"
                      name="explanation-level"
                      value={level.value}
                      checked={explainLevel === level.value}
                      onChange={() => setExplainLevel(level.value)}
                    />
                    {level.label}
                  </label>
                ))}
              </fieldset>
              <label className="ai-field-label" htmlFor="ai-explain-text">Passage à expliquer</label>
              <textarea
                id="ai-explain-text"
                value={explainText}
                onChange={event => setExplainText(event.target.value)}
                maxLength={10000}
                rows={7}
                placeholder="Collez ici le passage à expliquer…"
                disabled={isExplaining}
              />
              <div className="ai-composer-footer">
                <span>{explainText.length}/10000</span>
                <button type="submit" disabled={!explainText.trim() || isExplaining || (Boolean(selectedPublicationId) && selectedPublicationPdfMissing)}>
                  {isExplaining ? 'Analyse en cours…' : 'Expliquer'}
                </button>
              </div>
              {explainError && <div className="ai-status ai-status-error" role="alert">{explainError}</div>}
              {explainResult && <div className="ai-tool-result" aria-live="polite"><h4>Explication</h4><FormattedAIMessage text={explainResult} /></div>}
            </form>
          )}

          {action === 'COMPARE' && (
            <form className="ai-tool-panel" onSubmit={handleCompare}>
              <div className="ai-tool-intro">
                <h3>Comparer deux publications</h3>
                <p>La comparaison analyse directement le texte extrait des fichiers PDF des deux publications sur la plateforme.</p>
              </div>
              {!selectedPublicationId && (
                <div className="ai-context-hint">Choisissez la première publication dans le panneau Contexte.</div>
              )}
              {(selectedPublicationPdfMissing || comparePublicationPdfMissing) && (
                <div className="ai-status ai-status-error" role="alert">
                  L’une des publications sélectionnées ne dispose pas d’un fichier PDF disponible sur la plateforme.
                </div>
              )}
              {publicationsError && <div className="ai-status ai-status-error" role="alert">{publicationsError}</div>}
              <label className="ai-field-label" htmlFor="ai-compare-publication">Deuxième publication (plateforme)</label>
              <select
                id="ai-compare-publication"
                value={comparePublicationId ?? ''}
                onChange={event => {
                  setComparePublicationId(event.target.value ? Number(event.target.value) : undefined);
                  setComparisonError(null);
                  setComparisonResult(null);
                }}
                disabled={!selectedPublicationId || publicationsLoading || Boolean(publicationsError) || isComparing}
              >
                <option value="">Sélectionner une publication</option>
                {publications
                  .filter(publication => publication.id !== selectedPublicationId)
                  .map(publication => (
                    <option key={publication.id} value={publication.id}>
                      {publication.titre}{!hasPlatformPdf(publication) ? ' (PDF indisponible)' : ''}
                    </option>
                  ))}
              </select>
              <div className="ai-composer-footer">
                <span>{selectedPublicationId && comparePublicationId ? '2 documents PDF sélectionnés' : '2 publications avec PDF requises'}</span>
                <button
                  type="submit"
                  disabled={
                    !selectedPublicationId
                    || !comparePublicationId
                    || selectedPublicationPdfMissing
                    || comparePublicationPdfMissing
                    || isComparing
                  }
                >
                  {isComparing ? 'Comparaison en cours…' : 'Comparer'}
                </button>
              </div>
              {comparisonError && <div className="ai-status ai-status-error" role="alert">{comparisonError}</div>}
              {comparisonResult && <div className="ai-tool-result" aria-live="polite"><h4>Résultat de la comparaison</h4><FormattedAIMessage text={comparisonResult} /></div>}
            </form>
          )}
        </section>

        <aside className="ai-context-panel" aria-label="Contexte et références">
          <section className="ai-side-section ai-publication-context">
            <h3>Contexte de la demande</h3>
            <p className="ai-context-description">Sélectionnez une publication de la plateforme Galileo pour que l’IA interroge directement son fichier PDF (sans téléversement externe).</p>
            <label htmlFor="ai-publication-select">Publication liée (plateforme)</label>
            <select
              id="ai-publication-select"
              value={selectedPublicationId ?? ''}
              onChange={event => handlePublicationChange(event.target.value)}
              disabled={publicationsLoading || Boolean(publicationsError)}
            >
              <option value="">Aucune publication</option>
              {selectedPublicationId && !publications.some(publication => publication.id === selectedPublicationId) && (
                <option value={selectedPublicationId}>{activePublicationTitle || 'Publication de la conversation précédente'}</option>
              )}
              {publications.map(publication => (
                <option key={publication.id} value={publication.id}>
                  {publication.titre}{!hasPlatformPdf(publication) ? ' (PDF indisponible)' : ''}
                </option>
              ))}
            </select>
            {publicationsLoading && <p className="ai-side-note">Chargement des publications…</p>}
            {publicationsError && <div className="ai-status ai-status-error" role="alert">{publicationsError}</div>}
            {activePublicationTitle && selectedPublicationId && (
              <p className="ai-linked-publication">Liée : {activePublicationTitle}</p>
            )}
            {selectedPublication && selectedPublication.nombrePages && (
              <p className="ai-side-note">Document PDF disponible · {selectedPublication.nombrePages} page(s)</p>
            )}
            {selectedPublicationPdfMissing && (
              <p className="ai-side-note">Aucun fichier PDF lisible n’est rattaché à cette publication sur la plateforme.</p>
            )}
            {selectedPublicationId && mode === 'DOCUMENT' && !selectedPublicationPdfMissing && (
              <p className="ai-side-note">L’IA analyse directement le texte extrait du PDF hébergé sur la plateforme.</p>
            )}
          </section>

          <section className="ai-side-section ai-available-modes">
            <h3>Modes disponibles</h3>
            <ul>
              {modeOptions.map(option => (
                <li key={option.key} className={mode === option.key ? 'is-active' : ''}>
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="ai-side-section ai-references-section">
            <h3>Références de la réponse</h3>
            {latestSources.length > 0 ? (
              <ul>
                {latestSources.map((source, index) => (
                  <li key={`${source.attachmentChunkId || source.chunkId}-${index}`}>
                    <strong>{source.fileName ? `${source.fileName} · page ${source.pageNumber}` : `Page ${source.pageNumber}`}</strong>
                    <span>{source.excerpt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{historicalReferencesUnavailable
                ? 'La conversation conservée indique des références, mais leurs extraits ne sont pas disponibles dans l’historique.'
                : messages.some(message => message.sender === 'assistant')
                  ? 'Aucune référence n’a été renvoyée pour la dernière réponse.'
                  : 'Les références paginées du PDF de la plateforme sont affichées lorsque le service IA renvoie des sources pour la réponse.'}</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
};

export default AIAssistantPage;
