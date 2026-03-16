// ============================================================
// BobbyChat — Bobby Axelrod-style trading CIO with real market data
// Price queries, inline charts, smart NLP, on-chain execution
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, ArrowLeft, Activity, Settings, Wallet, TrendingUp, TrendingDown, Volume2, VolumeX, Mic, MicOff, Square, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { AdvisorSetup, useAdvisorProfile } from '@/components/agent-radar/AdvisorSetup';
import type { AdvisorProfile } from '@/components/agent-radar/AdvisorSetup';
import { fetchTickers, fetchMarketDetail, formatVolume, type OKXTicker } from '@/services/okx-market.service';
import { SwapConfirm, type TradeExecution } from './SwapConfirm';
import { VoiceOrb, type OrbState } from './VoiceOrb';
import { IntelligenceFeed, type DebateData, type MetacognitionData, type SignalData, type PolyData } from './IntelligenceFeed';
import { useBobbyVoice } from '@/hooks/useBobbyVoice';
import { useAuth } from '@/hooks/useAuth';

// ---- Supabase ----

const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4';

interface DBMessage {
  id: string;
  wallet_address: string;
  advisor_name: string;
  message: string;
  created_at: string;
  read: boolean;
}

async function fetchDBMessages(wallet: string): Promise<DBMessage[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/agent_messages?wallet_address=eq.${wallet}&order=created_at.asc&limit=50`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

// ---- Token symbol detection ----

const TOKEN_MAP: Record<string, string> = {
  btc: 'BTC-USDT', bitcoin: 'BTC-USDT',
  eth: 'ETH-USDT', ethereum: 'ETH-USDT', ether: 'ETH-USDT',
  sol: 'SOL-USDT', solana: 'SOL-USDT',
  okb: 'OKB-USDT',
  matic: 'MATIC-USDT', polygon: 'MATIC-USDT',
  // Commodities — Bobby is a Macro-Sovereign Agent
  gold: 'XAUT-USDT', oro: 'XAUT-USDT', xaut: 'XAUT-USDT', xau: 'XAUT-USDT',
  paxg: 'PAXG-USDT', 'pax gold': 'PAXG-USDT',
  silver: 'XAG-USDT-SWAP', plata: 'XAG-USDT-SWAP', xag: 'XAG-USDT-SWAP',
};

function detectTokens(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [key, instId] of Object.entries(TOKEN_MAP)) {
    // Word boundary match
    if (new RegExp(`\\b${key}\\b`).test(lower) && !found.includes(instId)) {
      found.push(instId);
    }
  }
  return found;
}

// ---- Interest tag auto-save ----
// Bobby silently saves what assets the user is watching to user_interests
async function saveInterestTags(wallet: string, tokens: string[], context: string) {
  if (!wallet || tokens.length === 0) return;
  for (const instId of tokens) {
    const asset = instId.split('-')[0]; // BTC-USDT → BTC
    try {
      // Check if interest already exists
      const checkRes = await fetch(
        `${SB_URL}/rest/v1/user_interests?wallet_address=eq.${wallet}&asset=eq.${asset}&active=eq.true&select=id`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        // Update context timestamp — user is still interested
        await fetch(`${SB_URL}/rest/v1/user_interests?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          headers: {
            apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json', Prefer: 'return=minimal',
          },
          body: JSON.stringify({ context, target_threshold: 0.75 }),
        });
      } else {
        // Insert new interest
        await fetch(`${SB_URL}/rest/v1/user_interests`, {
          method: 'POST',
          headers: {
            apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json', Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            wallet_address: wallet,
            asset,
            context,
            target_threshold: 0.75,
            active: true,
          }),
        });
      }
    } catch { /* silent — don't block chat for interest tracking */ }
  }
}

function detectIntent(text: string): 'price' | 'analyze' | 'portfolio' | 'trending' | 'prices_all' | 'help' | 'chat' {
  const l = text.toLowerCase();

  // Conversational / opinion questions → always go to OpenClaw (Bobby's brain)
  // "qué opinas", "what do you think", "crees que", "deberíamos", "tell me about", etc.
  if (/\b(opin|piens|crees|think|deberi|should|recomiend|recommend|tell me|dime|explica|explain|por ?qu[eé]|why|como ves|how do you see|que onda|what.?s your|cual es tu)\b/i.test(l)) return 'chat';

  if (/\b(pric|precio|coti|cuanto|how much|what.?s .* at|dame .* precio|give me|show me)\b/i.test(l)) return 'price';
  if (/\b(analyz|analiz|scan|escan|run|ejecut)\b/i.test(l)) return 'analyze';
  if (/\b(portfolio|position|posicion|balance|cartera|wallet)\b/i.test(l)) return 'portfolio';
  if (/\b(trend|trending|hot|popular|whats up|que hay)\b/i.test(l)) return 'trending';
  if (/\b(prices|precios|all|todos|overview|resumen)\b/i.test(l)) return 'prices_all';
  if (/\b(help|ayuda|command)\b/i.test(l)) return 'help';
  // If tokens detected but it's a longer sentence, route to chat for Bobby's analysis
  // Short inputs like "BTC" or "ETH SOL" → price; longer questions → Bobby's brain
  if (detectTokens(text).length > 0) {
    return l.split(/\s+/).length <= 3 ? 'price' : 'chat';
  }
  return 'chat';
}

// ---- Chat message types ----

interface PriceCard {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  funding?: { rate: number; annualized: number } | null;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'advisor';
  text: string;
  timestamp: number;
  isLive?: boolean;
  trades?: TradeExecution[];
  prices?: PriceCard[];
  debate?: DebateData;
  metacognition?: MetacognitionData;
  topSignals?: SignalData[];
  polymarket?: PolyData[];
}

// ---- Typewriter ----

function Typewriter({ text, speed = 8, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastRef = useRef(0);

  const skip = useCallback(() => {
    if (!done) { setDisplayed(text); setDone(true); onDone?.(); }
  }, [done, text, onDone]);

  useEffect(() => {
    idxRef.current = 0;
    lastRef.current = 0;
    setDisplayed('');
    setDone(false);
    const step = (ts: number) => {
      if (!lastRef.current) lastRef.current = ts;
      const elapsed = ts - lastRef.current;
      if (elapsed >= speed) {
        const next = Math.min(idxRef.current + Math.min(Math.floor(elapsed / speed), 4), text.length);
        idxRef.current = next;
        lastRef.current = ts;
        setDisplayed(text.slice(0, next));
        if (next >= text.length) { setDone(true); onDone?.(); return; }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, speed, onDone]);

  return (
    <span onClick={skip} className="cursor-pointer">
      {displayed}
      {!done && <span className="inline-block w-[5px] h-[13px] bg-green-400 ml-[1px] align-middle animate-pulse" />}
    </span>
  );
}

// ---- Helpers ----

function timeStr(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

// ---- Inline Price Card ----

function InlinePriceCard({ price, highlighted }: { price: PriceCard; highlighted?: boolean }) {
  const isUp = price.change24h >= 0;
  return (
    <div className={`border rounded-lg p-3 font-mono text-[11px] transition-all duration-500 ${
      highlighted
        ? 'border-green-500/40 bg-green-500/[0.06] shadow-[0_0_20px_rgba(34,197,94,0.15)]'
        : 'border-neutral-700/50 bg-neutral-900/50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-white">{price.symbol}</span>
          <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${
            isUp ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
          }`}>
            {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {isUp ? '+' : ''}{price.change24h.toFixed(2)}%
          </span>
        </div>
        <span className="text-[15px] font-bold text-white">${fmtPrice(price.price)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-neutral-500">
        <div>
          <div className="text-[9px] text-neutral-600 uppercase">24h High</div>
          <div className="text-neutral-400">${fmtPrice(price.high24h)}</div>
        </div>
        <div>
          <div className="text-[9px] text-neutral-600 uppercase">24h Low</div>
          <div className="text-neutral-400">${fmtPrice(price.low24h)}</div>
        </div>
        <div>
          <div className="text-[9px] text-neutral-600 uppercase">Volume</div>
          <div className="text-neutral-400">{formatVolume(price.vol24h)}</div>
        </div>
      </div>
      {price.funding && (
        <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center gap-3">
          <span className="text-neutral-600">Funding:</span>
          <span className={price.funding.rate > 0 ? 'text-green-400' : 'text-red-400'}>
            {(price.funding.rate * 100).toFixed(4)}%
          </span>
          <span className="text-neutral-600">({price.funding.annualized.toFixed(1)}% APR)</span>
        </div>
      )}
    </div>
  );
}

// ---- Chat Bubble ----

function ChatBubble({ msg, advisorName, isLatest, walletAddress }: { msg: ChatMsg; advisorName: string; isLatest: boolean; walletAddress?: string }) {
  const isUser = msg.role === 'user';
  const initial = advisorName.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'items-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 border border-green-500/20 bg-green-500/5 flex items-center justify-center flex-shrink-0 mt-5">
          <span className="text-[10px] font-bold text-green-400">{initial}</span>
        </div>
      )}

      <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="text-[9px] font-bold font-mono tracking-[1.5px] mb-1 px-0.5 text-white/30">
          {isUser ? 'YOU' : advisorName.toUpperCase()}
        </span>

        <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
          isUser
            ? 'bg-white text-black'
            : 'border border-green-500/15 bg-green-500/[0.04] text-green-200/90 font-mono text-[12px]'
        }`}>
          {!isUser && isLatest && msg.isLive !== false ? (
            <Typewriter text={msg.text} speed={6} />
          ) : (
            msg.text
          )}
        </div>

        {/* Inline price cards */}
        {msg.prices && msg.prices.length > 0 && (
          <div className="mt-2 space-y-2 w-full">
            {msg.prices.map((p, i) => (
              <InlinePriceCard key={i} price={p} />
            ))}
          </div>
        )}

        {/* Trade execution cards */}
        {msg.trades && msg.trades.length > 0 && (
          <div className="mt-2 space-y-2 w-full">
            {msg.trades.map((trade, i) => (
              <SwapConfirm key={i} trade={trade} walletAddress={walletAddress} />
            ))}
          </div>
        )}

        <span className="text-[9px] text-white/15 mt-0.5 px-0.5 font-mono">
          {timeStr(msg.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

// ---- Live Analysis Phase Bubble ----

function LiveAnalysisBubble({ phases, advisorName }: { phases: string[]; advisorName: string }) {
  const initial = advisorName.charAt(0).toUpperCase();
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 items-start">
      <div className="w-7 h-7 border border-green-500/20 bg-green-500/5 flex items-center justify-center flex-shrink-0 mt-5">
        <span className="text-[10px] font-bold text-green-400">{initial}</span>
      </div>
      <div className="max-w-[85%] flex flex-col items-start">
        <span className="text-[9px] font-bold font-mono tracking-[1.5px] mb-1 px-0.5 text-white/30">{advisorName.toUpperCase()}</span>
        <div className="border border-green-500/15 bg-green-500/[0.04] px-3.5 py-2.5 font-mono text-[11px] space-y-1">
          {phases.map((phase, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="flex items-start gap-1.5">
              <span className={i === phases.length - 1 ? 'text-green-400' : 'text-green-500/50'}>{i === phases.length - 1 ? '>' : '+'}</span>
              <span className={i === phases.length - 1 ? 'text-green-300' : 'text-green-400/60'}>{phase}</span>
            </motion.div>
          ))}
          <div className="flex items-center gap-1 text-green-500/30 pt-0.5">
            <span className="inline-block w-1 h-1 bg-green-400 rounded-full animate-pulse" />
            <span className="inline-block w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="inline-block w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Quick Actions ----

function QuickActions({ onAction, disabled }: { onAction: (text: string) => void; disabled: boolean }) {
  const actions = [
    { label: 'BTC', icon: '₿' },
    { label: 'ETH', icon: 'Ξ' },
    { label: 'All Prices', icon: '$' },
    { label: 'Analyze Market', icon: '>' },
  ];
  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map(a => (
        <button key={a.label} onClick={() => onAction(a.label)} disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-white/[0.08] bg-white/[0.02] text-white/50 hover:bg-white/[0.06] hover:text-white/80 hover:border-white/20 transition-all disabled:opacity-30">
          <span className="font-mono text-green-400">{a.icon}</span>
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ---- Main Component ----

export function AdamsChat() {
  const { profile, needsSetup, saveNewProfile, isConnected } = useAdvisorProfile();
  const { address } = useAccount();
  const { open: openWallet } = useAppKit();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    // Restore conversation from localStorage
    try {
      const saved = localStorage.getItem('bobby_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMsg[];
        // Only restore if less than 24h old
        const newest = parsed[parsed.length - 1];
        if (newest && Date.now() - newest.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.map(m => ({ ...m, isLive: false }));
        }
      }
    } catch {}
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisPhases, setAnalysisPhases] = useState<string[]>([]);
  const [highlightedSymbols, setHighlightedSymbols] = useState<Set<string>>(new Set());
  const highlightTimeoutRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Cache tickers locally for quick re-use
  const tickerCacheRef = useRef<OKXTicker[]>([]);

  // ---- Bobby's Voice ----
  const { speak, stop: stopVoice, isSpeaking, analyser } = useBobbyVoice();
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('bobby_voice_enabled');
      return stored === null ? true : stored === 'true'; // ON by default for first-time users
    } catch { return true; }
  });
  const toggleVoice = useCallback(() => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    try { localStorage.setItem('bobby_voice_enabled', String(next)); } catch {}
    if (!next) stopVoice();
  }, [voiceEnabled, stopVoice]);

  // Auto-speak new advisor messages when voice is enabled
  const lastSpokenRef = useRef<string>('');
  const speakIfEnabled = useCallback((text: string) => {
    if (!voiceEnabled || !text || text === lastSpokenRef.current) return;
    // Strip markdown-ish formatting for cleaner speech
    const clean = text.replace(/[-*_#>]/g, '').replace(/\n+/g, '. ').trim();
    if (clean.length < 10) return; // too short to speak
    lastSpokenRef.current = text;
    speak(clean);
  }, [voiceEnabled, speak]);

  // ---- Ambient thinking sound (Web Audio API — no external files) ----
  const thinkingAudioRef = useRef<{ osc: OscillatorNode; gain: GainNode; ctx: AudioContext } | null>(null);
  const startThinkingSound = useCallback(() => {
    try {
      if (thinkingAudioRef.current) return; // already playing
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator(); // subtle modulation
      const lfoGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 220; // low ambient hum
      gain.gain.value = 0;
      // Fade in smoothly
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.5);

      // LFO for subtle pulsing
      lfo.type = 'sine';
      lfo.frequency.value = 0.5; // slow pulse
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      lfo.start();

      thinkingAudioRef.current = { osc, gain, ctx };
    } catch { /* silent — audio not critical */ }
  }, []);

  const stopThinkingSound = useCallback(() => {
    const ref = thinkingAudioRef.current;
    if (!ref) return;
    try {
      ref.gain.gain.linearRampToValueAtTime(0, ref.ctx.currentTime + 0.3);
      setTimeout(() => {
        try { ref.osc.stop(); ref.ctx.close(); } catch {}
      }, 400);
    } catch {}
    thinkingAudioRef.current = null;
  }, []);

  // ---- Typewriter effect for analyze results ----
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typewriterText = useCallback((msgId: string, fullText: string, onDone?: () => void) => {
    let i = 0;
    const speed = Math.max(8, Math.min(25, 2000 / fullText.length)); // adaptive speed: longer text = faster
    const step = () => {
      // Reveal in chunks of 2-4 chars for natural feel
      const chunk = Math.min(fullText.length, i + (Math.random() > 0.7 ? 4 : 2));
      i = chunk;
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, text: fullText.slice(0, i) } : m
      ));
      if (i < fullText.length) {
        typewriterRef.current = setTimeout(step, speed);
      } else {
        onDone?.();
      }
    };
    step();
  }, []);

  // ---- Stop everything: voice + processing ----
  const stopAll = useCallback(() => {
    stopVoice();
    stopThinkingSound();
    if (typewriterRef.current) { clearTimeout(typewriterRef.current); typewriterRef.current = null; }
    setIsProcessing(false);
    setAnalysisPhases([]);
    phaseTimerRef.current.forEach(clearTimeout);
    phaseTimerRef.current = [];
  }, [stopVoice, stopThinkingSound]);

  // Cleanup thinking sound on unmount
  useEffect(() => () => { stopThinkingSound(); }, [stopThinkingSound]);

  // ---- Keyword-to-UI: scan streaming text and highlight mentioned symbols ----
  const scanAndHighlight = useCallback((text: string) => {
    const symbols = ['BTC', 'ETH', 'SOL', 'OKB', 'MATIC', 'XAUT', 'PAXG', 'XAG', 'GOLD', 'ORO', 'PLATA', 'SILVER', 'NVDA'];
    const upper = text.toUpperCase();
    for (const sym of symbols) {
      if (upper.includes(sym)) {
        // Normalize to display symbol
        const displaySym = sym === 'GOLD' || sym === 'ORO' ? 'XAUT' : sym === 'PLATA' || sym === 'SILVER' ? 'XAG' : sym;
        // 200ms delay — feels like Bobby is "calling" the data
        const existingTimeout = highlightTimeoutRef.current.get(displaySym);
        if (!existingTimeout) {
          const t = setTimeout(() => {
            setHighlightedSymbols(prev => new Set(prev).add(displaySym));
            // Auto-remove highlight after 4 seconds
            setTimeout(() => {
              setHighlightedSymbols(prev => {
                const next = new Set(prev);
                next.delete(displaySym);
                return next;
              });
              highlightTimeoutRef.current.delete(displaySym);
            }, 4000);
          }, 200);
          highlightTimeoutRef.current.set(displaySym, t);
        }
      }
    }
  }, []);

  // ---- Speech Recognition (user talks back to Bobby) ----
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sendMessageRef = useRef<(text?: string) => void>(() => {});

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'es-MX';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      setInputText(transcript);

      // Auto-send on final result
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false);
        setTimeout(() => sendMessageRef.current(transcript), 300);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const advisorName = profile?.advisorName || 'Bobby';
  const lang = profile?.language || 'en'; // user's chosen language

  // ---- i18n strings keyed by language ----
  const i18n = {
    intro: {
      es: `Soy Bobby Agent Trader. No soy un bot de trading — soy tu agente con metacognición. Escaneo flujos de ballenas, cruzo datos de smart money, y debato conmigo mismo antes de hablar. Crypto, oro, plata — lo veo todo.\n\n¿Estás listo?`,
      en: `I'm Bobby Agent Trader. Not a trading bot — I'm your agent with metacognition. I scan whale flows, cross-reference smart money, and debate myself before I speak. Crypto, gold, silver — I see it all.\n\nAre you ready?`,
      pt: `Sou Bobby Agent Trader. Não sou um bot de trading — sou seu agente com metacognição. Escaneio fluxos de baleias, cruzo dados de smart money, e debato comigo mesmo antes de falar. Crypto, ouro, prata — vejo tudo.\n\nVocê está pronto?`,
    },
    introShort: {
      es: `Soy Bobby Agent Trader. No soy un bot — soy tu agente con metacognición. Pregúntame sobre cualquier mercado.`,
      en: `I'm Bobby Agent Trader. Not a bot — I'm your agent with metacognition. Ask me about any market.`,
      pt: `Sou Bobby Agent Trader. Não sou um bot — sou seu agente com metacognição. Pergunte sobre qualquer mercado.`,
    },
    analyzeFillers: {
      es: [
        "Escáner completo. Desplegando Alpha Hunter, Red Team, y corriendo la dialéctica. Esto toma un minuto — no apresuro mis decisiones.",
        "Corriendo el ciclo completo de inteligencia. Tres agentes debatiendo tu dinero. Dame un momento.",
        "Iniciando escaneo soberano. Señales de ballenas, consenso de Polymarket, conviction scoring. El trabajo real empieza ahora.",
      ],
      en: [
        "Full scan. Deploying Alpha Hunter, Red Team, and running the dialectic. This takes a minute — I don't rush decisions.",
        "Running the complete intelligence cycle. Three agents debating your money. Give me a moment.",
        "Initiating sovereign scan. Whale signals, Polymarket consensus, conviction scoring. The real work starts now.",
      ],
      pt: [
        "Escaneamento completo. Implantando Alpha Hunter, Red Team, e rodando a dialética. Isso leva um minuto — não apresso decisões.",
        "Rodando o ciclo completo de inteligência. Três agentes debatendo seu dinheiro. Me dê um momento.",
        "Iniciando escaneamento soberano. Sinais de baleias, consenso Polymarket, conviction scoring. O trabalho real começa agora.",
      ],
    },
    chatFillers: {
      es: [
        "El mercado se mueve rápido, déjame cruzar los flujos...",
        "Un momento, estoy escaneando la actividad de las ballenas...",
        "Déjame revisar qué está haciendo el smart money...",
        "Pregunta interesante. Déjame jalar los datos reales antes de contestar...",
        "Espera, quiero ver qué está pasando realmente on-chain...",
        "Dame un segundo, estoy analizando los flujos de capital...",
        "Checando las señales de los whales... esto se pone bueno...",
      ],
      en: [
        "The tape is moving fast, let me cross-reference the flows...",
        "Give me a second, I'm scanning the whale activity...",
        "Let me check what the smart money is doing...",
        "Interesting question. Let me pull the real data before I answer...",
        "Hold on, I want to see what's actually happening on-chain...",
        "One sec, analyzing the capital flows...",
        "Checking the whale signals... this is getting interesting...",
      ],
      pt: [
        "O mercado se move rápido, deixa eu cruzar os fluxos...",
        "Um momento, estou escaneando a atividade das baleias...",
        "Deixa eu ver o que o smart money está fazendo...",
        "Pergunta interessante. Deixa eu puxar os dados reais...",
        "Espera, quero ver o que está acontecendo on-chain...",
      ],
    },
    phases: {
      es: [
        { text: 'Conectando a OKX OnchainOS...', delay: 0 },
        { text: 'Escaneando señales whale en ETH, SOL, Base...', delay: 1200 },
        { text: 'Filtrando señales (score > 20)...', delay: 3000 },
        { text: 'Obteniendo leaderboard Polymarket (top 15)...', delay: 5000 },
        { text: 'Auto-optimizando prompt del Alpha Hunter...', delay: 7500 },
        { text: 'Alpha Hunter analizando...', delay: 10000 },
        { text: 'Red Team stress-testing...', delay: 15000 },
        { text: 'Judge emitiendo veredicto final...', delay: 20000 },
        { text: 'Kelly Criterion sizing...', delay: 25000 },
        { text: 'Generando reporte...', delay: 28000 },
        { text: 'Sigo trabajando (el ciclo puede tomar hasta 2 min)...', delay: 60000 },
        { text: 'Casi listo...', delay: 90000 },
      ],
      en: [
        { text: 'Connecting to OKX OnchainOS...', delay: 0 },
        { text: 'Scanning whale signals across ETH, SOL, Base...', delay: 1200 },
        { text: 'Filtering signals (score > 20)...', delay: 3000 },
        { text: 'Fetching Polymarket leaderboard (top 15)...', delay: 5000 },
        { text: 'Self-optimizing Alpha prompt...', delay: 7500 },
        { text: 'Alpha Hunter analyzing...', delay: 10000 },
        { text: 'Red Team stress-testing...', delay: 15000 },
        { text: 'Judge making final verdict...', delay: 20000 },
        { text: 'Kelly Criterion sizing...', delay: 25000 },
        { text: 'Generating report...', delay: 28000 },
        { text: 'Still working (agent runs can take up to 2 min)...', delay: 60000 },
        { text: 'Almost done...', delay: 90000 },
      ],
      pt: [
        { text: 'Conectando ao OKX OnchainOS...', delay: 0 },
        { text: 'Escaneando sinais whale em ETH, SOL, Base...', delay: 1200 },
        { text: 'Filtrando sinais (score > 20)...', delay: 3000 },
        { text: 'Obtendo leaderboard Polymarket (top 15)...', delay: 5000 },
        { text: 'Auto-otimizando prompt do Alpha Hunter...', delay: 7500 },
        { text: 'Alpha Hunter analisando...', delay: 10000 },
        { text: 'Red Team stress-testing...', delay: 15000 },
        { text: 'Judge emitindo veredicto final...', delay: 20000 },
        { text: 'Kelly Criterion sizing...', delay: 25000 },
        { text: 'Gerando relatório...', delay: 28000 },
        { text: 'Ainda trabalhando (ciclo pode levar até 2 min)...', delay: 60000 },
        { text: 'Quase pronto...', delay: 90000 },
      ],
    },
    priceSingle: {
      es: (sym: string, price: string, up: boolean, change: string) =>
        `${sym} está en $${price} — ${up ? 'subió' : 'bajó'} ${change}% en las últimas 24 horas.`,
      en: (sym: string, price: string, up: boolean, change: string) =>
        `${sym} is at $${price} — ${up ? 'up' : 'down'} ${change}% in the last 24h.`,
      pt: (sym: string, price: string, up: boolean, change: string) =>
        `${sym} está em $${price} — ${up ? 'subiu' : 'caiu'} ${change}% nas últimas 24h.`,
    },
    priceMulti: {
      es: (names: string) => `Aquí tienes lo último de ${names}:`,
      en: (names: string) => `Here's the latest on ${names}:`,
      pt: (names: string) => `Aqui está o mais recente de ${names}:`,
    },
    priceError: {
      es: (err: string) => `No pude obtener precios ahorita: ${err}. Intenta de nuevo en un momento.`,
      en: (err: string) => `Couldn't fetch prices right now: ${err}. Try again in a moment.`,
      pt: (err: string) => `Não consegui obter preços agora: ${err}. Tente de novo em um momento.`,
    },
    scanSummary: {
      es: (time: string, found: number, filtered: number, trades: number, usd: string | null) =>
        [`Escaneo completo en ${time}s`, `${found} señales encontradas, ${filtered} pasaron filtros`, `${trades} trades recomendados`, usd ? `$${usd} posición total` : null].filter(Boolean).join('\n'),
      en: (time: string, found: number, filtered: number, trades: number, usd: string | null) =>
        [`Scan complete in ${time}s`, `${found} signals found, ${filtered} passed filters`, `${trades} trades recommended`, usd ? `$${usd} total position` : null].filter(Boolean).join('\n'),
      pt: (time: string, found: number, filtered: number, trades: number, usd: string | null) =>
        [`Escaneamento completo em ${time}s`, `${found} sinais encontrados, ${filtered} passaram filtros`, `${trades} trades recomendados`, usd ? `$${usd} posição total` : null].filter(Boolean).join('\n'),
    },
    noTrades: {
      es: (reason: string) => `Análisis completo, pero no recomiendo trades. ${reason}`,
      en: (reason: string) => `Analysis complete but no trades recommended. ${reason}`,
      pt: (reason: string) => `Análise completa, mas não recomendo trades. ${reason}`,
    },
    timeout: {
      es: 'El análisis tardó demasiado (>2 min). El ciclo puede seguir corriendo en segundo plano. Intenta "Analyze Market" de nuevo en unos minutos.',
      en: 'Analysis timed out (>2 min). The agent cycle may still be running in the background. Try "Analyze Market" again in a few minutes.',
      pt: 'A análise demorou demais (>2 min). O ciclo pode estar rodando em segundo plano. Tente "Analyze Market" de novo em alguns minutos.',
    },
    analysisError: {
      es: (err: string) => `Error en el análisis: ${err}. Suele ser temporal — intenta de nuevo.`,
      en: (err: string) => `Analysis error: ${err}. This is usually temporary — try again.`,
      pt: (err: string) => `Erro na análise: ${err}. Geralmente é temporário — tente de novo.`,
    },
    noData: {
      es: (msg: string) => `No tengo datos sobre "${msg}". Prueba con "BTC", "ETH", o "Analyze Market".`,
      en: (msg: string) => `I don't have data on "${msg}". Try "BTC", "ETH", or "Analyze Market".`,
      pt: (msg: string) => `Não tenho dados sobre "${msg}". Tente "BTC", "ETH", ou "Analyze Market".`,
    },
    fallbackWithPrices: {
      es: 'Aquí tienes los datos más recientes. Para un análisis completo, prueba "Analyze Market" — ahí despliego el debate multi-agente completo.',
      en: 'Here\'s the latest data. For a full Bobby analysis, try "Analyze Market" — that\'s where I deploy the full multi-agent debate.',
      pt: 'Aqui estão os dados mais recentes. Para uma análise completa, tente "Analyze Market" — é onde eu faço o debate multi-agente completo.',
    },
    fallbackNoPrices: {
      es: 'Te puedo ayudar con precios y análisis de mercado. Prueba:\n\n"BTC" o "ETH" — Precio en vivo\n"All Prices" — Panorama del mercado\n"Analyze Market" — Escaneo completo',
      en: 'I can help with prices and market analysis. Try:\n\n"BTC" or "ETH" — Live price\n"All Prices" — Market overview\n"Analyze Market" — Full agent scan',
      pt: 'Posso ajudar com preços e análise de mercado. Tente:\n\n"BTC" ou "ETH" — Preço ao vivo\n"All Prices" — Visão do mercado\n"Analyze Market" — Escaneamento completo',
    },
    walletConnected: {
      es: (addr: string) => `Wallet conectada: ${addr}\n\nPortfolio tracking próximamente en v2. Por ahora, corre "Analyze Market" — escaneo señales y recomiendo trades con Kelly Criterion para tu perfil de riesgo.`,
      en: (addr: string) => `Wallet connected: ${addr}\n\nPortfolio tracking coming in v2. For now, run "Analyze Market" — I'll scan signals and recommend trades sized with Kelly Criterion for your risk profile.`,
      pt: (addr: string) => `Wallet conectada: ${addr}\n\nPortfolio tracking em breve na v2. Por agora, rode "Analyze Market" — escaneio sinais e recomendo trades com Kelly Criterion para seu perfil de risco.`,
    },
  } as const;

  // Helper to get text for current language with fallback to English
  function t<K extends keyof typeof i18n>(key: K): (typeof i18n)[K][keyof (typeof i18n)[K]] {
    const entry = i18n[key];
    return (entry as Record<string, unknown>)[lang] ?? (entry as Record<string, unknown>)['en'] as any;
  }

  useEffect(() => {
    if (needsSetup) setShowSetup(true);
  }, [needsSetup]);

  // Load conversation — prefer localStorage, fallback to DB, then onboarding
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    if (!profile?.walletAddress) return;
    hasInitialized.current = true;

    // If we already restored from localStorage, skip DB fetch
    if (messages.length > 0) return;

    fetchDBMessages(profile.walletAddress).then(dbMsgs => {
      if (dbMsgs.length === 0) {
        // First time onboarding — Bobby introduces himself
        const introText = t('intro') as string;

        fetchTickers().then(tickers => {
          tickerCacheRef.current = tickers;
          const btc = tickers.find(t => t.symbol === 'BTC');
          const eth = tickers.find(t => t.symbol === 'ETH');
          const gold = tickers.find(t => t.symbol === 'XAUT');
          const priceCards: PriceCard[] = [btc, eth, gold].filter(Boolean).map(t => ({
            symbol: t!.symbol,
            price: t!.last,
            change24h: t!.change24h,
            high24h: t!.high24h,
            low24h: t!.low24h,
            vol24h: t!.vol24h,
            funding: t!.funding,
          }));

          setMessages([{
            id: 'welcome',
            role: 'advisor',
            text: introText,
            timestamp: Date.now(),
            isLive: true,
            prices: priceCards, // Show prices immediately with intro
          }]);

          // Auto-speak with small delay (needs user gesture from disclaimer click)
          setTimeout(() => {
            const cleanIntro = introText.replace(/[-*_#>]/g, '').replace(/\n+/g, '. ').trim();
            speak(cleanIntro);
          }, 500);
        }).catch(() => {
          setMessages([{
            id: 'welcome',
            role: 'advisor',
            text: t('introShort') as string,
            timestamp: Date.now(),
            isLive: true,
          }]);
        });
        return;
      }

      const chatMsgs: ChatMsg[] = [];
      for (const m of dbMsgs) {
        chatMsgs.push({
          id: m.id + '-trigger',
          role: 'user',
          text: 'Analyze Market',
          timestamp: new Date(m.created_at).getTime() - 1000,
          isLive: false,
        });
        chatMsgs.push({
          id: m.id,
          role: 'advisor',
          text: m.message.replace(/\*/g, '').replace(/_/g, ''),
          timestamp: new Date(m.created_at).getTime(),
          isLive: false,
        });
      }
      setMessages(chatMsgs);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.walletAddress, advisorName]);

  // Persist conversation to localStorage (keep last 30 messages)
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      const toSave = messages.slice(-30).map(m => ({
        ...m, isLive: false, // don't replay typewriter on restore
      }));
      localStorage.setItem('bobby_chat_history', JSON.stringify(toSave));
    } catch {}
  }, [messages]);

  // Auto-scroll — but only scroll the internal container, not the page
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, analysisPhases]);

  const handleSetupComplete = (p: AdvisorProfile) => {
    saveNewProfile(p);
    setShowSetup(false);
  };

  // ---- Fetch prices helper ----
  const getPriceCards = async (instIds: string[]): Promise<PriceCard[]> => {
    let tickers = tickerCacheRef.current;
    if (tickers.length === 0) {
      tickers = await fetchTickers();
      tickerCacheRef.current = tickers;
    }
    const cards: PriceCard[] = [];
    for (const instId of instIds) {
      const sym = instId.split('-')[0];
      const t = tickers.find(tk => tk.symbol === sym);
      if (t) {
        // For individual tokens, fetch detailed data with funding
        try {
          const detail = await fetchMarketDetail(instId);
          cards.push({
            symbol: t.symbol,
            price: detail.ticker?.last ?? t.last,
            change24h: detail.ticker?.change24h ?? t.change24h,
            high24h: detail.ticker?.high24h ?? t.high24h,
            low24h: detail.ticker?.low24h ?? t.low24h,
            vol24h: detail.ticker?.vol24h ?? t.vol24h,
            funding: detail.funding ? { rate: detail.funding.rate, annualized: detail.funding.annualized } : t.funding,
          });
        } catch {
          cards.push({
            symbol: t.symbol, price: t.last, change24h: t.change24h,
            high24h: t.high24h, low24h: t.low24h, vol24h: t.vol24h, funding: t.funding,
          });
        }
      }
    }
    return cards;
  };

  // ---- Send message / trigger action ----
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || inputText).trim();
    if (!msg || isProcessing) return;
    setInputText('');

    const userMsg: ChatMsg = { id: uid(), role: 'user', text: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    const intent = detectIntent(msg);
    const tokens = detectTokens(msg);

    // Bobby auto-saves interest tags when user mentions assets
    if (tokens.length > 0 && profile?.walletAddress) {
      saveInterestTags(profile.walletAddress, tokens, `user inquiry: "${msg}"`);
    }

    // ========================
    // PRICE QUERY — specific token(s)
    // ========================
    if (intent === 'price' || (intent === 'chat' && tokens.length > 0)) {
      const targetTokens = tokens.length > 0 ? tokens : ['BTC-USDT'];
      setIsProcessing(true);
      try {
        const cards = await getPriceCards(targetTokens);
        const names = cards.map(c => c.symbol).join(', ');
        const isUp = cards.length > 0 && cards[0].change24h >= 0;
        const priceFn = t('priceSingle') as (sym: string, price: string, up: boolean, change: string) => string;
        const multiPriceFn = t('priceMulti') as (names: string) => string;
        const priceText = cards.length === 1
          ? priceFn(cards[0].symbol, fmtPrice(cards[0].price), isUp, Math.abs(cards[0].change24h).toFixed(2))
          : multiPriceFn(names);
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: priceText,
          prices: cards,
        }]);
        speakIfEnabled(priceText);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: (t('priceError') as (err: string) => string)(err instanceof Error ? err.message : 'network error'),
        }]);
      }
      setIsProcessing(false);
      return;
    }

    // ========================
    // ALL PRICES
    // ========================
    if (intent === 'prices_all') {
      setIsProcessing(true);
      try {
        const tickers = await fetchTickers();
        tickerCacheRef.current = tickers;
        const cards: PriceCard[] = tickers.map(t => ({
          symbol: t.symbol, price: t.last, change24h: t.change24h,
          high24h: t.high24h, low24h: t.low24h, vol24h: t.vol24h, funding: t.funding,
        }));
        const winners = [...cards].sort((a, b) => b.change24h - a.change24h);
        const top = winners[0];
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: `Market overview — ${top.symbol} leading with ${top.change24h > 0 ? '+' : ''}${top.change24h.toFixed(2)}%:`,
          prices: cards,
        }]);
      } catch {
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: 'Failed to fetch market data. OKX API might be temporarily unavailable.',
        }]);
      }
      setIsProcessing(false);
      return;
    }

    // ========================
    // TRENDING — fetch prices + commentary
    // ========================
    if (intent === 'trending') {
      setIsProcessing(true);
      try {
        const tickers = await fetchTickers();
        tickerCacheRef.current = tickers;
        const sorted = [...tickers].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
        const cards: PriceCard[] = sorted.slice(0, 3).map(t => ({
          symbol: t.symbol, price: t.last, change24h: t.change24h,
          high24h: t.high24h, low24h: t.low24h, vol24h: t.vol24h, funding: t.funding,
        }));
        const movers = sorted.slice(0, 3).map(t =>
          `${t.symbol} ${t.change24h > 0 ? '+' : ''}${t.change24h.toFixed(2)}%`
        ).join(', ');
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: `Biggest movers right now: ${movers}\n\nFor smart money positions and whale signals, run "Analyze Market".`,
          prices: cards,
        }]);
      } catch {
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: 'Failed to fetch trending data. Try again in a moment.',
        }]);
      }
      setIsProcessing(false);
      return;
    }

    // ========================
    // PORTFOLIO
    // ========================
    if (intent === 'portfolio') {
      if (!address) {
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: lang === 'es' ? 'Conecta tu wallet primero — usa el botón "Connect" arriba a la derecha. Una vez conectada, puedo mostrar tus posiciones on-chain.'
            : lang === 'pt' ? 'Conecte sua wallet primeiro — use o botão "Connect" no canto superior direito. Uma vez conectada, posso mostrar suas posições on-chain.'
            : 'Connect your wallet first — use the "Connect" button in the top right. Once connected, I can show your on-chain positions.',
        }]);
      } else {
        const walletFn = t('walletConnected') as (addr: string) => string;
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: walletFn(`${address.slice(0, 6)}...${address.slice(-4)}`),
        }]);
      }
      return;
    }

    // ========================
    // HELP
    // ========================
    if (intent === 'help') {
      setMessages(prev => [...prev, {
        id: uid(), role: 'advisor', timestamp: Date.now(),
        text: `Here's what I can do:\n\n"BTC" or "ETH" — Live price + funding rate\n"All Prices" — Full market overview\n"What's trending?" — Biggest movers\n"Analyze Market" — Full OKX + Polymarket scan (multi-agent debate + Kelly sizing)\n"Portfolio" — Check connected wallet\n\nOr just type any token name — SOL, OKB, MATIC...`,
      }]);
      return;
    }

    // ========================
    // ANALYZE MARKET — full agent cycle
    // ========================
    if (intent === 'analyze') {
      setIsProcessing(true);
      setAnalysisPhases([]);
      startThinkingSound(); // ambient hum while analyzing

      // Bobby announces the full scan — voice filler during the 2min cycle
      const analyzeFillers = t('analyzeFillers') as string[];
      speakIfEnabled(analyzeFillers[Math.floor(Math.random() * analyzeFillers.length)]);
      phaseTimerRef.current.forEach(clearTimeout);
      phaseTimerRef.current = [];

      const phases = t('phases') as Array<{ text: string; delay: number }>;
      phases.forEach(p => {
        const t = setTimeout(() => setAnalysisPhases(prev => [...prev, p.text]), p.delay);
        phaseTimerRef.current.push(t);
      });

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 125_000); // 125s timeout

        const walletParam = address ? `&wallet=${address}` : '';
        const res = await fetch(`/api/agent-run?manual=true${walletParam}`, { signal: controller.signal });
        clearTimeout(timeout);
        const data = await res.json();

        phaseTimerRef.current.forEach(clearTimeout);
        phaseTimerRef.current = [];
        setAnalysisPhases([]);
        stopThinkingSound();

        if (data.ok) {
          const trades: TradeExecution[] = (data.trades || [])
            .filter((t: any) => t.execution)
            .map((t: any) => ({
              tokenSymbol: t.tokenSymbol, amountUsd: t.amountUsd,
              confidence: t.confidence || 0, sizingMethod: t.sizingMethod || 'half-kelly',
              chain: t.chain || '196', execution: t.execution,
            }));

          // Build a summary from the response
          const summaryFn = t('scanSummary') as (time: string, found: number, filtered: number, trades: number, usd: string | null) => string;
          const summary = summaryFn(
            ((data.cycle?.latency_ms || 0) / 1000).toFixed(1),
            data.cycle?.signals_found || 0,
            data.cycle?.signals_filtered || 0,
            data.cycle?.trades_executed || 0,
            data.cycle?.total_usd_deployed ? data.cycle.total_usd_deployed.toFixed(2) : null,
          );

          // Try to get the greeting from DB
          let greetingText = summary;
          if (profile?.walletAddress) {
            try {
              const dbMsgs = await fetchDBMessages(profile.walletAddress);
              if (dbMsgs.length > 0) {
                const latest = dbMsgs[dbMsgs.length - 1];
                greetingText = latest.message.replace(/\*/g, '').replace(/_/g, '');
              }
            } catch {}
          }

          const msgId = uid();
          const mainMsg: ChatMsg = {
            id: msgId, role: 'advisor', timestamp: Date.now(),
            text: '', isLive: true, // start empty — typewriter fills it
            trades: trades.length > 0 ? trades : undefined,
          };

          // Attach Intelligence Feed data — visible metacognition
          if (data.debate?.alphaView || data.debate?.redTeamView || data.debate?.judgeVerdict) {
            mainMsg.debate = {
              alphaView: data.debate.alphaView || '',
              redTeamView: data.debate.redTeamView || '',
              judgeVerdict: data.debate.judgeVerdict || '',
              selfOptimized: data.debate.selfOptimized,
              sizingMethod: data.debate.sizingMethod,
            };
          }
          if (data.metacognition) {
            mainMsg.metacognition = data.metacognition;
          }
          if (data.topSignals) {
            mainMsg.topSignals = data.topSignals;
          }
          if (data.polymarket) {
            mainMsg.polymarket = data.polymarket;
          }

          setMessages(prev => [...prev, mainMsg]);
          // Typewriter reveal + speak when done
          typewriterText(msgId, greetingText, () => speakIfEnabled(greetingText));
        } else {
          // API returned ok:false — still show what we got
          const reason = data.cycle?.llm_reasoning || data.error || (lang === 'es' ? 'Sin señales accionables este ciclo.' : 'No actionable signals this cycle.');
          const noTradeFn = t('noTrades') as (reason: string) => string;
          const noTradeText = noTradeFn(reason);
          setMessages(prev => [...prev, {
            id: uid(), role: 'advisor', timestamp: Date.now(),
            text: noTradeText,
          }]);
          speakIfEnabled(noTradeText);
        }
      } catch (err) {
        phaseTimerRef.current.forEach(clearTimeout);
        phaseTimerRef.current = [];
        setAnalysisPhases([]);
        stopThinkingSound();

        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: isAbort
            ? t('timeout') as string
            : (t('analysisError') as (err: string) => string)(err instanceof Error ? err.message : 'Unknown error'),
        }]);
      }
      setIsProcessing(false);
      return;
    }

    // ========================
    // CONVERSATIONAL AI — Bobby's brain via OpenClaw
    // If user mentions tokens, fetch live data in parallel for context
    // ========================
    setIsProcessing(true);
    startThinkingSound(); // ambient hum while thinking

    // Voice filler — Bobby "thinks out loud" while intelligence loads
    // Transforms network lag into narrative tension
    const fillers = t('chatFillers') as string[];
    const filler = fillers[Math.floor(Math.random() * fillers.length)];
    speakIfEnabled(filler);

    // Fetch FULL intelligence + price data in parallel (Bobby's brain needs everything)
    const contextPricesPromise = tokens.length > 0 ? getPriceCards(tokens) : Promise.resolve([]);
    const intelPromise = fetch('/api/bobby-intel').then(r => r.ok ? r.json() : null).catch(() => null);

    try {
      // Enrich the message with FULL intelligence context — whale signals, Polymarket, conviction
      let enrichedMessage = msg;
      try {
        const [contextPrices, intel] = await Promise.all([contextPricesPromise, intelPromise]);

        // Bobby's brain: inject the full intelligence briefing
        if (intel?.briefing) {
          enrichedMessage = `${msg}\n\n${intel.briefing}`;
        } else if (contextPrices.length > 0) {
          // Fallback: at least inject price context
          const priceContext = contextPrices.map(p =>
            `${p.symbol}: $${fmtPrice(p.price)} (${p.change24h > 0 ? '+' : ''}${p.change24h.toFixed(2)}% 24h, vol ${formatVolume(p.vol24h)}${p.funding ? `, funding ${(p.funding.rate * 100).toFixed(4)}%` : ''})`
          ).join('; ');
          enrichedMessage = `${msg}\n\n[LIVE DATA: ${priceContext}]`;
        }
      } catch { /* continue without context */ }

      const res = await fetch('/api/openclaw-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enrichedMessage,
          language: lang,
          history: messages.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      if (!res.ok) throw new Error(`OpenClaw: ${res.status}`);

      // Get price cards — from token detection OR from bobby-intel response
      let responsePrices: PriceCard[] = [];
      try {
        if (tokens.length > 0) {
          responsePrices = await contextPricesPromise;
        } else {
          // Even without specific tokens, show top prices from intel
          const cachedTickers = tickerCacheRef.current.length > 0
            ? tickerCacheRef.current
            : await fetchTickers().then(t => { tickerCacheRef.current = t; return t; });
          const topSymbols = ['BTC', 'ETH', 'SOL'];
          responsePrices = topSymbols
            .map(s => cachedTickers.find(t => t.symbol === s))
            .filter(Boolean)
            .map(t => ({
              symbol: t!.symbol, price: t!.last, change24h: t!.change24h,
              high24h: t!.high24h, low24h: t!.low24h, vol24h: t!.vol24h, funding: t!.funding,
            }));
        }
      } catch { /* no prices */ }

      // Try to parse SSE stream
      stopThinkingSound(); // stop hum once response arrives
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let fullText = '';
        const replyId = uid();

        // Add empty advisor message — price cards will appear mid-speech
        setMessages(prev => [...prev, {
          id: replyId, role: 'advisor', timestamp: Date.now(),
          text: '', isLive: false,
        }]);

        // Price cards appear 1.5s later — WHILE Bobby is speaking
        if (responsePrices.length > 0) {
          setTimeout(() => {
            setMessages(prev => prev.map(m =>
              m.id === replyId ? { ...m, prices: responsePrices } : m
            ));
          }, 1500);
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          // Parse SSE data lines
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                setMessages(prev => prev.map(m =>
                  m.id === replyId ? { ...m, text: fullText } : m
                ));
                // Keyword-to-UI: scan as text flows in
                scanAndHighlight(delta);
              }
            } catch { /* skip non-JSON lines */ }
          }
        }

        // If we got no text from stream, set a fallback
        if (!fullText) {
          setMessages(prev => prev.map(m =>
            m.id === replyId ? { ...m, text: `I understood "${msg}" but couldn't generate a response. Try asking about prices ("BTC", "ETH") or run "Analyze Market".` } : m
          ));
        } else {
          // Bobby speaks the complete response
          speakIfEnabled(fullText);
        }
      } else {
        // Non-streaming fallback
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: uid(), role: 'advisor', timestamp: Date.now(),
          text: data.choices?.[0]?.message?.content || (t('noData') as (m: string) => string)(msg),
          prices: responsePrices.length > 0 ? responsePrices : undefined,
        }]);
      }
    } catch {
      stopThinkingSound();
      // OpenClaw unavailable — fallback with prices if available
      let fallbackPrices: PriceCard[] = [];
      try { fallbackPrices = await contextPricesPromise; } catch { /* silent */ }
      setMessages(prev => [...prev, {
        id: uid(), role: 'advisor', timestamp: Date.now(),
        text: fallbackPrices.length > 0
          ? t('fallbackWithPrices') as string
          : t('fallbackNoPrices') as string,
        prices: fallbackPrices.length > 0 ? fallbackPrices : undefined,
      }]);
    }
    setIsProcessing(false);

  }, [inputText, isProcessing, profile?.walletAddress, address, advisorName, speakIfEnabled, scanAndHighlight, startThinkingSound, stopThinkingSound, typewriterText, lang, t]);

  // Keep ref in sync for speech recognition callback
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // ---- Orb state ----
  const orbState: OrbState = isListening ? 'listening' : isSpeaking ? 'speaking' : isProcessing ? 'thinking' : 'idle';

  // Get the latest advisor message for the "stage" display
  const latestAdvisor = [...messages].reverse().find(m => m.role === 'advisor');
  const latestUser = [...messages].reverse().find(m => m.role === 'user');

  return (
    <div className="h-full text-white flex flex-col overflow-hidden" style={{ background: '#050505' }}>
      {showSetup && <AdvisorSetup onComplete={handleSetupComplete} />}

      {/* ===== MINIMAL HEADER BAR ===== */}
      <div className="flex-shrink-0 border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/agentic-world" className="text-white/15 hover:text-white/40 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[12px] font-mono font-bold text-white/40 tracking-[1px]">{advisorName.toUpperCase()}</span>
            <span className="text-[9px] font-mono text-white/15 hidden sm:inline">
              {orbState === 'thinking' ? 'PROCESSING...' : orbState === 'speaking' ? 'SPEAKING' : orbState === 'listening' ? 'LISTENING' : 'ONLINE'}
            </span>
            <span className="text-[8px] font-mono text-white/10 hidden sm:inline">×</span>
            <a href="https://www.okx.com" target="_blank" rel="noopener noreferrer"
              className="text-[8px] font-mono text-white/15 hover:text-white/40 transition-colors hidden sm:inline">
              OKX OnchainOS
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Stop button — visible when speaking or processing */}
            {(isSpeaking || isProcessing) && (
              <button onClick={stopAll}
                className="p-1.5 text-red-400/70 hover:text-red-400 transition-colors animate-pulse"
                title="Stop">
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
            <button onClick={toggleVoice}
              className={`p-1.5 transition-colors ${voiceEnabled ? 'text-green-400/70 hover:text-green-400' : 'text-white/15 hover:text-white/30'}`}
              title={voiceEnabled ? 'Voice ON' : 'Voice OFF'}>
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            {address ? (
              <button onClick={() => openWallet()} className="text-[10px] text-white/25 font-mono hover:text-white/50 transition-colors px-2">
                {address.slice(0, 6)}...{address.slice(-4)}
              </button>
            ) : (
              <button onClick={() => openWallet()} className="text-[10px] text-green-400/50 hover:text-green-400 transition-colors px-2 font-mono">
                Connect
              </button>
            )}
            {isConnected && profile && (
              <button onClick={() => setShowSetup(true)} className="text-white/10 hover:text-white/30 transition-colors p-1.5">
                <Settings className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== COMMAND CENTER: ORB + STAGE ===== */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col" ref={scrollRef}>
        <div className="max-w-4xl mx-auto w-full px-4 flex flex-col items-center flex-1">

          {/* THE ORB — always visible, center stage */}
          <div className="flex-shrink-0 py-6 sm:py-8">
            <VoiceOrb analyser={analyser} state={orbState} mood="confident" size={140} />
          </div>

          {/* THINKING INDICATOR — conversational queries (no phases) */}
          <AnimatePresence>
            {isProcessing && analysisPhases.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="w-full max-w-md mb-3"
              >
                <div className="border border-green-500/10 bg-green-500/[0.03] backdrop-blur-sm px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-mono text-green-400/60">
                    Scanning intelligence feeds...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ANALYSIS PHASES — full agent-run thinking state */}
          <AnimatePresence>
            {isProcessing && analysisPhases.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-md mb-4"
              >
                <div className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 space-y-1.5">
                  {analysisPhases.map((phase, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-2 font-mono text-[10px]">
                      <span className={i === analysisPhases.length - 1 ? 'text-green-400' : 'text-white/15'}>{i === analysisPhases.length - 1 ? '>' : '+'}</span>
                      <span className={i === analysisPhases.length - 1 ? 'text-green-300/80' : 'text-white/25'}>{phase}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THE STAGE — Bobby's latest response + data panels */}
          <div className="w-full flex-1 space-y-3 pb-4">
            {/* Latest Bobby message — the main "stage" text */}
            {latestAdvisor && (
              <motion.div
                key={latestAdvisor.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-5">
                  <div className="text-[13px] leading-relaxed text-white/80 font-mono whitespace-pre-line">
                    {latestAdvisor === messages[messages.length - 1] && latestAdvisor.isLive !== false ? (
                      <Typewriter text={latestAdvisor.text} speed={6} />
                    ) : (
                      latestAdvisor.text
                    )}
                  </div>
                </div>

                {/* Trade execution cards */}
                {latestAdvisor.trades && latestAdvisor.trades.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {latestAdvisor.trades.map((trade, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <SwapConfirm trade={trade} walletAddress={address} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* INTELLIGENCE FEED — visible metacognition (debate Alpha vs Red Team vs Bobby CIO) */}
            {latestAdvisor?.debate && (
              <IntelligenceFeed
                debate={latestAdvisor.debate}
                metacognition={latestAdvisor.metacognition}
                topSignals={latestAdvisor.topSignals}
                polymarket={latestAdvisor.polymarket}
                isLive={latestAdvisor === messages[messages.length - 1]}
              />
            )}

            {/* DATA PANELS — price cards emerge from darkness */}
            {latestAdvisor?.prices && latestAdvisor.prices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {latestAdvisor.prices.map((p, i) => (
                  <motion.div
                    key={p.symbol}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <InlinePriceCard price={p} highlighted={highlightedSymbols.has(p.symbol)} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* CONVERSATION HISTORY — compact, behind the stage */}
            {messages.length > 1 && (
              <div className="w-full max-w-2xl mx-auto pt-4 border-t border-white/[0.03]">
                <div className="space-y-2">
                  {messages.slice(0, -1).map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-1.5 text-[11px] ${
                        msg.role === 'user'
                          ? 'bg-white/[0.06] text-white/50'
                          : 'text-white/30 font-mono'
                      }`}>
                        {msg.text.length > 200 ? msg.text.slice(0, 200) + '...' : msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* ===== INPUT BAR — Bottom ===== */}
      <div className="flex-shrink-0 border-t border-white/[0.04]" style={{ background: '#080808' }}>
        {isAuthenticated ? (
          <>
            <div className="max-w-4xl mx-auto px-4 pt-2 pb-1">
              <div className="flex gap-2 flex-wrap justify-center">
                {[
                  { label: 'BTC', icon: '₿' },
                  { label: 'ETH', icon: 'Ξ' },
                  { label: 'Gold', icon: '◆' },
                  { label: 'Silver', icon: '◇' },
                  { label: 'All Prices', icon: '$' },
                  { label: 'Analyze Market', icon: '>' },
                ].map(a => (
                  <button key={a.label} onClick={() => sendMessage(a.label)} disabled={isProcessing}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-white/[0.05] bg-white/[0.01] text-white/30 hover:bg-white/[0.04] hover:text-white/60 hover:border-white/10 transition-all disabled:opacity-20 font-mono">
                    <span className="text-green-400/60">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
                <Link to="/agentic-world/polymarket"
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-cyan-500/10 bg-cyan-500/[0.03] text-cyan-400/50 hover:bg-cyan-500/[0.08] hover:text-cyan-400/80 hover:border-cyan-500/20 transition-all font-mono">
                  <span>◉</span> Dashboard
                </Link>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-2">
              <button onClick={toggleListening} disabled={isProcessing}
                className={`w-9 h-9 flex items-center justify-center border transition-all active:scale-[0.95] flex-shrink-0 rounded-full ${
                  isListening
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                    : 'border-white/[0.06] text-white/20 hover:border-green-500/20 hover:text-green-400/60'
                }`}>
                {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>
              <input type="text" value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={isListening ? 'Listening...' : `Talk to ${advisorName}...`}
                className={`flex-1 bg-transparent border-0 border-b px-3 py-2 text-[13px] text-white/90 placeholder:text-white/15 outline-none transition-colors font-mono ${
                  isListening ? 'border-red-500/20' : 'border-white/[0.06] focus:border-white/10'
                }`}
                disabled={isProcessing} />
              <button onClick={() => sendMessage()} disabled={!inputText.trim() || isProcessing}
                className={`w-9 h-9 flex items-center justify-center transition-all active:scale-[0.95] rounded-full ${
                  inputText.trim() && !isProcessing ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'text-white/10 cursor-not-allowed'
                }`}>
                {isProcessing ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <ArrowUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </>
        ) : (
          /* ===== AUTH GATE — Login prompt for unauthenticated users ===== */
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="border border-amber-500/20 bg-amber-500/[0.03] backdrop-blur-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400/80 flex-shrink-0" />
                <span className="text-amber-400/80 text-[11px] font-mono">
                  {lang === 'es' ? 'Inicia sesión para hablar con Bobby' : lang === 'pt' ? 'Faça login para falar com Bobby' : 'Sign in to talk to Bobby'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                  className="text-[10px] px-4 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors font-mono tracking-wider">
                  {lang === 'es' ? 'INICIAR SESIÓN' : lang === 'pt' ? 'ENTRAR' : 'SIGN IN'}
                </button>
                <button
                  onClick={() => navigate('/register?redirect=' + encodeURIComponent(window.location.pathname))}
                  className="text-[10px] px-4 py-1.5 border border-green-500/30 text-green-400/60 hover:text-green-400 hover:border-green-500/50 transition-colors font-mono tracking-wider">
                  {lang === 'es' ? 'CREAR CUENTA' : lang === 'pt' ? 'CRIAR CONTA' : 'SIGN UP'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
