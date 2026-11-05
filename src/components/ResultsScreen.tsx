import React, { useState, useMemo, useEffect } from 'react';
import { BrandMatchResult, UserMeasurements, RegionFilter, SortOption } from '../types';
import { BrandCard } from './BrandCard';
import { SearchIcon, FilterIcon, HangerIcon, CheckIcon, WarningTriangleIcon, CrossCircleIcon, ShareIcon, HeartIcon } from './Icons';
import { formatDimension } from '../lib/matching/helpers';
import { SlidingTabs, SlidingTabOption } from './SlidingTabs';
import { BrandComparisonModal } from './BrandComparisonModal';
import { ExportShareModal } from './ExportShareModal';

const regionOptions: SlidingTabOption<RegionFilter>[] = [
  { id: 'all', label: 'All' },
  { id: 'global', label: 'Global' },
  { id: 'local', label: 'Local' },
];

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
  isLoading?: boolean;
  onShare?: () => void;
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
  isLoading = false,
  onShare,
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showMatchLevels, setShowMatchLevels] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [comparedBrandIds, setComparedBrandIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const isPants = measurements.category === 'pants';
  const primaryDim = isPants
    ? `Waist ${formatDimension(measurements.waist || 80, measurements.unit)}`
    : `Chest ${formatDimension(measurements.chest || 96, measurements.unit)}`;

  const genderLabel = measurements.gender.charAt(0).toUpperCase() + measurements.gender.slice(1);
  const categoryLabel = measurements.category.charAt(0).toUpperCase() + measurements.category.slice(1);

  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Reset pagination when query or filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, regionFilter, sortBy, showSavedOnly]);

  const filteredResults = useMemo(() => {
    if (showSavedOnly && savedBrandIds.length > 0) {
      return results.filter(r => savedBrandIds.includes(r.brandChart.id));
    }
    return results;
  }, [results, savedBrandIds, showSavedOnly]);

  const comparedMatches = useMemo(() => {
    return results.filter((r) => comparedBrandIds.includes(r.brandChart.id));
  }, [results, comparedBrandIds]);

  const handleToggleCompare = (brandId: string) => {
    setComparedBrandIds((prev) => {
      if (prev.includes(brandId)) {
        return prev.filter((id) => id !== brandId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), brandId];
      }
      return [...prev, brandId];
    });
  };

  const displayedResults = useMemo(() => {
    return filteredResults.slice(0, visibleCount);
  }, [filteredResults, visibleCount]);

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
          1. HEADER SECTION
          - Desktop (lg:): Title & subtitle on left, "Edit measurements" on right
          - Mobile (<lg:): Back circle button on left, "Edit measurements" on right
         ========================================================================= */}
      {/* Mobile-only top navigation bar */}
      <div className="flex lg:hidden items-center justify-between">
        <button
          onClick={onEditMeasurements}
          className="pill-btn btn-press font-medium text-xs sm:text-sm !min-h-[44px] !px-3.5 border border-white/20 hover:border-white/40 inline-flex items-center gap-1.5"
          aria-label="Back to edit measurements"
        >
          <span>←</span>
          <span>Edit measurements</span>
        </button>
        <span className="text-xs font-semibold text-secText uppercase tracking-wider">
          {genderLabel} · {categoryLabel}
        </span>
      </div>

      {/* Main Title Row: On desktop, title & subtitle on left, "Edit measurements" on right */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <h1 className="font-barlow text-4xl sm:text-5xl lg:text-[54px] font-semibold text-white tracking-wide leading-none">
            Your sizes
          </h1>
          <div className="text-sm sm:text-base text-[#D6D6DC] mt-1.5 flex items-center gap-2 flex-wrap">
            <span>
              {genderLabel} · {categoryLabel} · {primaryDim} ·{' '}
              {showSavedOnly ? (
                <>
                  <strong className="text-white">
                    {filteredResults.length} saved {filteredResults.length === 1 ? 'brand' : 'brands'}
                  </strong>{' '}
                  <button
                    type="button"
                    onClick={() => setShowSavedOnly(false)}
                    className="text-[#4ADE80] hover:underline font-medium text-xs sm:text-sm ml-1"
                  >
                    (show all {results.length})
                  </button>
                </>
              ) : (
                <span>
                  <strong>{filteredResults.length}</strong> {filteredResults.length === 1 ? 'brand' : 'brands'}
                  {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ''}
                </span>
              )}
            </span>
            {isLoading && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1.5 text-xs text-accent/90 bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Updating size charts...
              </span>
            )}
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

      {/* =========================================================================
          2. TOOLBAR ROW (Search, Region Filter, Sort)
          - Desktop (lg:): Search box + Inline [All] [Global] [Local] pills on left;
                           [Best match] sort + [≡] filter icon on right
          - Mobile (<lg:): Full-width search box + Horizontal scrolling pill toolbar
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
        {/* Left Toolbar group */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
          {/* Search Input Box */}
          <label className="field-container flex items-center gap-2 px-3.5 py-0 min-h-[42px] w-full sm:max-w-sm cursor-text rounded-full">
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
          <SlidingTabs<RegionFilter>
            ariaLabel="Brand region filter"
            className="hidden sm:inline-flex items-center gap-1.5"
            buttonClassName="!min-h-[38px] !px-4 text-xs sm:text-sm capitalize"
            value={regionFilter}
            onChange={(r) => setRegionFilter(r)}
            options={regionOptions}
          />
        </div>

        {/* Right Toolbar group: Horizontally scrollable chip row on mobile */}
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0 sm:self-auto">
          {/* Saved filter tab */}
          <button
            type="button"
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`pill-btn btn-press flex-none text-xs sm:text-sm font-semibold !min-h-[38px] sm:!min-h-[40px] !px-3.5 inline-flex items-center gap-1.5 transition-all ${showSavedOnly
                ? '!bg-[#1DA84A] text-white !border-[#4ADE80] shadow-md ring-1 ring-[#4ADE80]/30'
                : '!bg-white/[0.04] text-white/90 border-white/15 hover:border-white/30'
              }`}
            aria-label={showSavedOnly ? 'Show all brands' : 'Filter by saved brands'}
            aria-pressed={showSavedOnly}
          >
            <HeartIcon
              size={15}
              filled={showSavedOnly || savedBrandIds.length > 0}
              className={showSavedOnly ? 'text-white' : savedBrandIds.length > 0 ? 'text-[#F87171]' : 'text-secText'}
            />
            <span>Saved</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${showSavedOnly ? 'bg-white/25 text-white' : 'bg-white/10 text-secText'
                }`}
            >
              {savedBrandIds.length}
            </span>
          </button>

          {/* Sort button */}
          <button
            onClick={cycleSort}
            className="pill-btn btn-press flex-none text-xs sm:text-sm font-medium !min-h-[38px] sm:!min-h-[40px] !px-3.5 sm:!px-4"
            aria-label={`Sort: ${getSortLabel()}. Click to change`}
          >
            {getSortLabel()}
          </button>

          {/* Share button */}
          <button
            onClick={() => {
              setShowExportModal(true);
              onShare?.();
            }}
            className="pill-btn btn-press flex-none !min-h-[38px] sm:!min-h-[40px] !px-3.5 sm:!px-4 text-xs sm:text-sm font-medium inline-flex items-center"
            aria-label="Share and export results"
          >
            <ShareIcon size={15} className="mr-1" />
            <span>Share / Export</span>
          </button>

          {/* Filter icon button */}
          <div className="relative flex-none">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`circle-btn btn-press flex-none !w-10 !h-10 sm:!w-10 sm:!h-10 !min-w-[44px] !min-h-[44px] ${regionFilter !== 'all' ? '!bg-[#1DA84A]' : ''
                }`}
              aria-label="Filter by brand region"
              aria-expanded={showFilterMenu}
            >
              <FilterIcon size={17} />
            </button>

            {/* Filter Popup Menu */}
            {showFilterMenu && (
              <div className="absolute left-0 sm:left-auto right-0 sm:right-0 top-11 sm:top-12 z-40 glass-card !bg-[#131518]/98 p-2 min-w-[160px] max-w-[260px] w-full shadow-2xl border border-white/20 animate-fade-in">
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
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg capitalize transition-colors ${regionFilter === r ? 'bg-[#1DA84A] text-white font-semibold' : 'text-secText hover:bg-white/10'
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

      {/* =========================================================================
          3. DISMISSIBLE ONBOARDING TIP BANNER
         ========================================================================= */}
      {!tipDismissed && (
        <div
          role="region"
          aria-label="Onboarding tip"
          className="flex items-center gap-2 rounded-[18px] bg-[#131518]/94 backdrop-blur-xl border border-[#4ADE80]/45 p-2 pl-4 pr-2 animate-fade-in shadow-lg"
        >
          <span className="flex-1 text-xs sm:text-sm text-white font-normal leading-snug">
            The white dot is you. The colored bar is the brand's size range.
          </span>
          <button
            onClick={onDismissTip}
            className="circle-btn btn-press !w-8 !h-8 !min-w-[32px] !min-h-[32px] !text-base !bg-white/10 hover:!bg-white/20 text-white flex-none"
            aria-label="Dismiss tip"
          >
            ×
          </button>
        </div>
      )}

      {/* =========================================================================
          4. MATCH LEVELS COMPACT HELPER (Dark glass card for guaranteed contrast)
         ========================================================================= */}
      <div className="flex flex-col gap-2 w-full">
        <div className="glass-card border border-white/10 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-secText shadow-md">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <span className="text-white font-semibold">Match levels:</span>
            <span className="inline-flex items-center gap-1 text-[#4ADE80] font-semibold">
              <CheckIcon size={13} /> Great
            </span>
            <span className="text-white/25">·</span>
            <span className="inline-flex items-center gap-1 text-[#FBBF24] font-semibold">
              <WarningTriangleIcon size={13} /> Between
            </span>
            <span className="text-white/25">·</span>
            <span className="inline-flex items-center gap-1 text-[#F87171] font-semibold">
              <CrossCircleIcon size={13} /> Poor
            </span>
          </div>
          <button
            onClick={() => setShowMatchLevels(!showMatchLevels)}
            className="text-xs text-[#4ADE80] hover:text-white font-semibold transition-colors underline cursor-pointer py-0.5 ml-auto"
            aria-label={showMatchLevels ? 'Hide match levels guide' : 'Show match levels guide'}
          >
            {showMatchLevels ? 'Hide' : 'How it works'}
          </button>
        </div>

        {showMatchLevels && (
          <div className="glass-card p-4 flex flex-col gap-3 w-full animate-fade-in border border-white/10 rounded-2xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <span className="text-[#4ADE80] font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5">
                  <CheckIcon size={14} /> Great match
                </span>
                <div className="text-secText text-xs mt-0.5 leading-snug">
                  Your body measurement sits inside the size range.
                </div>
              </div>
              <div>
                <span className="text-[#FBBF24] font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5">
                  <WarningTriangleIcon size={14} /> Between sizes
                </span>
                <div className="text-secText text-xs mt-0.5 leading-snug">
                  You fall between two adjacent sizes. Suggested by fit preference.
                </div>
              </div>
              <div>
                <span className="text-[#F87171] font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5">
                  <CrossCircleIcon size={14} /> Poor match
                </span>
                <div className="text-secText text-xs mt-0.5 leading-snug">
                  No size is close. The brand cuts may not fit your proportions well.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ACTIVE STICKY COMPARISON TRAY (TOP DOCKED)
          - Positioned prominently at top of content, never obscuring bottom
          - Sticks gracefully when scrolling down through brand cards
         ========================================================================= */}
      {comparedBrandIds.length > 0 && (
        <aside
          role="region"
          aria-label="Brand comparison bar"
          className="sticky top-2 sm:top-4 z-30 w-full glass-card border border-[#4ADE80]/40 p-3 sm:p-3.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 animate-fade-in"
        >
          {/* Left: Indicator & Selected Brand Chips */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar min-w-0 py-0.5">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white whitespace-nowrap bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
              <span>⚖️</span>
              <span>Compare ({comparedBrandIds.length}/3)</span>
            </span>

            <div className="flex items-center gap-2 flex-nowrap">
              {comparedMatches.map((m) => (
                <span
                  key={m.brandChart.id}
                  className="inline-flex items-center gap-1.5 text-xs bg-white/[0.08] text-white px-3 py-1 rounded-full whitespace-nowrap border border-white/15 group shadow-sm"
                >
                  <strong className="font-semibold">{m.brandChart.brand}</strong>
                  <span className="text-[#4ADE80] font-bold text-[11px] bg-[#1DA84A]/25 px-1.5 py-0.5 rounded border border-[#4ADE80]/30">
                    {m.recommendedSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setComparedBrandIds((prev) => prev.filter((id) => id !== m.brandChart.id))}
                    className="text-secText hover:text-red-400 ml-1 p-0.5 text-sm leading-none transition-colors"
                    aria-label={`Remove ${m.brandChart.brand}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              {comparedBrandIds.length < 3 && (
                <span className="hidden md:inline-flex text-xs text-secText/70 italic px-1 whitespace-nowrap">
                  + pick {comparedBrandIds.length === 1 ? 'another brand' : '1 more'} below
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-none justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setShowComparisonModal(true)}
              disabled={comparedBrandIds.length < 2}
              className="primary-btn btn-press !min-h-[40px] !px-5 text-xs sm:text-sm font-bold flex-1 sm:flex-none justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(29,168,74,0.35)]"
            >
              {comparedBrandIds.length < 2 ? 'Pick 1 more brand' : 'Compare side-by-side →'}
            </button>
            <button
              type="button"
              onClick={() => setComparedBrandIds([])}
              className="pill-btn btn-press !min-h-[40px] !px-3 text-xs text-secText hover:text-white border-white/15 flex-none"
              aria-label="Clear all compared brands"
            >
              Clear
            </button>
          </div>
        </aside>
      )}

      {/* =========================================================================
          5. BRAND CARDS GRID
          - Desktop (lg:): Exactly 3 COLUMNS as shown in user's design image
          - Tablet (md:): 2 columns
          - Mobile (<md:): 1 column
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {displayedResults.length > 0 ? (
          displayedResults.map((match) => (
            <BrandCard
              key={match.brandChart.id}
              matchResult={match}
              measurements={measurements}
              isSaved={savedBrandIds.includes(match.brandChart.id)}
              onToggleSave={onToggleSave}
              onOpenDetail={onOpenDetail}
              isComparing={comparedBrandIds.includes(match.brandChart.id)}
              onToggleCompare={handleToggleCompare}
            />
          ))
        ) : showSavedOnly ? (
          /* Empty Saved Brands State */
          <div className="col-span-full glass-card p-8 sm:p-10 flex flex-col items-center text-center gap-3 animate-fade-in border border-white/15">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-red-400 mb-1">
              <HeartIcon size={32} filled={false} />
            </div>
            <h2 className="font-barlow text-2xl sm:text-3xl font-semibold text-white">
              No saved brands yet
            </h2>
            <p className="text-secText text-sm sm:text-[15px] leading-relaxed max-w-sm">
              Tap the heart icon on any brand card to save your favorite brands for quick reference anytime.
            </p>
            <button
              type="button"
              onClick={() => setShowSavedOnly(false)}
              className="primary-btn btn-press !min-h-[44px] !px-6 text-sm font-semibold mt-2"
            >
              Browse all brands
            </button>
          </div>
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

      {/* Brand Comparison Modal */}
      <BrandComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        matches={comparedMatches}
        measurements={measurements}
        onRemoveBrand={(id) => setComparedBrandIds((prev) => prev.filter((item) => item !== id))}
        onOpenDetail={onOpenDetail}
      />

      {/* Export & Share Modal */}
      <ExportShareModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        measurements={measurements}
        results={results}
      />

      {/* Pagination / Load More Controls */}
      {filteredResults.length > visibleCount && (
        <div className="flex flex-col items-center justify-center gap-3 py-4 sm:py-6 animate-fade-in">
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1DA84A] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (displayedResults.length / filteredResults.length) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-secText font-medium whitespace-nowrap">
              {displayedResults.length} of {filteredResults.length} brands
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(filteredResults.length, prev + PAGE_SIZE))}
              className="primary-btn btn-press !min-h-[44px] !px-6 text-xs sm:text-sm font-bold"
            >
              Load more brands (+{Math.min(PAGE_SIZE, filteredResults.length - visibleCount)})
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(filteredResults.length)}
              className="pill-btn btn-press !min-h-[44px] !px-4 text-xs sm:text-sm font-medium hover:border-white/30"
            >
              Show all ({filteredResults.length})
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. FOOTER DISCLAIMER
         ========================================================================= */}
      <footer className="text-center text-xs text-[#A1A1AA] pt-4 pb-2">
        Sample data for portfolio demonstration only · Not official brand charts.
      </footer>
    </div>
  );
};
