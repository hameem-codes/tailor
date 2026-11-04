import React, { useEffect } from 'react';
import { UserMeasurements } from '../types';
import { formatDimension } from '../lib/matching/helpers';

interface LoadingScreenProps {
  measurements: UserMeasurements;
  brandCount: number;
  onCancel: () => void;
  onFinished: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  measurements,
  brandCount,
  onCancel,
  onFinished,
}) => {
  const isPants = measurements.category === 'pants';
  const primaryDim = isPants
    ? `${formatDimension(measurements.waist || 80, measurements.unit)} waist`
    : `${formatDimension(measurements.chest || 96, measurements.unit)} chest`;

  // Display ~1100ms loading animation for a smooth, delightful progress bar fill
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 1150);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <main
      className="w-full min-h-[calc(100vh-80px)] flex flex-col justify-between p-4 sm:p-6 lg:px-8 py-6 max-w-[420px] md:max-w-3xl lg:max-w-6xl mx-auto page-transition"
      aria-busy="true"
    >
      <div className="flex flex-col gap-4">
        {/* Mobile-only Brand Header (Desktop displays TopNavbar above) */}
        <div className="lg:hidden font-barlow text-3xl sm:text-4xl font-semibold text-white tracking-wide">
          Tailor
        </div>

        {/* Header & Status: On desktop/tablet, header text and cancel button sit side-by-side */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div role="status" aria-live="polite" className="mt-1">
            <h1 className="font-barlow text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.02] text-white tracking-tight">
              Comparing {brandCount} brands...
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[#D6D6DC] mt-2 font-normal leading-relaxed">
              Matching your {primaryDim} to each size chart.
            </p>
          </div>

          {/* Desktop/Tablet Cancel button in toolbar */}
          <div className="hidden md:block">
            <button
              onClick={onCancel}
              className="pill-btn btn-press flex-none !px-6 !min-h-[42px] text-sm font-medium border border-white/25 hover:border-white/45 text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Animated Rainbow Progress Bar (Stretches across desktop container) */}
        <div className="h-2 rounded-full bg-white/15 overflow-hidden my-2 sm:my-3 shadow-inner w-full">
          <div className="progress-bar-fill" />
        </div>

        {/* =========================================================================
            SKELETON CARDS
            - Mobile (<md): 3 stacked skeleton cards with 3 shimmer lines
            - Tablet (md): 4 brand-card skeletons in 2 columns
            - Desktop (lg): 6 brand-card skeletons in 3 columns
           ========================================================================= */}
        {/* Mobile skeleton cards (<md) */}
        <div className="md:hidden space-y-3.5 mt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card p-5 space-y-3 border border-white/10 rounded-[24px] shadow-lg"
            >
              <div className="shimmer-block w-[32%] !h-3 rounded-full" />
              <div className="shimmer-block w-[68%] !h-3 rounded-full" />
              <div className="shimmer-block w-[94%] !h-3 rounded-full" />
            </div>
          ))}
        </div>

        {/* Desktop / Tablet skeleton cards (>=md) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4.5 mt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`glass-card p-5 space-y-4 border border-white/10 rounded-[24px] shadow-lg ${
                i > 4 ? 'hidden lg:block' : ''
              }`}
            >
              {/* Header row: Brand title placeholder + View chart placeholder */}
              <div className="flex items-center justify-between">
                <div className="shimmer-block w-24 !h-4.5 rounded-full" />
                <div className="shimmer-block w-16 !h-3.5 rounded-full" />
              </div>

              {/* Body: Big size letter + match lines */}
              <div className="flex items-start gap-4 pt-1">
                <div className="shimmer-block w-12 !h-14 rounded-xl flex-none" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="shimmer-block w-28 !h-3.5 rounded-full" />
                  <div className="shimmer-block w-40 !h-3 rounded-full" />
                  <div className="shimmer-block w-full !h-3 rounded-full" />
                </div>
              </div>

              {/* Bottom: Ruler track shimmer */}
              <div className="pt-2">
                <div className="flex justify-center mb-1.5">
                  <div className="shimmer-block w-16 !h-2.5 rounded-full" />
                </div>
                <div className="shimmer-block w-full !h-2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile-only Cancel Button at bottom (<md) */}
      <div className="pt-6 md:hidden">
        <button
          onClick={onCancel}
          className="pill-btn btn-press w-full !min-h-[48px] text-sm font-medium border border-white/25 hover:border-white/45 text-white transition-all"
        >
          Cancel
        </button>
      </div>
    </main>
  );
};
