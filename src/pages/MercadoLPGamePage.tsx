import { useState, useEffect, useCallback } from 'react';
import { GameProvider, useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { SwapView } from '@/components/games/mercado-lp/components/SwapView';
import { LiquidityView } from '@/components/games/mercado-lp/components/LiquidityView';
import { TokenCreatorView } from '@/components/games/mercado-lp/components/TokenCreatorView';
import { CCAView } from '@/components/games/mercado-lp/components/CCAView';
import { PlayerStatsPanel } from '@/components/games/mercado-lp/components/PlayerStatsPanel';
import { NPCActivityFeed } from '@/components/games/mercado-lp/components/NPCActivityFeed';
import { ContextualTip } from '@/components/games/mercado-lp/components/ContextualTip';
import { MarketPlazaMap } from '@/components/games/mercado-lp/components/MarketPlazaMap';
import { BadgeNotification } from '@/components/games/mercado-lp/components/BadgeNotification';
import { LevelUpModal } from '@/components/games/mercado-lp/components/LevelUpModal';
import { NFTClaimModal } from '@/components/games/mercado-lp/components/NFTClaimModal';
import { StartScreen } from '@/components/games/mercado-lp/components/StartScreen';
import { GameHeader } from '@/components/games/mercado-lp/components/GameHeader';
import { OnboardingTutorial } from '@/components/games/mercado-lp/components/OnboardingTutorial';
import { LoginPromptModal } from '@/components/games/mercado-lp/components/LoginPromptModal';
import { GameLevel } from '@/components/games/mercado-lp/types/game';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type LoginPromptReason = 'level_up' | 'xp_milestone' | 'leaderboard' | 'nft_claim';

const GameContent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLevel, activeTip, dismissTip, showMap, showStartScreen, isLoaded, openMap, closeMap, closeStartScreen, setCurrentLevel, newBadge, dismissBadge, levelUpNotification, dismissLevelUp, player } = useGame();
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [hasShownNFTModal, setHasShownNFTModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState<LoginPromptReason | null>(null);
  const [previousLevel, setPreviousLevel] = useState(player.level);
  const [previousXP, setPreviousXP] = useState(player.xp);

  // Check if a login prompt should be shown
  const shouldShowPrompt = useCallback((reason: LoginPromptReason) => {
    if (user) return false; // Already logged in
    const hidden = localStorage.getItem(`mercado_lp_hide_login_prompt_${reason}`);
    return !hidden;
  }, [user]);

  // Detect level up (to level 2+) and prompt login
  useEffect(() => {
    if (!isLoaded || !shouldShowPrompt('level_up')) return;

    if (player.level >= 2 && previousLevel < 2) {
      setTimeout(() => setLoginPromptReason('level_up'), 1500);
    }
    setPreviousLevel(player.level);
  }, [player.level, previousLevel, isLoaded, shouldShowPrompt]);

  // Detect XP milestone (500+) and prompt login
  useEffect(() => {
    if (!isLoaded || !shouldShowPrompt('xp_milestone')) return;

    if (player.xp >= 500 && previousXP < 500) {
      setTimeout(() => setLoginPromptReason('xp_milestone'), 1500);
    }
    setPreviousXP(player.xp);
  }, [player.xp, previousXP, isLoaded, shouldShowPrompt]);

  const handleLoginPromptLogin = () => {
    navigate('/auth');
  };

  const handleSelectRole = (level: GameLevel) => {
    setCurrentLevel(level);
    closeStartScreen();

    // Show onboarding tutorial for first-time players on level 1
    const hasSeenOnboarding = localStorage.getItem('mercado_lp_onboarding_complete');
    if (level === 1 && !hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 500);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('mercado_lp_onboarding_complete', 'true');
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem('mercado_lp_onboarding_complete', 'true');
  };

  // Detectar cuando el jugador completa el Nivel 4
  useEffect(() => {
    const hasCompletedLevel4 = player.level >= 4 && player.xp >= 1000;
    const modalAlreadyShown = localStorage.getItem('mercado_lp_nft_modal_shown');

    if (hasCompletedLevel4 && !hasShownNFTModal && !modalAlreadyShown) {
      // Mostrar modal después de 2 segundos
      const timer = setTimeout(() => {
        if (user) {
          // User is logged in, show NFT claim modal
          setShowNFTModal(true);
        } else if (shouldShowPrompt('nft_claim')) {
          // User not logged in, show login prompt for NFT claim
          setLoginPromptReason('nft_claim');
        }
        setHasShownNFTModal(true);
        localStorage.setItem('mercado_lp_nft_modal_shown', 'true');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [player.level, player.xp, hasShownNFTModal, user, shouldShowPrompt]);

  // Show loading state while game data is being loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🏪</div>
          <h2 className="text-2xl font-bold">Cargando Mercado LP...</h2>
          <div className="flex justify-center gap-2">
            <span className="animate-pulse">🥭</span>
            <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>🍋</span>
            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>🍉</span>
          </div>
        </div>
      </div>
    );
  }

  // Show start screen for first-time visitors
  if (showStartScreen) {
    return <StartScreen onSelectRole={handleSelectRole} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back button to Academy */}
      <div className="container mx-auto px-4 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/academia')}
          className="pixel-button mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Academia
        </Button>
      </div>

      {showMap && (
        <MarketPlazaMap
          open={showMap}
          onClose={closeMap}
          onEnterLevel={(level: GameLevel) => {
            setCurrentLevel(level);
            closeMap();
          }}
        />
      )}
      <GameHeader
          onOpenMap={openMap}
          onLoginPrompt={!user ? (reason) => setLoginPromptReason(reason) : undefined}
        />

      <div className="container mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main game area */}
          <div className="lg:col-span-2">
            {currentLevel === 1 && <SwapView />}
            {currentLevel === 2 && <LiquidityView />}
            {currentLevel === 3 && <TokenCreatorView />}
            {currentLevel === 4 && <CCAView />}
          </div>

          {/* Side panels */}
          <div className="space-y-4">
            <NPCActivityFeed />
            <PlayerStatsPanel />
          </div>
        </div>
      </div>

      {/* Badge notifications */}
      <BadgeNotification badge={newBadge} onDismiss={dismissBadge} />

      {/* Level Up Modal */}
      <LevelUpModal newLevel={levelUpNotification} onClose={dismissLevelUp} />

      {/* NFT Claim Modal */}
      <NFTClaimModal
        open={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        isAuthenticated={!!user}
        playerLevel={player.level}
        playerXP={player.xp}
      />

      {/* Contextual tutorial tips */}
      {activeTip && (
        <ContextualTip tip={activeTip} onDismiss={dismissTip} />
      )}

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <OnboardingTutorial
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={loginPromptReason !== null}
        onClose={() => setLoginPromptReason(null)}
        onLogin={handleLoginPromptLogin}
        reason={loginPromptReason || 'level_up'}
      />

      {/* Decorative elements */}
      <div className="fixed bottom-4 left-4 text-6xl opacity-20 animate-float pointer-events-none">
        🥭
      </div>
      <div className="fixed top-1/4 right-8 text-5xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '0.5s' }}>
        🍋
      </div>
      <div className="fixed bottom-1/3 right-1/4 text-4xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '1s' }}>
        🍉
      </div>
    </div>
  );
};

const MercadoLPGamePage = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default MercadoLPGamePage;
