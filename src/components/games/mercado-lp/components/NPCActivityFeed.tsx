import { useGame } from '@/components/games/mercado-lp/contexts/GameContext';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

export const NPCActivityFeed = () => {
  const { npcActivities, npcs } = useGame();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [npcActivities.length]);

  return (
    <Card className="pixel-card p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span>📢</span> Actividad del Mercado
      </h3>
      
      <ScrollArea className="h-[200px]" ref={scrollRef}>
        <div className="space-y-2">
          {npcActivities.slice(0, 10).map(activity => {
            const npc = npcs.find(n => n.id === activity.npcId);
            if (!npc) return null;
            
            return (
              <div key={activity.id} className="pixel-card bg-muted p-2 text-xs animate-fade-in">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{npc.avatar}</span>
                  <div className="flex-1">
                    <p className="font-bold">{npc.name}</p>
                    <p className="text-muted-foreground">{activity.action}</p>
                    <p className="text-[10px] text-primary mt-1">
                      Hace {Math.floor((Date.now() - activity.timestamp) / 1000)}s
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {npcActivities.length === 0 && (
            <div className="text-center text-muted-foreground text-xs py-8">
              <p>El mercado está tranquilo...</p>
              <p className="text-[10px] mt-1">Los vendedores llegarán pronto</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
