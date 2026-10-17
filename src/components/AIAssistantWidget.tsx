import React, { useState, useEffect, useRef } from 'react';
import { aiService, type AIMode, type SourceReference } from '../services/aiService';

interface AIAssistantWidgetProps {
  publicationId?: number;
  publicationTitle?: string;
  initialMode?: AIMode;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  mode?: AIMode;
  sources?: SourceReference[];
  timestamp: string;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  publicationId,
  publicationTitle,
  initialMode = 'DOCUMENT',
  isOpen,
  onClose
}) => {
  const [mode, setMode] = useState<AIMode>(initialMode);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: publicationTitle
        ? `Bonjour ! Je suis l'Assistant IA Galileo. Je suis prêt à analyser le document « ${publicationTitle} » avec vous. Posez-moi vos questions ou choisissez une synthèse ci-dessous.`
        : "Bonjour ! Je suis l'Assistant IA Galileo. Comment puis-je vous accompagner dans vos recherches aujourd'hui ?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (customMessage?: string) => {
    const textToSend = (customMessage || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMessage) setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage({
        conversationId,
        publicationId,
        mode,
        message: textToSend
      });

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: response.response,
        mode: response.mode,
        sources: response.sourceReferences,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: "Désolé, une erreur est survenue lors de la communication avec l'IA. Veuillez vérifier vos accès ou réessayer dans un instant.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSummary = async (type: 'QUICK' | 'STRUCTURED' | 'EDUCATIONAL') => {
    if (!publicationId || isLoading) return;
    setIsLoading(true);

    const promptText = type === 'QUICK' ? 'Générer un résumé rapide (3-5 points)' :
      type === 'STRUCTURED' ? 'Générer un résumé structuré (Contexte, Méthodes, Résultats)' :
      'Générer une explication pédagogique accessible';

    setMessages(prev => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'user',
        text: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      const res = await aiService.summarizePublication({
        publicationId,
        summaryType: type,
        language: 'fr'
      });

      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: res.content + (res.fromCache ? '\n\n*(Synthèse optimisée servie depuis le cache académique)*' : ''),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: "Impossible de générer le résumé pour le moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white dark:bg-navy-dark shadow-2xl border-l border-light-border dark:border-dark-border flex flex-col backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-light-border dark:border-dark-border flex items-center justify-between bg-light-card/80 dark:bg-navy/80">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-light-accent to-teal flex items-center justify-center text-white font-bold shadow-md">
            ✨
          </div>
          <div>
            <h3 className="font-poppins font-bold text-light-text dark:text-off-white text-base">Assistant IA Galileo</h3>
            <p className="text-xs text-light-text-secondary dark:text-gray-400">DeepSeek RAG & Qwen 1024D</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy transition-colors"
          title="Fermer"
        >
          ✕
        </button>
      </div>

      {/* Mode Selector */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-navy/40 border-b border-light-border dark:border-dark-border flex items-center space-x-1 overflow-x-auto text-xs">
        <span className="text-gray-500 font-medium mr-1">Mode:</span>
        {(['DOCUMENT', 'GENERAL', 'RESEARCH', 'LEARNING'] as AIMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === m
                ? 'bg-light-accent dark:bg-teal text-white dark:text-navy shadow-sm'
                : 'text-light-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy'
            }`}
          >
            {m === 'DOCUMENT' ? '📄 Document' :
             m === 'GENERAL' ? '🌐 Général' :
             m === 'RESEARCH' ? '🔬 Recherche' : '🎓 Pédagogie'}
          </button>
        ))}
      </div>

      {/* Mandatory AI Disclaimer Notice */}
      <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
        <span className="flex-shrink-0">⚠️</span>
        <p>Contenu généré par l'IA DeepSeek. Les extraits cités proviennent du texte indexé. Vérifiez systématiquement les sources.</p>
      </div>

      {/* Quick Action Chips (Document mode only) */}
      {publicationId && mode === 'DOCUMENT' && (
        <div className="px-3 py-2 bg-light-card/40 dark:bg-navy/30 border-b border-light-border dark:border-dark-border flex flex-wrap gap-1.5">
          <button
            onClick={() => handleQuickSummary('QUICK')}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal hover:bg-light-accent/20 dark:hover:bg-teal/20 transition-colors font-medium disabled:opacity-50"
          >
            ⚡ Résumé rapide
          </button>
          <button
            onClick={() => handleQuickSummary('STRUCTURED')}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal hover:bg-light-accent/20 dark:hover:bg-teal/20 transition-colors font-medium disabled:opacity-50"
          >
            📋 Résumé structuré
          </button>
          <button
            onClick={() => handleQuickSummary('EDUCATIONAL')}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal hover:bg-light-accent/20 dark:hover:bg-teal/20 transition-colors font-medium disabled:opacity-50"
          >
            🎓 Pédagogique
          </button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm text-sm ${
                msg.sender === 'user'
                  ? 'bg-light-accent dark:bg-teal text-white dark:text-navy rounded-br-none'
                  : 'bg-gray-100 dark:bg-navy/70 text-light-text dark:text-off-white border border-light-border dark:border-dark-border rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

              {/* Citations / Source References */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-dark-border/60 text-xs">
                  <div className="font-semibold text-light-accent dark:text-teal mb-1 flex items-center space-x-1">
                    <span>📖 Sources et références :</span>
                  </div>
                  <div className="space-y-1">
                    {msg.sources.map((src, i) => (
                      <div key={i} className="bg-white/50 dark:bg-navy/90 p-1.5 rounded border border-light-border dark:border-dark-border/40 text-[11px]">
                        <span className="font-bold text-light-accent dark:text-teal">Page {src.pageNumber} : </span>
                        <span className="italic text-light-text-secondary dark:text-gray-300">« {src.excerpt} »</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-light-accent dark:text-teal text-xs p-2">
            <div className="w-2 h-2 rounded-full bg-light-accent dark:teal animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-light-accent dark:teal animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-light-accent dark:teal animate-bounce [animation-delay:0.4s]" />
            <span className="text-gray-500 text-[11px]">Analyse vectorielle et génération...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-light-border dark:border-dark-border bg-white dark:bg-navy-dark">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              mode === 'DOCUMENT'
                ? 'Posez une question sur ce document...'
                : 'Posez votre question académique...'
            }
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-light-border dark:border-dark-border bg-gray-50 dark:bg-navy text-light-text dark:text-off-white focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-light-accent dark:bg-teal text-white dark:text-navy rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistantWidget;
