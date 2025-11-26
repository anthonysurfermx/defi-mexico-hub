import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlayerLevel } from '@/components/games/mercado-lp/types/game';
import { ConfettiBurst } from './ConfettiBurst';

interface LevelUpModalProps {
  newLevel: PlayerLevel | null;
  onClose: () => void;
}

export const LevelUpModal = ({ newLevel, onClose }: LevelUpModalProps) => {
  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    if (newLevel) {
      setConfettiKey(prev => prev + 1);
    }
  }, [newLevel]);

  if (!newLevel) return null;

  return (
    <>
      <ConfettiBurst trigger={confettiKey} />
      <Dialog open={!!newLevel} onOpenChange={onClose}>
        <DialogContent className="pixel-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl mb-4">
              ¡Nivel Alcanzado!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Level icon and name */}
            <div className="flex flex-col items-center space-y-3">
              <div className="text-8xl animate-bounce">
                {newLevel.icon}
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {newLevel.name}
                </h3>
                <p className="text-lg text-muted-foreground">
                  Nivel {newLevel.level}
                </p>
              </div>
            </div>

            {/* Perks unlocked */}
            <div className="pixel-card bg-gradient-to-br from-primary/10 to-purple-500/5 p-4 space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <span>🎁</span> Ventajas desbloqueadas
              </h4>
              <ul className="space-y-1">
                {newLevel.perks.map((perk, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Motivational message */}
            <div className="text-center text-sm text-muted-foreground italic">
              {newLevel.level === 2 && "¡Ahora puedes proveer liquidez y ganar fees!"}
              {newLevel.level === 3 && "¡Crea tus propios tokens y abre tu huerto!"}
              {newLevel.level === 4 && "¡Descubre las subastas de clearing continuo!"}
              {newLevel.level === 5 && "¡Eres un maestro del DeFi!"}
              {newLevel.level === 6 && "¡Leyenda del Mercado LP! Has alcanzado el nivel máximo."}
            </div>

            {/* Close button */}
            <Button
              onClick={onClose}
              className="w-full pixel-button bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="lg"
            >
              ¡Continuar! 🎉
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
