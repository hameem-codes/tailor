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
    <div className="w-full max-w-[720px] mx-auto min-h-screen flex flex-col gap-4 p-4 sm:p-6 pb-20 page-transition">
      {/* Top Header Navigation */}
      <div className="flex justify-between items-center">
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

      {/* Screen Title & Subtitle */}
      <div>
        <h1 className="font-barlow text-4xl sm:text-[44px] font-semibold text-white tracking-wide">
          Your sizes
        </h1>
        <div className="text-base text-[#D6D6DC] mt-0.5">
          {genderLabel} · {categoryLabel} · {primaryDim} · {results.length} brands
        </div>
      </div>

      {/* Search, Sort, and Filter Controls */}
      <div className="flex gap-2 items-center relative">
        <label className="field-container flex items-center gap-2 px-3.5 py-0 min-h-[44px] flex-1 cursor-text">
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

        <button
          onClick={cycleSort}
          className="pill-btn btn-press flex-none text-xs sm:text-sm font-medium"
          aria-label={`Sort: ${getSortLabel()}. Click to change`}
        >
          {getSortLabel()}
        </button>

        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className={`circle-btn btn-press flex-none ${regionFilter !== 'all' ? '!bg-[#1DA84A]' : ''}`}
          aria-label="Filter by brand region"
          aria-expanded={showFilterMenu}
        >
          <FilterIcon size={20} />
        </button>

        {/* Filter Popup Menu */}
        {showFilterMenu && (
          <div className="absolute right-0 top-12 z-20 glass-card p-2 min-w-[150px] shadow-2xl border border-white/20 animate-fade-in">
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

      {/* Dismissible Tip Banner */}
      {!tipDismissed && (
        <div
          role="region"
          aria-label="Onboarding tip"
          className="flex items-center gap-2 rounded-[18px] bg-[#4ADE80]/15 border border-[#4ADE80]/45 p-1 pl-3.5 pr-1 animate-fade-in"
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

      {/* Brand Cards List: 1 column on mobile/tablet, 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <button
              onClick={onEditMeasurements}
              className="primary-btn btn-press w-full mt-2"
            >
              Edit measurements
            </button>
            <button
              onClick={clearFilters}
              className="pill-btn btn-press w-full"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Match Levels Key Card */}
      <div className="glass-card p-6 flex flex-col gap-4 mt-2">
        <h3 className="font-semibold text-base text-white">Match levels</h3>
        <div>
          <span className="text-[#4ADE80] font-semibold text-base inline-flex items-center gap-1.5">
            <CheckIcon size={16} /> Great match
          </span>
          <div className="text-secText text-sm sm:text-[15px] mt-1">
            Your body measurement sits inside the size range.
          </div>
        </div>
        <div>
          <span className="text-[#FBBF24] font-semibold text-base inline-flex items-center gap-1.5">
            <WarningTriangleIcon size={16} /> Between sizes
          </span>
          <div className="text-secText text-sm sm:text-[15px] mt-1">
            You fall between two adjacent sizes. We suggest one based on your fit preference.
          </div>
        </div>
        <div>
          <span className="text-[#F87171] font-semibold text-base inline-flex items-center gap-1.5">
            <CrossCircleIcon size={16} /> Poor match
          </span>
          <div className="text-secText text-sm sm:text-[15px] mt-1">
            No size is close. The brand cuts may not fit your proportions well.
          </div>
        </div>
      </div>

      {/* Sample Data Disclaimer in Footer */}
      <footer className="text-center text-xs text-[#A1A1AA] pt-4 pb-2">
        Sample data for portfolio demonstration only · Not official brand charts.
      </footer>
    </div>
  );
};
