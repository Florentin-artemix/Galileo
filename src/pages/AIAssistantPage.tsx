import React, { useState, useEffect, useRef } from 'react';
import { aiService, type AIMode, type SourceReference } from '../services/aiService';
import { publicationsService, type PublicationDTO } from '../services/publicationsService';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  mode?: AIMode;
  sources?: SourceReference[];
  timestamp: string;
}

const AIAssistantPage: React.FC = () => {
  const [mode, setMode] = useState<AIMode>('GENERAL');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Bienvenue dans l'espace Assistant IA Galileo propulsé par DeepSeek et l'index vectoriel Qwen (1024D). Choisissez un mode ci-dessus pour explorer les publications académiques, synthétiser des travaux ou formuler vos questions scientifiques.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [selectedPublicationId, setSelectedPublicationId] = useState<number | undefined>(undefined);
  const [explainText, setExplainText] = useState('');
  const [explainLevel, setExplainLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'>('INTERMEDIATE');
  const [explainResult, setExplainResult] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'EXPLAIN' | 'COMPARE'>('CHAT');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPublications = async () => {
      try {
        const res = await publicationsService.getPublications(0, 50);
        setPublications(res.content || []);
      } catch (err) {
        console.error('Failed to load publications for AI assistant', err);
      }
    };
    loadPublications();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage({
        mode,
        publicationId: selectedPublicationId,
        message: textToSend
      });

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: response.response,
        mode: response.mode,
        sources: response.sourceReferences,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: "Désolé, une erreur est survenue lors du traitement de votre requête. Veuillez vérifier vos accès et réessayer.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!explainText.trim() || isExplaining) return;
    setIsExplaining(true);
    setExplainResult(null);

    try {
      const res = await aiService.explainPassage({
        text: explainText.trim(),
        level: explainLevel,
        publicationId: selectedPublicationId
      });
      setExplainResult(res.explanation);
    } catch (err) {
      setExplainResult("Erreur lors de la génération de l'explication.");
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl animate-fade-in">
      {/* Page Title & Subtitle */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="text-3xl">✨</span>
            <h1 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white">
              Assistant IA Académique
            </h1>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-gray-400">
            Génération DeepSeek & Indexation sémantique Qwen text-embedding-v4 (1024D)
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-light-card dark:bg-navy/60 p-1 rounded-xl border border-light-border dark:border-dark-border">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'CHAT'
                ? 'bg-light-accent dark:bg-teal text-white dark:text-navy shadow'
                : 'text-light-text-secondary dark:text-gray-400 hover:text-light-text dark:hover:text-off-white'
            }`}
          >
            💬 Discussion RAG
          </button>
          <button
            onClick={() => setActiveTab('EXPLAIN')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'EXPLAIN'
                ? 'bg-light-accent dark:bg-teal text-white dark:text-navy shadow'
                : 'text-light-text-secondary dark:text-gray-400 hover:text-light-text dark:hover:text-off-white'
            }`}
          >
            🔍 Explication de passage
          </button>
        </div>
      </div>

      {/* Mandatory AI Disclaimer Banner */}
      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start space-x-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div className="text-xs md:text-sm">
          <strong>Avertissement éditorial Galileo :</strong> Les réponses fournies par l'Assistant IA Galileo sont générées par le modèle DeepSeek à partir des extraits indexés. Ces informations d'assistance ne se substituent pas à une lecture critique et doivent être vérifiées auprès des publications académiques originales.
        </div>
      </div>

      {activeTab === 'CHAT' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Context & Modes */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-2xl bg-light-card dark:bg-navy/40 border border-light-border dark:border-dark-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-light-accent dark:text-teal mb-3">
                Modes de Raisonnement
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'GENERAL' as AIMode, label: '🌐 Général', desc: 'Questions ouvertes et culture scientifique' },
                  { key: 'DOCUMENT' as AIMode, label: '📄 Document RAG', desc: 'Analyse ciblée avec citations de pages' },
                  { key: 'RESEARCH' as AIMode, label: '🔬 Recherche', desc: "État de l'art et méthodologie" },
                  { key: 'LEARNING' as AIMode, label: '🎓 Apprentissage', desc: 'Pédagogie et révision structurée' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setMode(item.key)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      mode === item.key
                        ? 'bg-light-accent/10 dark:bg-teal/15 border-light-accent dark:border-teal text-light-accent dark:text-teal font-semibold'
                        : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy/80'
                    }`}
                  >
                    <div className="text-sm font-bold">{item.label}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Context Selector */}
            <div className="p-4 rounded-2xl bg-light-card dark:bg-navy/40 border border-light-border dark:border-dark-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-light-accent dark:text-teal mb-2">
                Document de Référence
              </h3>
              <select
                value={selectedPublicationId || ''}
                onChange={e => setSelectedPublicationId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs p-2.5 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-navy text-light-text dark:text-off-white focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal"
              >
                <option value="">-- Aucun document spécifique --</option>
                {publications.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.titre}
                  </option>
                ))}
              </select>
              {selectedPublicationId && (
                <p className="text-[11px] text-green-600 dark:text-teal mt-2">
                  ✓ Contexte actif : les réponses citeront ce document.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Chat Box */}
          <div className="lg:col-span-3 flex flex-col h-[650px] bg-light-card dark:bg-navy/40 border border-light-border dark:border-dark-border rounded-2xl shadow-xl overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm ${
                      msg.sender === 'user'
                        ? 'bg-light-accent dark:bg-teal text-white dark:text-navy rounded-br-none'
                        : 'bg-white dark:bg-navy/80 text-light-text dark:text-off-white border border-light-border dark:border-dark-border rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                    {/* Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-border/60 text-xs">
                        <div className="font-semibold text-light-accent dark:text-teal mb-1 flex items-center space-x-1">
                          <span>📖 Extraits sources vérifiés :</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.sources.map((src, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-navy p-2 rounded-lg border border-light-border dark:border-dark-border/40 text-[11px]">
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
                <div className="flex items-center space-x-2 text-light-accent dark:text-teal text-xs p-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-light-accent dark:bg-teal animate-bounce" />
                  <div className="w-2.5 h-2.5 rounded-full bg-light-accent dark:bg-teal animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-light-accent dark:bg-teal animate-bounce [animation-delay:0.4s]" />
                  <span className="text-gray-500 text-xs">Recherche RAG & Génération DeepSeek...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-light-border dark:border-dark-border bg-white dark:bg-navy">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={
                    selectedPublicationId
                      ? 'Interrogez l\'IA sur le document sélectionné...'
                      : 'Posez votre question académique ou méthodologique...'
                  }
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl border border-light-border dark:border-dark-border bg-gray-50 dark:bg-navy-dark text-light-text dark:text-off-white focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal text-sm"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-light-accent dark:bg-teal text-white dark:text-navy rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 shadow-md"
                >
                  Envoyer
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'EXPLAIN' && (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-light-card dark:bg-navy/40 border border-light-border dark:border-dark-border rounded-2xl shadow-xl">
          <h2 className="text-2xl font-poppins font-bold text-light-text dark:text-off-white mb-2">
            Explicateur Pédagogique Multi-Niveaux
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-6">
            Collez un extrait ou formule mathématique complexe. L'IA DeepSeek le vulgarise selon le niveau souhaité.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-gray-400 mb-2">
                Niveau d'explication
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { level: 'BEGINNER' as const, label: '🌱 Débutant', desc: 'Pédagogique, analogies simples' },
                  { level: 'INTERMEDIATE' as const, label: '📚 Intermédiaire', desc: 'Étudiant universitaire' },
                  { level: 'EXPERT' as const, label: '🔬 Expert', desc: 'Rigueur formelle et théorique' }
                ].map(opt => (
                  <button
                    key={opt.level}
                    type="button"
                    onClick={() => setExplainLevel(opt.level)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      explainLevel === opt.level
                        ? 'bg-light-accent/10 dark:bg-teal/20 border-light-accent dark:border-teal text-light-accent dark:text-teal font-bold'
                        : 'border-light-border dark:border-dark-border text-light-text-secondary dark:text-gray-400'
                    }`}
                  >
                    <div className="text-sm">{opt.label}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-gray-400 mb-2">
                Extrait à expliciter
              </label>
              <textarea
                rows={4}
                value={explainText}
                onChange={e => setExplainText(e.target.value)}
                placeholder="Ex : L'algorithme de descente de gradient stochastique ajuste les hyperparamètres..."
                className="w-full p-4 rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-navy text-light-text dark:text-off-white text-sm focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal"
              />
            </div>

            <button
              onClick={handleExplain}
              disabled={isExplaining || !explainText.trim()}
              className="w-full py-3 bg-light-accent dark:bg-teal text-white dark:text-navy rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 shadow-md"
            >
              {isExplaining ? 'Génération de l\'explication...' : 'Expliquer le passage'}
            </button>

            {explainResult && (
              <div className="mt-6 p-5 rounded-xl bg-white dark:bg-navy border border-light-border dark:border-dark-border">
                <h4 className="text-sm font-bold text-light-accent dark:text-teal mb-2">
                  Explication ({explainLevel}) :
                </h4>
                <p className="text-sm text-light-text dark:text-off-white leading-relaxed whitespace-pre-wrap">
                  {explainResult}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPage;
