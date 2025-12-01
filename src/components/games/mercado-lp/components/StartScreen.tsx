import { Button } from '@/components/ui/button';
import { GameLevel } from '@/components/games/mercado-lp/types/game';
import { Sparkles, Coins, FlaskConical, Gavel, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface StartScreenProps {
  onSelectRole: (level: GameLevel) => void;
}

type PixelPalette = Record<string, string>;

interface PixelAvatarProps {
  pattern: string[];
  palette: PixelPalette;
  label: string;
}

const PixelAvatar = ({ pattern, palette, label }: PixelAvatarProps) => {
  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="pixel-card bg-card/70 p-2 shadow-md">
        <div className="grid grid-cols-[repeat(12,14px)] gap-[2px] bg-foreground/5 p-2">
          {pattern.map((row, rowIdx) =>
            row.split('').map((cell, colIdx) => {
              if (cell === '.') {
                return <span key={`${rowIdx}-${colIdx}`} className="w-[14px] h-[14px]" />;
              }
              const fill = palette[cell] || '#111827';
              return (
                <span
                  key={`${rowIdx}-${colIdx}`}
                  className="w-[14px] h-[14px] rounded-[2px]"
                  style={{ backgroundColor: fill }}
                />
              );
            })
          )}
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
    </div>
  );
};

const roleCards: Array<{
  level: GameLevel;
  title: string;
  label: string;
  icon: string;
  AccentIcon: typeof Sparkles;
  gradient: string;
  description: string;
  bullets: string[];
  avatarPattern: string[];
  avatarPalette: PixelPalette;
  avatarLabel: string;
}> = [
  {
    level: 1,
    title: 'Swapper',
    label: 'Nivel 1 · Marchante',
    icon: '🔄',
    AccentIcon: Sparkles,
    gradient: 'from-amber-500/20 via-orange-500/10 to-yellow-500/5',
    description: 'Empieza como comprador/vendedor rápido. Aprende cómo el precio se mueve con cada trueque.',
    bullets: [
      'Cambia frutas sin fricción con pools ya abiertos',
      'Observa el impacto de precio y el deslizamiento',
      'Cumple retos rápidos para ganar reputación',
    ],
    avatarPattern: [
      '............',
      '.....YY.....',
      '....YYYY....',
      '....YBBY....',
      '...YBBBBY...',
      '...YWWWWY...',
      '..YWWYYWWY..',
      '..YWWYYWWY..',
      '..YBBBBBBY..',
      '...YBYYBY...',
      '...YBYYBY...',
      '..YB....BY..',
    ],
    avatarPalette: {
      Y: '#fbbf24',
      B: '#0ea5e9',
      W: '#f3f4f6',
    },
    avatarLabel: 'Runner',
  },
  {
    level: 2,
    title: 'Provider',
    label: 'Nivel 2 · Puestero',
    icon: '🏪',
    AccentIcon: Coins,
    gradient: 'from-emerald-500/20 via-green-500/10 to-lime-500/5',
    description: 'Coloca tu propio puesto en el mercado y cobra comisiones cada vez que alguien intercambia.',
    bullets: [
      'Aporta liquidez y equilibra dos frutas a la vez',
      'Ve cómo las fees se suman a tus ganancias',
      'Protege tu reputación manteniendo precios sanos',
    ],
    avatarPattern: [
      '............',
      '....GGGG....',
      '...GPPPPG...',
      '...GPPPPG...',
      '..GPPWWPPG..',
      '..GPPWWPPG..',
      '..GPPPPPPG..',
      '..GPPYYPPG..',
      '..GPPPYYPG..',
      '..GPPPYYPG..',
      '..GPP....G..',
      '...G......G.',
    ],
    avatarPalette: {
      G: '#22c55e',
      P: '#ec4899',
      W: '#f8fafc',
      Y: '#f59e0b',
    },
    avatarLabel: 'Tender',
  },
  {
    level: 3,
    title: 'Token Creator',
    label: 'Nivel 3 · Agricultor',
    icon: '🚜',
    AccentIcon: FlaskConical,
    gradient: 'from-pink-500/20 via-rose-500/10 to-purple-500/5',
    description: 'Diseña tu propia fruta/token y lánzala con liquidez inicial para que otros puedan comprarla.',
    bullets: [
      'Define la oferta y el branding de tu token',
      'Abre su primer pool con la mezcla correcta',
      'Genera hype con eventos y atrae marchantes',
    ],
    avatarPattern: [
      '............',
      '.....PP.....',
      '....PPPP....',
      '...PPYYPP...',
      '...PPYYPP...',
      '..PPPPPPPP..',
      '..PPWWWWPP..',
      '..PPWWWWPP..',
      '..PPPPPPPP..',
      '..PPG..GPP..',
      '..PPG..GPP..',
      '...P....P...',
    ],
    avatarPalette: {
      P: '#a855f7',
      Y: '#fbbf24',
      W: '#e5e7eb',
      G: '#22c55e',
    },
    avatarLabel: 'Farmer',
  },
  {
    level: 4,
    title: 'Auctioneer',
    label: 'Nivel 4 · Subastero',
    icon: '🔨',
    AccentIcon: Gavel,
    gradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/5',
    description: 'Participa en subastas continuas donde el precio se ajusta bloque a bloque según la demanda.',
    bullets: [
      'Coloca ofertas en múltiples bloques futuros',
      'Aprende cómo el precio de clearing equilibra oferta/demanda',
      'Estrategiza cuándo ofertar temprano vs tarde',
    ],
    avatarPattern: [
      '............',
      '.....VV.....',
      '....VVVV....',
      '...VVWWVV...',
      '...VVWWVV...',
      '..VVVVVVVV..',
      '..VVYYYYVV..',
      '..VVYYYYVV..',
      '..VVVVVVVV..',
      '..VVO..OVV..',
      '..VVO..OVV..',
      '...V....V...',
    ],
    avatarPalette: {
      V: '#8b5cf6',
      W: '#f3f4f6',
      Y: '#fbbf24',
      O: '#f97316',
    },
    avatarLabel: 'Bidder',
  },
];

export const StartScreen = ({ onSelectRole }: StartScreenProps) => {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Botón sutil para regresar al home */}
      <Link
        to="/"
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all duration-200 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="font-medium">DeFi México Hub</span>
      </Link>

      <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden>
        <div className="w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,136,0.1)_0,rgba(0,0,0,0)_30%),radial-gradient(circle_at_80%_0%,rgba(0,212,255,0.1)_0,rgba(0,0,0,0)_25%),radial-gradient(circle_at_30%_80%,rgba(139,92,246,0.1)_0,rgba(0,0,0,0)_30%)]" />
      </div>

      <div className="relative max-w-6xl w-full px-4">
        <div className="pixel-card p-6 md:p-8 bg-card backdrop-blur">
          <div className="text-center space-y-3 mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-4xl">🏪</span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">MERCADO LP</h1>
            </div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Aprende DeFi jugando en un mercado mexicano</p>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Desde hacer trueques simples hasta crear tokens y participar en subastas.
              Cada nivel te enseña un concepto clave de los DEX modernos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roleCards.map(({ level, title, label, icon, AccentIcon, gradient, description, bullets, avatarPattern, avatarPalette, avatarLabel }) => (
              <div
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`relative overflow-hidden pixel-card p-4 flex flex-col gap-4 cursor-pointer transition-transform duration-150 ${
                  selectedLevel === level ? 'ring-4 ring-foreground translate-y-[-4px]' : 'hover:-translate-y-1'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} aria-hidden />
                <div className="absolute inset-0 bg-card/80" aria-hidden />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{icon}</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                      <h3 className="text-lg font-bold">{title}</h3>
                    </div>
                  </div>
                  <div className="pixel-card bg-card/80 px-3 py-2 text-[10px] font-semibold tracking-wide">
                    Lvl {level}
                  </div>
                </div>

                <div className="relative flex justify-center">
                  <PixelAvatar pattern={avatarPattern} palette={avatarPalette} label={avatarLabel} />
                </div>

                <p className="relative text-sm text-foreground/90 leading-relaxed">{description}</p>

                <div className="relative space-y-2 text-xs text-foreground/90">
                  {bullets.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <AccentIcon className="w-3.5 h-3.5 mt-0.5 text-foreground/90" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => onSelectRole(level)}
                  className="relative pixel-button mt-auto"
                  variant="default"
                >
                  Jugar como {title}
                </Button>
              </div>
            ))}
          </div>

          <div className="relative mt-6 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              💡 Puedes cambiar de nivel cuando quieras desde el menú superior
            </p>
            <p className="text-xs text-muted-foreground">
              Completa retos para ganar XP, badges y desbloquear nuevos tokens
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
