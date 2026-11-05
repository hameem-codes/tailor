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
  const isTwo = matches.length === 2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full ${
          isTwo ? 'max-w-4xl' : 'max-w-6xl'
        } glass-card !bg-[#131518]/96 border border-white/20 rounded-[28px] p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col gap-5 my-auto max-h-[92vh] overflow-y-auto animate-modal-pop`}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#1DA84A]/20 text-[#4ADE80] flex items-center justify-center text-sm font-bold">
                ⚖️
              </span>
              <h2 id="comparison-title" className="font-barlow text-2xl sm:text-3xl font-bold text-white tracking-wide">
                Brand Fit Comparison
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-secText mt-1">
              Side-by-side size recommendations & ruler ranges for {measurements.gender} {measurements.category} ({userValText})
            </p>
          </div>
          <button
            onClick={onClose}
            className="circle-btn btn-press !w-9 !h-9 text-lg flex-none !bg-white/10 hover:!bg-white/20 text-white"
            aria-label="Close comparison"
          >
            ×
          </button>
        </div>

        {matches.length < 2 ? (
          <div className="py-12 flex flex-col items-center text-center gap-3 animate-fade-in">
            <span className="text-4xl">⚖️</span>
            <h3 className="text-lg font-semibold text-white">Select at least 2 brands</h3>
            <p className="text-xs sm:text-sm text-secText max-w-sm">
              Check the "+ Compare" button on any brand card on your results screen to compare 2 or 3 brands side by side.
            </p>
            <button
              onClick={onClose}
              className="primary-btn btn-press !min-h-[40px] !px-5 text-xs sm:text-sm font-semibold mt-2"
            >
              Back to brands
            </button>
          </div>
        ) : (
          <>
            {/* Animated Comparative Summary Pill */}
            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm text-[#D6D6DC] animate-card-pop">
              <div className="w-7 h-7 rounded-full bg-[#1DA84A]/25 text-[#4ADE80] flex items-center justify-center flex-none font-bold text-sm">
                ✓
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white font-semibold">Comparison overview: </span>
                <span>
                  {matches.map(m => `${m.brandChart.brand} (${m.recommendedSize})`).join(' vs ')}. Review each brand's exact range below to match your fit preference.
                </span>
              </div>
              <span className="hidden sm:inline-flex text-[11px] font-bold text-[#4ADE80] bg-[#1DA84A]/15 px-2.5 py-1 rounded-full border border-[#4ADE80]/30 whitespace-nowrap">
                {matches.length} brands compared
              </span>
            </div>

            {/* Comparison Columns: Fully spans 2 columns when 2 brands, 3 columns when 3 brands */}
            <div
              className={`grid grid-cols-1 ${
                isTwo ? 'md:grid-cols-2 gap-5 sm:gap-6' : 'md:grid-cols-3 gap-4 sm:gap-5'
              }`}
            >
              {matches.map((m, index) => {
                const { brandChart, recommendedSize, matchStatus, tip, chestRangeText, ruler, confidence, confidenceReason } = m;
                return (
                  <div
                    key={brandChart.id}
                    className="glass-card p-5 sm:p-6 flex flex-col gap-4 border border-white/15 rounded-2xl relative bg-white/[0.04] shadow-xl hover:border-white/30 transition-all duration-200 animate-card-pop hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 80 + 40}ms` }}
                  >
                    {/* Top Bar: Brand, Region Tag & Remove button */}
                    <div className="flex items-center justify-between min-h-[38px] border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <BrandLogo brand={brandChart.brand} maxHeight={24} />
                        <span className="text-[10px] font-semibold text-secText uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                          {brandChart.region}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveBrand(brandChart.id)}
                        className="text-xs text-secText hover:text-red-400 transition-colors p-1 flex items-center gap-1 group"
                        aria-label={`Remove ${brandChart.brand} from comparison`}
                      >
                        <span className="group-hover:underline">Remove</span>
                        <span className="text-sm font-bold">×</span>
                      </button>
                    </div>

                    {/* Size & Match Status Card Box */}
                    <div className="flex items-center justify-between gap-3 bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
                      <div
                        className="min-w-[68px] flex items-center justify-center animate-badge-pop"
                        style={{ animationDelay: `${index * 80 + 140}ms` }}
                      >
                        {renderBrandSizeBadge(recommendedSize)}
                      </div>
                      <div className="text-right">
                        {matchStatus === 'great' && (
                          <span className="text-[#4ADE80] font-semibold text-xs sm:text-sm inline-flex items-center gap-1 bg-[#1DA84A]/15 px-2.5 py-1 rounded-full border border-[#4ADE80]/30">
                            <CheckIcon size={14} /> Great match
                          </span>
                        )}
                        {matchStatus === 'between' && (
                          <span className="text-[#FBBF24] font-semibold text-xs sm:text-sm inline-flex items-center gap-1 bg-[#FBBF24]/15 px-2.5 py-1 rounded-full border border-[#FBBF24]/30">
                            <WarningTriangleIcon size={14} /> Between sizes
                          </span>
                        )}
                        {matchStatus === 'poor' && (
                          <span className="text-[#F87171] font-semibold text-xs sm:text-sm inline-flex items-center gap-1 bg-[#F87171]/15 px-2.5 py-1 rounded-full border border-[#F87171]/30">
                            <CrossCircleIcon size={14} /> Poor match
                          </span>
                        )}
                        <div className="text-xs text-white font-semibold mt-1.5">
                          {chestRangeText}
                        </div>
                      </div>
                    </div>

                    {/* Range Ruler with dynamic bar expansion */}
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

                    {/* Fit Note */}
                    <div className="text-xs text-[#D6D6DC] leading-relaxed bg-white/[0.04] p-3 rounded-xl border border-white/5">
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
                      className="pill-btn btn-press w-full text-center text-xs font-semibold !min-h-[40px] mt-auto hover:border-white/30 border-white/15"
                    >
                      View size chart & details →
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-secText">
          <span>Comparing up to 3 brands simultaneously</span>
          <button
            onClick={onClose}
            className="pill-btn btn-press !min-h-[36px] !px-5 text-xs font-semibold !bg-white/10 hover:!bg-white/20 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
