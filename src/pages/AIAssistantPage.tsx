import React, { useEffect, useRef, useState } from 'react';
import {
  aiService,
  getAIErrorMessage,
  type AIConversationAttachment,
  type AIMode,
  type AIExplanationLevel,
  type SourceReference
} from '../services/aiService';
import { publicationsService, type PublicationDTO } from '../services/publicationsService';
import './ai-assistant.css';

type AssistantAction = 'CHAT' | 'EXPLAIN' | 'COMPARE';

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
  { key: 'DOCUMENT', label: 'Document', description: 'Questions sur une publication liée' },
  { key: 'RESEARCH', label: 'Recherche', description: 'Explorer les travaux académiques' },
  { key: 'LEARNING', label: 'Apprentissage', description: 'Soutien à l’apprentissage' }
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

const AIAssistantPage: React.FC = () => {
  const [mode, setMode] = useState<AIMode>('GENERAL');
  const [action, setAction] = useState<AssistantAction>('CHAT');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [attachments, setAttachments] = useState<AIConversationAttachment[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
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
  const [explainText, setExplainText] = useState('');
  const [explainLevel, setExplainLevel] = useState<AIExplanationLevel>('INTERMEDIAIRE');
  const [explainResult, setExplainResult] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<string | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

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
        void aiService.getConversationAttachments(latestConversation.id)
          .then(items => { if (!disposed) setAttachments(items); })
          .catch(() => { if (!disposed) setAttachmentError('Les PDF joints à cette conversation ne sont pas disponibles.'); });
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

  const handleModeChange = (nextMode: AIMode) => {
    if (nextMode !== mode && conversationId) {
      setConversationId(undefined);
      setMessages([]);
      setAttachments([]);
      setLatestSources([]);
      setHistoricalReferencesUnavailable(false);
    }
    setMode(nextMode);
    if (nextMode !== 'DOCUMENT' && selectedPublicationId) {
      setSelectedPublicationId(undefined);
      setSelectedPublicationTitle(undefined);
      setComparePublicationId(undefined);
    }
  };

  const handlePublicationChange = (value: string) => {
    const nextId = value ? Number(value) : undefined;
    const selected = publications.find(publication => publication.id === nextId);
    setSelectedPublicationId(nextId);
    setSelectedPublicationTitle(selected?.titre);
    setComparePublicationId(undefined);
    if (nextId !== selectedPublicationId) {
      setConversationId(undefined);
      setMessages([]);
      setAttachments([]);
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
    if (mode === 'DOCUMENT' && !selectedPublicationId && attachments.length === 0) {
      setChatError('Sélectionnez une publication ou joignez un PDF pour utiliser le mode Document.');
      return;
    }

    setChatError(null);
    setPendingMessage(textToSend);

    try {
      const response = await aiService.sendMessage({
        conversationId,
        mode,
        publicationId: mode === 'DOCUMENT' ? selectedPublicationId : undefined,
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

  const handleAttachmentSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setAttachmentError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setAttachmentError('Le PDF joint ne peut pas dépasser 20 Mo.');
      return;
    }

    setAttachmentError(null);
    setAttachmentBusy(true);
    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const created = await aiService.createConversation({
          mode: 'DOCUMENT',
          publicationId: selectedPublicationId
        });
        activeConversationId = created.id;
        setConversationId(created.id);
        setMessages([]);
      }
      const uploaded = await aiService.uploadConversationAttachment(activeConversationId, file);
      setAttachments(previous => [...previous, uploaded]);
      setMode('DOCUMENT');
    } catch (error) {
      setAttachmentError(getAIErrorMessage(error));
    } finally {
      setAttachmentBusy(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: number) => {
    if (!conversationId || attachmentBusy) return;
    setAttachmentBusy(true);
    setAttachmentError(null);
    try {
      await aiService.deleteConversationAttachment(conversationId, attachmentId);
      const remaining = attachments.filter(attachment => attachment.id !== attachmentId);
      setAttachments(remaining);
      if (remaining.length === 0 && !selectedPublicationId) setMode('GENERAL');
    } catch (error) {
      setAttachmentError(getAIErrorMessage(error));
    } finally {
      setAttachmentBusy(false);
    }
  };

  const handleExplain = async (event: React.FormEvent) => {
    event.preventDefault();
    const passage = explainText.trim();
    if (!passage || isExplaining) return;

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
    || publications.find(publication => publication.id === selectedPublicationId)?.titre;

  return (
    <main className="ai-assistant-page">
      <header className="ai-assistant-heading">
        <div>
          <p className="ai-assistant-eyebrow">ASSISTANT DOCUMENTAIRE</p>
          <h1>Assistant IA Galileo</h1>
          <p>Interrogez les travaux académiques, obtenez un résumé ou comparez des publications.</p>
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

          {action === 'CHAT' && (
            <>
              <div className="ai-welcome-state">
                <div className="ai-welcome-head">
                  <img src="/assets/figma-ai-sparkles.svg" alt="" aria-hidden="true" />
                  <h3>Bonjour, comment puis-je vous aider ?</h3>
                </div>
                <p>Choisissez un mode, posez une question ou liez la conversation à une publication. Les réponses sont générées par le service IA de Galileo.</p>
              </div>
              <div className="ai-message-list" aria-live="polite" aria-busy={Boolean(pendingMessage) || historyLoading}>
                {historyLoading ? (
                  <div className="ai-empty-state" role="status">Chargement de la conversation…</div>
                ) : messages.length === 0 ? (
                  <div className="ai-empty-state">
                    <span className="ai-empty-illustration" aria-hidden="true">
                      <img src="/assets/figma-ai-book.svg" alt="" />
                    </span>
                    <h3>Votre échange apparaîtra ici</h3>
                    <p>Les réponses et références sont ajoutées après l’envoi d’une question.</p>
                  </div>
                ) : messages.map(message => (
                  <article key={message.id} className={`ai-message-row ${message.sender}`}>
                    <div className="ai-message-bubble">
                      <p>{message.text}</p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="ai-message-sources">
                          <strong>Références renvoyées</strong>
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
                {attachmentError && <div className="ai-status ai-status-error" role="alert">{attachmentError}</div>}
                {attachments.length > 0 && (
                  <ul className="ai-attachment-list" aria-label="PDF joints à la conversation">
                    {attachments.map(attachment => (
                      <li key={attachment.id}>
                        <span title={`${attachment.pageCount} pages, ${attachment.extractedCharacters} caractères extraits`}>
                          {attachment.fileName} · {attachment.pageCount} p.
                        </span>
                        <button type="button" onClick={() => void handleRemoveAttachment(attachment.id)} disabled={attachmentBusy || Boolean(pendingMessage)} aria-label={`Retirer ${attachment.fileName}`}>
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="ai-attachment-toolbar">
                  <input
                    ref={attachmentInputRef}
                    className="ai-sr-only"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={event => void handleAttachmentSelection(event)}
                    disabled={attachmentBusy || Boolean(pendingMessage) || historyLoading}
                    aria-label="Joindre un PDF à la conversation"
                  />
                  <button type="button" onClick={() => attachmentInputRef.current?.click()} disabled={attachmentBusy || Boolean(pendingMessage) || historyLoading || attachments.length >= 5}>
                    {attachmentBusy ? 'Traitement du PDF…' : 'Joindre un PDF'}
                  </button>
                  <span>PDF · 20 Mo max · 5 fichiers</span>
                </div>
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
                  placeholder={mode === 'DOCUMENT' ? 'Posez une question sur le document lié ou le PDF joint…' : 'Écrivez votre message…'}
                  maxLength={4000}
                  disabled={Boolean(pendingMessage) || historyLoading}
                  rows={2}
                />
                <div className="ai-composer-footer">
                  <span>{mode === 'DOCUMENT'
                    ? activePublicationTitle || (attachments.length > 0 ? `${attachments.length} PDF joint(s)` : 'Sélectionnez une publication ou joignez un PDF')
                    : 'Contexte documentaire facultatif'}</span>
                  <button type="submit" disabled={!input.trim() || Boolean(pendingMessage) || historyLoading || (mode === 'DOCUMENT' && !selectedPublicationId && attachments.length === 0)}>
                    Envoyer
                  </button>
                </div>
              </form>
            </>
          )}

          {action === 'EXPLAIN' && (
            <form className="ai-tool-panel" onSubmit={handleExplain}>
              <div className="ai-tool-intro">
                <h3>Expliquer un passage</h3>
                <p>Le service analyse le texte fourni au niveau choisi.</p>
              </div>
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
                <button type="submit" disabled={!explainText.trim() || isExplaining}>
                  {isExplaining ? 'Analyse en cours…' : 'Expliquer'}
                </button>
              </div>
              {explainError && <div className="ai-status ai-status-error" role="alert">{explainError}</div>}
              {explainResult && <div className="ai-tool-result" aria-live="polite"><h4>Explication</h4><p>{explainResult}</p></div>}
            </form>
          )}

          {action === 'COMPARE' && (
            <form className="ai-tool-panel" onSubmit={handleCompare}>
              <div className="ai-tool-intro">
                <h3>Comparer deux publications</h3>
                <p>La comparaison utilise les deux publications sélectionnées.</p>
              </div>
              {!selectedPublicationId && (
                <div className="ai-context-hint">Choisissez la première publication dans le panneau Contexte.</div>
              )}
              {publicationsError && <div className="ai-status ai-status-error" role="alert">{publicationsError}</div>}
              <label className="ai-field-label" htmlFor="ai-compare-publication">Deuxième publication</label>
              <select
                id="ai-compare-publication"
                value={comparePublicationId ?? ''}
                onChange={event => setComparePublicationId(event.target.value ? Number(event.target.value) : undefined)}
                disabled={!selectedPublicationId || publicationsLoading || Boolean(publicationsError) || isComparing}
              >
                <option value="">Sélectionner une publication</option>
                {publications
                  .filter(publication => publication.id !== selectedPublicationId)
                  .map(publication => <option key={publication.id} value={publication.id}>{publication.titre}</option>)}
              </select>
              <div className="ai-composer-footer">
                <span>{selectedPublicationId && comparePublicationId ? '2 publications sélectionnées' : '2 publications requises'}</span>
                <button type="submit" disabled={!selectedPublicationId || !comparePublicationId || isComparing}>
                  {isComparing ? 'Comparaison en cours…' : 'Comparer'}
                </button>
              </div>
              {comparisonError && <div className="ai-status ai-status-error" role="alert">{comparisonError}</div>}
              {comparisonResult && <div className="ai-tool-result" aria-live="polite"><h4>Résultat de la comparaison</h4><p>{comparisonResult}</p></div>}
            </form>
          )}
        </section>

        <aside className="ai-context-panel" aria-label="Contexte et références">
          <section className="ai-side-section ai-publication-context">
            <h3>Contexte de la demande</h3>
            <p className="ai-context-description">Associez une publication pour ancrer les questions, résumés et comparaisons sur un document précis.</p>
            <label htmlFor="ai-publication-select">Publication liée</label>
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
                <option key={publication.id} value={publication.id}>{publication.titre}</option>
              ))}
            </select>
            {publicationsLoading && <p className="ai-side-note">Chargement des publications…</p>}
            {publicationsError && <div className="ai-status ai-status-error" role="alert">{publicationsError}</div>}
            {activePublicationTitle && selectedPublicationId && (
              <p className="ai-linked-publication">Liée : {activePublicationTitle}</p>
            )}
            {selectedPublicationId && mode === 'DOCUMENT' && (
              <p className="ai-side-note">L’accès au document est vérifié par le service à chaque requête.</p>
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
                  : 'Les références sont affichées lorsque le service IA renvoie des sources pour la réponse.'}</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
};

export default AIAssistantPage;
