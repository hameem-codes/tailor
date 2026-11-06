import React from 'react';
import { BrandMatchResult, UnitSystem } from '../../types';
import { RangeRuler } from '../RangeRuler';
import { CheckIcon, WarningTriangleIcon, CrossCircleIcon, LockIcon } from '../Icons';
import { formatDimension } from '../../lib/matching/helpers';

interface BrandOverviewCardProps {
  matchResult: BrandMatchResult;
  selectedSizeIdx: number;
  tableUnit: UnitSystem;
  isPants: boolean;
  userPrimaryVal: number;
  matchLabel: string;
  matchColor: string;
  rulerProps: {
    userDotPercent: number;
    primaryBarLeftPercent: number;
    primaryBarWidthPercent: number;
    primaryBarColor: string;
  };
  chestRangeText: string;
  waistRangeText: string;
  className?: string;
}

function renderSelectedSize(label: string) {
  const match = label.match(/^([^(]+?)(?:\s*(\([^)]+\)))?$/);
  if (!match || !match[2]) {
    const len = label.length;
    const sizeClass =
      len <= 2
        ? 'text-6xl sm:text-7xl lg:text-8xl'
        : len <= 4
        ? 'text-5xl sm:text-6xl lg:text-7xl'
        : len <= 6
        ? 'text-3xl sm:text-4xl lg:text-5xl'
        : 'text-2xl sm:text-3xl lg:text-4xl';
    return (
      <div
        className={`font-barlow font-semibold text-white leading-none break-all ${sizeClass}`}
      >
        {label}
      </div>
    );
  }

  const primary = match[1].trim();
  const secondary = match[2].trim();

  return (
    <div className="flex flex-col items-start leading-none max-w-full">
      <div className="font-barlow text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-none break-all">
        {primary}
      </div>
      <div className="text-xs sm:text-sm font-semibold text-secText tracking-wider mt-1 truncate max-w-full">
        {secondary}
      </div>
    </div>
  );
}

export const BrandOverviewCard: React.FC<BrandOverviewCardProps> = ({
  matchResult,
  selectedSizeIdx,
  tableUnit,
  isPants,
  userPrimaryVal,
  matchLabel,
  matchColor,
  rulerProps,
  chestRangeText,
  waistRangeText,
  className = '',
}) => {
  const { brandChart, confidence, confidenceReason } = matchResult;
  const currentSize = brandChart.sizes[selectedSizeIdx] || brandChart.sizes[0];
  const userPrimaryText = formatDimension(userPrimaryVal, tableUnit);

  return (
    <div className={`glass-card p-5 sm:p-6 flex flex-col gap-4 rounded-[24px] sm:rounded-[28px] shadow-xl overflow-hidden ${className}`}>
      <div className="flex justify-between items-end gap-2">
        <div className="min-w-0">
          <div className="text-xs sm:text-sm text-secText font-medium">Selected size</div>
          <div className="mt-1">
            {renderSelectedSize(currentSize.label)}
          </div>
        </div>

        <div
          className="pb-2 sm:pb-3 flex items-center gap-1.5 font-semibold text-sm sm:text-base flex-none"
          style={{ color: matchColor }}
        >
          {matchLabel === 'Great match' && <CheckIcon size={16} />}
          {matchLabel.includes('fit') && <WarningTriangleIcon size={16} />}
          {matchLabel === 'Between sizes' && <WarningTriangleIcon size={16} />}
          {matchLabel === 'Poor match' && <CrossCircleIcon size={16} />}
          <span>{matchLabel}</span>
        </div>
      </div>

      <div>
        <div className="text-xs sm:text-sm text-secText mb-1 truncate">
          Range: <span className="text-white font-medium">{chestRangeText}</span>
        </div>
        <RangeRuler
          userValueText={`You: ${userPrimaryText}`}
          userDotPercent={rulerProps.userDotPercent}
          primaryBarLeftPercent={rulerProps.primaryBarLeftPercent}
          primaryBarWidthPercent={rulerProps.primaryBarWidthPercent}
          primaryBarColor={rulerProps.primaryBarColor}
        />
      </div>

      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#D6D6DC] pt-0.5 min-w-0">
        <LockIcon size={15} className="text-[#4ADE80] flex-none" />
        <span className="min-w-0 break-words">
          Confidence: <strong className="text-white capitalize">{confidence}</strong>. {confidenceReason}
        </span>
      </div>

      <div className="flex border-t border-white/10 pt-3 mt-0.5">
        <div className="flex-1 min-w-0 pr-1.5 sm:pr-3">
          <div className="font-barlow text-base sm:text-2xl lg:text-[28px] font-medium text-white truncate">
            {formatDimension(userPrimaryVal, tableUnit).replace(/ (cm|in)$/, '')}
            <span className="text-[11px] sm:text-sm text-secText"> {tableUnit === 'imperial' ? 'in' : 'cm'}</span>
          </div>
          <div className="text-[11px] sm:text-sm text-secText mt-0.5 truncate">
            Your {isPants ? 'waist' : 'chest'}
          </div>
        </div>

        <div className="flex-1 min-w-0 px-1.5 sm:px-3 border-l border-white/10">
          <div className="font-barlow text-base sm:text-2xl lg:text-[28px] font-medium text-white truncate">
            {chestRangeText.replace(/\s*(cm|in)/g, '')}
            <span className="text-[11px] sm:text-sm text-secText font-normal"> {tableUnit === 'imperial' ? 'in' : 'cm'}</span>
          </div>
          <div className="text-[11px] sm:text-sm text-secText mt-0.5 truncate">
            {isPants ? 'Waist' : 'Chest'} range
          </div>
        </div>

        <div className="flex-1 min-w-0 pl-1.5 sm:pl-3 border-l border-white/10">
          <div className="font-barlow text-base sm:text-2xl lg:text-[28px] font-medium text-white truncate">
            {waistRangeText.replace(/\s*(cm|in)/g, '')}
            <span className="text-[11px] sm:text-sm text-secText font-normal"> {tableUnit === 'imperial' ? 'in' : 'cm'}</span>
          </div>
          <div className="text-[11px] sm:text-sm text-secText mt-0.5 truncate">
            {isPants ? 'Hips' : 'Waist'} range
          </div>
        </div>
      </div>
    </div>
  );
};

