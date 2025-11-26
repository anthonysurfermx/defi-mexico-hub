import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { getPlayerLevel, getXPProgress } from '@/components/games/mercado-lp/data/playerLevels';

export const PlayerStatsPanel = () => {
  const { player, tokens, challenges } = useGame();

  const currentLevel = getPlayerLevel(player.xp);
  const xpProgress = getXPProgress(player.xp);

  return (
    <div className="space-y-4">
      {/* XP and Level Progress */}
      <Card className="pixel-card p-4 bg-gradient-to-br from-primary/10 to-purple-500/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentLevel.icon}</span>
            <div>
              <h3 className="text-sm font-bold">{currentLevel.name}</h3>
              <p className="text-xs text-muted-foreground">Nivel {currentLevel.level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">XP Total</p>
            <p className="text-sm font-bold">{player.xp}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-mono">{xpProgress.current} / {xpProgress.max}</span>
          </div>
          <Progress value={xpProgress.percentage} className="h-2" />

          {currentLevel.level < 6 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {(xpProgress.max - xpProgress.current).toFixed(0)} XP para {getPlayerLevel(currentLevel.maxXP + 1).name}
            </p>
          )}
        </div>

        {/* Streak indicator */}
        {player.currentStreak > 0 && (
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1">
                🔥 Racha de {player.currentStreak} día{player.currentStreak !== 1 ? 's' : ''}
              </span>
              {player.bestStreak > player.currentStreak && (
                <span className="text-xs text-muted-foreground">
                  Mejor: {player.bestStreak}
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="pixel-card p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <span>🧺</span> Bolsa de mercado
        </h3>

        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {Object.entries(player.inventory).map(([tokenId, amount]) => {
              const token = tokens.find(t => t.id === tokenId);
              if (!token || amount === 0) return null;

              return (
                <div key={tokenId} className="pixel-card bg-muted p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{token.emoji}</span>
                    <span className="text-xs font-bold">{token.symbol}</span>
                  </div>
                  <span className="text-xs font-mono">{amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      <Card className="pixel-card p-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <span>🎯</span> Challenges
        </h3>

        <ScrollArea className="h-[150px]">
          <div className="space-y-2">
            {challenges
              .filter(c => c.level <= 3)
              .map(challenge => (
                <div
                  key={challenge.id}
                  className={`pixel-card p-2 text-xs ${
                    challenge.completed ? 'bg-muted' : 'bg-muted'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span>{challenge.completed ? '✅' : '⭕'}</span>
                    <div className="flex-1">
                      <p className="font-bold">{challenge.title}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {challenge.description}
                      </p>
                      {!challenge.completed && (
                        <p className="text-primary text-[10px] mt-1">
                          +{challenge.xpReward} XP
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
