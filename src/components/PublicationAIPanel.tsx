import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { aiService, getAIErrorMessage, type SourceReference } from '../services/aiService';
import FormattedAIMessage from './FormattedAIMessage';

interface PublicationAIPanelProps {
  publicationId: number;
  pageCount?: number | null;
  onOpenPage: (page: number) => void;
}

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: SourceReference[];
}

const PublicationAIPanel: React.FC<PublicationAIPanelProps> = ({ publicationId, pageCount, onOpenPage }) => {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isFrench = language === 'fr';
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const requestTokenRef = useRef(0);

  const prompts = isFrench
    ? ['Résume ce document', 'Explique cette idée simplement', 'Quelles sont les limites ?', 'Crée des fiches de révision']
    : ['Summarize this document', 'Explain this idea simply', 'What are the limitations?', 'Create revision cards'];

  useEffect(() => {
    requestTokenRef.current += 1;
    setMessages([]);
    setConversationId(undefined);
    setInput('');
    setError('');
    setIsLoading(false);
  }, [publicationId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const ask = async (question: string) => {
    const prompt = question.trim();
    if (!prompt || isLoading || !isAuthenticated) return;
    setError('');
    const requestToken = ++requestTokenRef.current;
    const userMessageId = `user-${Date.now()}`;
    setMessages(previous => [...previous, { id: userMessageId, sender: 'user', text: prompt }]);
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage({
        conversationId,
        publicationId,
        mode: 'DOCUMENT',
        message: prompt
      });
      if (requestTokenRef.current !== requestToken) return;
      setConversationId(response.conversationId);
      setInput('');
      setMessages(previous => [...previous, {
        id: String(response.messageId || `assistant-${Date.now()}`),
        sender: 'assistant',
        text: response.response,
        sources: response.sourceReferences || []
      }]);
    } catch (requestError) {
      if (requestTokenRef.current === requestToken) {
        setMessages(previous => previous.filter(message => message.id !== userMessageId));
        setError(getAIErrorMessage(requestError));
      }
    } finally {
      if (requestTokenRef.current === requestToken) setIsLoading(false);
    }
  };

  const openSourcePage = (page: number) => {
    onOpenPage(page);
    document.getElementById('publication-document')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="publication-ai-panel" aria-labelledby="publication-ai-title">
      <header className="publication-ai-panel__header">
        <p>{isFrench ? 'GALILEO AI' : 'GALILEO AI'}</p>
        <h2 id="publication-ai-title">{isFrench ? 'Comprendre ce document' : 'Understand this document'}</h2>
        <span>{isFrench ? 'Des réponses reliées au texte que vous lisez.' : 'Answers connected to the text you are reading.'}</span>
      </header>

      <section className="publication-ai-panel__suggestions" aria-label={isFrench ? 'Suggestions de questions' : 'Suggested questions'}>
        <p>{isFrench ? 'COMMENCER PAR' : 'START WITH'}</p>
        {prompts.map((prompt, index) => (
          <button type="button" key={prompt} onClick={() => void ask(prompt)} disabled={!isAuthenticated || isLoading}>
            <span aria-hidden="true">{['≡', '✳', '⌁', '▤'][index]}</span>
            {prompt}
          </button>
        ))}
      </section>

      <section className="publication-ai-panel__conversation" aria-live="polite" aria-busy={isLoading}>
        <p className="publication-ai-panel__section-label">{isFrench ? 'RÉPONSE DE L’ASSISTANT' : 'ASSISTANT RESPONSE'}</p>
        {messages.length === 0 ? (
          <div className="publication-ai-panel__empty">
            <h3>{isFrench ? 'Posez une question sur cette publication' : 'Ask a question about this publication'}</h3>
            <p>{isFrench ? 'Choisissez une suggestion ou posez votre question sur le texte.' : 'Choose a suggestion or ask your own question about the text.'}</p>
          </div>
        ) : (
          <div className="publication-ai-panel__messages">
            {messages.map(message => (
              <article className={`publication-ai-message publication-ai-message--${message.sender}`} key={message.id}>
                {message.sender === 'assistant' ? (
                  <FormattedAIMessage text={message.text} className="publication-ai-message__text" />
                ) : (
                  <p className="publication-ai-message__text">{message.text}</p>
                )}
                {message.sender === 'assistant' && message.sources && message.sources.some(source =>
                  Number.isInteger(source.pageNumber) && source.pageNumber > 0 && (!pageCount || source.pageNumber <= pageCount)
                ) ? (
                  <div className="publication-ai-message__sources">
                    {message.sources.filter(source =>
                      Number.isInteger(source.pageNumber) && source.pageNumber > 0 && (!pageCount || source.pageNumber <= pageCount)
                    ).map((source, index) => (
                      <article className="publication-ai-source" key={`${source.chunkId}-${index}`}>
                        <strong>{isFrench ? `SOURCE · PAGE ${source.pageNumber}` : `SOURCE · PAGE ${source.pageNumber}`}</strong>
                        <p>« {source.excerpt} »</p>
                        <button type="button" onClick={() => openSourcePage(source.pageNumber)}>
                          {isFrench ? `Ouvrir à la page ${source.pageNumber} ↗` : `Open page ${source.pageNumber} ↗`}
                        </button>
                      </article>
                    ))}
                  </div>
                ) : message.sender === 'assistant' ? (
                  <p className="publication-ai-message__no-source">
                    {message.sources?.length
                      ? (isFrench ? 'Les références reçues ne correspondent pas aux pages de ce PDF.' : 'The returned references do not match pages in this PDF.')
                      : (isFrench ? 'Aucune référence n’a été fournie pour cette réponse.' : 'No reference was provided for this answer.')}
                  </p>
                ) : null}
              </article>
            ))}
            {isLoading && <p className="publication-ai-panel__loading" role="status">{isFrench ? 'Réponse en cours…' : 'Generating response…'}</p>}
            <div ref={messageEndRef} />
          </div>
        )}
      </section>

      {!isAuthenticated ? (
        <div className="publication-ai-panel__signin">
          <p>{isFrench ? 'Connectez-vous pour interroger ce document.' : 'Sign in to ask questions about this document.'}</p>
          <NavLink to="/auth">{isFrench ? 'Se connecter' : 'Sign in'}</NavLink>
        </div>
      ) : (
        <form className="publication-ai-panel__composer" onSubmit={event => { event.preventDefault(); void ask(input); }}>
          {error && <p className="publication-ai-panel__error" role="alert">{error}</p>}
          <label className="sr-only" htmlFor="publication-ai-question">{isFrench ? 'Question sur le document' : 'Question about the document'}</label>
          <input
            id="publication-ai-question"
            type="text"
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder={isFrench ? 'Posez une question sur ce document…' : 'Ask a question about this document…'}
            disabled={isLoading}
          />
          <div className="publication-ai-panel__composer-footer">
            <span>{isFrench ? 'Sources si disponibles' : 'Sources when available'}</span>
            <button type="submit" disabled={isLoading || !input.trim()} aria-label={isFrench ? 'Envoyer la question' : 'Send question'} title={isFrench ? 'Envoyer' : 'Send'}>
              <span aria-hidden="true">↑</span>
            </button>
          </div>
          <small>{isFrench ? 'L’IA peut se tromper. Vérifiez toujours le document original.' : 'AI can make mistakes. Always check the original document.'}</small>
        </form>
      )}
    </aside>
  );
};

export default PublicationAIPanel;
