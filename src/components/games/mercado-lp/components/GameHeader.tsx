import { Button } from '@/components/ui/button';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { BookOpen, Map, Trophy } from 'lucide-react';
import { useState } from 'react';
import { EducationModal } from './EducationModal';
import { ReputationDisplay } from './ReputationDisplay';
import { GameEventBanner } from './GameEventBanner';
import { Leaderboard } from './Leaderboard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GameHeaderProps {
  onOpenMap: () => void;
  onLoginPrompt?: (reason: 'leaderboard') => void;
}

export const GameHeader = ({ onOpenMap, onLoginPrompt }: GameHeaderProps) => {
  const { currentLevel, setCurrentLevel, player, currentEvent, eventTimeRemaining } = useGame();
  const [showEducation, setShowEducation] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleLeaderboardClick = () => {
    setShowLeaderboard(true);
    // Trigger login prompt for leaderboard view (only if not hidden)
    const hidden = localStorage.getItem('mercado_lp_hide_login_prompt_leaderboard');
    if (onLoginPrompt && !hidden) {
      setTimeout(() => onLoginPrompt('leaderboard'), 2000);
    }
  };

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
              onClick={handleLeaderboardClick}
              variant="outline"
              size="sm"
              className="rounded-full"
              title="Leaderboard"
            >
              <Trophy className="w-4 h-4" />
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

      {/* Leaderboard Modal */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Ranking de Jugadores
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <Leaderboard />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
