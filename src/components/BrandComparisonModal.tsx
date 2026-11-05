import React from 'react';
import { BrandMatchResult, UserMeasurements } from '../types';
import { BrandLogo } from './BrandLogo';
import { RangeRuler } from './RangeRuler';
import { CheckIcon, WarningTriangleIcon, CrossCircleIcon, LockIcon } from './Icons';
import { formatDimension } from '../lib/matching/helpers';
import { renderBrandSizeBadge } from './BrandCard';

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
  if (!isOpen) return null;

  const isPants = measurements.category === 'pants';
  const userVal = isPants ? (measurements.waist || 80) : (measurements.chest || 96);
  const userValText = `You: ${formatDimension(userVal, measurements.unit)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl glass-card border border-white/20 rounded-[28px] p-5 sm:p-7 shadow-2xl flex flex-col gap-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 id="comparison-title" className="font-barlow text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Brand Fit Comparison
            </h2>
            <p className="text-xs sm:text-sm text-secText mt-0.5">
              Side-by-side size recommendations & ruler ranges for {measurements.gender} {measurements.category} ({userValText})
            </p>
          </div>
          <button
            onClick={onClose}
            className="circle-btn btn-press !w-9 !h-9 text-lg flex-none"
            aria-label="Close comparison"
          >
            ×
          </button>
        </div>

        {matches.length < 2 ? (
          <div className="py-12 flex flex-col items-center text-center gap-3">
            <span className="text-4xl">⚖️</span>
            <h3 className="text-lg font-semibold text-white">Select at least 2 brands</h3>
            <p className="text-xs sm:text-sm text-secText max-w-sm">
              Check the "Compare" button on any brand card on your results screen to compare 2 or 3 brands side by side.
            </p>
            <button
              onClick={onClose}
              className="primary-btn btn-press !min-h-[40px] !px-5 text-xs sm:text-sm font-semibold mt-2"
            >
              Back to brands
            </button>
          </div>
        ) : (
          /* Comparison Columns */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((m) => {
              const { brandChart, recommendedSize, matchStatus, tip, chestRangeText, ruler, confidence, confidenceReason } = m;
              return (
                <div
                  key={brandChart.id}
                  className="glass-card p-4 sm:p-5 flex flex-col gap-3.5 border border-white/15 rounded-2xl relative bg-white/[0.03]"
                >
                  {/* Top Bar: Brand & Remove button */}
                  <div className="flex items-center justify-between min-h-[36px] border-b border-white/10 pb-2.5">
                    <BrandLogo brand={brandChart.brand} maxHeight={22} />
                    <button
                      onClick={() => onRemoveBrand(brandChart.id)}
                      className="text-xs text-secText hover:text-red-400 transition-colors p-1"
                      aria-label={`Remove ${brandChart.brand} from comparison`}
                    >
                      Remove ×
                    </button>
                  </div>

                  {/* Size & Match Status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-[60px] flex items-center justify-center">
                      {renderBrandSizeBadge(recommendedSize)}
                    </div>
                    <div className="text-right">
                      {matchStatus === 'great' && (
                        <span className="text-[#4ADE80] font-semibold text-xs sm:text-sm inline-flex items-center gap-1">
                          <CheckIcon size={14} /> Great match
                        </span>
                      )}
                      {matchStatus === 'between' && (
                        <span className="text-[#FBBF24] font-semibold text-xs sm:text-sm inline-flex items-center gap-1">
                          <WarningTriangleIcon size={14} /> Between sizes
                        </span>
                      )}
                      {matchStatus === 'poor' && (
                        <span className="text-[#F87171] font-semibold text-xs sm:text-sm inline-flex items-center gap-1">
                          <CrossCircleIcon size={14} /> Poor match
                        </span>
                      )}
                      <div className="text-xs text-secText font-medium mt-0.5">
                        {chestRangeText}
                      </div>
                    </div>
                  </div>

                  {/* Range Ruler */}
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
                    />
                  </div>

                  {/* Fit Note */}
                  <div className="text-xs text-[#D6D6DC] leading-relaxed bg-white/[0.04] p-2.5 rounded-xl border border-white/5">
                    {tip}
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center gap-1.5 text-[11px] text-secText">
                    <LockIcon size={12} className="text-[#4ADE80] flex-none" />
                    <span className="truncate">
                      Confidence: <strong className="text-white capitalize">{confidence}</strong>. {confidenceReason}
                    </span>
                  </div>

                  {/* Action Link */}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDetail(m);
                    }}
                    className="pill-btn btn-press w-full text-center text-xs font-semibold !min-h-[38px] mt-auto hover:border-white/30"
                  >
                    View size chart & details →
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-secText">
          <span>Comparing up to 3 brands simultaneously</span>
          <button
            onClick={onClose}
            className="pill-btn btn-press !min-h-[36px] !px-4 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

