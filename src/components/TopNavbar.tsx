import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TopNavbarProps {
  currentStep: 1 | 2 | 3;
  canGoToResults?: boolean;
  onOpenHowToMeasure: () => void;
  onOpenAbout: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentStep,
  canGoToResults = false,
  onOpenHowToMeasure,
  onOpenAbout,
}) => {
  const navigate = useNavigate();

  return (
    <header className="hidden lg:flex w-full max-w-7xl mx-auto px-6 lg:px-8 pt-6 pb-2 items-center justify-between">
      {/* Left: Brand Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
        aria-label="Tailor home"
      >
        <img
          src="/logo-tailor-accent.svg"
          alt="Tailor"
          className="h-10 xl:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </button>

      {/* Center: Desktop 3-Step Wizard Stepper with Frosted Capsule */}
      <nav aria-label="Progress steps" className="hidden sm:flex items-center gap-2.5 md:gap-3.5 px-4 py-1.5 rounded-full backdrop-blur-xl bg-black/50 border border-white/12 shadow-lg">
        {/* Step 1: Measurements */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full py-1 px-2"
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 1
                ? 'bg-[#1DA84A] text-white shadow-[0_0_12px_rgba(29,168,74,0.4)]'
                : 'bg-[#1DA84A]/25 text-[#4ADE80] border border-[#4ADE80]/50'
            }`}
          >
            {currentStep > 1 ? '✓' : '1'}
          </span>
          <span className={currentStep === 1 ? 'text-white font-bold' : 'text-[#D6D6DC] hover:text-white'}>
            Measurements
          </span>
        </button>

        {/* Divider 1 */}
        <div className="w-6 md:w-8 h-[1.5px] bg-white/20" aria-hidden="true" />

        {/* Step 2: Results */}
        <button
          onClick={() => {
            if (canGoToResults || currentStep > 2) navigate('/results');
          }}
          disabled={!canGoToResults && currentStep < 2}
          className={`flex items-center gap-2 text-xs md:text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full py-1 px-2 ${
            !canGoToResults && currentStep < 2 ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'
          }`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 2
                ? 'bg-[#1DA84A] text-white shadow-[0_0_12px_rgba(29,168,74,0.4)]'
                : currentStep > 2
                ? 'bg-[#1DA84A]/25 text-[#4ADE80] border border-[#4ADE80]/50'
                : 'border border-white/30 text-white/50'
            }`}
          >
            {currentStep > 2 ? '✓' : '2'}
          </span>
          <span className={currentStep === 2 ? 'text-white font-bold' : 'text-[#D6D6DC] hover:text-white'}>
            Results
          </span>
        </button>

        {/* Divider 2 */}
        <div className="w-6 md:w-8 h-[1.5px] bg-white/20" aria-hidden="true" />

        {/* Step 3: Your size */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 3
                ? 'bg-[#1DA84A] text-white shadow-[0_0_12px_rgba(29,168,74,0.4)]'
                : 'border border-white/30 text-white/50'
            }`}
          >
            3
          </span>
          <span className={currentStep === 3 ? 'text-white font-bold' : 'text-white/50'}>
            Your size
          </span>
        </div>
      </nav>

      {/* Right: Actions (How to measure & About) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenHowToMeasure}
          className="pill-btn btn-press !min-h-[38px] !px-3.5 text-xs sm:text-sm font-medium border border-white/20 hover:border-white/40"
        >
          How to measure
        </button>
        <button
          type="button"
          onClick={onOpenAbout}
          className="pill-btn btn-press !min-h-[38px] !px-3.5 text-xs sm:text-sm font-medium border border-white/20 hover:border-white/40"
        >
          About
        </button>
      </div>
    </header>
  );
};

