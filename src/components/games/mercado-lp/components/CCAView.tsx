import { useState, useEffect } from 'react';
import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { HelpCircle, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ConfettiBurst } from './ConfettiBurst';
import { AuctionBlockTimeline } from './AuctionBlockTimeline';
import { AuctionOnboarding } from './AuctionOnboarding';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuctionBid } from '@/components/games/mercado-lp/types/game';
import { useMercadoSound } from '@/hooks/useMercadoSound';
import {
  GraduationCapIcon,
  LightbulbIcon,
  AuctioneerIcon,
  BoltIcon,
  BoxIcon,
  CoinsIcon,
  QuestionIcon,
} from './icons/GameIcons';
import { MissionsCard } from './MissionsCard';

const AUCTION_ONBOARDING_KEY = 'mercado_lp_auction_onboarding_complete';

export const CCAView = () => {
  const { t } = useTranslation();
  const { player, auction, placeBid, advanceAuctionBlock, startAuction, resetAuction } = useGame();
  const [selectedBlock, setSelectedBlock] = useState<number>(1);
  const [maxPrice, setMaxPrice] = useState('');
  const [totalSpend, setTotalSpend] = useState('');
  const [confettiKey, setConfettiKey] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [playerTotalWon, setPlayerTotalWon] = useState(0);
  const [playerAvgPrice, setPlayerAvgPrice] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingAuctionStart, setPendingAuctionStart] = useState(false);

  // Sound effects
  const { play: playBidSound } = useMercadoSound('bid');

  // Check if onboarding was completed
  const hasCompletedOnboarding = () => {
    return localStorage.getItem(AUCTION_ONBOARDING_KEY) === 'true';
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    localStorage.setItem(AUCTION_ONBOARDING_KEY, 'true');
    setShowOnboarding(false);

    // If we were waiting to start an auction, start it now
    if (pendingAuctionStart) {
      startAuction();
      toast.success(t('mercadoLP.cca.toasts.started'));
      setConfettiKey(prev => prev + 1);
      setPendingAuctionStart(false);
    }
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    localStorage.setItem(AUCTION_ONBOARDING_KEY, 'true');
    setShowOnboarding(false);

    // If we were waiting to start an auction, start it now
    if (pendingAuctionStart) {
      startAuction();
      toast.success(t('mercadoLP.cca.toasts.started'));
      setConfettiKey(prev => prev + 1);
      setPendingAuctionStart(false);
    }
  };

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
      toast.error(t('mercadoLP.cca.errors.missing'));
      return;
    }

    const max = parseFloat(maxPrice);
    const spend = parseFloat(totalSpend);

    if (isNaN(max) || isNaN(spend) || max <= 0 || spend <= 0) {
      toast.error(t('mercadoLP.cca.errors.amount'));
      return;
    }

    const pesoBalance = player.inventory['peso'] || 0;
    if (spend > pesoBalance) {
      toast.error(t('mercadoLP.cca.errors.balance'));
      return;
    }

    const currentBlock = auction.blocks.find(b => b.blockNumber === selectedBlock);
    if (!currentBlock) return;

    // Validar que el precio máximo sea razonable
    if (max < currentBlock.minPrice) {
      toast.error(t('mercadoLP.cca.errors.minPrice', { price: currentBlock.minPrice.toFixed(2) }));
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

    // Play sound
    playBidSound();

    // Feedback educativo mejorado
    if (playerPreviousBids === 0) {
      toast.success(t('mercadoLP.cca.toasts.firstBid'), { duration: 4000 });
    } else {
      toast.success(t('mercadoLP.cca.toasts.bidPlaced', { block: selectedBlock }));
    }

    setConfettiKey(prev => prev + 1);

    // Reset form
    setMaxPrice('');
    setTotalSpend('');
  };

  const handleStartAuction = () => {
    // Show onboarding if user hasn't completed it yet
    if (!hasCompletedOnboarding()) {
      setPendingAuctionStart(true);
      setShowOnboarding(true);
      return;
    }

    startAuction();
    toast.success(t('mercadoLP.cca.toasts.started'));
    setConfettiKey(prev => prev + 1);
  };

  const handleAdvanceBlock = () => {
    if (!auction || !auction.active) return;

    if (auction.currentBlock >= auction.blocksCount) {
      toast.info(t('mercadoLP.cca.toasts.ended'));
      return;
    }

    advanceAuctionBlock();
    toast.success(t('mercadoLP.cca.toasts.blockRun', { block: auction.currentBlock }));

    // Si era el último bloque, mostrar resultados
    if (auction.currentBlock >= auction.blocksCount) {
      setTimeout(() => calculateResults(), 500);
    }
  };

  const handleResetAuction = () => {
    resetAuction();
    setShowResultsModal(false);
    toast.success(t('mercadoLP.cca.toasts.reset'));
  };

  if (!auction) {
    return (
      <div className="space-y-4">
        {/* Banner educativo del nivel */}
        <Card className="pixel-card p-4 bg-gradient-to-r from-primary/10 to-emerald-500/5 border-primary/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <GraduationCapIcon size={24} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-base">{t('mercadoLP.cca.banner.title')}</h3>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {t('mercadoLP.cca.banner.body')}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/60 px-3 py-2 rounded">
                <LightbulbIcon size={14} className="text-amber-500 shrink-0" />
                <span>{t('mercadoLP.cca.banner.concept')}</span>
              </div>
            </div>
          </div>
        </Card>

        <MissionsCard />

        <Card className="pixel-card p-6 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-violet-100 flex items-center justify-center">
            <AuctioneerIcon size={48} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">{t('mercadoLP.cca.noAuction.title')}</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {t('mercadoLP.cca.noAuction.body')}
            </p>
          </div>
          <Button
            onClick={handleStartAuction}
            className="pixel-button text-lg"
            size="lg"
          >
            <BoltIcon size={20} className="mr-2" />
            {t('mercadoLP.cca.noAuction.start')}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            {t('mercadoLP.cca.noAuction.note')}
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

      <MissionsCard />

      <Card className="pixel-card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('mercadoLP.cca.labels.title')}</p>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <AuctioneerIcon size={24} className="text-primary" />
              {t('mercadoLP.cca.labels.subtitle')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('mercadoLP.cca.labels.token', { emoji: auction.tokenOffered.emoji, symbol: auction.tokenOffered.symbol })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="pixel-button"
            title={t('mercadoLP.cca.labels.helpTitle')}
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
                <BoltIcon size={24} className="text-primary" />
                <div>
                  <p className="text-sm font-bold">
                    {auction.active
                      ? t('mercadoLP.cca.labels.progress', { defaultValue: 'Subasta en progreso' })
                      : t('mercadoLP.cca.labels.ended', { defaultValue: 'Subasta terminada' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('mercadoLP.cca.labels.blockProgress', { current: auction.currentBlock, total: auction.blocksCount, defaultValue: `Bloque ${auction.currentBlock} de ${auction.blocksCount}` })}
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
                    ▶️ {t('mercadoLP.cca.labels.ctaAdvance')}
                  </Button>
                )}
                <Button
                  onClick={handleResetAuction}
                  className="pixel-button"
                  variant="secondary"
                >
                  🔄 {t('mercadoLP.cca.labels.ctaReset')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Info del bloque seleccionado */}
          {currentBlock && (
            <Card className="pixel-card p-4 bg-gradient-to-b from-primary/10 to-purple-500/5">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <BoxIcon size={18} className="text-primary" />
                {t('mercadoLP.cca.labels.blockDetails', { block: selectedBlock, defaultValue: `Bloque ${selectedBlock} - Detalles` })}
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="pixel-card bg-card/80 p-3 text-center">
                  <div className="text-xs text-muted-foreground">{t('mercadoLP.cca.labels.tokensAvailable', { defaultValue: 'Tokens disponibles' })}</div>
                  <div className="text-2xl">{auction.tokenOffered.emoji}</div>
                  <div className="text-lg font-bold">{currentBlock.tokensAvailable}</div>
                </div>

                <div className="pixel-card bg-card/80 p-3 text-center">
                  <div className="text-xs text-muted-foreground">{t('mercadoLP.cca.labels.currentPrice', { defaultValue: 'Precio actual' })}</div>
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
              <CoinsIcon size={18} className="text-amber-500" />
              Coloca tu oferta
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
          <LightbulbIcon size={18} className="text-amber-500" />
          Estrategia del Subastero
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
              <QuestionIcon size={20} className="text-blue-500" />
              ¿Qué es una Subasta Continua (CCA)?
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

      {/* Auction Onboarding Tutorial */}
      {showOnboarding && (
        <AuctionOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
};
