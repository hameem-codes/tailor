import React, { useState, useMemo, useEffect } from 'react';
import { BrandMatchResult, UserMeasurements, UnitSystem, ChartType } from '../types';
import { BrandLogo } from './BrandLogo';
import { SlidingTabs } from './SlidingTabs';
import { loadTablePreferences, saveTablePreferences } from '../lib/storage';
import { formatDimension } from '../lib/matching/helpers';
import { BrandOverviewCard } from './brand/BrandOverviewCard';
import { BrandSizeChartTable } from './brand/BrandSizeChartTable';

interface BrandDetailProps {
  matchResult: BrandMatchResult;
  measurements: UserMeasurements;
  onBack: () => void;
}

export const BrandDetail: React.FC<BrandDetailProps> = ({
  matchResult,
  measurements,
  onBack,
}) => {
  const { brandChart, primarySizeIndex } = matchResult;

  // Selected size index state (defaults to primary recommended size)
  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number>(primarySizeIndex);

  // Independent table display toggles persisted to localStorage
  const [tableUnit, setTableUnit] = useState<UnitSystem>(() => loadTablePreferences().tableUnit);
  const [tableMeasurementType, setTableMeasurementType] = useState<ChartType>(() =>
    loadTablePreferences().tableMeasurementType
  );

  useEffect(() => {
    saveTablePreferences({ tableUnit, tableMeasurementType });
  }, [tableUnit, tableMeasurementType]);

  const isPants = measurements.category === 'pants';
  const userPrimaryVal = isPants ? (measurements.waist || 80) : (measurements.chest || 96);

  const genderLabel = measurements.gender.charAt(0).toUpperCase() + measurements.gender.slice(1);
  const categoryLabel = measurements.category.charAt(0).toUpperCase() + measurements.category.slice(1);

  const sizes = brandChart.sizes;
  const currentSize = sizes[selectedSizeIdx] || sizes[0];

  // Dynamic calculations based on selectedSizeIdx
  const { verdict, matchLabel, matchColor, rulerProps, chestRangeText, waistRangeText } = useMemo(() => {
    const isPrimary = selectedSizeIdx === primarySizeIndex;
    const isSmaller = selectedSizeIdx < primarySizeIndex;
    const isLarger = selectedSizeIdx > primarySizeIndex;

    const label = currentSize.label;
    const smallerLabel = selectedSizeIdx > 0 ? sizes[selectedSizeIdx - 1].label : null;
    const largerLabel = selectedSizeIdx < sizes.length - 1 ? sizes[selectedSizeIdx + 1].label : null;

    let vText = '';
    let mLabel = '';
    let mColor = '#4ADE80'; // green

    if (isPrimary) {
      if (matchResult.matchStatus === 'great') {
        vText = `Size ${label} is your best fit.`;
        mLabel = 'Great match';
        mColor = '#4ADE80';
      } else if (matchResult.matchStatus === 'between') {
        const otherSize = matchResult.secondarySizeIndex !== undefined ? sizes[matchResult.secondarySizeIndex]?.label : null;
        vText = otherSize
          ? `Between ${smallerLabel || label} and ${largerLabel || otherSize}. We recommend ${label}.`
          : `Size ${label} recommended based on your fit preference.`;
        mLabel = 'Between sizes';
        mColor = '#FBBF24';
      } else {
        vText = `Size ${label} is the closest match, but brand cuts may vary.`;
        mLabel = 'Poor match';
        mColor = '#F87171';
      }
    } else if (isSmaller) {
      vText = `Size ${label} will fit tighter than your preference.`;
      mLabel = 'Tighter fit';
      mColor = '#FBBF24';
    } else if (isLarger) {
      vText = `Size ${label} will give a looser, more relaxed silhouette.`;
      mLabel = 'Looser fit';
      mColor = '#60A5FA';
    }

    const chestRange = currentSize.chest || [80, 88];
    const waistRange = currentSize.waist || [70, 78];
    const cRange = isPants ? (currentSize.waist || [70, 78]) : chestRange;
    const wRange = isPants ? (currentSize.hips || [85, 95]) : waistRange;

    const chestRangeText = `${formatDimension(cRange[0], tableUnit)} – ${formatDimension(cRange[1], tableUnit)}`;
    const waistRangeText = `${formatDimension(wRange[0], tableUnit)} – ${formatDimension(wRange[1], tableUnit)}`;

    const minBound = cRange[0] - 12;
    const maxBound = cRange[1] + 12;
    const totalSpan = maxBound - minBound;

    const userDotPercent = Math.min(100, Math.max(0, ((userPrimaryVal - minBound) / totalSpan) * 100));
    const primaryBarLeftPercent = Math.min(100, Math.max(0, ((cRange[0] - minBound) / totalSpan) * 100));
    const primaryBarRightPercent = Math.min(100, Math.max(0, ((cRange[1] - minBound) / totalSpan) * 100));
    const primaryBarWidthPercent = Math.max(4, primaryBarRightPercent - primaryBarLeftPercent);

    return {
      verdict: vText,
      matchLabel: mLabel,
      matchColor: mColor,
      chestRangeText,
      waistRangeText,
      rulerProps: {
        userDotPercent: Math.round(userDotPercent * 10) / 10,
        primaryBarLeftPercent: Math.round(primaryBarLeftPercent * 10) / 10,
        primaryBarWidthPercent: Math.round(primaryBarWidthPercent * 10) / 10,
        primaryBarColor: mColor === '#4ADE80' ? '#34C759' : mColor,
      },
    };
  }, [selectedSizeIdx, primarySizeIndex, currentSize, sizes, isPants, userPrimaryVal, tableUnit, matchResult.matchStatus]);

  const brandActionUrl = brandChart.brandUrl || brandChart.sourceUrl;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col gap-4 sm:gap-6 pb-20 page-transition">
      {/* Top Header Row: Back button & Breadcrumb / Brand Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="pill-btn btn-press font-medium text-xs sm:text-sm !px-3.5 sm:!px-4 !min-h-[38px] border border-white/20 hover:border-white/40 inline-flex items-center gap-1.5"
            aria-label="Back to results"
          >
            ← <span className="hidden sm:inline">Back to results</span>
          </button>

          <div className="flex items-center gap-2">
            <BrandLogo
              brand={brandChart.brand}
              maxHeight={26}
              fallbackClassName="font-barlow text-2xl font-bold tracking-wide text-white"
            />
            <span className="text-secText text-xs sm:text-sm font-semibold tracking-wide uppercase">
              · {genderLabel} · {categoryLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Headline Verdict */}
      <h1 className="font-barlow text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.05] whitespace-pre-line text-white">
        {verdict}
      </h1>

      {/* Size Switcher Sliding Tabs */}
      <div className="w-full">
        <SlidingTabs<string>
          ariaLabel="Select size to compare"
          className="flex gap-2 overflow-x-auto pb-1 max-w-full"
          buttonClassName="flex-1 min-w-[85px] sm:min-w-[105px] text-center text-xs sm:text-sm font-medium"
          value={sizes[selectedSizeIdx].label}
          onChange={(val: string) => {
            const idx = sizes.findIndex((s) => s.label === val);
            if (idx !== -1) setSelectedSizeIdx(idx);
          }}
          options={sizes.map((s, idx) => {
            const isPrimary = idx === primarySizeIndex;
            let chipSubtext = 'regular';
            if (isPrimary) chipSubtext = 'best';
            else if (idx < primarySizeIndex) chipSubtext = 'snug';
            else if (idx > primarySizeIndex) chipSubtext = 'loose';
            return {
              id: s.label,
              label: `${s.label} · ${chipSubtext}`,
            };
          })}
        />
      </div>

      {/* Main Responsive Grid: 2 Columns on desktop, 1 column on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column: Overview Card with Ruler & Stats + Desktop Action Button */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <BrandOverviewCard
            matchResult={matchResult}
            selectedSizeIdx={selectedSizeIdx}
            tableUnit={tableUnit}
            isPants={isPants}
            userPrimaryVal={userPrimaryVal}
            matchLabel={matchLabel}
            matchColor={matchColor}
            rulerProps={rulerProps}
            chestRangeText={chestRangeText}
            waistRangeText={waistRangeText}
          />

          {brandActionUrl && (
            <a
              href={brandActionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex primary-btn btn-press w-full text-center items-center justify-center no-underline !min-h-[48px] font-bold"
            >
              View on {brandChart.brand}
            </a>
          )}
        </div>

        {/* Right Column: Size Chart Table + Mobile Action Button */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <BrandSizeChartTable
            sizes={sizes}
            selectedSizeIdx={selectedSizeIdx}
            onSelectSize={(idx) => setSelectedSizeIdx(idx)}
            tableUnit={tableUnit}
            onUnitChange={(u) => setTableUnit(u)}
            tableMeasurementType={tableMeasurementType}
            onMeasurementTypeChange={(t) => setTableMeasurementType(t)}
            isPants={isPants}
            source={brandChart.source}
            sourceUrl={brandChart.sourceUrl}
            updated={brandChart.updated}
          />

          {brandActionUrl && (
            <a
              href={brandActionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lg:hidden flex primary-btn btn-press w-full text-center items-center justify-center no-underline !min-h-[48px] font-bold mt-2"
            >
              View on {brandChart.brand}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
export default BrandDetail;
