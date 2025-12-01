import { Button } from '@/components/ui/button';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { BookOpen, Map, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

// Componente simple de banderas para cambio de idioma
const LanguageFlags = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => i18n.changeLanguage('es')}
        className={`text-xl transition-all duration-200 hover:scale-110 ${
          i18n.language === 'es' ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'
        }`}
        title="Español"
        aria-label="Cambiar a Español"
      >
        🇲🇽
      </button>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`text-xl transition-all duration-200 hover:scale-110 ${
          i18n.language === 'en' ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'
        }`}
        title="English"
        aria-label="Switch to English"
      >
        🇺🇸
      </button>
    </div>
  );
};

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
      
      <header className="bg-gradient-to-r from-primary/20 via-purple-500/10 to-pink-500/10 border-b border-primary/20 p-3 mb-4">
        <div className="container mx-auto space-y-3">
          {/* Fila superior: Logo, banderas e iconos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl animate-float">🏪</span>
              <h1 className="text-xl md:text-2xl font-bold tracking-wider">MERCADO LP</h1>
            </div>

            <div className="flex items-center gap-2">
              <LanguageFlags />
              <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/40 bg-card shadow-sm flex items-center justify-center">
                <img
                  src={player.avatar || '/player.png'}
                  alt="Tu personaje"
                  className="w-full h-full object-contain"
                />
              </div>
              <ReputationDisplay />
              <div className="pixel-card bg-card px-2 py-1.5 text-xs text-foreground/90 hidden sm:block">
                <span className="text-amber-500">⭐</span> XP: {player.xp}
              </div>
              <Button
                onClick={onOpenMap}
                variant="outline"
                size="sm"
                className="rounded-full px-2 sm:px-3"
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Mapa</span>
              </Button>
              <Button
                onClick={handleLeaderboardClick}
                variant="outline"
                size="sm"
                className="rounded-full px-2"
                title="Leaderboard"
              >
                <Trophy className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowEducation(true)}
                variant="outline"
                size="sm"
                className="rounded-full px-2"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Fila inferior: Botones de nivel */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Button
              onClick={() => setCurrentLevel(1)}
              variant={currentLevel === 1 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8"
            >
              <span className="font-bold">N1</span>
              <span className="mx-0.5">🔄</span>
              <span className="hidden xs:inline sm:inline">MARCHANTE</span>
            </Button>
            <Button
              onClick={() => setCurrentLevel(2)}
              variant={currentLevel === 2 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8"
            >
              <span className="font-bold">N2</span>
              <span className="mx-0.5">🏪</span>
              <span className="hidden xs:inline sm:inline">PUESTERO</span>
            </Button>
            <Button
              onClick={() => setCurrentLevel(3)}
              variant={currentLevel === 3 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8"
            >
              <span className="font-bold">N3</span>
              <span className="mx-0.5">🚜</span>
              <span className="hidden xs:inline sm:inline">AGRICULTOR</span>
            </Button>
            <Button
              onClick={() => setCurrentLevel(4)}
              variant={currentLevel === 4 ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8"
            >
              <span className="font-bold">N4</span>
              <span className="mx-0.5">🔨</span>
              <span className="hidden xs:inline sm:inline">SUBASTERO</span>
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
