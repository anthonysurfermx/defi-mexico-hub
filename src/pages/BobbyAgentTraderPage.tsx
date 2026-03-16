import { useAccount } from 'wagmi';
import { DisclaimerBanner } from '@/components/adams/DisclaimerBanner';
import { AdamsChat } from '@/components/adams/AdamsChat';
import { ProactiveNotification } from '@/components/adams/ProactiveNotification';

export default function BobbyAgentTraderPage() {
  const { address } = useAccount();
  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden" style={{ background: '#050505' }}>
      <DisclaimerBanner />
      <div className="flex-1 min-h-0 overflow-hidden">
        <AdamsChat />
      </div>
      <ProactiveNotification walletAddress={address} />
    </div>
  );
}
