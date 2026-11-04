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
}

export const BrandCard: React.FC<BrandCardProps> = ({
  matchResult,
  measurements,
  isSaved,
  onToggleSave,
  onOpenDetail,
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
    ? 'border-red-400/50 shadow-[0_0_15px_rgba(248,113,113,0.15)]'
    : matchStatus === 'between'
    ? 'border-amber-400/30'
    : 'border-white/12';

  return (
    <article
      onClick={() => onOpenDetail(matchResult)}
      className={`glass-card p-5 sm:p-6 flex flex-col gap-4 transition-all duration-200 hover:border-white/25 cursor-pointer ${cardBorderClass}`}
    >
      {/* Top Header: Brand Logo + View Chart Link + Save Heart */}
      <div className="flex items-center justify-between min-h-[36px]">
        <h3 className="flex items-center" aria-label={brandChart.brand}>
          <BrandLogo brand={brandChart.brand} />
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(matchResult);
            }}
            className="text-accent text-sm font-semibold min-h-[44px] px-2 inline-flex items-center hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
          >
            View chart ›
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(brandChart.id);
            }}
            className="circle-btn btn-press !bg-transparent hover:!bg-white/10"
            aria-label={isSaved ? `Remove ${brandChart.brand} from saved` : `Save ${brandChart.brand}`}
          >
            <HeartIcon filled={isSaved} size={22} />
          </button>
        </div>
      </div>

      {/* Main Size & Match Level Row */}
      <div className="flex items-center gap-4">
        {/* Recommended Size Big Display (Centered) */}
        <div className="font-barlow text-5xl sm:text-[64px] font-semibold w-20 sm:w-[84px] text-center flex items-center justify-center text-white flex-none tracking-tight">
          {recommendedSize}
        </div>

        {/* Match Details */}
        <div className="flex-1 min-w-0">
          {matchStatus === 'great' && (
            <span className="text-[#4ADE80] font-semibold text-base inline-flex items-center gap-1.5">
              <CheckIcon size={16} /> Great match
            </span>
          )}
          {matchStatus === 'between' && (
            <span className="text-[#FBBF24] font-semibold text-base inline-flex items-center gap-1.5">
              <WarningTriangleIcon size={16} /> Between sizes
            </span>
          )}
          {matchStatus === 'poor' && (
            <span className="text-[#F87171] font-semibold text-base inline-flex items-center gap-1.5">
              <CrossCircleIcon size={16} /> Poor match
            </span>
          )}

          <div className="text-[17px] font-medium text-white mt-1.5 truncate">
            {chestRangeText}
          </div>

          <div className="text-base text-[#D6D6DC] leading-snug mt-0.5 line-clamp-2">
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
    </article>
  );
};

