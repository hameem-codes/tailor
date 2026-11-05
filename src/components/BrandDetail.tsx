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

    const userDotPercent = Math.min(97, Math.max(3, ((userPrimaryVal - minBound) / totalSpan) * 100));
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
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8 flex flex-col gap-4 sm:gap-6 pb-20 page-transition">
      {/* Top Header Row: Back navigation & store link */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          onClick={onBack}
          className="pill-btn btn-press font-semibold text-xs sm:text-sm !px-4 !min-h-[40px] border border-white/20 hover:border-white/40 inline-flex items-center gap-2 text-white bg-white/[0.04]"
          aria-label="Back to results"
        >
          <span>←</span>
          <span>Back to results</span>
        </button>

        {brandActionUrl && (
          <a
            href={brandActionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pill-btn btn-press !min-h-[40px] !px-4 text-xs sm:text-sm font-semibold !text-[#4ADE80] border-[#4ADE80]/30 hover:border-[#4ADE80]/60 bg-[#1DA84A]/10 inline-flex items-center gap-1.5"
          >
            <span>Visit {brandChart.brand} store</span>
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      {/* =========================================================================
          BRAND SHOWCASE HERO (Prominent, High-Visibility Brand Identity)
          - Positioned below Results navigation and directly above Size Switcher
          - Features large official brand logo, bold title, and fit status
         ========================================================================= */}
      <section
        aria-label={`${brandChart.brand} overview`}
        className="glass-card p-5 sm:p-7 flex flex-col gap-4 animate-fade-in"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Large Brand Logo + Brand Details (No white border box around logo) */}
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="flex items-center flex-none">
              <BrandLogo
                brand={brandChart.brand}
                maxHeight={48}
                maxWidth={180}
                hideTextSuffix={true}
                fallbackClassName="font-barlow text-3xl sm:text-5xl font-extrabold tracking-wide text-white uppercase"
              />
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-barlow text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wide truncate">
                  {brandChart.brand}
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#4ADE80] bg-[#1DA84A]/20 px-2.5 py-0.5 rounded-full border border-[#4ADE80]/30 flex-none">
                  {brandChart.region}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-secText/85 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 flex-none">
                  {genderLabel} · {categoryLabel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-secText/80 leading-snug">
                Official {brandChart.brand} size guide & body fit matching
              </p>
            </div>
          </div>

          {/* Quick Best Fit Callout Badge */}
          <div className="flex items-center sm:flex-col sm:items-end justify-between border-t border-white/10 sm:border-0 pt-3 sm:pt-0 flex-none">
            <span className="text-xs font-semibold text-secText/80 uppercase tracking-wider">
              Recommended Size
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-barlow text-3xl sm:text-4xl font-extrabold text-[#4ADE80]">
                {matchResult.recommendedSize}
              </span>
              <span className="text-xs font-bold text-white/90 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                {matchResult.matchStatus === 'great'
                  ? '✓ Great match'
                  : matchResult.matchStatus === 'between'
                  ? '⚠ Between sizes'
                  : 'Closest fit'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Verdict Headline with Fit Badge */}
        <div className="border-t border-white/10 pt-3 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4ADE80] flex-none">
            Fit Verdict:
          </span>
          <p className="font-barlow text-xl sm:text-2xl lg:text-3xl font-semibold text-white tracking-wide leading-tight break-words">
            {verdict}
          </p>
        </div>
      </section>

      {/* Size Switcher Sliding Tabs (Directly above sizes) */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs sm:text-sm font-semibold text-secText uppercase tracking-wider">
            Compare Sizes:
          </span>
          <span className="text-xs text-secText/75">
            Tap a size to preview ruler & proportions
          </span>
        </div>
        <div className="w-full overflow-x-auto no-scrollbar py-0.5">
          <SlidingTabs<string>
            ariaLabel="Select size to compare"
            className="flex gap-2 min-w-full w-max"
            buttonClassName="flex-none min-w-[76px] sm:min-w-[105px] !min-h-[36px] sm:!min-h-[38px] text-center text-xs sm:text-sm font-medium"
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
