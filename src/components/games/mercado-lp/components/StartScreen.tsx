import { Button } from '@/components/ui/button';
import { GameLevel } from '@/components/games/mercado-lp/types/game';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface StartScreenProps {
  onSelectRole: (level: GameLevel, avatar: string) => void;
}

interface CharacterCardProps {
  imageSrc: string;
  label: string;
}

const CharacterCard = ({ imageSrc, label }: CharacterCardProps) => {
  return (
    <div className="relative flex flex-col items-center gap-5">
      <div className="pixel-card bg-card/70 p-4 shadow-md">
        <img
          src={imageSrc}
          alt={label}
          className="w-48 h-48 object-contain"
        />
      </div>
      <h3 className="text-lg font-semibold text-center leading-tight">
        {label}
      </h3>
    </div>
  );
};

const roleCards: Array<{
  level: GameLevel;
  title: string;
  gradient: string;
  description: string;
  characterImage: string;
  characterLabel: string;
}> = [
  {
    level: 1,
    title: 'Swapper',
    gradient: 'from-emerald-500/20 via-green-500/10 to-lime-500/5',
    description:
      'Observa en silencio, hace cuentas en la cabeza y truequea sin nervios. Prueba chiquito, mide y luego se avienta. Explica lo complejo de forma simple.',
    characterImage: '/player.png',
    characterLabel: 'Don Vitalik “El Truequero”',
  },
  {
    level: 2,
    title: 'Provider',
    gradient: 'from-emerald-500/20 via-green-500/10 to-lime-500/5',
    description:
      'Llega temprano, arma el puesto derechito y deja la balanza lista. Ajusta y reacomoda para que no se vacíe una canasta más que la otra. Trabaja fino y sin alarde.',
    characterImage: '/player1.3.png',
    characterLabel: 'Don Hayden “El Puestero”',
  },
  {
    level: 3,
    title: 'Token Creator',
    gradient: 'from-emerald-500/20 via-green-500/10 to-lime-500/5',
    description:
      'Creativa y metódica. Inventa nombres, etiquetas e historias, y lanza con plan: cuánta fruta, cómo repartirla y cómo arrancar fuerte.',
    characterImage: '/player1.2.png',
    characterLabel: 'Doña Esmeralda “La Semillera”',
  },
  {
    level: 4,
    title: 'Auctioneer',
    gradient: 'from-emerald-500/20 via-green-500/10 to-lime-500/5',
    description:
      'Aparece cuando el tianguis está a reventar. Habla poco, se mueve rápido y juega con el tiempo y la urgencia. Se adelanta y cierra antes de que otros reaccionen.',
    characterImage: '/player1.1.png',
    characterLabel: 'Doña Lupe “La Martillera”',
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
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roleCards.map(({ level, title, gradient, description, characterImage, characterLabel }) => (
              <div
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`relative overflow-hidden pixel-card p-4 flex flex-col gap-4 cursor-pointer transition-transform duration-150 ${
                  selectedLevel === level ? 'ring-4 ring-foreground translate-y-[-4px]' : 'hover:-translate-y-1'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} aria-hidden />
                <div className="absolute inset-0 bg-card/80" aria-hidden />

                <div className="relative flex justify-center">
                  <CharacterCard imageSrc={characterImage} label={characterLabel} />
                </div>

                <p className="relative text-sm text-foreground/90 leading-relaxed">{description}</p>

                <Button
                  onClick={() => onSelectRole(level, characterImage)}
                  className="relative pixel-button mt-auto"
                  variant="default"
                >
                  Seleccionar Jugador
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
