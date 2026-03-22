// ============================================================
// Deploy Agent Page — wrapper for the AgentWizard
// Route: /agentic-world/deploy
// ============================================================

import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import AgentWizard from '@/components/kinetic/AgentWizard';

export default function DeployAgentPage() {
  const navigate = useNavigate();
  const { address } = useAccount();

  const handleComplete = async (config: {
    agent_name: string;
    voice: 'male' | 'female';
    personality: 'direct' | 'analytical' | 'wise';
    cadence_hours: number;
    markets: string[];
    delivery: string[];
  }) => {
    if (!address) {
      navigate('/agentic-world/bobby');
      return;
    }

    try {
      const res = await fetch('/api/agent-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          ...config,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // Save agent config locally for immediate use in terminal
        localStorage.setItem('agent_profile', JSON.stringify(data.agent_profile));
        localStorage.setItem('bobby_trading_mode', 'paper');
      }
    } catch (err) {
      console.error('[DeployAgent] Setup failed:', err);
    }

    // Navigate to terminal regardless — it will show deploying state
    navigate('/agentic-world/bobby');
  };

  const handleSkip = () => {
    navigate('/agentic-world/bobby');
  };

  return <AgentWizard onComplete={handleComplete} onSkip={handleSkip} />;
}
