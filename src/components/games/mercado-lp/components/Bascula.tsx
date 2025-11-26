import { Token } from '@/components/games/mercado-lp/types/game';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface BasculaProps {
  tokenA: Token;
  tokenB: Token;
  reserveA: number;
  reserveB: number;
  className?: string;
  previewReserveA?: number;
  previewReserveB?: number;
}

export const Bascula = ({ tokenA, tokenB, reserveA, reserveB, className, previewReserveA, previewReserveB }: BasculaProps) => {
  const displayReserveA = previewReserveA ?? reserveA;
  const displayReserveB = previewReserveB ?? reserveB;
  const isPreview = previewReserveA !== undefined && previewReserveB !== undefined;

  const safeReserveA = Math.max(displayReserveA, 0.0001);
  const ratio = displayReserveB / safeReserveA;
  const maxRatio = 30;
  const normalizedRatio = Math.min(ratio / maxRatio, 1);
  const tiltAngle = useMemo(() => (normalizedRatio - 0.5) * 30, [normalizedRatio]);

  return (
    <div className={cn("relative w-full h-48 flex items-center justify-center", className)}>
      {/* Scale base */}
      <div className="absolute bottom-0 w-4 h-24 bg-foreground rounded-t"></div>
      
      {/* Scale beam with subtle bob */}
      <div className="absolute w-72 max-w-full animate-bob-slow">
        <div 
          className="relative w-64 h-3 bg-foreground rounded-full transition-transform duration-500 mx-auto"
          style={{ transform: `rotate(${tiltAngle}deg)` }}
        >
          {/* Left pan */}
          <div 
            className="absolute -left-2 -top-16 w-20 h-20 bg-game-yellow border-4 border-foreground rounded-full shadow-lg transition-transform duration-500"
            style={{ transform: `rotate(${-tiltAngle}deg)` }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center animate-pan-bounce">
              <span className="text-3xl animate-shake">{tokenA.emoji}</span>
              <span className="text-xs font-bold mt-1">{displayReserveA.toFixed(0)}</span>
            </div>
          </div>
          
          {/* Right pan */}
          <div 
            className="absolute -right-2 -top-16 w-20 h-20 bg-secondary border-4 border-foreground rounded-full shadow-lg transition-transform duration-500"
            style={{ transform: `rotate(${-tiltAngle}deg)` }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center animate-pan-bounce delay-150">
              <span className="text-3xl animate-shake" style={{ animationDelay: '0.4s' }}>{tokenB.emoji}</span>
              <span className="text-xs font-bold mt-1">{displayReserveB.toFixed(0)}</span>
            </div>
          </div>
          
          {/* Center fulcrum */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-6 h-6 bg-primary border-2 border-foreground rounded-full shadow-sm animate-pulse-slow"></div>
        </div>
      </div>
      
      {/* Price display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-4 pixel-card bg-card px-3 py-2 text-xs text-center">
        <p>1 {tokenA.symbol} = {ratio.toFixed(4)} {tokenB.symbol}</p>
        {isPreview && <p className="text-[10px] text-muted-foreground mt-1">Movimiento estimado</p>}
      </div>
    </div>
  );
};
