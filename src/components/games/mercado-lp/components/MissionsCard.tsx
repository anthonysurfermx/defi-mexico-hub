import { Card } from '@/components/ui/card';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import {
  TargetIcon,
  CheckCircleIcon,
  PendingIcon,
  SwapperIcon,
  ProviderIcon,
  FarmerIcon,
  AuctioneerIcon,
} from './icons/GameIcons';

interface Mission {
  id: string;
  level: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export const MissionsCard = () => {
  const { player, tokens, auction } = useGame();

  // Define all missions across levels
  const missions: Mission[] = [
    {
      id: 'swap',
      level: 1,
      title: 'N1: Marchante',
      description: 'Haz tu primer intercambio (swap) en el mercado.',
      isCompleted: player.swapCount > 0,
      isCurrent: player.swapCount === 0,
    },
    {
      id: 'lp',
      level: 2,
      title: 'N2: Puestero',
      description: 'Abre un puesto y provee liquidez a un pool.',
      isCompleted: player.lpPositions.length > 0 || player.totalFeesEarned > 0,
      isCurrent: player.swapCount > 0 && player.lpPositions.length === 0,
    },
    {
      id: 'token',
      level: 3,
      title: 'N3: Agricultor',
      description: 'Crea tu propio token y abre su huerto.',
      isCompleted: tokens.filter(t => !t.isBaseToken && !['mango', 'limon', 'sandia', 'platano'].includes(t.id)).length > 0,
      isCurrent: (player.lpPositions.length > 0 || player.totalFeesEarned > 0) &&
                 tokens.filter(t => !t.isBaseToken && !['mango', 'limon', 'sandia', 'platano'].includes(t.id)).length === 0,
    },
    {
      id: 'auction',
      level: 4,
      title: 'N4: Subastero',
      description: 'Participa en una subasta continua (CCA).',
      isCompleted: player.stats.auctionBidsPlaced > 0,
      isCurrent: tokens.filter(t => !t.isBaseToken && !['mango', 'limon', 'sandia', 'platano'].includes(t.id)).length > 0 &&
                 player.stats.auctionBidsPlaced === 0,
    },
  ];

  const getLevelIcon = (level: number, isCompleted: boolean, isCurrent: boolean) => {
    const iconClass = isCompleted
      ? 'text-emerald-500'
      : isCurrent
        ? 'text-primary'
        : 'text-muted-foreground/50';

    const size = 20;

    switch (level) {
      case 1:
        return <SwapperIcon size={size} className={iconClass} />;
      case 2:
        return <ProviderIcon size={size} className={iconClass} />;
      case 3:
        return <FarmerIcon size={size} className={iconClass} />;
      case 4:
        return <AuctioneerIcon size={size} className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <Card className="pixel-card p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <TargetIcon size={18} className="text-primary" />
        <h3 className="font-bold text-sm">Tu progreso</h3>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className={`pixel-card p-3 text-sm transition-all ${
              mission.isCompleted
                ? 'bg-emerald-50 border-emerald-200'
                : mission.isCurrent
                  ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                  : 'bg-muted/30 border-muted'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {getLevelIcon(mission.level, mission.isCompleted, mission.isCurrent)}
                <p className={`font-semibold text-xs ${
                  mission.isCompleted
                    ? 'text-emerald-700'
                    : mission.isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                }`}>
                  {mission.title}
                </p>
              </div>
              {mission.isCompleted ? (
                <CheckCircleIcon size={18} className="text-emerald-500 shrink-0" />
              ) : mission.isCurrent ? (
                <PendingIcon size={18} className="text-primary shrink-0 animate-pulse" />
              ) : (
                <div className="w-[18px] h-[18px] rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>
            <p className={`text-[11px] mt-1.5 leading-relaxed ${
              mission.isCompleted || mission.isCurrent
                ? 'text-muted-foreground'
                : 'text-muted-foreground/60'
            }`}>
              {mission.description}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progreso total</span>
          <span className="font-semibold">{missions.filter(m => m.isCompleted).length}/4 niveles</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
            style={{ width: `${(missions.filter(m => m.isCompleted).length / 4) * 100}%` }}
          />
        </div>
      </div>
    </Card>
  );
};
