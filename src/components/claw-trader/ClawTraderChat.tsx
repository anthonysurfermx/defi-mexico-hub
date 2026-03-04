import React, { useState, useRef, useEffect, useCallback } from 'react';
import { parseChatIntent, type ChatIntent } from '@/lib/chat-intents';

// --- Types ---

interface OpportunityResult {
  market: {
    question: string;
    conditionId: string;
    slug: string;
    yesPrice: number;
    noPrice: number;
    volume: number;
    endDate: string;
  };
  analysis: {
    agentRate: number;
    smartMoneyDirection: 'Yes' | 'No' | 'Divided' | 'No Signal';
    smartMoneyPct: number;
    botCount: number;
    totalScanned: number;
    dominantStrategy: string;
    redFlags: string[];
    vpinScore: number | null;
    vpinClassification: string | null;
  };
  probability: {
    winProbability: number;
    recommendedSide: 'Yes' | 'No' | null;
    confidence: 'high' | 'medium' | 'low';
    edge: number;
    kellyFraction: number;
    smartMoneySize: number;
    breakdown: {
      marketImplied: number;
      agentAdjustment: number;
      vpinAdjustment: number;
      redFlagPenalty: number;
      marketImpact: number;
    };
  };
}

type ChatAttachment =
  | { type: 'opportunities'; data: OpportunityResult[] }
  | { type: 'deepAnalysis'; data: OpportunityResult }
  | { type: 'loading'; text: string }
  | { type: 'error'; text: string };

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  text: string;
  attachment?: ChatAttachment;
  streaming?: string;
  timestamp: number;
}

// --- Helpers ---

const CONFIDENCE_COLORS = {
  high: { border: 'border-green-500/30', bg: 'bg-green-500/5', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400' },
  medium: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
  low: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' },
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const WELCOME_MESSAGES: ChatMessage[] = [
  { id: 'sys1', role: 'system', text: '[SYS] Claw Trader Intelligence v2.0', timestamp: Date.now() },
  { id: 'sys2', role: 'system', text: '[SYS] 9-signal bot detection + VPIN + Smart Money + Kelly Criterion', timestamp: Date.now() },
  { id: 'sys3', role: 'system', text: '[SYS] Ready. Tell me your budget, target, and risk level.', timestamp: Date.now() },
  { id: 'sys4', role: 'system', text: '[SYS] Example: "Tengo $1,000 quiero ganar 5% con riesgo medio"', timestamp: Date.now() },
];

// --- Components ---

const OpportunityCard: React.FC<{ opp: OpportunityResult; index: number; onSelect: (n: number) => void }> = ({ opp, index, onSelect }) => {
  const c = CONFIDENCE_COLORS[opp.probability.confidence];
  const isTopPick = index === 0 && opp.probability.edge > 0;

  return (
    <div
      className={`border ${c.border} ${c.bg} px-3 py-2 cursor-pointer hover:brightness-110 transition-all`}
      onClick={() => onSelect(index + 1)}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-green-400/40">#{index + 1}</span>
        {isTopPick && (
          <span className="text-[8px] px-1 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30">
            BEST EDGE
          </span>
        )}
        <span className={`text-[8px] px-1 py-0.5 ${c.badge}`}>
          {opp.probability.confidence.toUpperCase()}
        </span>
      </div>
      <div className={`text-xs font-bold ${c.text} mb-1 leading-tight`}>
        "{opp.market.question}"
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
        <div>
          <span className="text-green-400/40">Side: </span>
          <span className={c.text}>{opp.probability.recommendedSide || 'N/A'}</span>
          <span className="text-green-400/30"> ({opp.probability.winProbability}% win)</span>
        </div>
        <div>
          <span className="text-green-400/40">Edge: </span>
          <span className={opp.probability.edge > 0 ? 'text-green-400' : 'text-red-400'}>
            {opp.probability.edge > 0 ? '+' : ''}{(opp.probability.edge * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-green-400/40">SM: </span>
          <span className="text-foreground">{opp.analysis.smartMoneyDirection} {opp.analysis.smartMoneyPct}%</span>
        </div>
        <div>
          <span className="text-green-400/40">VPIN: </span>
          <span className="text-foreground">
            {opp.analysis.vpinScore !== null ? `${Math.round(opp.analysis.vpinScore * 100)}%` : 'N/A'}
          </span>
          {opp.analysis.vpinClassification && (
            <span className="text-green-400/30"> ({opp.analysis.vpinClassification})</span>
          )}
        </div>
        <div>
          <span className="text-green-400/40">Bots: </span>
          <span className="text-foreground">{opp.analysis.botCount}/{opp.analysis.totalScanned}</span>
        </div>
        <div>
          <span className="text-green-400/40">Kelly: </span>
          <span className="text-cyan-400">${opp.probability.smartMoneySize}</span>
        </div>
      </div>
      {opp.analysis.redFlags.length > 0 && (
        <div className="mt-1 text-[9px] text-red-400/60">
          {'\u26A0'} {opp.analysis.redFlags[0]}
        </div>
      )}
      <div className="text-[8px] text-green-400/20 mt-1">
        Click or type #{index + 1} for deep analysis
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ text: string }> = ({ text }) => {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-3 py-2">
      <div className="flex gap-[2px] mb-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 bg-green-500/30 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
      <span className="text-[10px] text-green-400/60 animate-pulse">
        {text}{'.'.repeat(dots)}
      </span>
    </div>
  );
};

// --- Main Component ---

export const ClawTraderChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(WELCOME_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastOpportunities, setLastOpportunities] = useState<OpportunityResult[]>([]);
  const [lastAmount, setLastAmount] = useState(1000);
  const [lastRisk, setLastRisk] = useState('medium');
  const [lastQuery, setLastQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: genId(), timestamp: Date.now() }]);
  }, []);

  const updateLastMessage = useCallback((update: Partial<ChatMessage>) => {
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) updated[updated.length - 1] = { ...last, ...update };
      return updated;
    });
  }, []);

  // Stream AI explanation
  const streamExplanation = useCallback(async (context: string, data: any) => {
    addMessage({ role: 'assistant', text: '', streaming: '' });

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, data, language: 'auto' }),
      });

      if (!res.ok || !res.body) {
        updateLastMessage({ text: '[CLW] Analysis unavailable.', streaming: undefined });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              accumulated += parsed.text;
              updateLastMessage({ streaming: accumulated });
            }
          } catch { /* skip malformed */ }
        }
      }

      updateLastMessage({ text: accumulated, streaming: undefined });
    } catch {
      updateLastMessage({ text: '[CLW] Stream interrupted.', streaming: undefined });
    }
  }, [addMessage, updateLastMessage]);

  // Handle FIND_OPPORTUNITIES
  const handleFindOpportunities = useCallback(async (intent: ChatIntent) => {
    const amount = intent.amount || 1000;
    const risk = intent.risk || 'medium';
    const query = intent.query || 'bitcoin';

    setLastAmount(amount);
    setLastRisk(risk);
    setLastQuery(query);

    addMessage({
      role: 'assistant',
      text: `[CLW] Scanning markets for $${amount.toLocaleString()}, ${risk} risk...`,
      attachment: { type: 'loading', text: `Scanning "${query}" markets, analyzing holders, computing VPIN` },
    });

    try {
      const res = await fetch(`/api/chat-analyze?query=${encodeURIComponent(query)}&amount=${amount}&risk=${risk}`);
      const data = await res.json();

      if (!data.ok || !data.opportunities || data.opportunities.length === 0) {
        updateLastMessage({
          text: `[CLW] No opportunities found for "${query}". Try: bitcoin, trump, nba, ethereum...`,
          attachment: { type: 'error', text: data.message || 'No markets found' },
        });
        return;
      }

      const opps = data.opportunities as OpportunityResult[];
      setLastOpportunities(opps);

      updateLastMessage({
        text: `[CLW] Found ${opps.length} opportunit${opps.length === 1 ? 'y' : 'ies'} in ${(data.scanTime / 1000).toFixed(1)}s`,
        attachment: { type: 'opportunities', data: opps },
      });

      // Stream AI explanation
      await streamExplanation('chat-opportunity', {
        opportunities: opps,
        amount,
        risk,
        userQuery: intent.raw,
      });
    } catch (err) {
      updateLastMessage({
        text: '[CLW] Analysis failed. Please try again.',
        attachment: { type: 'error', text: String(err) },
      });
    }
  }, [addMessage, updateLastMessage, streamExplanation]);

  // Handle ANALYZE_MARKET (#1, #2, etc)
  const handleAnalyzeMarket = useCallback(async (intent: ChatIntent) => {
    const ref = (intent.marketRef || 1) - 1;
    if (ref < 0 || ref >= lastOpportunities.length) {
      addMessage({
        role: 'assistant',
        text: `[CLW] No market #${ref + 1} found. Available: #1-${lastOpportunities.length}`,
      });
      return;
    }

    const opp = lastOpportunities[ref];
    addMessage({
      role: 'assistant',
      text: `[CLW] Deep analyzing "${opp.market.question}"...`,
      attachment: { type: 'loading', text: 'Running 9-signal engine on top holders' },
    });

    // Update to show the deep analysis card
    updateLastMessage({
      text: `[CLW] Deep analysis: "${opp.market.question}"`,
      attachment: { type: 'deepAnalysis', data: opp },
    });

    // Stream AI explanation
    await streamExplanation('chat-deep-analysis', {
      market: opp.market,
      probability: opp.probability,
      analysis: opp.analysis,
      amount: lastAmount,
      userQuery: intent.raw,
    });
  }, [lastOpportunities, lastAmount, addMessage, updateLastMessage, streamExplanation]);

  // Handle SEARCH_MARKET
  const handleSearchMarket = useCallback(async (intent: ChatIntent) => {
    const searchIntent: ChatIntent = {
      ...intent,
      type: 'FIND_OPPORTUNITIES',
      amount: lastAmount,
      risk: (intent.risk || lastRisk) as 'low' | 'medium' | 'high',
      query: intent.query || intent.raw,
    };
    await handleFindOpportunities(searchIntent);
  }, [lastAmount, lastRisk, handleFindOpportunities]);

  // Handle send
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    addMessage({ role: 'user', text: `[YOU] ${text}` });
    setIsLoading(true);

    const intent = parseChatIntent(text);

    try {
      switch (intent.type) {
        case 'FIND_OPPORTUNITIES':
          await handleFindOpportunities(intent);
          break;
        case 'ANALYZE_MARKET':
          await handleAnalyzeMarket(intent);
          break;
        case 'SEARCH_MARKET':
          await handleSearchMarket(intent);
          break;
        case 'HELP':
          addMessage({
            role: 'assistant',
            text: `[CLW] I can help you find trading opportunities on Polymarket.

> Tell me your budget and target:
>   "Tengo $1,000 quiero ganar 5% con riesgo medio"
>   "I have $500, low risk"
>
> Search markets:
>   "bitcoin", "trump", "nba", "ethereum"
>
> Deep analyze a result:
>   "#1" or "dime más sobre el primero"
>
> I'll scan markets, detect bots, compute VPIN,
> and size your position with Kelly Criterion.`,
          });
          break;
        default:
          // Treat as search
          await handleSearchMarket({ ...intent, query: text });
          break;
      }
    } catch {
      addMessage({ role: 'assistant', text: '[CLW] Something went wrong. Try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, addMessage, handleFindOpportunities, handleAnalyzeMarket, handleSearchMarket]);

  const handleSelectOpportunity = useCallback((n: number) => {
    if (isLoading) return;
    setInput(`#${n}`);
    // Auto-send
    addMessage({ role: 'user', text: `[YOU] #${n}` });
    setIsLoading(true);
    handleAnalyzeMarket({ type: 'ANALYZE_MARKET', marketRef: n, raw: `#${n}` }).finally(() => setIsLoading(false));
    setInput('');
  }, [isLoading, addMessage, handleAnalyzeMarket]);

  return (
    <div className="border border-green-500/20 bg-black/60 overflow-hidden font-mono flex flex-col h-[calc(100vh-12rem)]">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border-b border-green-500/20 shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-green-400 text-[10px]">
          claw-trader --chat --intelligence-engine
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[8px] text-green-400/30">9-signal</span>
          <span className="text-[8px] text-cyan-400/30">VPIN</span>
          <span className="text-[8px] text-amber-400/30">Kelly</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin scrollbar-thumb-green-500/10">
        {messages.map((msg) => (
          <div key={msg.id}>
            {/* Text */}
            {msg.text && (
              <div className={`text-[11px] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'system' ? 'text-green-400/40' :
                msg.role === 'user' ? 'text-cyan-400' :
                'text-green-400/80'
              }`}>
                {msg.role === 'assistant' && !msg.text.startsWith('[CLW]') && !msg.text.startsWith('>') ? (
                  // Streaming/AI text — render with > prefix per line
                  msg.text.split('\n').map((line, i) => (
                    <div key={i}>
                      <span className="text-green-400/30">{'> '}</span>{line}
                    </div>
                  ))
                ) : (
                  msg.text
                )}
              </div>
            )}

            {/* Streaming text */}
            {msg.streaming !== undefined && msg.streaming.length > 0 && (
              <div className="text-[11px] text-green-400/80 leading-relaxed whitespace-pre-wrap">
                {msg.streaming.split('\n').map((line, i) => (
                  <div key={i}>
                    <span className="text-green-400/30">{'> '}</span>{line}
                  </div>
                ))}
                <span className="inline-block w-1.5 h-3 bg-green-400/60 animate-pulse ml-0.5" />
              </div>
            )}

            {/* Loading attachment */}
            {msg.attachment?.type === 'loading' && (
              <ProgressBar text={msg.attachment.text} />
            )}

            {/* Error attachment */}
            {msg.attachment?.type === 'error' && (
              <div className="text-[10px] text-red-400/60 pl-2 border-l border-red-500/20">
                {msg.attachment.text}
              </div>
            )}

            {/* Opportunities */}
            {msg.attachment?.type === 'opportunities' && (
              <div className="space-y-2 mt-2">
                {msg.attachment.data.map((opp, i) => (
                  <OpportunityCard
                    key={opp.market.conditionId}
                    opp={opp}
                    index={i}
                    onSelect={handleSelectOpportunity}
                  />
                ))}
                <div className="text-[9px] text-green-400/30 pl-2">
                  Type # number for deep analysis, or search another market
                </div>
              </div>
            )}

            {/* Deep Analysis */}
            {msg.attachment?.type === 'deepAnalysis' && (
              <div className="mt-2 border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 space-y-1">
                <div className="text-[10px] text-cyan-400/40 uppercase">Probability Breakdown</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                  <div>
                    <span className="text-cyan-400/40">Market Implied: </span>
                    <span className="text-foreground">{msg.attachment.data.probability.breakdown.marketImplied}%</span>
                  </div>
                  <div>
                    <span className="text-cyan-400/40">Agent Adj: </span>
                    <span className={msg.attachment.data.probability.breakdown.agentAdjustment > 0 ? 'text-green-400' : msg.attachment.data.probability.breakdown.agentAdjustment < 0 ? 'text-red-400' : 'text-foreground'}>
                      {msg.attachment.data.probability.breakdown.agentAdjustment > 0 ? '+' : ''}{msg.attachment.data.probability.breakdown.agentAdjustment}%
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan-400/40">VPIN Adj: </span>
                    <span className={msg.attachment.data.probability.breakdown.vpinAdjustment > 0 ? 'text-green-400' : msg.attachment.data.probability.breakdown.vpinAdjustment < 0 ? 'text-red-400' : 'text-foreground'}>
                      {msg.attachment.data.probability.breakdown.vpinAdjustment > 0 ? '+' : ''}{msg.attachment.data.probability.breakdown.vpinAdjustment}%
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan-400/40">Red Flag: </span>
                    <span className={msg.attachment.data.probability.breakdown.redFlagPenalty < 0 ? 'text-red-400' : 'text-foreground'}>
                      {msg.attachment.data.probability.breakdown.redFlagPenalty}%
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan-400/40">Mkt Impact: </span>
                    <span className={msg.attachment.data.probability.breakdown.marketImpact < 0 ? 'text-red-400' : 'text-foreground'}>
                      {msg.attachment.data.probability.breakdown.marketImpact}%
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan-400/40">Final: </span>
                    <span className="text-cyan-400 font-bold">{msg.attachment.data.probability.winProbability}%</span>
                  </div>
                </div>
                {msg.attachment.data.analysis.redFlags.length > 0 && (
                  <div className="text-[9px] text-red-400/60 border-t border-cyan-500/10 pt-1 mt-1">
                    {msg.attachment.data.analysis.redFlags.map((f, i) => (
                      <div key={i}>{'\u26A0'} {f}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 bg-green-500/5 border-t border-green-500/20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-green-400/40 text-[11px]">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            placeholder={isLoading ? 'Analyzing...' : 'Tengo $1,000 quiero ganar 5% con riesgo medio'}
            className="flex-1 bg-transparent text-green-400 text-[11px] outline-none placeholder:text-green-400/20 disabled:opacity-50"
          />
          {isLoading && (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};
