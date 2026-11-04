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
      className="w-full max-w-[420px] mx-auto min-h-screen flex flex-col justify-between p-5 sm:p-6 pt-10 pb-12 page-transition"
      aria-busy="true"
    >
      <div className="flex flex-col gap-4">
        {/* Brand Header */}
        <div className="font-barlow text-3xl sm:text-4xl font-semibold text-white tracking-wide">
          Tailor
        </div>

        {/* Polite Live Status */}
        <div role="status" aria-live="polite" className="mt-1">
          <h1 className="font-barlow text-5xl sm:text-[56px] font-semibold leading-[1.02] text-white tracking-tight">
            Comparing<br />{brandCount} brands...
          </h1>
          <p className="text-sm sm:text-base text-[#D6D6DC] mt-2 font-normal leading-relaxed">
            Matching your {primaryDim} to each size chart.
          </p>
        </div>

        {/* Animated Rainbow Progress Bar */}
        <div className="h-2 rounded-full bg-white/15 overflow-hidden my-2 shadow-inner">
          <div className="progress-bar-fill" />
        </div>

        {/* 3 Shimmer Skeleton Cards matching design screenshot */}
        <div className="space-y-3.5 mt-2">
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
      </div>

      {/* Cancel Button */}
      <div className="pt-6">
        <button
          onClick={onCancel}
          className="pill-btn btn-press w-full !min-h-[48px] text-sm sm:text-base font-medium border border-white/25 hover:border-white/45 text-white transition-all"
        >
          Cancel
        </button>
      </div>
    </main>
  );
};
