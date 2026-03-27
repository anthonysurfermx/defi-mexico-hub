// ============================================================
// PTS Shell — White-label wrapper for ALL Bobby pages
// Replaces KineticShell with PTS-branded chrome (gold/navy)
// Every Bobby page can be mounted inside this shell
// Route: /demopts/*
// ============================================================

import { useState, useEffect, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { WhiteLabelProvider, PTS_THEME } from '@/contexts/WhiteLabelContext';

const NAV_ITEMS = [
  { id: 'terminal', label: 'TERMINAL', path: '/demopts/terminal' },
  { id: 'challenge', label: 'CHALLENGE', path: '/demopts/challenge' },
  { id: 'history', label: 'HISTORIAL', path: '/demopts/history' },
  { id: 'agents', label: 'AGENTES', path: '/demopts/agents' },
  { id: 'analytics', label: 'ANALYTICS', path: '/demopts/analytics' },
  { id: 'meta', label: 'META', path: '/demopts/meta' },
  { id: 'signals', label: 'SEÑALES', path: '/demopts/signals' },
  { id: 'docs', label: 'AI DOCS', path: '/demopts/docs' },
  { id: 'commerce', label: 'COMERCIO', path: '/demopts/commerce' },
];

const TICKER_ASSETS = [
  { symbol: 'SPY', change: -1.79 },
  { symbol: 'QQQ', change: -2.31 },
  { symbol: 'NVDA', change: -4.16 },
  { symbol: 'AAPL', change: +0.11 },
  { symbol: 'TSLA', change: -3.59 },
  { symbol: 'META', change: -7.96 },
  { symbol: 'BTC', change: -3.47 },
  { symbol: 'ETH', change: -4.96 },
  { symbol: 'EUR/USD', change: -0.12 },
  { symbol: 'GOLD', change: +0.85 },
];

export default function PTSShellPage() {
  const location = useLocation();

  useEffect(() => {
    const prev = localStorage.getItem('bobby_agent_name');
    localStorage.setItem('bobby_agent_name', 'DANY');
    return () => {
      if (prev) localStorage.setItem('bobby_agent_name', prev);
      else localStorage.removeItem('bobby_agent_name');
    };
  }, []);

  const doubled = [...TICKER_ASSETS, ...TICKER_ASSETS];
  const isTerminal = location.pathname === '/demopts/terminal';

  return (
    <WhiteLabelProvider theme={PTS_THEME}>
      <Helmet>
        <title>Dany Agent Trader | Pro Trading Skills — Global Investor</title>
      </Helmet>

      <div className={`${isTerminal ? 'fixed inset-0 z-[100]' : 'min-h-screen'} flex flex-col overflow-hidden`} style={{ background: '#11121e' }}>

        {/* TOP NAV */}
        <nav className="flex-shrink-0 flex justify-between items-center px-4 md:px-6 h-12 z-50"
          style={{ background: 'rgba(30,31,43,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(248,207,44,0.1)' }}>
          <div className="flex items-center gap-6">
            <Link to="/demopts" className="text-base font-black tracking-tighter font-mono" style={{ color: '#F8CF2C' }}>
              DANY AGENT TRADER
            </Link>
            <div className="hidden md:flex gap-4 items-center font-mono uppercase tracking-widest text-[9px]">
              {NAV_ITEMS.map(item => (
                <Link key={item.id} to={item.path}
                  className={`transition-colors pb-0.5 ${
                    location.pathname === item.path
                      ? 'font-bold'
                      : 'text-gray-500 hover:opacity-80'
                  }`}
                  style={location.pathname === item.path ? { color: '#F8CF2C', borderBottom: '1px solid #F8CF2C' } : {}}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="font-mono text-[8px] px-2 py-0.5 rounded" style={{ background: 'rgba(248,207,44,0.1)', color: '#F8CF2C', border: '1px solid rgba(248,207,44,0.2)' }}>
              GLOBAL INVESTOR
            </span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-mono text-[8px] text-green-400">ONLINE</span>
          </div>
        </nav>

        {/* TICKER TAPE */}
        <div className="flex-shrink-0 h-7 flex items-center overflow-hidden" style={{ background: '#1a1b27', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="flex whitespace-nowrap gap-8 text-[9px] font-mono tracking-wider animate-marquee" style={{ color: 'rgba(248,207,44,0.5)' }}>
            {doubled.map((t, i) => (
              <span key={i}>
                <span style={{ color: 'rgba(248,207,44,0.7)' }}>${t.symbol}</span>
                <span className={t.change >= 0 ? 'text-green-400' : 'text-red-400'}> {t.change >= 0 ? '+' : ''}{t.change}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT — renders child route */}
        <div className={`flex-1 ${isTerminal ? 'min-h-0 overflow-hidden' : 'overflow-y-auto'}`}>
          <Outlet />
        </div>

        {/* MOBILE BOTTOM NAV */}
        <nav className="md:hidden fixed bottom-0 w-full h-14 flex items-center justify-around px-2 z-[101]"
          style={{ background: 'rgba(30,31,43,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(248,207,44,0.1)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {NAV_ITEMS.slice(0, 5).map(item => (
            <Link key={item.id} to={item.path}
              className="flex flex-col items-center gap-0.5"
              style={{ color: location.pathname === item.path ? '#F8CF2C' : 'rgba(255,255,255,0.25)' }}>
              <span className="text-[7px] font-mono tracking-[0.5px]">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </WhiteLabelProvider>
  );
}
