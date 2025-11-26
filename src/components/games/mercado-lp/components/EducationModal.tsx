import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

interface EducationModalProps {
  open: boolean;
  onClose: () => void;
}

export const EducationModal = ({ open, onClose }: EducationModalProps) => {
  const [dragMangos, setDragMangos] = useState(2);
  const [buySize, setBuySize] = useState(5);

  const basculaLesson = useMemo(() => {
    const initialA = 10;
    const initialB = 100;
    const newA = Math.max(0.5, initialA - dragMangos);
    const k = initialA * initialB;
    const newB = k / newA;
    const priceBefore = initialB / initialA;
    const priceAfter = newB / newA;
    return { initialA, initialB, newA, newB, priceBefore, priceAfter, k };
  }, [dragMangos]);

  const impactLesson = useMemo(() => {
    const reserveA = 100;
    const reserveB = 1000;
    const amountIn = buySize;
    const amountInWithFee = amountIn * (1 - 0.003);
    const amountOut = (reserveB * amountInWithFee) / (reserveA + amountInWithFee);
    const priceBefore = reserveB / reserveA;
    const priceAfter = (reserveB - amountOut) / (reserveA + amountInWithFee);
    const impact = ((priceAfter - priceBefore) / priceBefore) * 100 * -1;
    return { amountOut, priceBefore, priceAfter, impact };
  }, [buySize]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl pixel-card">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <span>🎓</span> La Escuelita del Tianguis
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                <span>⚖️</span> La olla mágica (x·y=k)
              </h3>
              <div className="pixel-card bg-muted p-3 space-y-2">
                <p>Mueve el deslizador: quita mangos de la olla y mira cómo sube el precio.</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🥭</span>
                  <Slider
                    value={[dragMangos]}
                    min={0}
                    max={8}
                    step={1}
                    onValueChange={(v) => setDragMangos(v[0])}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">{dragMangos} mangos</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Card className="pixel-card bg-card/80 p-2">
                    <p className="font-semibold">Antes</p>
                    <p>🥭 {basculaLesson.initialA} · 🍋 {basculaLesson.initialB}</p>
                    <p>k = {basculaLesson.k}</p>
                    <p>Precio: 1 🥭 = {basculaLesson.priceBefore.toFixed(2)} 🍋</p>
                  </Card>
                  <Card className="pixel-card bg-card p-2">
                    <p className="font-semibold">Después</p>
                    <p>🥭 {basculaLesson.newA.toFixed(1)} · 🍋 {basculaLesson.newB.toFixed(1)}</p>
                    <p>k = {basculaLesson.k.toFixed(1)} (igual)</p>
                    <p>Precio: 1 🥭 = {basculaLesson.priceAfter.toFixed(2)} 🍋</p>
                  </Card>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Al haber menos mangos, cada mango “vale” más limones. Esa es la fórmula x·y=k en acción.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-secondary mb-2 flex items-center gap-2">
                <span>📈</span> Impacto de precio (slippage)
              </h3>
              <div className="pixel-card bg-muted p-3 space-y-2">
                <p>Si compras mucho de golpe, tú mismo subes el precio. Ajusta el tamaño de compra de mangos:</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🥭</span>
                  <Slider
                    value={[buySize]}
                    min={1}
                    max={50}
                    step={1}
                    onValueChange={(v) => setBuySize(v[0])}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">{buySize} mangos</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Card className="pixel-card bg-card/80 p-2">
                    <p className="font-semibold">Precio promedio</p>
                    <p>Antes: {impactLesson.priceBefore.toFixed(2)} 🍋</p>
                    <p>Después: {impactLesson.priceAfter.toFixed(2)} 🍋</p>
                  </Card>
                  <Card className="pixel-card bg-card p-2">
                    <p className="font-semibold">Impacto</p>
                    <p>{impactLesson.impact.toFixed(1)}% {impactLesson.impact < 6 ? '🟢' : impactLesson.impact < 12 ? '🟡' : '🔴'}</p>
                    <p className="text-[11px] text-muted-foreground">Recibes ~{impactLesson.amountOut.toFixed(1)} limones.</p>
                  </Card>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tip: en el mercado real, los grandes reparten su orden en partes para bajar el impacto.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                <span>🏪</span> Liquidez y propinas
              </h3>
              <p className="leading-relaxed">
                Pones dos frutas en la olla y ganas una parte de cada propina. Tu porcentaje define cuánta propina recibes.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Deposita ambas frutas en el ratio actual</li>
                <li>Ganas fees de cada swap según tu porcentaje</li>
                <li>Si el precio se mueve, cambia tu mezcla (IL)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-game-purple mb-2 flex items-center gap-2">
                <span>✨</span> Crea tu fruta y su mercado
              </h3>
              <p className="leading-relaxed">
                Inventar fruta no basta: debes abrir su olla con liquidez inicial. El precio de arranque lo pones tú; después manda el mercado.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Define ícono, símbolo y color</li>
                <li>Empareja con otra fruta y deposita ambas</li>
                <li>El depósito inicial fija el precio de arranque</li>
              </ul>
            </section>

            <section className="bg-primary/10 p-4 rounded">
              <h3 className="text-lg font-bold mb-2">🎯 Tips rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li>✅ Siempre mira el impacto antes de confirmar</li>
                <li>✅ Divide swaps grandes en varios pequeños</li>
                <li>✅ LP: elige rangos y hooks pensando en tu riesgo</li>
                <li>✅ Crea token + pool; sin olla, nadie puede comprar</li>
                <li className="text-[11px] text-muted-foreground">Más: v4.uniswap.org · Auditorías v4-core en GitHub</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
