import React, { useRef } from 'react';
import { useModalBehavior } from './shared/useModalBehavior';

interface HowToMeasureModalProps {
  isOpen: boolean;
  onClose: () => void;
  showHips?: boolean;
}

export const HowToMeasureModal: React.FC<HowToMeasureModalProps> = ({
  isOpen,
  onClose,
  showHips = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape to close, focus trapped, background scroll locked, focus restored.
  useModalBehavior(isOpen, onClose, modalRef);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="measure-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md glass-card p-6 rounded-t-[28px] sm:rounded-[28px] border border-white/15 max-h-[90dvh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="measure-modal-title" className="font-barlow text-3xl sm:text-4xl font-semibold">
            How to measure
          </h2>
          <button
            onClick={onClose}
            className="circle-btn btn-press"
            aria-label="Close how to measure modal"
          >
            ×
          </button>
        </div>

        {/* Anatomical Guide SVG */}
        <div className="my-2 flex justify-center">
          <svg
            role="img"
            aria-label="Figure illustrating chest, waist, and hips measurement locations"
            viewBox="0 0 240 155"
            width="100%"
            height="150"
            fill="none"
            stroke="#D6D6DC"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="120" cy="18" r="14" />
            <path d="M84 42Q120 34 156 42L168 100L157 103L150 68L148 146H92L90 68L83 103L72 100Z" />
            
            {/* Chest Line */}
            <path d="M62 62H178" stroke="#4ADE80" strokeDasharray="6 5" />
            <text x="184" y="67" fill="#4ADE80" stroke="none" fontSize="13" fontFamily="Inter" fontWeight="600">
              Chest
            </text>

            {/* Waist Line */}
            <path d="M76 98H164" stroke="#FBBF24" strokeDasharray="6 5" />
            <text x="170" y="103" fill="#FBBF24" stroke="none" fontSize="13" fontFamily="Inter" fontWeight="600">
              Waist
            </text>

            {/* Hips Line (optional) */}
            {showHips && (
              <>
                <path d="M80 120H160" stroke="#38BDF8" strokeDasharray="6 5" />
                <text x="166" y="125" fill="#38BDF8" stroke="none" fontSize="13" fontFamily="Inter" fontWeight="600">
                  Hips
                </text>
              </>
            )}
          </svg>
        </div>

        <div className="space-y-3.5 my-4 text-sm sm:text-[15px] leading-relaxed text-[#D6D6DC]">
          <div>
            <strong className="text-white font-semibold">Height. </strong>
            <span>Stand straight without shoes. Measure from the floor to the top of your head.</span>
          </div>
          <div>
            <strong className="text-white font-semibold">Chest. </strong>
            <span>Wrap the tape around the fullest part, under your arms, keeping it level.</span>
          </div>
          <div>
            <strong className="text-white font-semibold">Waist. </strong>
            <span>Measure at your natural waist, just above the belly button.</span>
          </div>
          {showHips && (
            <div>
              <strong className="text-white font-semibold">Hips. </strong>
              <span>Measure around the fullest part of your hips and seat with feet together.</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="primary-btn btn-press w-full mt-4"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

