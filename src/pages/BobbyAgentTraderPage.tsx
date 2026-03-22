import { Component, type ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, Brain, Zap, Vault, Settings, Bell, MessageSquare, ClipboardList } from 'lucide-react';
import { AdamsChat } from '@/components/adams/AdamsChat';
import { ProactiveNotification } from '@/components/adams/ProactiveNotification';

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
  { label: 'TERMINAL', path: '/agentic-world/bobby' },
  { label: 'CHALLENGE', path: '/agentic-world/bobby/challenge' },
  { label: 'HISTORY', path: '/agentic-world/bobby/history' },
  { label: 'AGENTS', path: '/agentic-world/bobby/agents' },
  { label: 'ANALYTICS', path: '/agentic-world/bobby/analytics' },
];

const ICON_NAV = [
  { Icon: Terminal, label: 'Command', path: '/agentic-world/bobby' },
  { Icon: Brain, label: 'Intel', path: '/agentic-world/bobby/analytics' },
  { Icon: Zap, label: 'Exec', path: '/agentic-world/bobby/challenge' },
  { Icon: Vault, label: 'Vault', path: '/agentic-world/bobby/history' },
];

export default function BobbyAgentTraderPage() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden" style={{ background: '#050505' }}>
      <BobbyErrorBoundary>
        {/* === Top Nav Bar — Stitch style === */}
        <nav className="flex-shrink-0 flex justify-between items-center px-4 md:px-6 h-12 bg-[#131313]/90 backdrop-blur-md border-b border-white/5 z-50 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
          <div className="flex items-center gap-6">
            <Link to="/agentic-world/bobby" className="text-base font-black tracking-tighter text-green-500 font-mono">
              BOBBY AGENT TRADER
            </Link>
            <div className="hidden md:flex gap-5 items-center font-mono uppercase tracking-widest text-[10px]">
              {NAV_ITEMS.map(item => (
                <Link key={item.label} to={item.path}
                  className={currentPath === item.path
                    ? 'text-green-500 border-b border-green-500 pb-0.5 font-bold'
                    : 'text-gray-500 hover:text-green-300 transition-colors'
                  }>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate('/agentic-world/bobby/agents')}
              className="text-gray-500 hover:text-green-300 transition-colors active:scale-90">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/agentic-world/bobby/telegram')}
              className="text-gray-500 hover:text-green-300 transition-colors active:scale-90">
              <Bell className="w-4 h-4" />
            </button>
            {address ? (
              <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center overflow-hidden">
                <span className="text-[9px] font-mono font-bold text-green-400">{address.slice(2, 4).toUpperCase()}</span>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10" />
            )}
          </div>
        </nav>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* === Icon Sidebar — Stitch style (desktop) === */}
          <aside className="hidden md:flex flex-col items-center w-20 bg-[#050505] border-r border-white/5 pt-4 pb-4 flex-shrink-0 z-40">
            {/* BOBBY_OS branding */}
            <div className="flex flex-col items-center gap-1 mb-4 px-2">
              <div className="w-8 h-8 bg-green-500/10 flex items-center justify-center border border-green-500/20 rounded">
                <span className="text-green-400 text-[8px] font-black font-mono">B</span>
              </div>
              <span className="font-mono text-[7px] text-white/20 tracking-tight">BOBBY_OS</span>
            </div>

            <div className="flex flex-col gap-1 items-center w-full flex-1">
              {ICON_NAV.map(item => (
                <Link key={item.label} to={item.path}
                  className={`flex flex-col items-center gap-1 py-3 px-1 w-full transition-all duration-300 ${
                    currentPath === item.path
                      ? 'bg-green-500/10 text-green-500 border-r-2 border-green-500'
                      : 'text-gray-600 hover:bg-white/5 hover:text-green-300'
                  }`}>
                  <item.Icon className="w-[18px] h-[18px]" />
                  <span className="font-mono text-[8px] tracking-tight">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-4 items-center mt-auto pb-2">
              <Link to="/agentic-world/forum" className="text-gray-600 hover:text-green-400 transition-colors" title="Forum">
                <MessageSquare className="w-[18px] h-[18px]" />
              </Link>
              <Link to="/agentic-world/bobby/portfolio" className="text-gray-600 hover:text-green-400 transition-colors" title="Portfolio">
                <ClipboardList className="w-[18px] h-[18px]" />
              </Link>
            </div>
          </aside>

          {/* === Main Chat Area === */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AdamsChat />
          </div>
        </div>

        <ProactiveNotification walletAddress={address} />

        {/* === Mobile Bottom Nav === */}
        <nav className="md:hidden fixed bottom-0 w-full h-14 bg-[#131313]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-[101]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {NAV_ITEMS.slice(0, 4).map(item => (
            <Link key={item.label} to={item.path}
              className={`flex flex-col items-center gap-0.5 ${
                currentPath === item.path ? 'text-green-400' : 'text-white/25'
              }`}>
              <span className="text-[10px]">
                {item.label === 'TERMINAL' ? '⌘' : item.label === 'CHALLENGE' ? '◆' : item.label === 'HISTORY' ? '◎' : '△'}
              </span>
              <span className="text-[7px] font-mono tracking-[1px]">{item.label}</span>
            </Link>
          ))}
        </nav>
      </BobbyErrorBoundary>
    </div>
  );
}
