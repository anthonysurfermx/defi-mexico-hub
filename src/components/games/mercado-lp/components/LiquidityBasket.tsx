import { Token } from '@/components/games/mercado-lp/types/game';
import { cn } from '@/lib/utils';

interface LiquidityBasketProps {
  tokenA: Token;
  tokenB: Token;
  amountA: number;
  amountB: number;
  previewAmountA?: number;
  previewAmountB?: number;
  className?: string;
}

export const LiquidityBasket = ({
  tokenA,
  tokenB,
  amountA,
  amountB,
  previewAmountA,
  previewAmountB,
  className,
}: LiquidityBasketProps) => {
  // Calcular cuántas frutas mostrar (máximo 15 por lado para no saturar)
  const getFruitCount = (amount: number) => {
    if (amount === 0) return 0;
    if (amount < 10) return Math.ceil(amount);
    if (amount < 50) return Math.ceil(amount / 5);
    if (amount < 100) return Math.ceil(amount / 10);
    return Math.min(Math.ceil(amount / 20), 15);
  };

  const fruitCountA = getFruitCount(amountA);
  const fruitCountB = getFruitCount(amountB);
  const previewCountA = previewAmountA ? getFruitCount(previewAmountA) : 0;
  const previewCountB = previewAmountB ? getFruitCount(previewAmountB) : 0;

  const renderFruits = (count: number, emoji: string, isPreview = false) => {
    return Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        className={cn(
          'text-3xl transition-all duration-300',
          isPreview ? 'opacity-40 animate-pulse' : 'animate-fade-in',
          'inline-block'
        )}
        style={{
          animationDelay: `${i * 50}ms`,
        }}
      >
        {emoji}
      </span>
    ));
  };

  return (
    <div className={cn('pixel-card bg-gradient-to-b from-primary/10 to-purple-500/5 p-6 relative overflow-hidden', className)}>
      {/* Fondo decorativo del puesto */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-8 bg-primary" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-primary" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
            🏪 Tu Puesto de Liquidez
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 min-h-[180px]">
          {/* Lado A - Primera fruta */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="pixel-card bg-card/80 p-4 min-h-[120px] w-full flex flex-wrap gap-2 items-center justify-center">
              {fruitCountA === 0 && previewCountA === 0 ? (
                <div className="text-4xl opacity-20">🧺</div>
              ) : (
                <>
                  {renderFruits(fruitCountA, tokenA.emoji)}
                  {renderFruits(previewCountA, tokenA.emoji, true)}
                </>
              )}
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{tokenA.emoji}</span>
                <span className="text-lg font-bold">{tokenA.symbol}</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {amountA.toFixed(1)}
              </div>
              {previewAmountA && previewAmountA > amountA && (
                <div className="text-xs text-muted-foreground">
                  → {previewAmountA.toFixed(1)} (preview)
                </div>
              )}
            </div>
          </div>

          {/* Separador vertical */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-32 bg-primary/20 rounded-full" />

          {/* Lado B - Segunda fruta */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="pixel-card bg-card/80 p-4 min-h-[120px] w-full flex flex-wrap gap-2 items-center justify-center">
              {fruitCountB === 0 && previewCountB === 0 ? (
                <div className="text-4xl opacity-20">🧺</div>
              ) : (
                <>
                  {renderFruits(fruitCountB, tokenB.emoji)}
                  {renderFruits(previewCountB, tokenB.emoji, true)}
                </>
              )}
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{tokenB.emoji}</span>
                <span className="text-lg font-bold">{tokenB.symbol}</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {amountB.toFixed(1)}
              </div>
              {previewAmountB && previewAmountB > amountB && (
                <div className="text-xs text-muted-foreground">
                  → {previewAmountB.toFixed(1)} (preview)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Indicador de ratio */}
        <div className="mt-4 text-center">
          <div className="inline-block pixel-card bg-card/60 px-3 py-1 text-xs">
            <span className="text-muted-foreground">Proporción del pool:</span>{' '}
            <span className="font-bold">
              1 {tokenA.symbol} = {(amountB / Math.max(amountA, 0.01)).toFixed(2)} {tokenB.symbol}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
