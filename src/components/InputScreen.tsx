import React, { useState } from 'react';
import { UserMeasurements } from '../types';
import { HangerIcon } from './Icons';
import { TapeRulerGraphic } from './TapeRulerGraphic';
import { validateHeightWeight } from '../lib/matching/helpers';
import { MeasurementForm } from './shared/MeasurementForm';
import { hasStoredMeasurements } from '../lib/storage';
import { OnboardingWalkthrough } from './shared/OnboardingWalkthrough';

interface InputScreenProps {
  measurements: UserMeasurements;
  onMeasurementsChange: (m: UserMeasurements) => void;
  onSubmit: () => void;
  onOpenAbout: () => void;
  onOpenHowToMeasure: () => void;
  extraFormHeader?: React.ReactNode;
}

export const InputScreen: React.FC<InputScreenProps> = ({
  measurements,
  onMeasurementsChange,
  onSubmit,
  onOpenAbout,
  onOpenHowToMeasure,
  extraFormHeader,
}) => {
  const [showGuide, setShowGuide] = useState<boolean>(!hasStoredMeasurements());

  const validation = validateHeightWeight(measurements.height, measurements.weight, measurements.unit);
  const isFormValid = validation.heightValid && validation.weightValid;

  return (
    <div className="w-full page-transition pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        {/* Onboarding walkthrough for first-time visitors */}
        {showGuide && (
          <div className="mb-4">
            <OnboardingWalkthrough onOpenHowToMeasure={onOpenHowToMeasure} />
          </div>
        )}
      </div>

      {/* Main Unified Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4 lg:py-6">
        {/* Mobile-only Header: Logo and About info button */}
        <div className="lg:hidden flex justify-between items-center mb-3 max-w-[540px] mx-auto">
          <div className="flex items-center gap-2">
            <HangerIcon size={26} className="text-white" />
            <span className="font-barlow text-2xl sm:text-3xl font-semibold text-white tracking-wide">
              Tailor
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!showGuide && (
              <button
                onClick={() => setShowGuide(true)}
                className="pill-btn btn-press !text-xs !min-h-[36px] !h-9 !px-3 text-[#4ADE80] border-[#4ADE80]/40 inline-flex items-center"
              >
                Guide
              </button>
            )}
            <button
              onClick={onOpenAbout}
              className="circle-btn btn-press text-base font-serif italic !w-9 !h-9 !min-w-[36px] !min-h-[36px]"
              aria-label="About Tailor"
            >
              i
            </button>
          </div>
        </div>

        {/* Mobile-only Headline */}
        <div className="lg:hidden max-w-[540px] mx-auto mb-4">
          <h1 className="font-barlow text-4xl sm:text-5xl font-semibold text-white leading-[1.05]">
            Find your fit.
          </h1>
          <p className="text-secText text-xs sm:text-sm mt-1">
            Enter your measurements once to see your exact size across brands.
          </p>
        </div>

        {/* Responsive 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-16 items-start lg:items-center min-h-[calc(100vh-220px)]">
          {/* Left Column (Desktop Hero): hidden on mobile, visible on lg+ */}
          <section className="hidden lg:flex col-span-5 flex-col justify-center">
            <div className="backdrop-blur-xl bg-black/45 border border-white/10 rounded-[32px] p-6 lg:p-8 shadow-2xl">
              <h1 className="font-barlow text-[76px] xl:text-[90px] font-semibold text-white leading-[0.93] tracking-tight">
                Find<br />your fit.
              </h1>

              <p className="text-lg xl:text-xl text-[#E2E8F0] max-w-md mt-4 leading-relaxed">
                Enter your measurements once. See the right size across brands.
              </p>

              <ul className="space-y-3.5 mt-7 text-base text-white/95">
                <li className="flex items-center gap-3">
                  <span className="text-[#4ADE80] font-bold text-xl">✓</span>
                  <span>Compare 10+ brands at once</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#4ADE80] font-bold text-xl">✓</span>
                  <span>Matched from real size charts</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[#4ADE80] font-bold text-xl">✓</span>
                  <span>Stays private on your device</span>
                </li>
              </ul>

              <div className="mt-8 pt-2">
                <TapeRulerGraphic />
              </div>

              <div className="mt-4 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-xs text-[#4ADE80] hover:underline font-semibold"
                >
                  {showGuide ? 'Hide quick start guide' : 'Show quick start walkthrough →'}
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Unified Measurement Form */}
          <section className="col-span-12 lg:col-span-7 flex justify-center lg:justify-end w-full">
            <MeasurementForm
              measurements={measurements}
              onMeasurementsChange={onMeasurementsChange}
              onSubmit={onSubmit}
              onOpenHowToMeasure={onOpenHowToMeasure}
              isFormValid={isFormValid}
              validation={validation}
              extraHeaderActions={extraFormHeader}
            />
          </section>
        </div>
      </div>
    </div>
  );
};
export default InputScreen;
