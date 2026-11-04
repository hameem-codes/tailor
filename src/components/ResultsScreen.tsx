import React, { useState } from 'react';
import { BrandMatchResult, UserMeasurements, RegionFilter, SortOption } from '../types';
import { BrandCard } from './BrandCard';
import { SearchIcon, FilterIcon, HangerIcon, CheckIcon, WarningTriangleIcon, CrossCircleIcon } from './Icons';
import { formatDimension } from '../lib/matching/helpers';

interface ResultsScreenProps {
  results: BrandMatchResult[];
  measurements: UserMeasurements;
  savedBrandIds: string[];
  tipDismissed: boolean;
  onDismissTip: () => void;
  onToggleSave: (brandId: string) => void;
  onOpenDetail: (match: BrandMatchResult) => void;
  onEditMeasurements: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  regionFilter: RegionFilter;
  setRegionFilter: (r: RegionFilter) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  results,
  measurements,
  savedBrandIds,
  tipDismissed,
  onDismissTip,
  onToggleSave,
  onOpenDetail,
  onEditMeasurements,
  searchQuery,
  setSearchQuery,
  regionFilter,
  setRegionFilter,
  sortBy,
  setSortBy,
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMatchLevels, setShowMatchLevels] = useState(true);

  const isPants = measurements.category === 'pants';
  const primaryDim = isPants
    ? `Waist ${formatDimension(measurements.waist || 80, measurements.unit)}`
    : `Chest ${formatDimension(measurements.chest || 96, measurements.unit)}`;

  const genderLabel = measurements.gender.charAt(0).toUpperCase() + measurements.gender.slice(1);
  const categoryLabel = measurements.category.charAt(0).toUpperCase() + measurements.category.slice(1);

  const cycleSort = () => {
    if (sortBy === 'match') setSortBy('brand-asc');
    else if (sortBy === 'brand-asc') setSortBy('size');
    else setSortBy('match');
  };

  const getSortLabel = () => {
    if (sortBy === 'match') return 'Best match';
    if (sortBy === 'brand-asc') return 'A–Z';
    return 'Size';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRegionFilter('all');
    setSortBy('match');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex flex-col gap-4 sm:gap-5 pb-20 page-transition">
      {/* =========================================================================
          1. HEADER & TOOLBAR SECTION (Protected with Frosted Backdrop Shield)
         ========================================================================= */}
      <div className="backdrop-blur-2xl bg-black/60 border border-white/12 rounded-[28px] p-5 sm:p-6 lg:p-7 flex flex-col gap-4 shadow-xl">
        {/* Mobile-only top navigation bar */}
        <div className="flex lg:hidden justify-between items-center">
          <button
            onClick={onEditMeasurements}
            className="circle-btn btn-press"
            aria-label="Back to measurements"
          >
            ←
          </button>
          <button
            onClick={onEditMeasurements}
            className="pill-btn btn-press font-medium text-sm"
          >
            Edit measurements
          </button>
        </div>

        {/* Main Title Row: On desktop, title & subtitle on left, "Edit measurements" on right */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <h1 className="font-barlow text-4xl sm:text-5xl lg:text-[54px] font-semibold text-white tracking-wide leading-none drop-shadow-sm">
              Your sizes
            </h1>
            <div className="text-sm sm:text-base text-[#D6D6DC] mt-1.5">
              {genderLabel} · {categoryLabel} · {primaryDim} · {results.length} brands
            </div>
          </div>

          {/* Desktop-only "Edit measurements" pill button */}
          <button
            onClick={onEditMeasurements}
            className="hidden lg:inline-flex pill-btn btn-press font-medium text-sm !px-5 !min-h-[42px] border border-white/20 hover:border-white/40"
          >
            Edit measurements
          </button>
        </div>

        {/* Toolbar Row (Search, Region Filter, Sort) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative pt-1">
          {/* Left Toolbar group */}
          <div className="flex items-center gap-2.5 flex-1">
            {/* Search Input Box */}
            <label className="field-container flex items-center gap-2 px-3.5 py-0 min-h-[42px] flex-1 max-w-sm cursor-text rounded-full">
              <SearchIcon size={18} className="text-[#D6D6DC] flex-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brands"
                aria-label="Search brands"
                className="bg-transparent border-0 text-white font-normal text-sm sm:text-[15px] outline-none w-full placeholder:text-[#D6D6DC]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#D6D6DC] hover:text-white text-base px-1"
                  aria-label="Clear brand search"
                >
                  ×
                </button>
              )}
            </label>

            {/* Desktop-only Segmented Region Pills: [ All ] [ Global ] [ Local ] */}
            <div
              role="radiogroup"
              aria-label="Brand region filter"
              className="hidden sm:inline-flex items-center gap-1.5"
            >
              {(['all', 'global', 'local'] as RegionFilter[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={regionFilter === r}
                  onClick={() => setRegionFilter(r)}
                  className={`pill-btn btn-press !min-h-[38px] !px-4 text-xs sm:text-sm capitalize transition-all ${
                    regionFilter === r ? 'pill-active' : ''
                  }`}
                >
                  {r === 'all' ? 'All' : r}
                </button>
              ))}
            </div>
          </div>

          {/* Right Toolbar group */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort button */}
            <button
              onClick={cycleSort}
              className="pill-btn btn-press flex-none text-xs sm:text-sm font-medium !min-h-[40px] !px-4"
              aria-label={`Sort: ${getSortLabel()}. Click to change`}
            >
              {getSortLabel()}
            </button>

            {/* Filter icon button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`circle-btn btn-press flex-none !w-10 !h-10 !min-w-[40px] !min-h-[40px] ${
                  regionFilter !== 'all' ? '!bg-[#1DA84A]' : ''
                }`}
                aria-label="Filter by brand region"
                aria-expanded={showFilterMenu}
              >
                <FilterIcon size={18} />
              </button>

              {/* Filter Popup Menu */}
              {showFilterMenu && (
                <div className="absolute right-0 top-12 z-30 glass-card p-2 min-w-[150px] shadow-2xl border border-white/20 animate-fade-in">
                  <div className="text-xs font-semibold text-secText px-3 py-1.5 uppercase tracking-wider">
                    Region
                  </div>
                  {(['all', 'global', 'local'] as RegionFilter[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRegionFilter(r);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg capitalize transition-colors ${
                        regionFilter === r ? 'bg-[#1DA84A] text-white font-semibold' : 'text-secText hover:bg-white/10'
                      }`}
                    >
                      {r === 'all' ? 'All regions' : `${r} only`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. DISMISSIBLE ONBOARDING TIP BANNER
         ========================================================================= */}
      {!tipDismissed && (
        <div
          role="region"
          aria-label="Onboarding tip"
          className="flex items-center gap-2 rounded-[18px] bg-[#4ADE80]/15 border border-[#4ADE80]/45 p-1 pl-4 pr-1 animate-fade-in"
        >
          <span className="flex-1 text-xs sm:text-sm text-white font-normal leading-snug">
            The white dot is you. The colored bar is the brand's size range.
          </span>
          <button
            onClick={onDismissTip}
            className="circle-btn btn-press !w-8 !h-8 !min-w-[32px] !min-h-[32px] !text-base !bg-transparent hover:!bg-white/10 text-white"
            aria-label="Dismiss tip"
          >
            ×
          </button>
        </div>
      )}

      {/* =========================================================================
          4. MATCH LEVELS KEY CARD (ON TOP)
          Making the user see what is what at first before browsing brand cards
         ========================================================================= */}
      <div className="glass-card p-4 sm:p-5 flex flex-col gap-3 w-full animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm sm:text-base text-white">Match levels</h3>
          <button
            onClick={() => setShowMatchLevels(!showMatchLevels)}
            className="text-xs text-secText hover:text-white transition-colors cursor-pointer py-0.5 px-1.5 rounded hover:bg-white/10"
            aria-label={showMatchLevels ? 'Hide match levels guide' : 'Show match levels guide'}
          >
            {showMatchLevels ? 'Hide' : 'Show guide'}
          </button>
        </div>
        {showMatchLevels && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 animate-fade-in">
            <div>
              <span className="text-[#4ADE80] font-semibold text-sm sm:text-base inline-flex items-center gap-1.5">
                <CheckIcon size={16} /> Great match
              </span>
              <div className="text-secText text-xs sm:text-sm mt-1 leading-snug">
                Your body measurement sits inside the size range.
              </div>
            </div>
            <div>
              <span className="text-[#FBBF24] font-semibold text-sm sm:text-base inline-flex items-center gap-1.5">
                <WarningTriangleIcon size={16} /> Between sizes
              </span>
              <div className="text-secText text-xs sm:text-sm mt-1 leading-snug">
                You fall between two adjacent sizes. Suggested by fit preference.
              </div>
            </div>
            <div>
              <span className="text-[#F87171] font-semibold text-sm sm:text-base inline-flex items-center gap-1.5">
                <CrossCircleIcon size={16} /> Poor match
              </span>
              <div className="text-secText text-xs sm:text-sm mt-1 leading-snug">
                No size is close. The brand cuts may not fit your proportions well.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          5. BRAND CARDS GRID
          - Desktop (lg:): Exactly 3 COLUMNS as shown in user's design image
          - Tablet (md:): 2 columns
          - Mobile (<md:): 1 column
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {results.length > 0 ? (
          results.map((match) => (
            <BrandCard
              key={match.brandChart.id}
              matchResult={match}
              measurements={measurements}
              isSaved={savedBrandIds.includes(match.brandChart.id)}
              onToggleSave={onToggleSave}
              onOpenDetail={onOpenDetail}
            />
          ))
        ) : (
          /* Empty No Brands Match State */
          <div className="col-span-full glass-card p-8 flex flex-col items-center text-center gap-3 animate-fade-in">
            <div className="text-[#D6D6DC] my-1">
              <HangerIcon size={48} />
            </div>
            <h2 className="font-barlow text-3xl sm:text-4xl font-semibold text-white">
              No brands match yet
            </h2>
            <p className="text-secText text-[15px] leading-relaxed max-w-xs">
              We couldn't find a matching brand for these filters or search terms. Try adjusting your preferences.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm mt-3">
              <button
                onClick={onEditMeasurements}
                className="primary-btn btn-press w-full sm:w-auto !px-6 !min-h-[44px] !text-sm font-semibold whitespace-nowrap"
              >
                Edit measurements
              </button>
              <button
                onClick={clearFilters}
                className="pill-btn btn-press w-full sm:w-auto !px-6 !min-h-[44px] !text-sm font-medium whitespace-nowrap"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          6. FOOTER DISCLAIMER
         ========================================================================= */}
      <footer className="text-center text-xs text-[#A1A1AA] pt-4 pb-2">
        Sample data for portfolio demonstration only · Not official brand charts.
      </footer>
    </div>
  );
};
