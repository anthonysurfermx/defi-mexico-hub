import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ConfettiBurst } from './ConfettiBurst';
import { Award, Lock, Wallet } from 'lucide-react';

// Bueno Art Widget ID
const BUENO_WIDGET_ID = 'qrKviaP2N56V0lqJZH2l4';

interface NFTClaimModalProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  playerLevel: number;
  playerXP: number;
  autoShowMintWidget?: boolean; // Si true, muestra directamente el widget de minting
}

export const NFTClaimModal = ({
  open,
  onClose,
  isAuthenticated,
  playerLevel,
  playerXP,
  autoShowMintWidget = false
}: NFTClaimModalProps) => {
  const navigate = useNavigate();
  const [confettiKey, setConfettiKey] = useState(0);
  const [showMintWidget, setShowMintWidget] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Requisitos para claim NFT
  const hasCompletedLevel4 = playerLevel >= 4;
  const hasMinimumXP = playerXP >= 1000;
  const canClaimNFT = hasCompletedLevel4 && hasMinimumXP;

  // Auto-show mint widget when returning from login
  useEffect(() => {
    if (open && autoShowMintWidget && isAuthenticated && canClaimNFT) {
      setShowMintWidget(true);
    }
  }, [open, autoShowMintWidget, isAuthenticated, canClaimNFT]);

  // Initialize widget using iframe approach when showing mint view
  useEffect(() => {
    if (showMintWidget && widgetContainerRef.current) {
      // Clear any existing content
      widgetContainerRef.current.innerHTML = '';
      setWidgetReady(false);

      // Create an iframe with the Bueno widget embedded
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '600px'; // Taller to accommodate expanded widget with QR
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.background = 'transparent';
      iframe.allow = 'clipboard-write; web-share';

      // Write the widget HTML directly into the iframe
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://app.bueno.art/widget/v3/styles.css">
          <style>
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 8px;
              background: #f8f9fa;
              font-family: system-ui, -apple-system, sans-serif;
              min-height: 100%;
              border-radius: 12px;
            }
            [data-bueno-mint] {
              width: 100%;
              min-height: 550px;
              background: #ffffff;
              border-radius: 12px;
              padding: 16px;
            }
            /* Override dark text on dark background */
            [data-bueno-mint] * {
              color: #1a1a1a !important;
            }
            [data-bueno-mint] button {
              color: #ffffff !important;
            }
          </style>
        </head>
        <body>
          <div data-bueno-mint="${BUENO_WIDGET_ID}"></div>
          <script type="module" crossorigin src="https://app.bueno.art/widget/v3/index.js"></script>
        </body>
        </html>
      `;

      iframe.onload = () => {
        setWidgetReady(true);
      };

      iframeRef.current = iframe;
      widgetContainerRef.current.appendChild(iframe);

      // Trigger confetti on showing widget
      setConfettiKey(prev => prev + 1);
    }
  }, [showMintWidget]);

  // Cleanup iframe when modal closes or widget hides
  useEffect(() => {
    if (!showMintWidget && iframeRef.current) {
      iframeRef.current = null;
    }
  }, [showMintWidget]);

  const handleLogin = () => {
    // Guardar que el usuario quiere reclamar NFT
    localStorage.setItem('mercado_lp_pending_nft_claim', 'true');
    localStorage.setItem('mercado_lp_return_url', window.location.pathname);

    // Redirigir a login
    navigate('/login');
  };

  const handleShowMintWidget = () => {
    if (!isAuthenticated) {
      handleLogin();
      return;
    }
    setShowMintWidget(true);
  };

  const handleBackToInfo = () => {
    setShowMintWidget(false);
  };

  return (
    <>
      <ConfettiBurst trigger={confettiKey} />
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setShowMintWidget(false);
        }
        onClose();
      }}>
        <DialogContent className={`pixel-card ${showMintWidget ? 'max-w-xl max-h-[90vh] overflow-y-auto' : 'max-w-md'}`}>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl mb-4">
              {showMintWidget
                ? '🎨 Mintea tu NFT'
                : canClaimNFT
                  ? '🎉 ¡Reclama tu NFT!'
                  : '🔒 NFT Bloqueado'}
            </DialogTitle>
          </DialogHeader>

          {/* Mint Widget View */}
          {showMintWidget ? (
            <div className="space-y-4">
              {/* Bueno Art Widget Container (iframe) */}
              <div className="relative">
                {!widgetReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-xl min-h-[300px]">
                    <div className="text-center space-y-3">
                      <div className="text-4xl animate-bounce">🎨</div>
                      <p className="text-sm text-muted-foreground">Cargando widget de minting...</p>
                    </div>
                  </div>
                )}
                <div
                  ref={widgetContainerRef}
                  className="w-full"
                />
              </div>

              {/* Instructions */}
              <div className="pixel-card bg-muted/50 p-3 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">📋 Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Conecta tu wallet (MetaMask, WalletConnect, etc.)</li>
                  <li>El NFT es <strong>gratuito</strong> - solo pagas el gas</li>
                  <li>Una vez minteado, aparecerá en tu wallet</li>
                </ol>
              </div>

              {/* Back Button */}
              <Button
                onClick={handleBackToInfo}
                variant="outline"
                size="sm"
                className="w-full"
              >
                ← Volver a información
              </Button>
            </div>
          ) : (
            /* Info View */
            <div className="space-y-6">
              {/* NFT Preview */}
              <div className="relative">
                <div className={`pixel-card p-6 text-center ${
                  canClaimNFT
                    ? 'bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-yellow-900/30'
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
                      onClick={handleShowMintWidget}
                      className="w-full pixel-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      size="lg"
                    >
                      {isAuthenticated ? (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Conectar Wallet y Mintear
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
