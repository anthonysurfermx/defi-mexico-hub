import { useEffect, useState } from 'react';
import { Badge } from '@/components/games/mercado-lp/types/game';
import { Card } from '@/components/ui/card';

interface BadgeNotificationProps {
  badge: Badge | null;
  onDismiss: () => void;
}

export const BadgeNotification = ({ badge, onDismiss }: BadgeNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [badge, onDismiss]);

  if (!badge) return null;

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <Card
        className={`
          pixel-card p-4 bg-gradient-to-br from-accent to-primary text-white
          pointer-events-auto transition-all duration-300 shadow-xl
          ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-4'}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="text-4xl animate-bounce-slow">{badge.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                ¡Insignia Desbloqueada!
              </span>
            </div>
            <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
            <p className="text-sm opacity-90">{badge.description}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
