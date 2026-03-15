import { DisclaimerBanner } from '@/components/adams/DisclaimerBanner';
import { AdamsChat } from '@/components/adams/AdamsChat';

export default function BobbyAgentTraderPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]" style={{ background: '#0a0a0a' }}>
      <DisclaimerBanner />
      <div className="flex-1 min-h-0">
        <AdamsChat />
      </div>
    </div>
  );
}
