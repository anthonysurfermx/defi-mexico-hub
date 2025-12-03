import { Token } from '@/components/games/mercado-lp/types/game';
import { cn } from '@/lib/utils';
import { TokenIcon } from './icons/GameIcons';

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

  // Calcular el balance visual (0 = equilibrado, positivo = B pesa más, negativo = A pesa más)
  const balance = Math.max(-1, Math.min(1, (displayReserveB - displayReserveA) / Math.max(displayReserveA, displayReserveB, 1)));

  return (
    <div
      className={cn(
        "relative w-full h-48 sm:h-56 flex flex-col items-center justify-center overflow-hidden",
        "rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-900/60",
        "border border-white/10 shadow-2xl p-4",
        className
      )}
    >
      {/* Halo + grid */}
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Contenedor de los platos - diseño simplificado con flexbox */}
      <div className="relative z-10 flex items-end justify-center gap-4 sm:gap-8 w-full max-w-xs">
        {/* Plato izquierdo (Token A) */}
        <div
          className="flex flex-col items-center transition-transform duration-500"
          style={{ transform: `translateY(${balance < 0 ? Math.abs(balance) * 12 : 0}px)` }}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur rounded-xl border border-white/20 shadow-xl flex flex-col items-center justify-center">
            <TokenIcon tokenId={tokenA.id} size={28} className="drop-shadow" />
            <span className="text-[10px] sm:text-xs font-bold mt-1 text-white">{displayReserveA.toFixed(0)}</span>
          </div>
          <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-white/40 to-white/10 mt-1" />
          <p className="text-[10px] sm:text-xs font-semibold text-emerald-300 mt-1">{tokenA.symbol}</p>
        </div>

        {/* Centro - Fulcro y barra */}
        <div className="flex flex-col items-center -mb-2">
          <div className="w-20 sm:w-28 h-1 bg-gradient-to-r from-white/20 via-white/40 to-white/20 rounded-full" />
          <div className="w-3 h-8 sm:h-10 bg-gradient-to-b from-white/50 to-white/20 rounded-b-full" />
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary border-2 border-white/40 rounded-full shadow-lg -mt-1" />
        </div>

        {/* Plato derecho (Token B) */}
        <div
          className="flex flex-col items-center transition-transform duration-500"
          style={{ transform: `translateY(${balance > 0 ? Math.abs(balance) * 12 : 0}px)` }}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur rounded-xl border border-white/20 shadow-xl flex flex-col items-center justify-center">
            <TokenIcon tokenId={tokenB.id} size={28} className="drop-shadow" />
            <span className="text-[10px] sm:text-xs font-bold mt-1 text-white">{displayReserveB.toFixed(0)}</span>
          </div>
          <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-white/40 to-white/10 mt-1" />
          <p className="text-[10px] sm:text-xs font-semibold text-cyan-300 mt-1">{tokenB.symbol}</p>
        </div>
      </div>

      {/* Precio */}
      <div className="relative z-10 mt-4">
        <div className={cn(
          "pixel-card px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs text-white text-center shadow-lg border",
          isPreview ? "bg-emerald-500/20 border-emerald-300/50" : "bg-white/10 border-white/20"
        )}>
          <p className="font-semibold tracking-wide">1 {tokenA.symbol} = {ratio.toFixed(4)} {tokenB.symbol}</p>
          {isPreview && <p className="text-[9px] sm:text-[11px] text-emerald-100 mt-1">Movimiento estimado</p>}
        </div>
      </div>
    </div>
  );
};
