import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameLevel } from '@/components/games/mercado-lp/types/game';
import { cn } from '@/lib/utils';

interface MarketPlazaMapProps {
  open: boolean;
  onClose: () => void;
  onEnterLevel: (level: GameLevel) => void;
  autoOpenLevel?: GameLevel | null;
  onAutoOpenConsumed?: () => void;
}

type StallZone = {
  id: GameLevel;
  label: string;
  area: { left: number; top: number; width: number; height: number }; // percentages
};

const stallZones: StallZone[] = [
  {
    id: 1,
    label: 'Marchanta',
    area: { left: 32, top: 50, width: 10, height: 18 }, // señora con chiles a la izquierda
  },
  {
    id: 2,
    label: 'Marchanto',
    area: { left: 52, top: 55, width: 9, height: 18 }, // puesto de plátanos en el centro
  },
  {
    id: 3,
    label: 'Doña Mari',
    area: { left: 57, top: 70, width: 9, height: 16 }, // señor en aguacates
  },
  {
    id: 4,
    label: 'El Subastero',
    area: { left: 68, top: 52, width: 10, height: 18 }, // puesto a la derecha
  },
];

const stallDialog: Record<
  GameLevel,
  {
    title: string;
    message: string;
    subtitle: string;
  }
> = {
  1: {
    title: 'Marchanta',
    subtitle: 'Desafío 1/4: Intercambiar (swaps)',
    message: 'Hola, soy la Marchanta. Vamos directo al primer reto: tu primer swap, paso a paso y sin enredos.',
  },
  2: {
    title: 'Marchanto',
    subtitle: 'Desafío 2/4: Liquidez',
    message: 'Hola, soy el Marchanto. Aquí aprenderás rápido cómo aportar liquidez y cobrar comisiones.',
  },
  3: {
    title: 'Doña Mari',
    subtitle: 'Desafío 3/4: Crear',
    message: 'Hola, soy Doña Mari. Te enseño a crear mezclas y estrategias nuevas para el AMM, en pocos pasos.',
  },
  4: {
    title: 'El Subastero',
    subtitle: 'Desafío 4/4: Subastas Continuas (CCA)',
    message: '¡Órale! Soy el Subastero. Te voy a enseñar las subastas continuas - distribución justa de tokens en bloques. ¡Ofertar temprano da mejor precio!',
  },
};

export const MarketPlazaMap = ({
  open,
  onClose,
  onEnterLevel,
  autoOpenLevel = null,
  onAutoOpenConsumed,
}: MarketPlazaMapProps) => {
  const [selected, setSelected] = useState<GameLevel | null>(null);
  const [dogPos, setDogPos] = useState<{ x: number; y: number }>({ x: 50, y: 70 });
  const [dialogZone, setDialogZone] = useState<StallZone | null>(null);
  const [autoOpened, setAutoOpened] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      let { x, y } = dogPos;
      const step = 4;
      if (key === 'arrowup' || key === 'w') y = Math.max(5, y - step);
      if (key === 'arrowdown' || key === 's') y = Math.min(95, y + step);
      if (key === 'arrowleft' || key === 'a') x = Math.max(5, x - step);
      if (key === 'arrowright' || key === 'd') x = Math.min(95, x + step);
      if (x !== dogPos.x || y !== dogPos.y) {
        e.preventDefault();
        setDogPos({ x, y });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dogPos, open]);

  const nearStall = useMemo(() => {
    return stallZones.find(zone => {
      return (
        dogPos.x >= zone.area.left &&
        dogPos.x <= zone.area.left + zone.area.width &&
        dogPos.y >= zone.area.top &&
        dogPos.y <= zone.area.top + zone.area.height
      );
    });
  }, [dogPos.x, dogPos.y]);

  useEffect(() => {
    if (open && autoOpenLevel && !autoOpened) {
      const zone = stallZones.find(z => z.id === autoOpenLevel);
      if (zone) {
        setAutoOpened(true);
        setTimeout(() => {
          openDialogForZone(zone);
          onAutoOpenConsumed?.();
        }, 300);
      }
    }
    if (!open) {
      setAutoOpened(false);
    }
  }, [open, autoOpenLevel, autoOpened]);

  if (!open) return null;

  const openDialogForZone = (zone: StallZone) => {
    setSelected(zone.id);
    setDialogZone(zone);
  };

  const handleContinue = () => {
    if (!dialogZone) return;
    onEnterLevel(dialogZone.id);
    setDialogZone(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-center bg-cover"
      style={{
        backgroundImage: "url('/market-plaza.png')",
        backgroundColor: '#f2a95c',
      }}
    >
      <div className="relative w-full h-full overflow-hidden">

        <div className="absolute top-3 right-3 flex gap-2">
          <Button variant="secondary" size="sm" className="pixel-button" onClick={onClose}>
            Entrar al juego
          </Button>
        </div>

        <div className="absolute top-3 left-3 pixel-card bg-card/60 backdrop-blur-sm px-3 py-2 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span>👣</span> Mueve el perrito con flechas/WASD y haz click en el puesto
          </div>
        </div>

        <div className="absolute top-3 left-1/2 -translate-x-1/2 pixel-card bg-card/60 backdrop-blur-sm px-4 py-2 text-sm font-bold tracking-wide">
          AMM de frutas
        </div>

        <div className="absolute inset-0">
          {stallZones.map(zone => (
            <div
              key={zone.id}
              className={cn(
                "absolute cursor-pointer flex flex-col items-center justify-center text-center",
                selected === zone.id ? 'animate-bounce-slow' : ''
              )}
              style={{
                left: `${zone.area.left}%`,
                top: `${zone.area.top}%`,
                width: `${zone.area.width}%`,
                height: `${zone.area.height}%`,
                transform: 'translate(-10%, -10%)',
              }}
              onClick={() => {
                openDialogForZone(zone);
              }}
            >
              <div className="text-xs mt-1 px-3 py-1 bg-card/80 border border-black/20 rounded-sm shadow-sm font-semibold">
                <span className="text-primary">N{zone.id}</span> - {zone.label}
              </div>
            </div>
          ))}

          <img
            src="/player.png"
            alt="Jugador con perrito"
            className="absolute w-16 h-auto animate-bob-slow pointer-events-none select-none drop-shadow-[0_4px_2px_rgba(0,0,0,0.35)]"
            style={{
              left: `${dogPos.x}%`,
              top: `${dogPos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />

          {nearStall && (
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 pixel-card bg-card/70 backdrop-blur-sm px-4 py-3 text-sm flex items-center gap-3">
              <span className="text-lg">❗</span>
              <div>
                <p className="font-semibold">{nearStall.label}</p>
                <p className="text-xs text-muted-foreground">Presiona el botón para entrar.</p>
              </div>
              <Button
                className="pixel-button"
                onClick={() => {
                  if (nearStall.id) {
                    openDialogForZone(nearStall);
                  }
                }}
              >
                Hablar
              </Button>
            </div>
          )}

          {dialogZone && (
            <div className="absolute left-1/2 bottom-6 -translate-x-1/2 w-[90%] max-w-3xl pixel-card bg-white/85 backdrop-blur-sm border-4 border-green-700/50 shadow-lg">
              <div className="px-4 py-3 border-b border-black/10 bg-gradient-to-r from-primary/10 to-purple-500/5 space-y-1">
                <p className="text-sm font-bold tracking-wide">{stallDialog[dialogZone.id].title}</p>
                <p className="text-xs text-muted-foreground">
                  {stallDialog[dialogZone.id].subtitle}
                </p>
              </div>
              <div className="px-4 py-3 text-sm leading-relaxed">
                <p>{stallDialog[dialogZone.id].message}</p>
              </div>
              <div className="px-4 py-3 flex justify-end">
                <Button className="pixel-button" onClick={handleContinue}>
                  Continuar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
