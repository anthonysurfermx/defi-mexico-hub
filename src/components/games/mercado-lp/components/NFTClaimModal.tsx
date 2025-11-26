import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ConfettiBurst } from './ConfettiBurst';
import { Award, Lock, Unlock } from 'lucide-react';

interface NFTClaimModalProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  playerLevel: number;
  playerXP: number;
}

export const NFTClaimModal = ({
  open,
  onClose,
  isAuthenticated,
  playerLevel,
  playerXP
}: NFTClaimModalProps) => {
  const navigate = useNavigate();
  const [confettiKey, setConfettiKey] = useState(0);

  // Requisitos para claim NFT
  const hasCompletedLevel4 = playerLevel >= 4;
  const hasMinimumXP = playerXP >= 1000;
  const canClaimNFT = hasCompletedLevel4 && hasMinimumXP;

  const handleLogin = () => {
    // Guardar que el usuario quiere reclamar NFT
    localStorage.setItem('mercado_lp_pending_nft_claim', 'true');
    localStorage.setItem('mercado_lp_return_url', window.location.pathname);

    // Redirigir a login
    navigate('/login');
  };

  const handleClaimNFT = async () => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }

    // Trigger confetti
    setConfettiKey(prev => prev + 1);

    // Import NFT service dynamically
    const { createNFTClaim } = await import('../lib/nft');

    // Create NFT claim
    const claimId = await createNFTClaim();

    if (claimId) {
      // Close modal after successful claim
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  };

  return (
    <>
      <ConfettiBurst trigger={confettiKey} />
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="pixel-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl mb-4">
              {canClaimNFT ? '🎉 ¡Reclama tu NFT!' : '🔒 NFT Bloqueado'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* NFT Preview */}
            <div className="relative">
              <div className={`pixel-card p-6 text-center ${
                canClaimNFT
                  ? 'bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100'
                  : 'bg-muted opacity-60'
              }`}>
                <div className="text-8xl mb-4 animate-pulse">
                  {canClaimNFT ? '🏆' : '🔒'}
                </div>
                <h3 className="font-bold text-lg mb-2">
                  Mercado LP Maestro
                </h3>
                <p className="text-xs text-muted-foreground">
                  NFT Educativo - Nivel 4 Completado
                </p>
              </div>

              {/* Lock overlay */}
              {!canClaimNFT && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="pixel-card bg-background/90 p-4 text-center">
                    <Lock className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-bold">Completa el Nivel 4</p>
                  </div>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="pixel-card bg-muted p-4 space-y-3">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Award className="w-4 h-4" />
                Requisitos para el NFT
              </h4>

              <div className="space-y-2 text-sm">
                <div className={`flex items-center gap-2 ${
                  hasCompletedLevel4 ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {hasCompletedLevel4 ? '✅' : '⭕'}
                  <span>Completar Nivel 4: Subastero</span>
                </div>

                <div className={`flex items-center gap-2 ${
                  hasMinimumXP ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {hasMinimumXP ? '✅' : '⭕'}
                  <span>Alcanzar 1000 XP (Tienes: {playerXP})</span>
                </div>

                <div className={`flex items-center gap-2 ${
                  isAuthenticated ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {isAuthenticated ? '✅' : '🔐'}
                  <span>
                    {isAuthenticated
                      ? 'Cuenta conectada'
                      : 'Iniciar sesión para reclamar'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* NFT Details */}
            {canClaimNFT && (
              <div className="text-center text-xs text-muted-foreground space-y-2">
                <p>
                  Este NFT certifica que has completado todos los niveles educativos
                  de Mercado LP y dominas los conceptos básicos de DeFi.
                </p>
                <div className="flex justify-center gap-3 text-xs">
                  <span className="pixel-card bg-primary/10 px-2 py-1">
                    🎓 Educativo
                  </span>
                  <span className="pixel-card bg-muted/50 px-2 py-1">
                    🏆 Achievement
                  </span>
                  <span className="pixel-card bg-card px-2 py-1">
                    ⛓️ On-chain
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {canClaimNFT ? (
                <>
                  <Button
                    onClick={handleClaimNFT}
                    className="w-full pixel-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    size="lg"
                  >
                    {isAuthenticated ? (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        ¡Reclamar NFT Gratis!
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Iniciar Sesión para Reclamar
                      </>
                    )}
                  </Button>

                  {!isAuthenticated && (
                    <p className="text-xs text-center text-muted-foreground">
                      Necesitas una cuenta para reclamar tu NFT educativo
                    </p>
                  )}
                </>
              ) : (
                <Button
                  onClick={onClose}
                  className="w-full pixel-button"
                  variant="secondary"
                  size="lg"
                >
                  Continuar Jugando
                </Button>
              )}
            </div>

            {/* Close button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="w-full pixel-button"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
