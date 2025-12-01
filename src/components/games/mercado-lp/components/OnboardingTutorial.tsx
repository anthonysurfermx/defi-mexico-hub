import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, X, Sparkles, Target, Coins, ArrowLeftRight, Store } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  character: string;
  characterName: string;
  highlightSelector?: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  tip?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al Mercado LP! 🏪',
    description: 'Aquí aprenderás cómo funcionan los exchanges descentralizados (DEX) de una forma divertida. Imagina un tianguis mexicano donde se intercambian frutas.',
    character: '🤠',
    characterName: 'Don Pancho',
    position: 'center',
    tip: 'Este juego te enseñará conceptos reales de DeFi como AMM, liquidez e impermanent loss.',
  },
  {
    id: 'inventory',
    title: 'Tu Inventario de Frutas',
    description: 'Estas son tus frutas. Los pesos 💵 son tu moneda base, y tienes diferentes frutas como mangos 🥭, limones 🍋 y sandías 🍉 para intercambiar.',
    character: '👵',
    characterName: 'Doña María',
    highlightSelector: '[data-tutorial="inventory"]',
    position: 'right',
    tip: 'Cada fruta representa un token diferente en el mundo crypto.',
  },
  {
    id: 'pools',
    title: 'Los Puestos del Mercado (Pools)',
    description: 'Cada puesto tiene dos frutas que se pueden intercambiar. El precio depende de cuánta cantidad hay de cada una. ¡Menos mangos = más caros!',
    character: '👴',
    characterName: 'Don José',
    highlightSelector: '[data-tutorial="pools"]',
    position: 'left',
    tip: 'Esto es lo que en DeFi se llama un Automated Market Maker (AMM).',
  },
  {
    id: 'swap',
    title: 'Hacer un Intercambio (Swap)',
    description: 'Selecciona una fruta, elige cuánto quieres cambiar y observa cuánto recibirás. El "impacto de precio" te dice cuánto moviste el mercado.',
    character: '💃',
    characterName: 'Lupita',
    highlightSelector: '[data-tutorial="swap-form"]',
    position: 'top',
    action: 'Intenta hacer tu primer swap con una cantidad pequeña',
    tip: 'Swaps grandes mueven más el precio. Los traders expertos dividen sus órdenes.',
  },
  {
    id: 'fees',
    title: 'Las Propinas (Fees)',
    description: 'Cada vez que alguien hace un swap, paga una pequeña propina. Esta propina va para los dueños de los puestos que proveen liquidez.',
    character: '🤠',
    characterName: 'Don Pancho',
    position: 'center',
    tip: 'En el mundo real, estas fees van del 0.01% al 1% dependiendo del protocolo.',
  },
  {
    id: 'mission',
    title: '¡Tu Primera Misión! 🎯',
    description: 'Completa tu primer swap exitosamente. Cambia algunos pesos por mangos y gana tu primera recompensa de XP.',
    character: '💃',
    characterName: 'Lupita',
    position: 'center',
    action: 'Haz un swap de al menos 10 pesos por cualquier fruta',
    tip: 'Completa retos para subir de nivel y desbloquear nuevas funciones.',
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

  // Position styles based on step position
  const getPositionStyles = () => {
    if (highlightRect && step.position !== 'center') {
      switch (step.position) {
        case 'top':
          return {
            top: Math.max(16, highlightRect.top - 280),
            left: Math.max(16, highlightRect.left + highlightRect.width / 2 - 200),
          };
        case 'bottom':
          return {
            top: Math.min(window.innerHeight - 280, highlightRect.bottom + 16),
            left: Math.max(16, highlightRect.left + highlightRect.width / 2 - 200),
          };
        case 'left':
          return {
            top: Math.max(16, highlightRect.top + highlightRect.height / 2 - 140),
            left: Math.max(16, highlightRect.left - 420),
          };
        case 'right':
          return {
            top: Math.max(16, highlightRect.top + highlightRect.height / 2 - 140),
            left: Math.min(window.innerWidth - 420, highlightRect.right + 16),
          };
      }
    }
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
        {/* Header with character */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-bounce">{step.character}</div>
              <div>
                <p className="text-xs text-muted-foreground">Guía del Mercado</p>
                <p className="font-bold">{step.characterName}</p>
              </div>
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
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Action callout */}
          {step.action && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-start gap-2">
              <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-primary">Tu misión:</p>
                <p className="text-sm">{step.action}</p>
              </div>
            </div>
          )}

          {/* Tip */}
          {step.tip && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{step.tip}</p>
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
