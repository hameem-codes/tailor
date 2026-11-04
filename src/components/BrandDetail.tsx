import React, { useState, useMemo } from 'react';
import { BrandMatchResult, UserMeasurements, UnitSystem, ChartType } from '../types';
import { RangeRuler } from './RangeRuler';
import { CheckIcon, WarningTriangleIcon, CrossCircleIcon, LockIcon } from './Icons';
import { formatDimension, formatRange } from '../lib/matching/helpers';
import { BrandLogo } from './BrandLogo';
import { SlidingTabs, SlidingTabOption } from './SlidingTabs';

const tableUnitOptions: SlidingTabOption<'metric' | 'imperial'>[] = [
  { id: 'metric', label: 'cm' },
  { id: 'imperial', label: 'in' },
];

const measurementTypeOptions: SlidingTabOption<'body' | 'garment'>[] = [
  { id: 'body', label: 'Body' },
  { id: 'garment', label: 'Garment' },
];

interface BrandDetailProps {
  matchResult: BrandMatchResult;
  measurements: UserMeasurements;
  onBack: () => void;
}

function renderSelectedSize(label: string) {
  const match = label.match(/^([^(]+?)(?:\s*(\([^)]+\)))?$/);
  if (!match || !match[2]) {
    const isLong = label.length > 3;
    return (
      <div
        className={`font-barlow font-semibold text-white leading-none ${
          isLong ? 'text-6xl sm:text-7xl' : 'text-7xl sm:text-8xl'
        }`}
      >
        {label}
      </div>
    );
  }

  const primary = match[1].trim();
  const secondary = match[2].trim();

  return (
    <div className="flex flex-col items-center justify-center leading-none text-center">
      <div className="font-barlow text-6xl sm:text-7xl font-semibold text-white leading-none">
        {primary}
      </div>
      <div className="text-xs sm:text-sm font-semibold text-secText tracking-wider mt-1">
        {secondary}
      </div>
    </div>
  );
}

export const BrandDetail: React.FC<BrandDetailProps> = ({
  matchResult,
  measurements,
  onBack,
}) => {
  const { brandChart, primarySizeIndex, confidence, confidenceReason } = matchResult;

  // Selected size index state (defaults to primary recommended size)
  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number>(primarySizeIndex);
  // Independent table display toggles
  const [tableUnit, setTableUnit] = useState<UnitSystem>(measurements.unit);
  const [tableMeasurementType, setTableMeasurementType] = useState<ChartType>(brandChart.chartType);

  const isPants = measurements.category === 'pants';
  const userPrimaryVal = isPants ? (measurements.waist || 80) : (measurements.chest || 96);
  const userPrimaryText = formatDimension(userPrimaryVal, tableUnit);

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
        vText = smallerLabel
          ? `Take ${label}.\n${smallerLabel} fits tighter.`
          : largerLabel
          ? `Take ${label}.\n${largerLabel} fits looser.`
          : `Take ${label}.\nIdeal fit.`;
        mLabel = 'Great match';
        mColor = '#4ADE80';
      } else if (matchResult.matchStatus === 'between') {
        vText = `Take ${label}.\nBetween sizes.`;
        mLabel = 'Between sizes';
        mColor = '#FBBF24';
      } else {
        vText = `Take ${label}.\nLoose or tight fit.`;
        mLabel = 'Poor match';
        mColor = '#F87171';
      }
    } else if (isSmaller) {
      vText = `Take ${label}.\nSnug, less room.`;
      mLabel = 'Snug fit';
      mColor = '#FBBF24';
    } else if (isLarger) {
      vText = `Take ${label}.\nLoose, more room.`;
      mLabel = 'Roomy fit';
      mColor = '#FBBF24';
    }

    // Ruler calculations for currently selected size
    const primaryRange = isPants ? (currentSize.waist ?? [70, 78]) : (currentSize.chest ?? [88, 95]);
    const waistRange = currentSize.waist ?? [70, 78];

    // Scale domain
    const allRanges = sizes.map(s => isPants ? (s.waist ?? [70, 80]) : (s.chest ?? [80, 90]));
    const minScale = Math.min(...allRanges.map(r => r[0]), userPrimaryVal) - 6;
    const maxScale = Math.max(...allRanges.map(r => r[1]), userPrimaryVal) + 6;
    const span = Math.max(maxScale - minScale, 1);

    const userDotPercent = Math.min(Math.max(((userPrimaryVal - minScale) / span) * 100, 4), 96);
    const primaryBarLeftPercent = Math.min(Math.max(((primaryRange[0] - minScale) / span) * 100, 2), 94);
    const primaryBarWidthPercent = Math.min(Math.max(((primaryRange[1] - primaryRange[0]) / span) * 100, 5), 90);

    return {
      verdict: vText,
      matchLabel: mLabel,
      matchColor: mColor,
      chestRangeText: formatRange(primaryRange[0], primaryRange[1], tableUnit),
      waistRangeText: formatRange(waistRange[0], waistRange[1], tableUnit),
      rulerProps: {
        userDotPercent: Math.round(userDotPercent * 10) / 10,
        primaryBarLeftPercent: Math.round(primaryBarLeftPercent * 10) / 10,
        primaryBarWidthPercent: Math.round(primaryBarWidthPercent * 10) / 10,
        primaryBarColor: mColor === '#4ADE80' ? '#34C759' : mColor,
      },
    };
  }, [selectedSizeIdx, primarySizeIndex, currentSize, sizes, isPants, userPrimaryVal, tableUnit, matchResult.matchStatus]);

  return (
    <div className="w-full page-transition">
      {/* =========================================================================
          VIEW A: MOBILE VIEW (< lg: / under 1024px)
          - Restores the exact mobile layout from before:
            - Header: ← circle button + Brand Name
            - Dynamic verdict headline
            - Size switcher chips
            - Overview card
            - Size chart table card
            - Sticky primary button
         ========================================================================= */}
      <div className="lg:hidden w-full max-w-[520px] mx-auto min-h-screen flex flex-col gap-3.5 p-4 sm:p-6 pb-20">
        {/* Mobile Header: Back Button + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="circle-btn btn-press"
            aria-label="Back to recommendations"
          >
            ←
          </button>
          <div className="flex items-center min-h-[36px]">
            <BrandLogo
              brand={brandChart.brand}
              maxHeight={32}
              fallbackClassName="font-barlow text-3xl font-semibold tracking-wide text-white"
            />
          </div>
        </div>

        {/* Dynamic Headline Verdict */}
        <h1 className="font-barlow text-4xl sm:text-[46px] font-semibold leading-[1.05] whitespace-pre-line text-white">
          {verdict}
        </h1>

        {/* Size Switcher Chips */}
        <SlidingTabs<string>
          ariaLabel="Select size to compare"
          className="flex gap-2 overflow-x-auto pb-1"
          buttonClassName="flex-1 min-w-[85px] text-center"
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

        {/* Mobile Glass Overview Card */}
        <div className="glass-card p-5 sm:p-6 flex flex-col gap-4 border-accent/40">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm sm:text-base text-secText">Selected size</div>
              <div className="mt-1">
                {renderSelectedSize(currentSize.label)}
              </div>
            </div>

            <div className="pb-3 flex items-center gap-1.5 font-semibold text-base" style={{ color: matchColor }}>
              {matchLabel === 'Great match' && <CheckIcon size={16} />}
              {matchLabel.includes('fit') && <WarningTriangleIcon size={16} />}
              {matchLabel === 'Between sizes' && <WarningTriangleIcon size={16} />}
              {matchLabel === 'Poor match' && <CrossCircleIcon size={16} />}
              <span>{matchLabel}</span>
            </div>
          </div>

          <div>
            <div className="text-sm sm:text-base text-secText">
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

          <div className="flex items-center gap-2 text-sm text-[#D6D6DC] pt-1">
            <LockIcon size={16} className="text-[#4ADE80] flex-none" />
            <span>Confidence: <strong className="text-white capitalize">{confidence}</strong>. {confidenceReason}</span>
          </div>

          <div className="flex border-t border-white/15 pt-3 mt-1">
            <div className="flex-1 pr-3">
              <div className="font-barlow text-2xl sm:text-[34px] font-medium text-white">
                {Math.round(userPrimaryVal)}
                <span className="text-sm text-secText"> {tableUnit === 'imperial' ? 'in' : 'cm'}</span>
              </div>
              <div className="text-sm text-secText mt-1">
                Your {isPants ? 'waist' : 'chest'}
              </div>
            </div>

            <div className="flex-1 px-3 border-l border-white/15">
              <div className="font-barlow text-2xl sm:text-[34px] font-medium text-white truncate">
                {chestRangeText.replace(' cm', '').replace(' in', '')}
              </div>
              <div className="text-sm text-secText mt-1">
                {isPants ? 'Waist' : 'Chest'} range
              </div>
            </div>

            <div className="flex-1 pl-3 border-l border-white/15">
              <div className="font-barlow text-2xl sm:text-[34px] font-medium text-white truncate">
                {waistRangeText.replace(' cm', '').replace(' in', '')}
              </div>
              <div className="text-sm text-secText mt-1">
                {isPants ? 'Hips' : 'Waist'} range
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Size Chart Table */}
        <div className="glass-card p-4 sm:p-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-secText text-sm sm:text-base">Unit</span>
            <SlidingTabs<'metric' | 'imperial'>
              ariaLabel="Table unit"
              className="flex gap-1.5"
              buttonClassName="!min-h-[36px] !py-0 !px-3"
              value={tableUnit}
              onChange={(u: 'metric' | 'imperial') => setTableUnit(u)}
              options={tableUnitOptions}
            />
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-secText text-sm sm:text-base">Measurement type</span>
            <SlidingTabs<'body' | 'garment'>
              ariaLabel="Measurement type"
              className="flex gap-1.5"
              buttonClassName="!min-h-[36px] !py-0 !px-3"
              value={tableMeasurementType}
              onChange={(t: 'body' | 'garment') => setTableMeasurementType(t)}
              options={measurementTypeOptions}
            />
          </div>

          <div className="overflow-x-auto w-full">
            <div className="min-w-[280px]">
              <div className="flex text-secText text-sm sm:text-base font-medium px-2.5 py-1">
                <span className="w-16 text-center">Size</span>
                <span className="flex-1">{isPants ? 'Waist' : 'Chest'}</span>
                <span className="flex-1">{isPants ? 'Hips' : 'Waist'}</span>
              </div>

              <div className="space-y-1">
                {sizes.map((s, idx) => {
                  const isCurrent = idx === selectedSizeIdx;
                  const chestR = tableMeasurementType === 'garment' && s.garmentChest
                    ? s.garmentChest
                    : (s.chest ?? [80, 88]);
                  const waistR = tableMeasurementType === 'garment' && s.garmentWaist
                    ? s.garmentWaist
                    : (s.waist ?? [70, 78]);

                  const col1Range = isPants ? (s.waist ?? [70, 78]) : chestR;
                  const col2Range = isPants ? (s.hips ?? [85, 95]) : waistR;

                  return (
                    <div
                      key={s.label}
                      onClick={() => setSelectedSizeIdx(idx)}
                      className={`flex items-center px-2.5 py-2 text-sm sm:text-base cursor-pointer rounded-[14px] transition-all duration-200 ${
                        isCurrent
                          ? 'bg-[#1DA84A] text-white font-bold shadow-md'
                          : 'hover:bg-white/5 text-white/90'
                      }`}
                    >
                      <span className="w-16 text-center font-semibold">{s.label}</span>
                      <span className="flex-1">
                        {formatRange(col1Range[0], col1Range[1], tableUnit).replace(' cm', '').replace(' in', '')}
                      </span>
                      <span className="flex-1">
                        {formatRange(col2Range[0], col2Range[1], tableUnit).replace(' cm', '').replace(' in', '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[15px] sm:text-base text-secText mt-2">
            Source: {brandChart.source} · Updated {brandChart.updated}
          </div>
        </div>

        {/* Primary Link Button */}
        <a
          href={brandChart.brandUrl || brandChart.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="primary-btn btn-press w-full text-center no-underline mt-4 mb-2"
        >
          View on {brandChart.brand}
        </a>
      </div>

      {/* =========================================================================
          VIEW B: DESKTOP VIEW (hidden on mobile, visible on lg: and up)
          - Exactly matches the 3rd desktop reference image ("11 Desktop Brand Detail"):
            - 2-Column Layout:
              - Left Column: "← Back to results", "<Brand> · <Gender> · <Category>",
                Verdict headline, S/M/L chips, Overview Card with Ruler & Stats,
                and "View on <Brand>" button.
              - Right Column: Size Chart Table Card with Unit and Measurement Type toggles,
                active row highlighted in solid green, and source note.
         ========================================================================= */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-12 gap-8 xl:gap-12 items-start">
          {/* ==================== LEFT COLUMN ==================== */}
          <div className="col-span-6 flex flex-col gap-4">
            {/* Top Hero Shield Card: Prevents 3D model collision, ensures 100% text contrast */}
            <div className="glass-card p-6 sm:p-7 flex flex-col gap-4 border border-white/12 rounded-[28px] shadow-2xl">
              {/* Top Back Action Button */}
              <div>
                <button
                  onClick={onBack}
                  className="pill-btn btn-press font-medium text-sm !px-4 !py-2 border border-white/20 hover:border-white/40 inline-flex items-center gap-1.5"
                >
                  ← Back to results
                </button>
              </div>

              {/* Breadcrumb Context Label */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-secText uppercase">
                <BrandLogo
                  brand={brandChart.brand}
                  maxHeight={18}
                  fallbackClassName="text-white font-semibold"
                />
                <span>· {genderLabel} · {categoryLabel}</span>
              </div>

              {/* Dynamic Headline Verdict */}
              <h1 className="font-barlow text-4xl sm:text-5xl lg:text-[54px] font-semibold leading-[1.04] whitespace-pre-line text-white">
                {verdict}
              </h1>

              {/* S / M / L Size Selector Chips */}
              <SlidingTabs<string>
                ariaLabel="Select size to compare"
                className="flex flex-wrap gap-2 mt-1"
                buttonClassName="flex-1 min-w-[85px] text-center font-medium !py-2.5"
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

            {/* Overview Card */}
            <div className="glass-card p-6 flex flex-col gap-4 border border-white/12 rounded-[28px] mt-1">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm text-secText">Selected size</div>
                  <div className="mt-1">
                    {renderSelectedSize(currentSize.label)}
                  </div>
                </div>

                <div className="pb-2 flex items-center gap-1.5 font-semibold text-base" style={{ color: matchColor }}>
                  {matchLabel === 'Great match' && <CheckIcon size={18} />}
                  {matchLabel.includes('fit') && <WarningTriangleIcon size={18} />}
                  {matchLabel === 'Between sizes' && <WarningTriangleIcon size={18} />}
                  {matchLabel === 'Poor match' && <CrossCircleIcon size={18} />}
                  <span>{matchLabel}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-secText">
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

              <div className="flex items-center gap-2 text-sm text-[#D6D6DC] pt-1">
                <LockIcon size={16} className="text-[#4ADE80] flex-none" />
                <span>Confidence: <strong className="text-white capitalize">{confidence}</strong>. {confidenceReason}</span>
              </div>

              {/* 3 Stats Columns */}
              <div className="flex border-t border-white/15 pt-3.5 mt-1">
                <div className="flex-1 pr-3">
                  <div className="font-barlow text-3xl font-medium text-white">
                    {Math.round(userPrimaryVal)}
                    <span className="text-sm text-secText"> {tableUnit === 'imperial' ? 'in' : 'cm'}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-secText mt-1">
                    Your {isPants ? 'waist' : 'chest'}
                  </div>
                </div>

                <div className="flex-1 px-3 border-l border-white/15">
                  <div className="font-barlow text-3xl font-medium text-white truncate">
                    {chestRangeText.replace(' cm', '').replace(' in', '')}
                  </div>
                  <div className="text-xs sm:text-sm text-secText mt-1">
                    {isPants ? 'Waist' : 'Chest'} range
                  </div>
                </div>

                <div className="flex-1 pl-3 border-l border-white/15">
                  <div className="font-barlow text-3xl font-medium text-white truncate">
                    {waistRangeText.replace(' cm', '').replace(' in', '')}
                  </div>
                  <div className="text-xs sm:text-sm text-secText mt-1">
                    {isPants ? 'Hips' : 'Waist'} range
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Button: View on Brand */}
            <a
              href={brandChart.brandUrl || brandChart.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-btn btn-press w-full text-center no-underline !min-h-[52px] text-lg font-bold mt-1"
            >
              View on {brandChart.brand}
            </a>
          </div>

          {/* ==================== RIGHT COLUMN: SIZE CHART TABLE ==================== */}
          <div className="col-span-6 flex flex-col justify-start">
            <div className="glass-card p-6 sm:p-7 flex flex-col gap-4 border border-white/12 rounded-[28px] shadow-2xl">
              {/* Unit Toggle Row */}
              <div className="flex items-center justify-between">
                <span className="text-secText font-medium text-sm sm:text-base">Unit</span>
                <SlidingTabs<'metric' | 'imperial'>
                  ariaLabel="Table unit"
                  className="flex gap-1.5"
                  buttonClassName="!min-h-[36px] !py-0 !px-4 text-xs sm:text-sm"
                  value={tableUnit}
                  onChange={(u: 'metric' | 'imperial') => setTableUnit(u)}
                  options={tableUnitOptions}
                />
              </div>

              {/* Measurement Type Toggle Row */}
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-secText font-medium text-sm sm:text-base">Measurement type</span>
                <SlidingTabs<'body' | 'garment'>
                  ariaLabel="Measurement type"
                  className="flex gap-1.5"
                  buttonClassName="!min-h-[36px] !py-0 !px-4 text-xs sm:text-sm"
                  value={tableMeasurementType}
                  onChange={(t: 'body' | 'garment') => setTableMeasurementType(t)}
                  options={measurementTypeOptions}
                />
              </div>

              {/* Table Container */}
              <div className="w-full">
                {/* Table Header */}
                <div className="flex text-secText text-sm sm:text-base font-semibold px-4 py-2">
                  <span className="w-20 text-center">Size</span>
                  <span className="flex-1">{isPants ? 'Waist' : 'Chest'}</span>
                  <span className="flex-1">{isPants ? 'Hips' : 'Waist'}</span>
                </div>

                {/* Size Rows */}
                <div className="space-y-1.5">
                  {sizes.map((s, idx) => {
                    const isCurrent = idx === selectedSizeIdx;
                    const chestR = tableMeasurementType === 'garment' && s.garmentChest
                      ? s.garmentChest
                      : (s.chest ?? [80, 88]);
                    const waistR = tableMeasurementType === 'garment' && s.garmentWaist
                      ? s.garmentWaist
                      : (s.waist ?? [70, 78]);

                    const col1Range = isPants ? (s.waist ?? [70, 78]) : chestR;
                    const col2Range = isPants ? (s.hips ?? [85, 95]) : waistR;

                    return (
                      <div
                        key={s.label}
                        onClick={() => setSelectedSizeIdx(idx)}
                        className={`flex items-center px-4 py-3 text-sm sm:text-base cursor-pointer rounded-[16px] transition-all duration-200 ${
                          isCurrent
                            ? 'bg-[#1DA84A] text-white font-bold shadow-lg scale-[1.01]'
                            : 'hover:bg-white/10 text-white/90'
                        }`}
                      >
                        <span className="w-20 text-center font-semibold">{s.label}</span>
                        <span className="flex-1">
                          {formatRange(col1Range[0], col1Range[1], tableUnit).replace(' cm', '').replace(' in', '')}
                        </span>
                        <span className="flex-1">
                          {formatRange(col2Range[0], col2Range[1], tableUnit).replace(' cm', '').replace(' in', '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Source Note */}
              <div className="text-xs sm:text-sm text-secText mt-2 pt-2 border-t border-white/10">
                Source: {brandChart.source} · Updated {brandChart.updated}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
