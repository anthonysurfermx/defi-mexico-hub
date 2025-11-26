import { useState, useEffect } from 'react';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { HelpCircle, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';
import { ConfettiBurst } from './ConfettiBurst';
import { AuctionBlockTimeline } from './AuctionBlockTimeline';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuctionBid } from '@/components/games/mercado-lp/types/game';

export const CCAView = () => {
  const { player, auction, placeBid, advanceAuctionBlock, startAuction, resetAuction } = useGame();
  const [selectedBlock, setSelectedBlock] = useState<number>(1);
  const [maxPrice, setMaxPrice] = useState('');
  const [totalSpend, setTotalSpend] = useState('');
  const [confettiKey, setConfettiKey] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [playerTotalWon, setPlayerTotalWon] = useState(0);
  const [playerAvgPrice, setPlayerAvgPrice] = useState(0);

  // Verificar si la subasta terminó para mostrar resultados
  useEffect(() => {
    if (!auction) return;

    if (!auction.active && auction.currentBlock > auction.blocksCount) {
      calculateResults();
    }
  }, [auction?.active, auction?.currentBlock]);

  const calculateResults = () => {
    if (!auction) return;

    let totalTokens = 0;
    let totalCost = 0;

    auction.blocks.forEach(block => {
      const playerBid = block.bids.find(b => b.bidderId === 'player');
      if (playerBid?.tokensWon) {
        totalTokens += playerBid.tokensWon;
        totalCost += playerBid.tokensWon * (playerBid.averagePrice || 0);
      }
    });

    setPlayerTotalWon(totalTokens);
    setPlayerAvgPrice(totalTokens > 0 ? totalCost / totalTokens : 0);
    setShowResultsModal(true);
    setConfettiKey(prev => prev + 1);
  };

  const handlePlaceBid = () => {
    if (!auction || !maxPrice || !totalSpend) {
      toast.error('Completa precio máximo y gasto total.');
      return;
    }

    const max = parseFloat(maxPrice);
    const spend = parseFloat(totalSpend);

    if (isNaN(max) || isNaN(spend) || max <= 0 || spend <= 0) {
      toast.error('Pon números mayores que 0.');
      return;
    }

    const pesoBalance = player.inventory['peso'] || 0;
    if (spend > pesoBalance) {
      toast.error('No tienes suficiente PESO.');
      return;
    }

    const currentBlock = auction.blocks.find(b => b.blockNumber === selectedBlock);
    if (!currentBlock) return;

    // Validar que el precio máximo sea razonable
    if (max < currentBlock.minPrice) {
      toast.error(`El precio debe ser al menos $${currentBlock.minPrice.toFixed(2)}`);
      return;
    }

    const bid: AuctionBid = {
      id: `bid-${Date.now()}`,
      bidderId: 'player',
      bidderName: 'Tú',
      maxPrice: max,
      totalSpend: spend,
    };

    // Contar ofertas previas del jugador
    const playerPreviousBids = auction.blocks.reduce((count, block) => {
      return count + block.bids.filter(b => b.bidderId === 'player').length;
    }, 0);

    placeBid(selectedBlock, bid);

    // Feedback educativo mejorado
    if (playerPreviousBids === 0) {
      toast.success(`¡Primera oferta colocada! 🎉 El precio de clearing se ajustará según todas las ofertas.`, { duration: 4000 });
    } else {
      toast.success(`¡Oferta colocada en Bloque ${selectedBlock}! 🔨`);
    }

    setConfettiKey(prev => prev + 1);

    // Reset form
    setMaxPrice('');
    setTotalSpend('');
  };

  const handleStartAuction = () => {
    startAuction();
    toast.success('¡Subasta iniciada! Coloca tus ofertas. 🔨');
    setConfettiKey(prev => prev + 1);
  };

  const handleAdvanceBlock = () => {
    if (!auction || !auction.active) return;

    if (auction.currentBlock >= auction.blocksCount) {
      toast.info('La subasta ya terminó.');
      return;
    }

    advanceAuctionBlock();
    toast.success(`Bloque ${auction.currentBlock} ejecutado!`);

    // Si era el último bloque, mostrar resultados
    if (auction.currentBlock >= auction.blocksCount) {
      setTimeout(() => calculateResults(), 500);
    }
  };

  const handleResetAuction = () => {
    resetAuction();
    setShowResultsModal(false);
    toast.success('Subasta reiniciada. Puedes iniciar una nueva.');
  };

  if (!auction) {
    return (
      <div className="space-y-4">
        {/* Banner educativo del nivel */}
        <Card className="pixel-card p-4 bg-gradient-to-r from-violet-100 to-purple-100 border-violet-300">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎓</span>
            <div className="space-y-2">
              <h3 className="font-bold text-base">Nivel 4: Subastero - Continuous Clearing Auctions</h3>
              <p className="text-sm text-foreground/90 leading-relaxed">
                <strong>Recuerdas crear tokens en N3?</strong> Aquí aprenderás <strong>otra forma de distribuirlos</strong>:
                subastas por bloques donde el precio se ajusta según demanda real. Más justo que venta directa.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/60 px-3 py-2 rounded">
                <span>💡</span>
                <span>Concepto DeFi: <strong>Continuous Clearing Auctions + Fair Price Discovery</strong></span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="pixel-card p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <span>🎯</span>
            <h3 className="font-bold text-sm">Tu misión</h3>
          </div>
          <div className="pixel-card p-3 text-sm bg-white">
            <p className="font-semibold mb-1">Participa en la Subasta Continua (CCA)</p>
            <p className="text-xs text-muted-foreground">
              Haz ofertas en diferentes bloques. Ofertar temprano te da mejor precio promedio.
            </p>
          </div>
        </Card>

        <Card className="pixel-card p-6 text-center space-y-4">
          <div className="text-6xl">🔨</div>
          <div>
            <h2 className="text-xl font-bold mb-2">No hay subasta activa</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Inicia una nueva subasta para participar en el descubrimiento de precios.
            </p>
          </div>
          <Button
            onClick={handleStartAuction}
            className="pixel-button text-lg"
            size="lg"
          >
            🚀 Iniciar Subasta
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Nota: Necesitas haber creado al menos un token en el Nivel 3
          </p>
        </Card>
      </div>
    );
  }

  const currentBlock = auction.blocks.find(b => b.blockNumber === selectedBlock);
  const playerBudget = player.inventory['peso'] || 0;
  const estimatedTokens = currentBlock && maxPrice && totalSpend
    ? Math.min(parseFloat(totalSpend) / parseFloat(maxPrice), currentBlock.tokensAvailable)
    : 0;

  return (
    <div className="space-y-4">
      <ConfettiBurst trigger={confettiKey} />

      <Card className="pixel-card p-4 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <span>🎯</span>
          <h3 className="font-bold text-sm">Tu misión</h3>
        </div>
        <div className="pixel-card p-3 text-sm bg-white">
          <p className="font-semibold mb-1">Participa en la Subasta Continua (CCA)</p>
          <p className="text-xs text-muted-foreground">
            Haz ofertas en diferentes bloques. Ofertar temprano te da mejor precio promedio.
          </p>
        </div>
      </Card>

      <Card className="pixel-card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Mercado LP</p>
            <h1 className="text-xl font-bold flex items-center gap-2">🔨 El Subastero</h1>
            <p className="text-xs text-muted-foreground">
              Subasta: {auction.tokenOffered.emoji} {auction.tokenOffered.symbol}
            </p>
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
          {/* Timeline de bloques */}
          <AuctionBlockTimeline
            blocks={auction.blocks}
            currentBlock={auction.currentBlock}
            tokenEmoji={auction.tokenOffered.emoji}
            onBlockClick={setSelectedBlock}
            selectedBlock={selectedBlock}
          />

          {/* Controles de subasta */}
          <Card className="pixel-card p-4 bg-primary/10">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-sm font-bold">
                    {auction.active ? 'Subasta en progreso' : 'Subasta terminada'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bloque {auction.currentBlock} de {auction.blocksCount}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {auction.active && auction.currentBlock <= auction.blocksCount && (
                  <Button
                    onClick={handleAdvanceBlock}
                    className="pixel-button"
                    variant="default"
                  >
                    ▶️ Avanzar al siguiente bloque
                  </Button>
                )}
                <Button
                  onClick={handleResetAuction}
                  className="pixel-button"
                  variant="secondary"
                >
                  🔄 Reiniciar Subasta
                </Button>
              </div>
            </div>
          </Card>

          {/* Info del bloque seleccionado */}
          {currentBlock && (
            <Card className="pixel-card p-4 bg-gradient-to-b from-primary/10 to-purple-500/5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <span>📦</span> Bloque {selectedBlock} - Detalles
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="pixel-card bg-card/80 p-3 text-center">
                  <div className="text-xs text-muted-foreground">Tokens disponibles</div>
                  <div className="text-2xl">{auction.tokenOffered.emoji}</div>
                  <div className="text-lg font-bold">{currentBlock.tokensAvailable}</div>
                </div>

                <div className="pixel-card bg-card/80 p-3 text-center">
                  <div className="text-xs text-muted-foreground">Precio actual</div>
                  <div className="text-2xl">💵</div>
                  <div className="text-lg font-bold">${currentBlock.currentPrice.toFixed(2)}</div>
                </div>
              </div>

              {/* Ofertas existentes en este bloque */}
              {currentBlock.bids.length > 0 && (
                <div className="pixel-card bg-card/60 p-3 space-y-2">
                  <div className="text-xs font-semibold">Ofertas en este bloque:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {currentBlock.bids.map(bid => (
                      <div
                        key={bid.id}
                        className="flex justify-between text-xs pixel-card bg-muted/50 p-2"
                      >
                        <span className={bid.bidderId === 'player' ? 'font-bold text-primary' : ''}>
                          {bid.bidderName}
                        </span>
                        <span>
                          Max: ${bid.maxPrice.toFixed(2)} | Gasto: ${bid.totalSpend.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Formulario de oferta */}
          <Card className="pixel-card p-4 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <span>💰</span> Coloca tu oferta
            </h3>

            <div>
              <Label className="text-xs text-muted-foreground">
                Precio máximo por token ($/token)
              </Label>
              <Input
                type="number"
                placeholder="Ej: 10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="pixel-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Solo pagarás el precio de equilibrio, no necesariamente tu máximo.
              </p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                Gasto total (PESO)
              </Label>
              <Input
                type="number"
                placeholder="Ej: 100"
                value={totalSpend}
                onChange={(e) => setTotalSpend(e.target.value)}
                className="pixel-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tu presupuesto: {playerBudget.toFixed(2)} PESO
              </p>
            </div>

            {estimatedTokens > 0 && (
              <div className="pixel-card bg-muted p-2 text-xs">
                <p className="font-semibold">Estimación:</p>
                <p>Podrías ganar ~{estimatedTokens.toFixed(1)} {auction.tokenOffered.symbol}</p>
                <p className="text-muted-foreground mt-1">
                  (Depende del precio final de equilibrio)
                </p>
              </div>
            )}

            <Button
              onClick={handlePlaceBid}
              className="w-full pixel-button"
              disabled={!maxPrice || !totalSpend || selectedBlock < auction.currentBlock}
            >
              {selectedBlock < auction.currentBlock
                ? 'Bloque ya ejecutado'
                : '¡Ofertar en este bloque! 🔨'}
            </Button>
          </Card>

          {/* Resumen de tus ofertas */}
          <Card className="pixel-card p-4 bg-card">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span>📊</span> Tus ofertas activas
            </h3>
            <div className="space-y-2">
              {auction.blocks
                .filter(block => block.bids.some(b => b.bidderId === 'player'))
                .map(block => {
                  const playerBid = block.bids.find(b => b.bidderId === 'player');
                  return (
                    <div
                      key={block.id}
                      className="pixel-card bg-card p-2 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold">Bloque {block.blockNumber}</span>
                        {block.executed && playerBid?.tokensWon && (
                          <span className="ml-2 text-green-600">
                            ✓ Ganaste {playerBid.tokensWon.toFixed(1)} tokens
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div>Max: ${playerBid?.maxPrice.toFixed(2)}</div>
                        <div className="text-muted-foreground">
                          Gasto: ${playerBid?.totalSpend.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {auction.blocks.filter(b => b.bids.some(bid => bid.bidderId === 'player')).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No tienes ofertas aún. ¡Coloca tu primera oferta arriba!
                </p>
              )}
            </div>
          </Card>
        </div>
      </Card>

      <Card className="pixel-card p-4 bg-card">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <span>💡</span> Estrategia del Subastero
        </h3>
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Ofertar en bloques tempranos suele darte mejor precio promedio.
          Los bloques avanzados se vuelven más competidos y caros. Distribuye tu presupuesto
          inteligentemente entre varios bloques.
        </p>
      </Card>

      {/* Modal de ayuda */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="pixel-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>❓</span> ¿Qué es una Subasta Continua (CCA)?
            </DialogTitle>
            <DialogDescription className="text-sm space-y-2">
              <p>
                Las Continuous Clearing Auctions distribuyen tokens en bloques a lo largo del tiempo.
                Esto incentiva participación temprana y descubrimiento justo de precios.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Cada bloque vende una porción de tokens</li>
                <li>Pones precio máximo y gasto total</li>
                <li>Al ejecutarse, pagas el precio de equilibrio (no tu máximo)</li>
                <li>Bloques tempranos = precios más bajos</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Inspirado en Uniswap v4 CCA hooks para lanzamientos justos de tokens.
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

      {/* Modal de resultados */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="pixel-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-600" />
              <span>¡Subasta completada!</span>
            </DialogTitle>
            <DialogDescription className="text-sm space-y-3">
              <div className="pixel-card bg-gradient-to-b from-primary/10 to-purple-500/5 p-4 space-y-2">
                <div className="text-center">
                  <div className="text-4xl mb-2">{auction.tokenOffered.emoji}</div>
                  <p className="font-bold text-lg">Resultados finales</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center pixel-card bg-card/80 p-2">
                    <span className="text-muted-foreground">Tokens ganados:</span>
                    <span className="font-bold text-lg">
                      {playerTotalWon.toFixed(1)} {auction.tokenOffered.symbol}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pixel-card bg-card/80 p-2">
                    <span className="text-muted-foreground">Precio promedio:</span>
                    <span className="font-bold">${playerAvgPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2 justify-center mt-3 p-2 bg-green-100 rounded">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      ¡Aprendiste sobre subastas continuas!
                    </span>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              className="pixel-button"
              variant="secondary"
              onClick={() => {
                setShowResultsModal(false);
                handleResetAuction();
              }}
            >
              🔄 Nueva Subasta
            </Button>
            <Button className="pixel-button" onClick={() => setShowResultsModal(false)}>
              ¡Genial!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
