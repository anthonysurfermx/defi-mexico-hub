// ============================================================
// Bobby Agent Trader — Terminal Page
// Uses unified KineticShell for consistent nav across all pages
// The chat (AdamsChat) is the main content
// ============================================================

import { Component, type ReactNode, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { AdamsChat } from '@/components/adams/AdamsChat';
import { ProactiveNotification } from '@/components/adams/ProactiveNotification';
import KineticShell from '@/components/kinetic/KineticShell';

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
          <h2 className="text-[14px] font-mono font-bold text-white/50">Bobby encontró un error</h2>
          <p className="text-[10px] font-mono text-white/25 text-center max-w-md">{this.state.error}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
            className="px-4 py-2 text-[11px] font-mono border border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/15 transition-all rounded"
          >
            Recargar Bobby
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function BobbyAgentTraderPage() {
  const { address } = useAccount();

  // Reset agent name to BOBBY when on Bobby's pages (PTS demo sets it to DANY)
  useEffect(() => {
    const current = localStorage.getItem('bobby_agent_name');
    if (current === 'DANY' && !window.location.pathname.startsWith('/demopts')) {
      localStorage.removeItem('bobby_agent_name');
    }
  }, []);

  return (
    <KineticShell activeTab="terminal">
      <BobbyErrorBoundary>
        <div className="fixed inset-0 pt-[104px] md:pt-[52px] pb-14 md:pb-0" style={{ background: '#050505' }}>
          <AdamsChat />
        </div>
        <ProactiveNotification walletAddress={address} />
      </BobbyErrorBoundary>
    </KineticShell>
  );
}
