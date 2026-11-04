import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveLocalFeedback } from '../lib/storage';

interface AboutScreenProps {
  brandContext?: string;
  sizeContext?: string;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  brandContext = 'General',
  sizeContext = 'M',
}) => {
  const navigate = useNavigate();
  const [feedbackGiven, setFeedbackGiven] = useState<'well' | 'tight' | 'loose' | null>(null);

  const handleFeedback = (sentiment: 'well' | 'tight' | 'loose') => {
    setFeedbackGiven(sentiment);
    saveLocalFeedback({
      brandId: brandContext,
      size: sizeContext,
      sentiment,
      timestamp: new Date().toISOString(),
    });
  };

  const handleGoBack = () => {
    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="w-full max-w-[640px] mx-auto min-h-screen flex flex-col gap-4 p-4 sm:p-6 lg:p-8 pb-20 page-transition">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleGoBack}
          className="circle-btn btn-press"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="font-barlow text-3xl sm:text-4xl font-semibold text-white tracking-wide">
          About Tailor
        </h1>
      </div>

      {/* Intro */}
      <p className="text-[16px] leading-relaxed text-[#E4E4E8]">
        Tailor matches your body measurements to real brand size charts, so a Medium means the same thing everywhere.
      </p>

      {/* Collapsible FAQ sections */}
      <div className="glass-card p-0 gap-0 overflow-hidden divide-y divide-white/12 border border-white/12">
        <details className="group" open>
          <summary className="min-h-[56px] flex items-center justify-between px-4 sm:px-5 py-3 font-semibold text-base text-white cursor-pointer select-none">
            <span>How it works</span>
            <span className="text-secText font-normal group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
          </summary>
          <div className="px-4 sm:px-5 pb-4 text-[15px] leading-relaxed text-[#D6D6DC]">
            Enter your measurements. Pick the garment and fit. We compare your numbers to each brand's chart and show a size per brand with a match label.
          </div>
        </details>

        <details className="group">
          <summary className="min-h-[56px] flex items-center justify-between px-4 sm:px-5 py-3 font-semibold text-base text-white cursor-pointer select-none">
            <span>Data and privacy</span>
            <span className="text-secText font-normal group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
          </summary>
          <div className="px-4 sm:px-5 pb-4 text-[15px] leading-relaxed text-[#D6D6DC]">
            Sizes come from official brand guides, cleaned and standardized. Your measurements stay on your device and are never stored or sent to a server.
          </div>
        </details>

        <details className="group">
          <summary className="min-h-[56px] flex items-center justify-between px-4 sm:px-5 py-3 font-semibold text-base text-white cursor-pointer select-none">
            <span>Why does my size differ across brands?</span>
            <span className="text-secText font-normal group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
          </summary>
          <div className="px-4 sm:px-5 pb-4 text-[15px] leading-relaxed text-[#D6D6DC]">
            Brands cut sizes differently, so labels like M are not comparable. Tailor compares your actual body dimensions against the brand's specifications instead.
          </div>
        </details>

        <details className="group">
          <summary className="min-h-[56px] flex items-center justify-between px-4 sm:px-5 py-3 font-semibold text-base text-white cursor-pointer select-none">
            <span>How accurate is this?</span>
            <span className="text-secText font-normal group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
          </summary>
          <div className="px-4 sm:px-5 pb-4 text-[15px] leading-relaxed text-[#D6D6DC]">
            Accuracy is highest when you add chest and waist. Treat results as a strong guide, not a guarantee, since personal garment draping varies.
          </div>
        </details>
      </div>

      {/* Local Feedback Card */}
      <div className="glass-card p-5 space-y-3 border border-white/12">
        <div className="font-semibold text-base text-white">Did this size fit you?</div>
        {feedbackGiven ? (
          <p className="text-sm text-[#4ADE80] font-medium animate-fade-in py-1">
            Thanks! Your feedback is saved locally on your device.
          </p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleFeedback('well')}
              className="pill-btn btn-press flex-1 min-w-[90px]"
            >
              Fit well
            </button>
            <button
              onClick={() => handleFeedback('tight')}
              className="pill-btn btn-press flex-1 min-w-[90px]"
            >
              Too tight
            </button>
            <button
              onClick={() => handleFeedback('loose')}
              className="pill-btn btn-press flex-1 min-w-[90px]"
            >
              Too loose
            </button>
          </div>
        )}
      </div>

      {/* Solid white Close button */}
      <button
        onClick={handleGoBack}
        className="secondary-btn btn-press w-full mt-2"
      >
        Close
      </button>
    </div>
  );
};

