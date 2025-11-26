import { useEffect, useMemo, useState } from 'react';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ConfettiBurst } from '@/components/games/mercado-lp/components/ConfettiBurst';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowDownUp, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Bascula } from './Bascula';

export const SwapView = () => {
  const { tokens, pools, player, swap, getEffectiveFeePercent, openMap } = useGame();
  const [selectedPool, setSelectedPool] = useState(pools[0]?.id || '');
  const [amountIn, setAmountIn] = useState('');
  const [tokenIn, setTokenIn] = useState<string>('');
  const [confettiKey, setConfettiKey] = useState(0);
  const [showSlippageModal, setShowSlippageModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTour, setShowTour] = useState(true);
  const [swapSuccess, setSwapSuccess] = useState(false);

  const currentPool = pools.find(p => p.id === selectedPool);

  useEffect(() => {
    if (!currentPool) return;
    const tokenOptions = [currentPool.tokenA, currentPool.tokenB];
    const best = tokenOptions.reduce((bestToken, t) => {
      const bal = player.inventory[t.id] || 0;
      const bestBal = player.inventory[bestToken.id] || 0;
      return bal > bestBal ? t : bestToken;
    }, tokenOptions[0]);
    setTokenIn(best.id);
    setAmountIn('');
  }, [currentPool, player.inventory]);

  const effectiveFeePercent = useMemo(() => {
    if (!currentPool) return 0;
    const amount = amountIn ? parseFloat(amountIn) : 0;
    if (!tokenIn || !amount || amount <= 0) {
      return (currentPool.baseFeeBps || 30) / 100;
    }
    return getEffectiveFeePercent(currentPool, amount, tokenIn);
  }, [currentPool, amountIn, tokenIn, getEffectiveFeePercent]);

  const getPreviewReserves = () => {
    if (!currentPool || !amountIn || !tokenIn) return null;

    const amount = parseFloat(amountIn);
    if (isNaN(amount) || amount <= 0) return null;

    const isTokenA = currentPool.tokenA.id === tokenIn;
    const reserveIn = isTokenA ? currentPool.reserveA : currentPool.reserveB;
    const reserveOut = isTokenA ? currentPool.reserveB : currentPool.reserveA;

    const feePercent = getEffectiveFeePercent(currentPool, amount, tokenIn);
    const amountInWithFee = amount * (1 - feePercent / 100);
    const amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

    const newReserveIn = reserveIn + amount;
    const newReserveOut = Math.max(reserveOut - amountOut, 0);

    return isTokenA
      ? { reserveA: newReserveIn, reserveB: newReserveOut }
      : { reserveA: newReserveOut, reserveB: newReserveIn };
  };

  const calculateOutput = () => {
    if (!currentPool || !amountIn || !tokenIn) return 0;

    const amount = parseFloat(amountIn);
    const isTokenA = currentPool.tokenA.id === tokenIn;
    const reserveIn = isTokenA ? currentPool.reserveA : currentPool.reserveB;
    const reserveOut = isTokenA ? currentPool.reserveB : currentPool.reserveA;

    const amountInWithFee = amount * (1 - effectiveFeePercent / 100);
    return (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
  };

  const calculatePriceImpact = () => {
    if (!currentPool || !amountIn || !tokenIn) return 0;
    const output = calculateOutput();
    const isTokenA = currentPool.tokenA.id === tokenIn;
    const reserveOut = isTokenA ? currentPool.reserveB : currentPool.reserveA;
    return (output / reserveOut) * 100;
  };

  const handleSwap = () => {
    const isFirstSwap = player.swapCount === 0;
    if (!currentPool || !tokenIn || !amountIn) {
      toast.error('Elige un puesto, una fruta y escribe una cantidad mayor que 0.');
      return;
    }

    const token = tokens.find(t => t.id === tokenIn);
    if (!token) return;

    const amount = parseFloat(amountIn);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Pon un número mayor que 0.');
      return;
    }

    if ((player.inventory[token.id] || 0) < amount) {
      toast.error('No tienes suficiente en tu bolsa para este cambio.');
      return;
    }

    swap(selectedPool, token, amount);

    const isTokenA = currentPool.tokenA.id === tokenIn;
    const tokenOut = isTokenA ? currentPool.tokenB : currentPool.tokenA;
    const amountOut = calculateOutput();

    // Feedback educativo mejorado
    if (isFirstSwap) {
      toast.success(`¡Primer swap exitoso! 🎉 Usaste un AMM automático sin intermediarios.`, { duration: 4000 });
    } else if (player.swapCount === 2) {
      toast.success(`${amount.toFixed(2)} ${token.symbol} → ~${amountOut.toFixed(2)} ${tokenOut.symbol}. La fórmula x·y=k ajustó el precio!`, { duration: 3500 });
    } else {
      toast.success(`Listo: ${amount.toFixed(2)} ${token.symbol} por ~${amountOut.toFixed(2)} ${tokenOut.symbol}.`);
    }

    setConfettiKey(prev => prev + 1);
    setSwapSuccess(true);
    setTimeout(() => setSwapSuccess(false), 600);
    setAmountIn('');
    if (isFirstSwap) {
      setShowSlippageModal(true);
      openMap();
    }
  };

  const priceImpact = calculatePriceImpact();
  const previewReserves = getPreviewReserves();

  const spotText = useMemo(() => {
    if (!currentPool) return '';
    const spot = currentPool.reserveB / Math.max(currentPool.reserveA, 0.0001);
    if (!tokenIn) return `Hoy: 1 ${currentPool.tokenA.symbol} ≈ ${spot.toFixed(2)} ${currentPool.tokenB.symbol}`;
    const isA = tokenIn === currentPool.tokenA.id;
    return isA
      ? `Hoy: 1 ${currentPool.tokenA.symbol} ≈ ${spot.toFixed(2)} ${currentPool.tokenB.symbol}`
      : `Hoy: 1 ${currentPool.tokenB.symbol} ≈ ${(1 / spot).toFixed(2)} ${currentPool.tokenA.symbol}`;
  }, [currentPool, tokenIn]);

  const priceMood = (() => {
    if (!amountIn || !tokenIn) return { label: 'Pon una cantidad para ver el precio', tone: 'muted' as const };
    if (priceImpact < 3) return { label: 'Buen precio 👍', tone: 'good' as const };
    if (priceImpact < 8) return { label: 'Precio regular 😐', tone: 'ok' as const };
    if (priceImpact < 15) return { label: 'Está saliendo caro 😬', tone: 'meh' as const };
    return { label: 'Muy caro, compra menos 🛑', tone: 'bad' as const };
  })();

  const depthState = useMemo(() => {
    if (!currentPool) return { label: 'Sin puesto', tone: 'muted' as const };
    const total = currentPool.reserveA + currentPool.reserveB;
    if (total > 400) return { label: 'Puesto grande (precio se mueve poco)', tone: 'good' as const };
    if (total > 200) return { label: 'Puesto mediano', tone: 'ok' as const };
    return { label: 'Puesto chico (pedido grande sube precio)', tone: 'meh' as const };
  }, [currentPool]);

  const tipList = [
    'Entre más sacas del puesto, más caro sale lo siguiente.',
    'Una pequeña propina va para quien puso frutas en el puesto.',
    'Divide órdenes grandes para mejorar el precio.',
  ];
  const tip = tipList[player.swapCount % tipList.length];

  const priceBarClass = {
    good: 'bg-green-500',
    ok: 'bg-yellow-400',
    meh: 'bg-orange-400',
    bad: 'bg-red-500',
    muted: 'bg-muted-foreground/40',
  }[priceMood.tone];
  const depthBarClass = {
    good: 'bg-green-500',
    ok: 'bg-yellow-400',
    meh: 'bg-orange-400',
    bad: 'bg-red-500',
    muted: 'bg-muted-foreground/40',
  }[depthState.tone];

  const isSwapReady = !!(currentPool && tokenIn && amountIn && parseFloat(amountIn) > 0 && (player.inventory[tokenIn] || 0) >= parseFloat(amountIn));

  const challenges = [
    {
      id: 'swap',
      title: 'Primer cambio',
      desc: 'Cambia 1 fruta y mira cómo se mueve el precio.',
      done: player.swapCount > 0,
    },
    {
      id: 'lp',
      title: 'Siguiente: Puestero',
      desc: 'Aprende de dónde vienen las frutas del puesto.',
      done: player.lpPositions.length > 0 || player.totalFeesEarned > 0,
      next: true,
    },
    {
      id: 'token',
      title: 'Siguiente: Agricultor',
      desc: 'Crea tu propia fruta desde cero.',
      done: tokens.length > 5,
      next: true,
    },
  ];

  const glossary = [
    { term: 'AMM', desc: 'Un puesto automático: siempre hay precio sin depender de un vendedor.' },
    { term: 'Liquidez', desc: 'Frutas que alguien dejó en el puesto; de ahí salen tus compras.' },
    { term: 'Propina (fee)', desc: 'Lo que pagas por swap; va para quien puso las frutas.' },
    { term: 'Slippage', desc: 'Si pides mucho vs. lo que hay, el precio sube para ti.' },
  ];

  return (
    <div className="space-y-4">
      <ConfettiBurst trigger={confettiKey} />

      {/* Banner educativo del nivel */}
      {player.swapCount === 0 && (
        <Card className="pixel-card p-4 bg-gradient-to-r from-orange-100 to-amber-100 border-orange-300">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎓</span>
            <div className="space-y-2">
              <h3 className="font-bold text-base">Bienvenido al Nivel 1: Marchante</h3>
              <p className="text-sm text-foreground/90 leading-relaxed">
                Aquí aprenderás <strong>cómo funciona un intercambio automático (AMM)</strong>.
                No hay vendedor ni comprador, solo una "olla mágica" que mantiene balance usando la fórmula <code className="px-1.5 py-0.5 bg-card/60 rounded text-xs">x·y=k</code>.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/60 px-3 py-2 rounded">
                <span>💡</span>
                <span>Concepto DeFi: <strong>Automated Market Maker (AMM) + Constant Product</strong></span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="pixel-card p-4 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <span>🎯</span>
          <h3 className="font-bold text-sm">Misiones rápidas</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {challenges.map(ch => (
            <div
              key={ch.id}
              className={`pixel-card p-3 text-sm ${ch.done ? 'bg-muted border-secondary' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{ch.title}</p>
                <span className="text-lg">{ch.done ? '✅' : '⏳'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{ch.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="pixel-card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Mercado LP</p>
            <h1 className="text-xl font-bold flex items-center gap-2">🔄 Cambiar frutas</h1>
            <p className="text-xs text-muted-foreground">Misión: haz tu primer cambio en 2 pasos.</p>
          </div>
          <Button variant="ghost" size="icon" className="pixel-button" title="Ayuda rápida" onClick={() => setShowHelpModal(true)}>
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr,1fr]">
          <Card className="pixel-card p-6 pb-10 bg-muted relative overflow-hidden min-h-[380px] flex items-center justify-center">
            {currentPool ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background to-background/80" aria-hidden />
                <div className="relative z-10 w-full max-w-md mx-auto space-y-4 flex flex-col items-center">
                  <Bascula
                    tokenA={currentPool.tokenA}
                    tokenB={currentPool.tokenB}
                    reserveA={currentPool.reserveA}
                    reserveB={currentPool.reserveB}
                    previewReserveA={previewReserves?.reserveA}
                    previewReserveB={previewReserves?.reserveB}
                  />
                  <div className="text-sm font-semibold text-center pixel-card bg-white/85 px-3 py-1 shadow-sm">
                    {spotText}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No hay puestos disponibles.</p>
            )}
          </Card>

          <Card className="pixel-card p-4 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Elige puesto</Label>
              <Select value={selectedPool} onValueChange={val => { setSelectedPool(val); setTokenIn(''); }}>
                <SelectTrigger className="pixel-border">
                  <SelectValue placeholder="Selecciona un mercado" />
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
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quiero cambiar</Label>
                  <div className="flex gap-2">
                    <Select value={tokenIn} onValueChange={setTokenIn}>
                      <SelectTrigger className="pixel-border w-[160px]">
                        <SelectValue placeholder="Fruta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={currentPool.tokenA.id}>
                          {currentPool.tokenA.emoji} {currentPool.tokenA.symbol}
                        </SelectItem>
                        <SelectItem value={currentPool.tokenB.id}>
                          {currentPool.tokenB.emoji} {currentPool.tokenB.symbol}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="0"
                      value={amountIn}
                      onChange={(e) => setAmountIn(e.target.value)}
                      className="pixel-border flex-1"
                    />
                  </div>
                  {tokenIn && (
                    <p className="text-xs text-muted-foreground">
                      Tienes: {(player.inventory[tokenIn] || 0).toFixed(2)} en tu canasta
                    </p>
                  )}
                  {!amountIn && (
                    <div className="pixel-card bg-muted text-[11px] text-muted-foreground p-2">
                      Ejemplo: cambia 2 {tokenIn === currentPool.tokenA.id ? currentPool.tokenA.emoji : currentPool.tokenB.emoji} y mira cuántas recibes.
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <div className="p-2 bg-muted rounded-full">
                    <ArrowDownUp className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Recibes aproximadamente</Label>
                  <div className={`pixel-card bg-card p-3 flex items-center justify-between ${swapSuccess ? 'animate-success' : ''}`}>
                    <span className="text-2xl">
                      {tokenIn === currentPool.tokenA.id ? currentPool.tokenB.emoji : currentPool.tokenA.emoji}
                    </span>
                    <span className="text-xl font-bold">{calculateOutput().toFixed(2)}</span>
                  </div>
                  {!amountIn && (
                    <p className="text-[11px] text-muted-foreground">Pon una cantidad para ver el estimado.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full overflow-hidden bg-muted">
                    <div
                      className={`h-full ${priceBarClass}`}
                      style={{ width: priceImpact ? `${Math.min(priceImpact * 3, 100)}%` : '35%' }}
                    />
                  </div>
                  <p className="text-xs font-semibold">{priceMood.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {amountIn ? 'El precio sube si compras mucho en un solo pedido.' : 'Pon una cantidad para ver cómo se mueve el precio.'}
                  </p>
                  <div className="mt-2">
                    <p className="text-[11px] text-muted-foreground font-semibold">Profundidad del puesto</p>
                    <div className="h-2 w-full rounded-full overflow-hidden bg-muted">
                      <div
                        className={`h-full ${depthBarClass}`}
                        style={{ width: currentPool ? Math.min((currentPool.reserveA + currentPool.reserveB) / 5, 100) + '%' : '20%' }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{depthState.label}</p>
                  </div>
                  <div className="mt-2 pixel-card bg-muted p-2 text-[11px] space-y-1">
                    <p className="font-semibold text-xs">Checklist rápido</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>El puesto tiene fruta (revisa la barra verde).</li>
                      <li>Tu pedido no es enorme vs. el puesto.</li>
                      <li>El estimado se ve bien para ti.</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={handleSwap}
                  className="w-full pixel-button text-lg"
                  size="lg"
                  disabled={!isSwapReady}
                >
                  {isSwapReady ? '¡Cámbialo! 🔄' : 'Escribe una cantidad para cambiar'}
                </Button>
              </>
            )}
          </Card>
        </div>
      </Card>

      <Card className="pixel-card p-4 bg-card">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <span>💡</span> Tip rápido
        </h3>
        <p className="text-sm text-muted-foreground">{tip}</p>
      </Card>

      <Card className="pixel-card p-4">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <span>📘</span> Glosario rápido AMM
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
          {glossary.map(item => (
            <div key={item.term} className="pixel-card bg-muted p-2">
              <p className="font-semibold text-primary">{item.term}</p>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={showSlippageModal} onOpenChange={setShowSlippageModal}>
        <DialogContent className="pixel-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>👵</span> Marchanta te cuenta algo rápido
            </DialogTitle>
            <DialogDescription className="text-sm space-y-2">
              <p>
                Eso pasa cuando en un puesto (pool) intercambias dos frutas con precios diferentes —como
                si fueran ETH y UNI. Si sacas mucho de un lado, el precio se mueve: es el <strong>slippage</strong>.
              </p>
              <p>
                Siempre revisa cuánta fruta hay en el puesto (liquidez). Si hay poca, cada pieza que saques
                lo encarece más. Divide órdenes grandes para pagar menos.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button className="pixel-button" onClick={() => setShowSlippageModal(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="pixel-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>❓</span> ¿Cómo funciona este puesto?
            </DialogTitle>
            <DialogDescription className="text-sm space-y-2">
              <p>Imagina una balanza mágica: sacas mangos, entran limones. Si pides mucho de golpe, el precio sube.</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Revisa que el puesto tenga fruta (profundidad).</li>
                <li>Divide pedidos grandes para un mejor precio.</li>
                <li>Una propina va para quien puso frutas en el puesto.</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button className="pixel-button" onClick={() => setShowHelpModal(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showTour && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center px-4">
          <div className="pixel-card bg-card max-w-xl w-full p-4 space-y-3 animate-slide-up">
            <h3 className="font-bold text-lg flex items-center gap-2"><span>🧭</span> Cómo hacer tu primer cambio</h3>
            <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
              <li>Elige el puesto y la fruta que quieres cambiar.</li>
              <li>Escribe cuántas piezas. Mira la barra de precio y la profundidad.</li>
              <li>Da click en "¡Cámbialo!" para confirmar.</li>
            </ol>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" className="pixel-button" onClick={() => setShowTour(false)}>
                Cerrar
              </Button>
              <Button className="pixel-button" onClick={() => setShowTour(false)}>
                ¡Entendido!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
