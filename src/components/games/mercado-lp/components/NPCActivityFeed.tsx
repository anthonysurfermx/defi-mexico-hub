import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState } from 'react';
import { getRecentMarketActivity, MarketActivity } from '@/components/games/mercado-lp/lib/supabase';
import { getPlayerLevel } from '@/components/games/mercado-lp/data/playerLevels';

export const NPCActivityFeed = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<MarketActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      setIsLoading(true);
      const data = await getRecentMarketActivity(10);
      setActivities(data);
      setIsLoading(false);
    };

    loadActivity();

    // Refresh every 30 seconds
    const interval = setInterval(loadActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities.length]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  const getActivityDescription = (activity: MarketActivity) => {
    const level = getPlayerLevel(activity.xp);
    if (activity.swap_count > 10) {
      return `Alcanzó ${activity.swap_count} swaps como ${level.name}`;
    }
    if (activity.xp > 1000) {
      return `Subió a ${level.name} con ${activity.xp} XP`;
    }
    return `Jugando como ${level.name}`;
  };

  return (
    <Card className="pixel-card p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span>📢</span> Actividad del Mercado
      </h3>

      <ScrollArea className="h-[200px]" ref={scrollRef}>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center text-muted-foreground text-xs py-8">
              <p>Cargando actividad...</p>
            </div>
          ) : activities.length > 0 ? (
            activities.map(activity => {
              const level = getPlayerLevel(activity.xp);
              return (
                <div key={activity.id} className="pixel-card bg-muted p-2 text-xs animate-fade-in">
                  <div className="flex items-start gap-2">
                    {activity.user_avatar ? (
                      <img
                        src={activity.user_avatar}
                        alt={activity.user_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                        {level.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold">{activity.user_name}</p>
                      <p className="text-muted-foreground">{getActivityDescription(activity)}</p>
                      <p className="text-[10px] text-primary mt-1">
                        {getTimeAgo(activity.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground text-xs py-8">
              <p>El mercado está tranquilo...</p>
              <p className="text-[10px] mt-1">¡Sé el primero en jugar!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
