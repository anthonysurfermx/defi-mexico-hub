import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { GameLevel } from '@/components/games/mercado-lp/types/game';
import { LightbulbIcon, CheckCircleIcon, CircleIcon } from 'lucide-react';

type MissionConfig = {
  title: string;
  detail: string;
  help: string;
  isCompleted: boolean;
};

const buildMission = (level: GameLevel, ctx: ReturnType<typeof useGame>): MissionConfig => {
  const { player, tokens, auction } = ctx;
  switch (level) {
    case 1:
      return {
        title: 'Haz tu primer swap',
        detail: 'Intercambia cualquier fruta por otra usando el AMM.',
        help: 'Elige dos frutas, pon un monto pequeño y confirma el swap.',
        isCompleted: player.swapCount > 0,
      };
    case 2:
      return {
        title: 'Abre tu primer puesto (LP)',
        detail: 'Deposita dos frutas balanceadas en un pool y gana fees.',
        help: 'Selecciona un par, aporta cantidades similares y confirma la liquidez.',
        isCompleted: player.lpPositions.length > 0,
      };
    case 3:
      return {
        title: 'Crea tu primera fruta/token',
        detail: 'Define nombre, símbolo y liquidez inicial para lanzarlo.',
        help: 'Completa los campos, define el par con PESO y confirma el lanzamiento.',
        isCompleted: tokens.some(t => !t.isBaseToken),
      };
    case 4:
    default:
      return {
        title: 'Participa en una subasta',
        detail: 'Coloca una oferta en la CCA y asegura tokens al mejor precio.',
        help: 'Elige un bloque futuro, pon tope de precio y gasto máximo, y confirma.',
        isCompleted: (auction?.bids?.length || 0) > 0 || player.stats.auctionBidsPlaced > 0,
      };
  }
};

export const CurrentMissionBar = () => {
  const ctx = useGame();
  const { currentLevel } = ctx;
  const mission = buildMission(currentLevel, ctx);

  return (
    <Card className="pixel-card p-3 bg-card/80 border-primary/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          {mission.isCompleted ? (
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          ) : (
            <CircleIcon className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Misión actual</p>
            <Badge variant={mission.isCompleted ? 'secondary' : 'outline'}>
              {mission.isCompleted ? 'Lista' : 'En curso'}
            </Badge>
          </div>
          <p className="text-sm text-foreground font-bold">{mission.title}</p>
          <p className="text-xs text-muted-foreground">{mission.detail}</p>
        </div>
      </div>
      <Button size="sm" variant="ghost" className="justify-start sm:justify-center px-3">
        <LightbulbIcon className="w-4 h-4 mr-1 text-amber-500" />
        <span className="text-xs">{mission.help}</span>
      </Button>
    </Card>
  );
};
