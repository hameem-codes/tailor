import React from 'react';
import { BrandMatchResult, UserMeasurements } from '../types';
import { RangeRuler } from './RangeRuler';
import { CheckIcon, WarningTriangleIcon, CrossCircleIcon, HeartIcon } from './Icons';
import { formatDimension } from '../lib/matching/helpers';

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
        ? 'text-5xl sm:text-[56px]'
        : len <= 4
        ? 'text-3xl sm:text-[40px]'
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
      <span className="font-barlow text-3xl sm:text-4xl font-semibold text-white leading-none break-all">
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
      className={`glass-card group relative p-5 sm:p-6 rounded-2xl flex flex-col gap-4 transition-all duration-200 hover:border-white/20 cursor-pointer focus-within:ring-2 focus-within:ring-accent/50 ${cardBorderClass}`}
    >
      {/* Top Header: 120x40px Wordmark Box on left, Quick Action Toolbar on right */}
      <div className="flex items-center justify-between gap-3 min-h-[44px]">
        {/* Consistent Plain-Text Wordmark in 120x40px Box (Barlow Condensed, uppercase, 28px) */}
        <div
          className="w-[120px] h-[40px] flex items-center justify-start flex-none overflow-hidden"
          title={brandChart.brand}
        >
          <span className="font-barlow text-[28px] font-bold uppercase tracking-wider text-white leading-none truncate">
            {brandChart.brand}
          </span>
        </div>

        {/* Action icons: Compare toggle + Save heart with 44px minimum tap target */}
        <div className="flex items-center gap-1.5 flex-none relative z-10">
          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(brandChart.id)}
              className={`pill-btn btn-press !min-h-[44px] !h-[44px] !px-3.5 rounded-full whitespace-nowrap text-xs font-semibold flex items-center justify-center transition-all ${
                isComparing
                  ? '!bg-[#1DA84A] !border-[#4ADE80] text-white font-bold shadow-sm'
                  : '!bg-white/[0.06] text-secText hover:text-white border border-white/20 hover:border-white/40'
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
            className="circle-btn btn-press !w-[44px] !h-[44px] !min-w-[44px] !min-h-[44px] !bg-transparent hover:!bg-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label={isSaved ? `Remove ${brandChart.brand} from saved` : `Save ${brandChart.brand}`}
          >
            <HeartIcon filled={isSaved} size={20} />
          </button>
        </div>
      </div>

      {/* Main Size & Match Level Row - Fixed 84px Grid Column for size letter alignment */}
      <div className="grid grid-cols-[84px_1fr] items-center gap-4">
        {/* Recommended Size Big Display (84px width column) */}
        <div className="w-[84px] flex items-center justify-center text-center">
          {renderBrandSizeBadge(recommendedSize)}
        </div>

        {/* Match Details */}
        <div className="min-w-0 flex flex-col justify-center">
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

      {/* Card Footer: Full-width 48px button inside card padding with hairline divider */}
      <div className="pt-3 border-t border-white/10 mt-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(matchResult);
          }}
          className="w-full h-[48px] min-h-[48px] px-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors flex items-center justify-between text-sm sm:text-[15px] font-semibold text-[#4ADE80] group-hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`View size chart & details for ${brandChart.brand}`}
        >
          <span className="truncate">View size chart & details</span>
          <span
            aria-hidden="true"
            className="text-secText group-hover:text-white transition-transform duration-200 group-hover:translate-x-1 ml-2 flex-none font-bold text-base"
          >
            →
          </span>
        </button>
      </div>
    </article>
  );
};
