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
    <div
      className={cn(
        "relative w-full h-64 flex items-center justify-center overflow-hidden",
        "rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/60",
        "border border-white/10 shadow-2xl",
        className
      )}
    >
      {/* Halo + grid */}
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Datos laterales (fuera de los platos) */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 text-xs text-white/85">
        <div className="pixel-card bg-white/6 px-3 py-2 shadow-lg border-transparent">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-lg">{tokenA.emoji}</span>
            {tokenA.symbol}
          </p>
          <p className="text-[11px] text-emerald-200/90">
            {displayReserveA.toFixed(1)} en canasta
          </p>
        </div>
        <div className="pixel-card bg-white/6 px-3 py-2 shadow-lg text-right border-transparent">
          <p className="font-semibold flex items-center gap-2 justify-end">
            {tokenB.symbol}
            <span className="text-lg">{tokenB.emoji}</span>
          </p>
          <p className="text-[11px] text-cyan-200/90">
            {displayReserveB.toFixed(1)} en canasta
          </p>
        </div>
      </div>

      {/* Base */}
      <div className="absolute bottom-6 w-3 h-24 bg-gradient-to-b from-white/70 to-white/10 rounded-full" />

      {/* Brazo con glassmorphism */}
      <div className="absolute w-80 max-w-full animate-bob-slow pt-6">
        <div
          className="relative w-72 h-3 bg-white/30 backdrop-blur rounded-full transition-transform duration-500 mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          style={{ transform: `rotate(${tiltAngle}deg)` }}
        >
          {/* Plato izquierdo */}
          <div
            className="absolute -left-4 -top-16 w-24 h-24 bg-white/18 rounded-2xl shadow-2xl transition-transform duration-500 backdrop-blur"
            style={{ transform: `rotate(${-tiltAngle}deg)` }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center animate-pan-bounce">
              <span className="text-4xl drop-shadow">{tokenA.emoji}</span>
              <span className="text-xs font-bold mt-1 text-white">{displayReserveA.toFixed(0)}</span>
            </div>
          </div>

          {/* Plato derecho */}
          <div
            className="absolute -right-4 -top-16 w-24 h-24 bg-white/18 rounded-2xl shadow-2xl transition-transform duration-500 backdrop-blur"
            style={{ transform: `rotate(${-tiltAngle}deg)` }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center animate-pan-bounce delay-150">
              <span className="text-4xl drop-shadow" style={{ animationDelay: '0.35s' }}>{tokenB.emoji}</span>
              <span className="text-xs font-bold mt-1 text-white">{displayReserveB.toFixed(0)}</span>
            </div>
          </div>

          {/* Fulcro */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-8 h-8 bg-primary border-2 border-white/40 rounded-full shadow-lg animate-pulse-slow" />
        </div>
      </div>

      {/* Precio */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className={cn(
          "pixel-card px-4 py-2 text-xs text-white text-center shadow-lg border",
          isPreview ? "bg-emerald-500/20 border-emerald-300/50" : "bg-white/10 border-white/20"
        )}>
          <p className="font-semibold tracking-wide">1 {tokenA.symbol} = {ratio.toFixed(4)} {tokenB.symbol}</p>
          {isPreview && <p className="text-[11px] text-emerald-100 mt-1">Movimiento estimado</p>}
        </div>
      </div>
    </div>
  );
};
