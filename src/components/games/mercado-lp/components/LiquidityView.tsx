import { useState } from 'react';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ConfettiBurst } from './ConfettiBurst';
import { LiquidityBasket } from './LiquidityBasket';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const LiquidityView = () => {
  const { pools, player, addLiquidity, removeLiquidity } = useGame();
  const [selectedPool, setSelectedPool] = useState(pools[0]?.id || '');
  const [amountA, setAmountA] = useState('');
  const [confettiKey, setConfettiKey] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [lpSuccess, setLpSuccess] = useState(false);

  const currentPool = pools.find(p => p.id === selectedPool);
  const currentPosition = player.lpPositions.find(p => p.poolId === selectedPool);

  const calculateRequiredB = (inputA: string) => {
    if (!currentPool || !inputA) return '';
    const ratio = currentPool.reserveB / currentPool.reserveA;
    return (parseFloat(inputA) * ratio).toFixed(2);
  };

  const calculatedAmountB = calculateRequiredB(amountA);

  const handleAddLiquidity = () => {
    if (!currentPool || !amountA) {
      toast.error('Pon cuántas frutas quieres aportar del primer tipo.');
      return;
    }

    const a = parseFloat(amountA);
    const b = parseFloat(calculatedAmountB);

    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) {
      toast.error('Pon un número mayor que 0.');
      return;
    }

    if ((player.inventory[currentPool.tokenA.id] || 0) < a) {
      toast.error(`No tienes suficiente ${currentPool.tokenA.symbol}.`);
      return;
    }

    if ((player.inventory[currentPool.tokenB.id] || 0) < b) {
      toast.error(`No tienes suficiente ${currentPool.tokenB.symbol}.`);
      return;
    }

    const isFirstLP = player.lpPositions.length === 0;
    addLiquidity(selectedPool, a, b);

    // Feedback educativo mejorado
    if (isFirstLP) {
      toast.success(`¡Primera liquidez aportada! 🎉 Ahora ganas fees de cada swap en este pool.`, { duration: 4000 });
    } else {
      toast.success(`¡Puesto abierto! Ahora ganas propinas. 🏪`);
    }

    setConfettiKey(prev => prev + 1);
    setLpSuccess(true);
    setTimeout(() => setLpSuccess(false), 600);
    setAmountA('');
  };

  const handleRemoveLiquidity = () => {
    if (!currentPosition) {
      toast.error('No tienes puesto en este pool.');
      return;
    }

    const feesEarned = currentPosition.feesEarned.tokenA + currentPosition.feesEarned.tokenB;
    removeLiquidity(selectedPool, currentPosition.sharePercent);

    if (feesEarned > 0) {
      toast.success(`¡Puesto cerrado! Ganaste ${feesEarned.toFixed(2)} en propinas. 💰`);
    } else {
      toast.success('Puesto cerrado. 💰');
    }
    setConfettiKey(prev => prev + 1);
  };

  const canAddLiquidity = currentPool && amountA && parseFloat(amountA) > 0 &&
    (player.inventory[currentPool.tokenA.id] || 0) >= parseFloat(amountA) &&
    (player.inventory[currentPool.tokenB.id] || 0) >= parseFloat(calculatedAmountB);

  return (
    <div className="space-y-4">
      <ConfettiBurst trigger={confettiKey} />

      {/* Banner educativo del nivel */}
      {player.lpPositions.length === 0 && (
        <Card className="pixel-card p-4 bg-gradient-to-r from-primary/10 to-emerald-500/5 border-primary/30">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎓</span>
            <div className="space-y-2">
              <h3 className="font-bold text-base">Nivel 2: Puestero - Proveer Liquidez</h3>
              <p className="text-sm text-foreground/90 leading-relaxed">
                <strong>¿Recuerdas los swaps del N1?</strong> Ahora aprenderás <strong>de dónde vienen esas frutas</strong>.
                Tú las aportas al pool y ganas comisión (fee) cada vez que alguien intercambia.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/60 px-3 py-2 rounded">
                <span>💡</span>
                <span>Concepto DeFi: <strong>Liquidity Providing + Fee Earnings + Impermanent Loss</strong></span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="pixel-card p-4 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <span>🎯</span>
          <h3 className="font-bold text-sm">Tu misión</h3>
        </div>
        <div className="pixel-card p-3 text-sm bg-white">
          <p className="font-semibold mb-1">Abre un puesto (LP)</p>
          <p className="text-xs text-muted-foreground">
            Aporta dos frutas al pool. Cada vez que alguien haga un cambio ahí, ganas una propina automática.
          </p>
        </div>
      </Card>

      <Card className="pixel-card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Mercado LP</p>
            <h1 className="text-xl font-bold flex items-center gap-2">🏪 Abrir puesto</h1>
            <p className="text-xs text-muted-foreground">Aporta frutas y gana propinas.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="pixel-button"
            title="Ayuda rápida"
            onClick={() => setShowHelpModal(true)}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Visual del puesto */}
          {currentPool && (
            <LiquidityBasket
              tokenA={currentPool.tokenA}
              tokenB={currentPool.tokenB}
              amountA={currentPool.reserveA}
              amountB={currentPool.reserveB}
              previewAmountA={amountA ? currentPool.reserveA + parseFloat(amountA) : undefined}
              previewAmountB={calculatedAmountB ? currentPool.reserveB + parseFloat(calculatedAmountB) : undefined}
            />
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Elige pool</Label>
            <Select value={selectedPool} onValueChange={(val) => { setSelectedPool(val); setAmountA(''); }}>
              <SelectTrigger className="pixel-border">
                <SelectValue placeholder="Selecciona un pool" />
              </SelectTrigger>
              <SelectContent>
                {pools.map(pool => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.tokenA.emoji} {pool.tokenA.symbol} / {pool.tokenB.emoji} {pool.tokenB.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentPool && (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Cuántas {currentPool.tokenA.emoji} {currentPool.tokenA.symbol} aportas
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amountA}
                    onChange={(e) => setAmountA(e.target.value)}
                    className="pixel-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tienes: {(player.inventory[currentPool.tokenA.id] || 0).toFixed(2)}
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="text-2xl">+</div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Necesitas aportar {currentPool.tokenB.emoji} {currentPool.tokenB.symbol}
                  </Label>
                  <div className={`pixel-card bg-muted p-3 flex items-center justify-between ${lpSuccess ? 'animate-success' : ''}`}>
                    <span className="text-2xl">{currentPool.tokenB.emoji}</span>
                    <span className="text-xl font-bold">{calculatedAmountB || '0.00'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tienes: {(player.inventory[currentPool.tokenB.id] || 0).toFixed(2)}
                  </p>
                  {!amountA && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Pon una cantidad arriba para ver cuánto necesitas del segundo token.
                    </p>
                  )}
                </div>
              </div>

              <div className="pixel-card bg-muted p-3 text-xs space-y-2">
                <p className="font-semibold">¿Cómo funciona?</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Aportas las dos frutas en la proporción del pool.</li>
                  <li>Cada swap en este pool te da una propina automática.</li>
                  <li>Puedes cerrar tu puesto cuando quieras y retirar todo.</li>
                </ul>
              </div>

              <Button
                onClick={handleAddLiquidity}
                className="w-full pixel-button text-lg"
                size="lg"
                disabled={!canAddLiquidity}
              >
                {canAddLiquidity ? '¡Abrir puesto! 🏪' : 'Completa las cantidades'}
              </Button>

              {currentPosition && (
                <>
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <span>📊</span> Tu puesto en este pool
                    </h3>
                    <div className="pixel-card bg-muted/50 p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Participación:</span>
                        <span className="font-bold">{currentPosition.sharePercent.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Propinas ganadas {currentPool.tokenA.emoji}:</span>
                        <span className="font-bold">{currentPosition.feesEarned.tokenA.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Propinas ganadas {currentPool.tokenB.emoji}:</span>
                        <span className="font-bold">{currentPosition.feesEarned.tokenB.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span>Total propinas:</span>
                        <span className="font-bold text-primary">
                          {(currentPosition.feesEarned.tokenA + currentPosition.feesEarned.tokenB).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={handleRemoveLiquidity}
                      className="w-full pixel-button mt-3"
                      variant="secondary"
                    >
                      Cerrar puesto y retirar todo 💰
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      <Card className="pixel-card p-4 bg-card">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <span>💡</span> Tip rápido
        </h3>
        <p className="text-sm text-muted-foreground">
          Mientras más swaps haya en tu pool, más propinas ganas. Los pools grandes y activos suelen dar más fees.
        </p>
      </Card>

      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="pixel-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>❓</span> ¿Qué es ser LP?
            </DialogTitle>
            <DialogDescription className="text-sm space-y-2">
              <p>
                LP = Liquidity Provider = Puestero. Aportas dos frutas al pool y cada vez que alguien hace un cambio (swap),
                una pequeña propina (fee) va directo a ti.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Aportas en la proporción correcta del pool.</li>
                <li>Las propinas se acumulan automáticamente.</li>
                <li>Puedes cerrar tu puesto cuando quieras.</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Nota: En Uniswap v4 real, puedes usar hooks y rangos de precio para optimizar tus ganancias.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button className="pixel-button" onClick={() => setShowHelpModal(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
