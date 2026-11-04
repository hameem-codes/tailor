import React, { useState, useEffect, useRef } from 'react';
import { saveLocalFeedback } from '../lib/storage';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandContext?: string;
  sizeContext?: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  brandContext = 'General',
  sizeContext = 'M',
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'well' | 'tight' | 'loose' | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFeedback = (sentiment: 'well' | 'tight' | 'loose') => {
    setFeedbackGiven(sentiment);
    saveLocalFeedback({
      brandId: brandContext,
      size: sizeContext,
      sentiment,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md glass-card p-6 border border-white/15 max-h-[90vh] overflow-y-auto space-y-4"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="circle-btn btn-press"
            aria-label="Back"
          >
            ←
          </button>
          <h2 id="about-modal-title" className="font-barlow text-3xl font-semibold">
            About Tailor
          </h2>
        </div>

        {/* Intro */}
        <p className="text-[16px] leading-relaxed text-[#E4E4E8]">
          Tailor matches your body measurements to real brand size charts, so a Medium means the same thing everywhere.
        </p>

        {/* Collapsible FAQ sections */}
        <div className="glass-card p-0 gap-0 overflow-hidden divide-y divide-white/10">
          <details className="group" open>
            <summary className="min-h-[56px] flex items-center justify-between px-4 py-3 font-semibold text-base cursor-pointer select-none">
              <span>How it works</span>
              <span className="text-secText font-normal group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
            </summary>
            <div className="px-4 pb-4 text-[15px] leading-relaxed text-[#D6D6DC]">
              Enter your measurements. Pick the garment and fit. We compare your numbers to each brand's chart and show a size per brand with a match label.
            </div>
          </details>

          <details className="group">
            <summary className="min-h-[56px] flex items-center justify-between px-4 py-3 font-semibold text-base cursor-pointer select-none">
              <span>Data and privacy</span>
              <span className="text-secText font-normal group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
            </summary>
            <div className="px-4 pb-4 text-[15px] leading-relaxed text-[#D6D6DC]">
              Sizes come from official brand guides, cleaned and standardized. Your measurements stay on your device and are never stored or sent to a server.
            </div>
          </details>

          <details className="group">
            <summary className="min-h-[56px] flex items-center justify-between px-4 py-3 font-semibold text-base cursor-pointer select-none">
              <span>Why does my size differ across brands?</span>
              <span className="text-secText font-normal group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
            </summary>
            <div className="px-4 pb-4 text-[15px] leading-relaxed text-[#D6D6DC]">
              Brands cut sizes differently, so labels like M are not comparable. Tailor compares your actual body dimensions against the brand's specifications instead.
            </div>
          </details>

          <details className="group">
            <summary className="min-h-[56px] flex items-center justify-between px-4 py-3 font-semibold text-base cursor-pointer select-none">
              <span>How accurate is this?</span>
              <span className="text-secText font-normal group-open:rotate-45 transition-transform text-lg" aria-hidden="true">+</span>
            </summary>
            <div className="px-4 pb-4 text-[15px] leading-relaxed text-[#D6D6DC]">
              Accuracy is highest when you add chest and waist. Treat results as a strong guide, not a guarantee, since personal garment draping varies.
            </div>
          </details>
        </div>

        {/* Local Feedback Card */}
        <div className="glass-card p-4 space-y-2.5">
          <div className="font-semibold text-base">Did this size fit you?</div>
          {feedbackGiven ? (
            <p className="text-sm text-[#4ADE80] font-medium animate-fade-in">
              Thanks! Your anonymous feedback is saved locally to fine-tune your fit preference.
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

        {/* Solid white close button */}
        <button
          onClick={onClose}
          className="secondary-btn btn-press w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

