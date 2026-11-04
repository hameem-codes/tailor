import React, { useState } from 'react';
import { UserMeasurements } from '../types';
import { HangerIcon } from './Icons';
import { TapeRulerGraphic } from './TapeRulerGraphic';
import { validateHeightWeight } from '../lib/matching/helpers';
import { MeasurementForm } from './shared/MeasurementForm';
import { isOnboardingSeen, setOnboardingSeen } from '../lib/storage';

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
  const [onboardingSeen, setOnboardingSeenState] = useState<boolean>(isOnboardingSeen());

  const validation = validateHeightWeight(measurements.height, measurements.weight);
  const isFormValid = validation.heightValid && validation.weightValid;

  return (
    <div className="w-full page-transition pb-16">
      {/* Onboarding Welcome Banner for first-time users */}
      {!onboardingSeen && (
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 mx-auto">
          <div
            role="region"
            aria-label="Welcome onboarding"
            className="flex items-center gap-3 rounded-[20px] bg-black/60 backdrop-blur-md border border-[#4ADE80]/50 p-2 sm:p-2.5 pl-4 sm:pl-5 pr-2 animate-fade-in shadow-xl"
          >
            <span className="flex-1 text-xs sm:text-sm text-white font-normal leading-snug">
              👋 <strong>Welcome to Tailor!</strong> Enter your measurements once to see your exact size match across top clothing brands. Chest and waist are optional but improve accuracy.
            </span>
            <button
              onClick={() => {
                setOnboardingSeenState(true);
                setOnboardingSeen(true);
              }}
              className="circle-btn btn-press !w-8 !h-8 !min-w-[32px] !min-h-[32px] !text-base !bg-transparent hover:!bg-white/10 text-white flex-none"
              aria-label="Dismiss welcome"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Unified Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
        {/* Mobile-only Header: Logo and About info button */}
        <div className="lg:hidden flex justify-between items-center mb-3 max-w-[540px] mx-auto">
          <div className="flex items-center gap-2">
            <HangerIcon size={26} className="text-white" />
            <span className="font-barlow text-2xl sm:text-3xl font-semibold text-white tracking-wide">
              Tailor
            </span>
          </div>
          <button
            onClick={onOpenAbout}
            className="circle-btn btn-press text-base font-serif italic !w-9 !h-9"
            aria-label="About Tailor"
          >
            i
          </button>
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
