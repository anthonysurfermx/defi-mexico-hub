import { Button } from '@/components/ui/button';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { BookOpen, Map } from 'lucide-react';
import { useState } from 'react';
import { EducationModal } from './EducationModal';
import { ReputationDisplay } from './ReputationDisplay';
import { GameEventBanner } from './GameEventBanner';

interface GameHeaderProps {
  onOpenMap: () => void;
}

export const GameHeader = ({ onOpenMap }: GameHeaderProps) => {
  const { currentLevel, setCurrentLevel, player, currentEvent, eventTimeRemaining } = useGame();
  const [showEducation, setShowEducation] = useState(false);

  return (
    <>
      <GameEventBanner event={currentEvent} remainingTime={eventTimeRemaining} />
      
      <header className="bg-gradient-to-r from-primary/20 via-purple-500/10 to-pink-500/10 border-b border-primary/20 p-4 mb-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-float">🏪</span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider">MERCADO LP</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setCurrentLevel(1)}
              variant={currentLevel === 1 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs px-4"
            >
              🔄 MARCHANTE
            </Button>
            <Button
              onClick={() => setCurrentLevel(2)}
              variant={currentLevel === 2 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs px-4"
            >
              🏪 PUESTERO
            </Button>
            <Button
              onClick={() => setCurrentLevel(3)}
              variant={currentLevel === 3 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs px-4"
            >
              🚜 AGRICULTOR
            </Button>
            <Button
              onClick={() => setCurrentLevel(4)}
              variant={currentLevel === 4 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs px-4"
            >
              🔨 SUBASTERO
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ReputationDisplay />
            <div className="pixel-card bg-card px-3 py-2 text-xs text-foreground/90">
              <span className="text-amber-500">⭐</span> XP: {player.xp}
            </div>
            <Button
              onClick={onOpenMap}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Map className="w-4 h-4 mr-1" /> Mapa
            </Button>
            <Button
              onClick={() => setShowEducation(true)}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <BookOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <EducationModal open={showEducation} onClose={() => setShowEducation(false)} />
    </>
  );
};
