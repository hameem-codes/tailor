import React from 'react';
import { BrandMatchResult, UserMeasurements } from '../types';
import { RangeRuler } from './RangeRuler';
import { CheckIcon, WarningTriangleIcon, CrossCircleIcon, HeartIcon } from './Icons';
import { formatDimension } from '../lib/matching/helpers';
import { BrandLogo } from './BrandLogo';

interface BrandCardProps {
  matchResult: BrandMatchResult;
  measurements: UserMeasurements;
  isSaved: boolean;
  onToggleSave: (brandId: string) => void;
  onOpenDetail: (matchResult: BrandMatchResult) => void;
  isComparing?: boolean;
  onToggleCompare?: (brandId: string) => void;
}

export function renderBrandSizeBadge(sizeStr: string) {
  const match = sizeStr.match(/^([^(]+?)(?:\s*(\([^)]+\)))?$/);
  if (!match || !match[2]) {
    const len = sizeStr.length;
    const sizeClass =
      len <= 2
        ? 'text-5xl sm:text-[60px]'
        : len <= 4
        ? 'text-4xl sm:text-[46px]'
        : len <= 6
        ? 'text-2xl sm:text-3xl'
        : 'text-xl sm:text-2xl';
    return (
      <span
        className={`font-barlow font-semibold text-white leading-none break-all ${sizeClass}`}
      >
        {sizeStr}
      </span>
    );
  }

  const primary = match[1].trim();
  const secondary = match[2].trim();

  return (
    <div className="flex flex-col items-center justify-center leading-none text-center max-w-full">
      <span className="font-barlow text-4xl sm:text-5xl font-semibold text-white leading-none break-all">
        {primary}
      </span>
      <span className="text-[11px] sm:text-xs font-semibold text-secText tracking-wider leading-none mt-1 truncate max-w-full">
        {secondary}
      </span>
    </div>
  );
}

export const BrandCard: React.FC<BrandCardProps> = ({
  matchResult,
  measurements,
  isSaved,
  onToggleSave,
  onOpenDetail,
  isComparing = false,
  onToggleCompare,
}) => {
  const {
    brandChart,
    recommendedSize,
    matchStatus,
    tip,
    chestRangeText,
    ruler,
  } = matchResult;

  const isPants = measurements.category === 'pants';
  const userVal = isPants ? (measurements.waist || 80) : (measurements.chest || 96);
  const userValText = `You: ${formatDimension(userVal, measurements.unit)}`;

  const isPoor = matchStatus === 'poor';
  const cardBorderClass = isPoor
    ? 'border-red-400/40 shadow-[0_0_15px_rgba(248,113,113,0.12)]'
    : matchStatus === 'between'
    ? 'border-amber-400/25'
    : 'border-white/10';

  return (
    <article
      onClick={(e) => {
        // Only trigger card click if user did not click an interactive element inside
        const target = e.target as HTMLElement;
        if (target.closest('button, a')) return;
        onOpenDetail(matchResult);
      }}
      className={`glass-card group relative p-4.5 sm:p-5 flex flex-col gap-3.5 transition-all duration-200 hover:border-white/20 cursor-pointer focus-within:ring-2 focus-within:ring-accent/50 overflow-hidden ${cardBorderClass}`}
    >
      {/* Top Header: Brand Logo on left, Quick Action Toolbar on right */}
      <div className="flex items-center justify-between gap-2 min-h-[36px]">
        <h3 className="flex items-center min-w-0 pr-1 truncate" aria-label={brandChart.brand}>
          <BrandLogo brand={brandChart.brand} />
        </h3>

        {/* Action icons: Compare toggle + Save heart */}
        <div className="flex items-center gap-1.5 flex-none relative z-10">
          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(brandChart.id)}
              className={`pill-btn btn-press !text-[11px] sm:!text-xs !min-h-[28px] sm:!min-h-[30px] !px-2.5 rounded-full whitespace-nowrap transition-all ${
                isComparing
                  ? '!bg-[#1DA84A] !border-[#4ADE80] text-white font-bold shadow-sm'
                  : '!bg-white/[0.04] text-secText hover:text-white border-white/20 hover:border-white/40'
              }`}
              aria-label={isComparing ? `Remove ${brandChart.brand} from comparison` : `Compare ${brandChart.brand}`}
              aria-pressed={isComparing}
            >
              {isComparing ? '✓ Comparing' : '+ Compare'}
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleSave(brandChart.id)}
            className="circle-btn btn-press !w-8 !h-8 !min-w-[32px] !min-h-[32px] !bg-transparent hover:!bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label={isSaved ? `Remove ${brandChart.brand} from saved` : `Save ${brandChart.brand}`}
          >
            <HeartIcon filled={isSaved} size={18} />
          </button>
        </div>
      </div>

      {/* Main Size & Match Level Row */}
      <div className="flex items-center gap-3.5">
        {/* Recommended Size Big Display (Centered) */}
        <div className="min-w-[72px] sm:min-w-[80px] max-w-[96px] flex-none flex items-center justify-center text-center">
          {renderBrandSizeBadge(recommendedSize)}
        </div>

        {/* Match Details */}
        <div className="flex-1 min-w-0">
          {matchStatus === 'great' && (
            <span className="text-[#4ADE80] font-semibold text-sm sm:text-base inline-flex items-center gap-1.5">
              <CheckIcon size={16} /> Great match
            </span>
          )}
          {matchStatus === 'between' && (
            <span className="text-[#FBBF24] font-semibold text-sm sm:text-base inline-flex items-center gap-1.5">
              <WarningTriangleIcon size={16} /> Between sizes
            </span>
          )}
          {matchStatus === 'poor' && (
            <span className="text-[#F87171] font-semibold text-sm sm:text-base inline-flex items-center gap-1.5">
              <CrossCircleIcon size={16} /> Poor match
            </span>
          )}

          <div className="text-sm sm:text-base font-medium text-white mt-1 break-words leading-snug">
            {chestRangeText}
          </div>

          <div className="text-xs sm:text-sm text-[#D6D6DC] leading-snug mt-0.5 line-clamp-2">
            {tip}
          </div>
        </div>
      </div>

      {/* Range Ruler Component */}
      <RangeRuler
        userValueText={userValText}
        userDotPercent={ruler.userDotPercent}
        primaryBarLeftPercent={ruler.primaryBarLeftPercent}
        primaryBarWidthPercent={ruler.primaryBarWidthPercent}
        primaryBarColor={ruler.primaryBarColor}
        secondaryBarLeftPercent={ruler.secondaryBarLeftPercent}
        secondaryBarWidthPercent={ruler.secondaryBarWidthPercent}
        secondaryBarColor={ruler.secondaryBarColor}
        accessibleDescription={`${brandChart.brand} size ${recommendedSize}. ${userValText}, size range ${chestRangeText}`}
      />

      {/* Card Footer: Clean "View size chart & details →" CTA spanning bottom */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm font-semibold select-none mt-auto">
        <span className="text-[#4ADE80] group-hover:text-white transition-colors flex items-center gap-1.5">
          View size chart & details
        </span>
        <span
          aria-hidden="true"
          className="text-secText group-hover:text-white transition-all duration-200 group-hover:translate-x-1 text-sm font-bold"
        >
          →
        </span>
      </div>
    </article>
  );
};
