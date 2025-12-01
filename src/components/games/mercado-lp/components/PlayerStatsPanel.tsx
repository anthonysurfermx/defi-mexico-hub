import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { getPlayerLevel, getXPProgress } from '@/components/games/mercado-lp/data/playerLevels';
import { useTranslation } from 'react-i18next';

export const PlayerStatsPanel = () => {
  const { player, tokens } = useGame();
  const { t } = useTranslation();

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
              <p className="text-xs text-muted-foreground">
                {t('mercadoLP.player.level', { level: currentLevel.level })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('mercadoLP.player.xpTotal')}</p>
            <p className="text-sm font-bold">{player.xp}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{t('mercadoLP.player.progress')}</span>
            <span className="font-mono">
              {t('mercadoLP.player.xpRange', { current: xpProgress.current, max: xpProgress.max })}
            </span>
          </div>
          <Progress value={xpProgress.percentage} className="h-2" />

          {currentLevel.level < 6 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t('mercadoLP.player.xpToNext', {
                remaining: (xpProgress.max - xpProgress.current).toFixed(0),
                next: getPlayerLevel(currentLevel.maxXP + 1).name,
              })}
            </p>
          )}
        </div>

        {/* Streak indicator */}
        {player.currentStreak > 0 && (
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1">
                {t('mercadoLP.player.streak', {
                  days: player.currentStreak,
                  s: player.currentStreak !== 1 ? 's' : '',
                })}
              </span>
              {player.bestStreak > player.currentStreak && (
                <span className="text-xs text-muted-foreground">
                  {t('mercadoLP.player.bestStreak', { best: player.bestStreak })}
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="pixel-card p-4" data-tutorial="inventory">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <span>🧺</span> {t('mercadoLP.player.inventory')}
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
    </div>
  );
};
