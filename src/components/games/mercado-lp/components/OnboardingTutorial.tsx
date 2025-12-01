import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlightSelector?: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenido al Mercado LP',
    description: 'Piensa en un puesto automático: siempre hay precio y no hay intermediarios. Aquí lo ves con frutas, fácil y sin complicarte.',
    position: 'center',
    tip: 'Es pura práctica. No es dinero real y puedes probar sin miedo.',
  },
  {
    id: 'inventory',
    title: 'Tus frutas (tokens)',
    description: 'Tienes pesos como moneda base y frutas como tokens. Cambiarás entre ellos y verás cómo varían los precios.',
    highlightSelector: '[data-tutorial="inventory"]',
    position: 'right',
    tip: 'Cada fruta = un token. Practica con montos pequeños para ver cómo funciona.',
  },
  {
    id: 'pools',
    title: 'Puestos (pools) automáticos',
    description: 'Cada pool tiene dos frutas. El precio cambia según cuánta hay de cada una. Si queda poca fruta, sube el precio.',
    highlightSelector: '[data-tutorial="pools"]',
    position: 'left',
    tip: 'Esto es un AMM: la fórmula mantiene balance y siempre te da un precio.',
  },
  {
    id: 'swap',
    title: 'Haz tu primer swap',
    description: 'Elige una fruta, pon un monto y mira cuánto recibes. Verás el impacto en precio si el monto es grande.',
    highlightSelector: '[data-tutorial="swap-form"]',
    position: 'top',
    action: 'Prueba con un monto pequeño para ver el cambio.',
    tip: 'Montos pequeños mueven menos el precio; es la mejor forma de aprender.',
  },
  {
    id: 'fees',
    title: 'Propinas (fees)',
    description: 'Cada swap paga una pequeña comisión que va a quienes pusieron frutas en el pool.',
    position: 'center',
    tip: 'Así se incentiva a que siempre haya frutas disponibles.',
  },
  {
    id: 'mission',
    title: 'Tu primera misión',
    description: 'Completa tu primer swap. Cambia algunos pesos por fruta y gana XP.',
    position: 'center',
    action: 'Haz un swap de pesos por cualquier fruta.',
    tip: 'Cada misión completada te da XP y te lleva al siguiente nivel.',
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTutorial = ({ onComplete, onSkip }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = tutorialSteps[currentStep];
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    // Highlight element if selector provided
    if (step.highlightSelector) {
      const element = document.querySelector(step.highlightSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightRect(null);
    }
  }, [currentStep, step.highlightSelector]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  // Position styles: centrado en pantalla para todos los pasos
  const getPositionStyles = () => {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Spotlight cutout for highlighted element */}
      {highlightRect && (
        <div
          className="absolute border-4 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none z-10 animate-pulse"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
          }}
        />
      )}

      {/* Tutorial Card */}
      <Card
        className={`absolute z-20 w-[400px] max-w-[90vw] pixel-card bg-card border-2 border-primary/50 shadow-2xl transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        style={getPositionStyles()}
      >
        {/* Header simple */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Tutorial rápido</p>
            <p className="font-bold">Mercado LP</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Action callout */}
          {step.action && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary">Tu misión:</p>
              <p className="text-sm">{step.action}</p>
            </div>
          )}

          {/* Tip */}
          {step.tip && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Tip rápido</p>
              <p>{step.tip}</p>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Paso {currentStep + 1} de {tutorialSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Saltar tutorial
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1 bg-primary hover:bg-primary/90"
            >
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  ¡Empezar!
                  <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Step indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {tutorialSteps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              index === currentStep
                ? 'bg-primary w-6'
                : index < currentStep
                ? 'bg-primary/60'
                : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
