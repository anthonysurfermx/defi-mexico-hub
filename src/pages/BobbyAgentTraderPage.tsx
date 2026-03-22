import { Component, type ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { Link, useNavigate } from 'react-router-dom';
import { AdamsChat } from '@/components/adams/AdamsChat';
import { ProactiveNotification } from '@/components/adams/ProactiveNotification';

// Error Boundary — prevents full page crash if Bobby encounters a runtime error
class BobbyErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8" style={{ background: '#050505' }}>
          <span className="text-4xl">⚠️</span>
          <h2 className="text-[14px] font-mono font-bold text-white/50">Bobby encountered an error</h2>
          <p className="text-[10px] font-mono text-white/25 text-center max-w-md">{this.state.error}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
            className="px-4 py-2 text-[11px] font-mono border border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/15 transition-all rounded"
          >
            Reload Bobby
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const NAV_ITEMS = [
  { label: 'TERMINAL', path: '/agentic-world/bobby', active: true },
  { label: 'CHALLENGE', path: '/agentic-world/bobby/challenge' },
  { label: 'AGENTS', path: '/agentic-world/bobby/agents' },
  { label: 'HISTORY', path: '/agentic-world/bobby/history' },
  { label: 'ANALYTICS', path: '/agentic-world/bobby/analytics' },
];

const ICON_NAV = [
  { icon: '⌘', label: 'Command', path: '/agentic-world/bobby', active: true },
  { icon: '◎', label: 'Intel', path: '/agentic-world/bobby/analytics' },
  { icon: '⚡', label: 'Exec', path: '/agentic-world/bobby/challenge' },
  { icon: '◈', label: 'Vault', path: '/agentic-world/bobby/history' },
];

export default function BobbyAgentTraderPage() {
  const { address } = useAccount();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden" style={{ background: '#050505' }}>
      <BobbyErrorBoundary>
        {/* === Stitch Top Nav Bar === */}
        <nav className="flex-shrink-0 flex justify-between items-center px-4 md:px-6 h-12 bg-[#131313]/90 backdrop-blur-md border-b border-white/5 z-50">
          <div className="flex items-center gap-6">
            <Link to="/agentic-world/bobby" className="text-base font-black tracking-tighter text-green-500 font-mono">
              AGENT TRADER
            </Link>
            <div className="hidden md:flex gap-5 items-center font-mono uppercase tracking-widest text-[10px]">
              {NAV_ITEMS.map(item => (
                <Link key={item.label} to={item.path}
                  className={item.active
                    ? 'text-green-500 border-b border-green-500 pb-0.5 font-bold'
                    : 'text-gray-500 hover:text-gray-300 transition-colors'
                  }>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/agentic-world/bobby/agents')} className="text-gray-500 hover:text-green-400 transition-colors text-sm">⚙</button>
            <button onClick={() => navigate('/agentic-world/bobby/telegram')} className="text-gray-500 hover:text-green-400 transition-colors text-sm">🔔</button>
            {address ? (
              <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <span className="text-[9px] font-mono text-green-400">{address.slice(2, 4)}</span>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10" />
            )}
          </div>
        </nav>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* === Stitch Icon Sidebar (desktop) === */}
          <aside className="hidden md:flex flex-col items-center w-[72px] bg-[#050505] border-r border-white/5 pt-4 pb-4 flex-shrink-0 z-40">
            <div className="flex flex-col gap-2 items-center w-full flex-1">
              {ICON_NAV.map(item => (
                <Link key={item.label} to={item.path}
                  className={`flex flex-col items-center gap-0.5 py-2.5 px-2 w-full transition-all ${
                    item.active
                      ? 'bg-green-500/10 text-green-500 border-r-2 border-green-500'
                      : 'text-gray-600 hover:bg-white/5 hover:text-gray-300'
                  }`}>
                  <span className="text-base">{item.icon}</span>
                  <span className="font-mono text-[8px]">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3 items-center mt-auto">
              <Link to="/agentic-world/forum" className="text-gray-600 hover:text-green-400 transition-colors text-base">💬</Link>
              <Link to="/agentic-world/bobby/portfolio" className="text-gray-600 hover:text-green-400 transition-colors text-base">📋</Link>
            </div>
          </aside>

          {/* === Main Chat Area === */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AdamsChat />
          </div>
        </div>

        <ProactiveNotification walletAddress={address} />
      </BobbyErrorBoundary>
    </div>
  );
}
