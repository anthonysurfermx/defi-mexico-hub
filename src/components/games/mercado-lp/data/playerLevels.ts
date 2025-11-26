import { PlayerLevel } from '@/components/games/mercado-lp/types/game';

export const playerLevels: PlayerLevel[] = [
  {
    level: 1,
    name: 'Aprendiz',
    minXP: 0,
    maxXP: 199,
    icon: '🌱',
    perks: ['Acceso a Nivel 1: Marchante'],
  },
  {
    level: 2,
    name: 'Marchante',
    minXP: 200,
    maxXP: 499,
    icon: '🔄',
    perks: ['Acceso a Nivel 2: Puestero', 'Descuento 5% en fees'],
  },
  {
    level: 3,
    name: 'Puestero',
    minXP: 500,
    maxXP: 999,
    icon: '🏪',
    perks: ['Acceso a Nivel 3: Agricultor', 'Bonus XP +20%'],
  },
  {
    level: 4,
    name: 'Comerciante',
    minXP: 1000,
    maxXP: 1999,
    icon: '💼',
    perks: ['Acceso a Nivel 4: Subastero', 'Badge especial', 'Título personalizado'],
  },
  {
    level: 5,
    name: 'Maestro',
    minXP: 2000,
    maxXP: 3999,
    icon: '⭐',
    perks: ['Badge dorado', 'Bonus XP +50%', 'Descuento 15% en fees'],
  },
  {
    level: 6,
    name: 'Leyenda',
    minXP: 4000,
    maxXP: 999999,
    icon: '👑',
    perks: ['Badge legendario', 'Bonus XP +100%', 'Hall of Fame', 'Skin exclusiva'],
  },
];

export const getPlayerLevel = (xp: number): PlayerLevel => {
  for (let i = playerLevels.length - 1; i >= 0; i--) {
    if (xp >= playerLevels[i].minXP) {
      return playerLevels[i];
    }
  }
  return playerLevels[0];
};

export const getNextLevel = (currentLevel: number): PlayerLevel | null => {
  return playerLevels.find(l => l.level === currentLevel + 1) || null;
};

export const getXPProgress = (xp: number): { current: number; max: number; percentage: number } => {
  const level = getPlayerLevel(xp);
  const current = xp - level.minXP;
  const max = level.maxXP - level.minXP;
  const percentage = Math.min((current / max) * 100, 100);

  return { current, max, percentage };
};
