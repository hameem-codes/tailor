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

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 800);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <main
      className="w-full max-w-[520px] mx-auto min-h-screen flex flex-col gap-4 p-5 sm:p-7 pt-12 pb-16 page-transition"
      aria-busy="true"
    >
      {/* Brand Header */}
      <div className="font-barlow text-3xl font-semibold text-white tracking-wide">
        Tailor
      </div>

      {/* Polite Live Status */}
      <div role="status" aria-live="polite" className="mt-2">
        <h1 className="font-barlow text-5xl sm:text-[52px] font-semibold leading-[1.05] text-white">
          Comparing<br />{brandCount} brands...
        </h1>
        <p className="text-[15px] text-[#D6D6DC] mt-2.5">
          Matching your {primaryDim} to each size chart.
        </p>
      </div>

      {/* Progress Bar with Rainbow Gradient */}
      <div className="h-2 rounded-full bg-white/20 overflow-hidden my-3">
        <div className="progress-bar-fill" />
      </div>

      {/* 3 Shimmer Skeleton Cards */}
      <div className="space-y-3.5 flex-1 my-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-5 space-y-3.5 border border-white/12">
            <div className="shimmer-block w-2/5" />
            <div className="shimmer-block w-3/4" />
            <div className="shimmer-block h-2.5 w-full" />
          </div>
        ))}
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="pill-btn btn-press w-full min-h-[52px] text-base font-semibold mt-auto"
      >
        Cancel
      </button>
    </main>
  );
};
