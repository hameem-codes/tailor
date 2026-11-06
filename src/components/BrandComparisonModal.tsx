import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { BrandMatchResult, UserMeasurements } from '../types';
import { RangeRuler } from './RangeRuler';
import { formatDimension } from '../lib/matching/helpers';
import { useModalBehavior } from './shared/useModalBehavior';

interface BrandComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: BrandMatchResult[];
  measurements: UserMeasurements;
  onRemoveBrand: (brandId: string) => void;
  onOpenDetail: (match: BrandMatchResult) => void;
}

export const BrandComparisonModal: React.FC<BrandComparisonModalProps> = ({
  isOpen,
  onClose,
  matches,
  measurements,
  onRemoveBrand,
  onOpenDetail,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock background scroll, trap focus, close on Escape, restore focus on close.
  useModalBehavior(isOpen, onClose, sheetRef);

  if (!isOpen) return null;

  const isPants = measurements.category === 'pants';
  const userVal = isPants ? (measurements.waist || 80) : (measurements.chest || 96);
  const userValText = `You: ${formatDimension(userVal, measurements.unit)}`;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Bottom Sheet on Mobile / Modal on Tablet & Desktop */}
      <div
        ref={sheetRef}
        className="w-full h-auto max-h-[85dvh] sm:max-w-[720px] glass-card !bg-[#131518]/98 border border-white/15 rounded-t-[28px] sm:rounded-[28px] p-4.5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-3.5 shadow-[0_-10px_40px_rgba(0,0,0,0.7)] sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)] animate-slide-up sm:animate-modal-pop overflow-hidden"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-white/20 rounded-full mx-auto -mt-1 mb-1 flex-none" />

        {/* Header: Title, one-line subtitle, 44px close button */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 flex-none">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-base flex-none" aria-hidden="true">⚖️</span>
              <h2
                id="comparison-title"
                className="font-barlow text-2xl sm:text-3xl font-bold text-white tracking-wide truncate"
              >
                Brand Fit Comparison
              </h2>
            </div>
            <p className="text-xs sm:text-[13px] text-secText mt-0.5 truncate">
              Side-by-side fit recommendations for your measurements ({userValText})
            </p>
          </div>
          <button
            onClick={onClose}
            className="circle-btn btn-press !w-[44px] !h-[44px] !min-w-[44px] !min-h-[44px] flex-none !bg-white/10 hover:!bg-white/20 text-white rounded-full flex items-center justify-center text-xl font-bold"
            aria-label="Close comparison"
          >
            ×
          </button>
        </div>

        {matches.length < 2 ? (
          <div className="py-8 flex flex-col items-center text-center gap-3 animate-fade-in">
            <span className="text-3xl">⚖️</span>
            <h3 className="text-base font-semibold text-white">Select at least 2 brands</h3>
            <p className="text-xs sm:text-sm text-secText max-w-sm">
              Use the "+ Compare" button on brand cards to compare 2 or 3 brands side by side.
            </p>
            <button
              onClick={onClose}
              className="primary-btn btn-press !min-h-[44px] !px-5 text-xs sm:text-sm font-semibold mt-2"
            >
              Back to brands
            </button>
          </div>
        ) : (
          <>
            {/* Compressed single-line overview */}
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#D6D6DC] flex-none">
              <span className="text-[#4ADE80] font-bold text-sm flex-none">✓</span>
              <p className="truncate flex-1">
                <strong className="text-white">Overview: </strong>
                {matches.map((m) => `${m.brandChart.brand} (${m.recommendedSize})`).join(' vs ')}
              </p>
            </div>

            {/* Scrollable body with overscroll-behavior contain */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-3 pr-0.5">
              {/* Compact side-by-side layout: 2 columns on mobile for 2 brands */}
              <div
                className={`grid ${
                  matches.length === 2
                    ? 'grid-cols-2 gap-2.5 sm:gap-4'
                    : 'grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'
                }`}
              >
                {matches.map((m, index) => {
                  const {
                    brandChart,
                    recommendedSize,
                    matchStatus,
                    tip,
                    chestRangeText,
                    ruler,
                  } = m;

                  return (
                    <div
                      key={brandChart.id}
                      className="glass-card p-3.5 sm:p-4 flex flex-col gap-2.5 border border-white/15 rounded-2xl relative bg-white/[0.04] shadow-md transition-all duration-200 animate-card-pop overflow-hidden"
                      style={{ animationDelay: `${index * 60 + 30}ms` }}
                    >
                      {/* Top Bar: Brand Wordmark + Small Remove Icon Button */}
                      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-white/10 min-h-[32px]">
                        <div className="truncate font-barlow font-bold text-lg sm:text-xl uppercase tracking-wider text-white">
                          {brandChart.brand}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveBrand(brandChart.id)}
                          className="!w-11 !h-11 !min-w-[44px] !min-h-[44px] rounded-full bg-white/10 hover:bg-red-500/20 text-secText hover:text-red-400 flex items-center justify-center text-sm font-bold transition-colors flex-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          aria-label={`Remove ${brandChart.brand} from comparison`}
                        >
                          ×
                        </button>
                      </div>

                      {/* Size Letter & Match Label */}
                      <div className="flex flex-col items-center justify-center text-center py-1">
                        <span className="font-barlow text-3xl sm:text-4xl font-bold text-white leading-none">
                          {recommendedSize}
                        </span>
                        <span
                          className={`text-[11px] sm:text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            matchStatus === 'great'
                              ? 'bg-[#1DA84A]/20 text-[#4ADE80] border border-[#4ADE80]/30'
                              : matchStatus === 'between'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {matchStatus === 'great'
                            ? '✓ Great match'
                            : matchStatus === 'between'
                            ? '⚠ Between sizes'
                            : '✕ Poor match'}
                        </span>
                      </div>

                      {/* Chest Range */}
                      <div className="text-[11px] sm:text-xs text-white/90 text-center font-medium truncate">
                        {chestRangeText}
                      </div>

                      {/* Ruler */}
                      <div className="py-1">
                        <RangeRuler
                          userValueText={userValText}
                          userDotPercent={ruler.userDotPercent}
                          primaryBarLeftPercent={ruler.primaryBarLeftPercent}
                          primaryBarWidthPercent={ruler.primaryBarWidthPercent}
                          primaryBarColor={ruler.primaryBarColor}
                          secondaryBarLeftPercent={ruler.secondaryBarLeftPercent}
                          secondaryBarWidthPercent={ruler.secondaryBarWidthPercent}
                          secondaryBarColor={ruler.secondaryBarColor}
                          className="animate-expand-bar"
                        />
                      </div>

                      {/* Compact Tip */}
                      <div className="text-[11px] sm:text-xs text-[#D6D6DC] leading-snug line-clamp-2 bg-white/[0.03] p-2 rounded-lg">
                        {tip}
                      </div>

                      {/* Details Link */}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDetail(m);
                        }}
                        className="w-full h-[44px] min-h-[44px] px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-[11px] sm:text-xs font-semibold text-[#4ADE80] flex items-center justify-center transition-colors mt-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        View details →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-xs text-secText flex-none">
          <span>Comparing {matches.length}/3 brands</span>
          <button
            onClick={onClose}
            className="pill-btn btn-press !px-4 text-xs font-semibold !bg-white/10 hover:!bg-white/20 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
