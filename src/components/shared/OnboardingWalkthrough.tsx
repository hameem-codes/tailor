import React, { useState } from 'react';
import { isOnboardingSeen, setOnboardingSeen } from '../../lib/storage';

interface OnboardingWalkthroughProps {
  onOpenHowToMeasure?: () => void;
  className?: string;
}

export const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({
  onOpenHowToMeasure,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(isOnboardingSeen());
  const [activeStep, setActiveStep] = useState<number>(1);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    setOnboardingSeen(true);
  };

  const steps = [
    {
      step: 1,
      title: 'Pick Who & What',
      desc: 'Select gender and clothing type (T-shirt, Shirt, Pants, or Jacket) to calibrate the size charts.',
      icon: '👕',
    },
    {
      step: 2,
      title: 'Set Your Measurements',
      desc: 'Enter height and weight. Chest and waist are optional but give you millimeter-accurate sizing.',
      icon: '📐',
    },
    {
      step: 3,
      title: 'Get Cross-Brand Fits',
      desc: 'Tap "Find my size" to see your exact recommended size and fit range across 20+ top brands.',
      icon: '✨',
    },
  ];

  return (
    <div
      role="region"
      aria-label="First-time user onboarding"
      className={`glass-card p-4 sm:p-5 border border-[#4ADE80]/40 rounded-[24px] shadow-2xl relative overflow-hidden animate-fade-in ${className}`}
    >
      {/* Decorative top-right glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#4ADE80]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1DA84A] text-white text-xs font-bold">
            ?
          </span>
          <h3 className="font-semibold text-sm sm:text-base text-white">
            First time using Tailor? Quick 3-Step Guide
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-xs text-secText hover:text-white transition-colors !px-3 !min-h-[44px] rounded-lg hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Dismiss guide"
        >
          Got it ×
        </button>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
        {steps.map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => setActiveStep(s.step)}
            aria-pressed={activeStep === s.step}
            className={`p-3 rounded-2xl border transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeStep === s.step
                ? 'bg-white/10 border-[#4ADE80]/60 ring-1 ring-[#4ADE80]/40'
                : 'bg-white/5 border-white/10 hover:bg-white/8'
            }`}
          >
            <span className="flex items-center gap-2 mb-1">
              <span className="text-base" aria-hidden="true">{s.icon}</span>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Step {s.step}
              </span>
            </span>
            <span className="block text-xs sm:text-[13px] font-semibold text-white mb-0.5">
              {s.title}
            </span>
            <span className="block text-xs text-secText leading-relaxed">
              {s.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Footer action bar */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-xs relative z-10">
        {onOpenHowToMeasure ? (
          <button
            type="button"
            onClick={onOpenHowToMeasure}
            className="text-[#4ADE80] font-semibold hover:underline inline-flex items-center gap-1 !min-h-[44px] rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Don't have a tape measure? See tips →
          </button>
        ) : (
          <span className="text-secText">All data stays stored privately on your device.</span>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 !px-3.5 !min-h-[44px] rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Dismiss guide
        </button>
      </div>
    </div>
  );
};

