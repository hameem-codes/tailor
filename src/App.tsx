import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UserMeasurements,
  BrandChart,
  BrandMatchResult,
  RegionFilter,
  SortOption,
} from './types';
import {
  loadStoredMeasurements,
  saveStoredMeasurements,
  loadSavedBrands,
  toggleSavedBrand,
  isTipDismissed,
  setTipDismissed,
  isOnboardingSeen,
  setOnboardingSeen,
} from './lib/storage';
import { getInitialBrands, fetchBrandSizes } from './lib/data';
import { matchAllBrands } from './lib/matching/engine';
import { InputScreen } from './components/InputScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { BrandDetail } from './components/BrandDetail';
import { HowToMeasureModal } from './components/HowToMeasureModal';
import { AboutModal } from './components/AboutModal';

type AppScreen = 'input' | 'loading' | 'results' | 'detail';

export const App: React.FC = () => {
  // Global & Persistent State
  const [measurements, setMeasurements] = useState<UserMeasurements>(loadStoredMeasurements);
  const [brands, setBrands] = useState<BrandChart[]>(getInitialBrands);
  const [savedBrandIds, setSavedBrandIds] = useState<string[]>(loadSavedBrands);
  const [tipDismissed, setTipDismissedState] = useState<boolean>(isTipDismissed);
  const [onboardingBanner, setOnboardingBanner] = useState<boolean>(!isOnboardingSeen());

  // Screen & Navigation
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('input');
  const [selectedBrandMatch, setSelectedBrandMatch] = useState<BrandMatchResult | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('match');

  // Modals
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMeasureModal, setShowMeasureModal] = useState(false);

  // Responsive Layout detection (desktop 1200px+)
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 1200 : false
  );

  const loadingTimerRef = useRef<number | null>(null);

  // Handle window resizing for responsive layouts
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1200);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch updated brand data if available
  useEffect(() => {
    fetchBrandSizes().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setBrands(loaded);
      }
    });
  }, []);

  // Sync measurements to localStorage
  const handleMeasurementsChange = (newMeasurements: UserMeasurements) => {
    setMeasurements(newMeasurements);
    saveStoredMeasurements(newMeasurements);
  };

  // Toggle favorite brand
  const handleToggleSave = (brandId: string) => {
    const updated = toggleSavedBrand(brandId);
    setSavedBrandIds(updated);
  };

  // Dismiss tip
  const handleDismissTip = () => {
    setTipDismissedState(true);
    setTipDismissed(true);
  };

  const handleDismissOnboarding = () => {
    setOnboardingBanner(false);
    setOnboardingSeen(true);
  };

  // Matching calculation
  const matchResults = useMemo(() => {
    return matchAllBrands(brands, measurements, searchQuery, regionFilter, sortBy);
  }, [brands, measurements, searchQuery, regionFilter, sortBy]);

  // Handle "Find my size" submission
  const handleSubmit = () => {
    setCurrentScreen('loading');
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

    // Brief simulation (750ms) as specified in PRD
    loadingTimerRef.current = window.setTimeout(() => {
      setCurrentScreen('results');
    }, 750);
  };

  const handleCancelLoading = () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    setCurrentScreen('input');
  };

  const handleOpenDetail = (match: BrandMatchResult) => {
    setSelectedBrandMatch(match);
    if (!isDesktop) {
      setCurrentScreen('detail');
    }
  };

  const handleCloseDetail = () => {
    setSelectedBrandMatch(null);
    if (currentScreen === 'detail') {
      setCurrentScreen('results');
    }
  };

  // Selected brand result on desktop (if currently selected brand exists in results, use updated match)
  const activeDetailMatch = useMemo(() => {
    if (!selectedBrandMatch) return null;
    return matchResults.find(m => m.brandChart.id === selectedBrandMatch.brandChart.id) || selectedBrandMatch;
  }, [selectedBrandMatch, matchResults]);

  return (
    <div className="min-h-screen text-white relative flex flex-col items-center">
      {/* Onboarding hint banner for first-time visitors */}
      {onboardingBanner && (
        <div
          role="status"
          className="w-full bg-[#1DA84A] text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-lg z-30"
        >
          <div className="flex-1 text-center">
            👋 Welcome to <strong>Tailor</strong>. Enter your measurements once to discover your exact size across every clothing brand!
          </div>
          <button
            onClick={handleDismissOnboarding}
            className="text-white hover:opacity-80 px-2 py-0.5 text-lg font-bold"
            aria-label="Dismiss welcome banner"
          >
            ×
          </button>
        </div>
      )}

      {/* DESKTOP LAYOUT (1200px+) */}
      {isDesktop ? (
        <main className="w-full max-w-[1440px] px-8 py-8 flex items-start gap-8 min-h-screen justify-center">
          {/* Left Column: Sticky Input Panel (approx 400px) */}
          <aside className="w-[400px] flex-none sticky top-8 max-h-[calc(100vh-64px)] overflow-y-auto pr-2 pb-6">
            <InputScreen
              measurements={measurements}
              onMeasurementsChange={handleMeasurementsChange}
              onSubmit={handleSubmit}
              onOpenAbout={() => setShowAboutModal(true)}
              onOpenHowToMeasure={() => setShowMeasureModal(true)}
            />
          </aside>

          {/* Middle Column: Results List (approx 560px) */}
          <section className="w-[560px] flex-none min-h-[80vh]">
            {currentScreen === 'loading' ? (
              <LoadingScreen
                measurements={measurements}
                brandCount={matchResults.length}
                onCancel={handleCancelLoading}
              />
            ) : (
              <ResultsScreen
                results={matchResults}
                measurements={measurements}
                savedBrandIds={savedBrandIds}
                tipDismissed={tipDismissed}
                onDismissTip={handleDismissTip}
                onToggleSave={handleToggleSave}
                onOpenDetail={handleOpenDetail}
                onEditMeasurements={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                regionFilter={regionFilter}
                setRegionFilter={setRegionFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            )}
          </section>

          {/* Right Column / Panel: Brand Detail Drawer (420px) */}
          {activeDetailMatch ? (
            <aside className="w-[420px] flex-none sticky top-8 glass-card border border-white/15 max-h-[calc(100vh-64px)] overflow-hidden animate-fade-in shadow-2xl">
              <BrandDetail
                matchResult={activeDetailMatch}
                measurements={measurements}
                onBack={handleCloseDetail}
                isDrawer={true}
              />
            </aside>
          ) : (
            <div className="w-[420px] flex-none hidden xl:flex flex-col items-center justify-center p-8 text-center text-secText glass-card min-h-[400px] border border-white/5 opacity-60">
              <span className="font-barlow text-2xl font-medium">Select any brand</span>
              <p className="text-sm mt-1">Click "View chart ›" on any brand card to open full size breakdown and interactive specifications.</p>
            </div>
          )}
        </main>
      ) : (
        /* MOBILE & TABLET LAYOUT (< 1200px) */
        <main className="w-full flex justify-center min-h-screen">
          {currentScreen === 'input' && (
            <InputScreen
              measurements={measurements}
              onMeasurementsChange={handleMeasurementsChange}
              onSubmit={handleSubmit}
              onOpenAbout={() => setShowAboutModal(true)}
              onOpenHowToMeasure={() => setShowMeasureModal(true)}
            />
          )}

          {currentScreen === 'loading' && (
            <LoadingScreen
              measurements={measurements}
              brandCount={matchResults.length}
              onCancel={handleCancelLoading}
            />
          )}

          {currentScreen === 'results' && (
            <ResultsScreen
              results={matchResults}
              measurements={measurements}
              savedBrandIds={savedBrandIds}
              tipDismissed={tipDismissed}
              onDismissTip={handleDismissTip}
              onToggleSave={handleToggleSave}
              onOpenDetail={handleOpenDetail}
              onEditMeasurements={() => setCurrentScreen('input')}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              regionFilter={regionFilter}
              setRegionFilter={setRegionFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          )}

          {currentScreen === 'detail' && activeDetailMatch && (
            <BrandDetail
              matchResult={activeDetailMatch}
              measurements={measurements}
              onBack={handleCloseDetail}
              isDrawer={false}
            />
          )}
        </main>
      )}

      {/* Modals */}
      <HowToMeasureModal
        isOpen={showMeasureModal}
        onClose={() => setShowMeasureModal(false)}
        showHips={measurements.category === 'pants'}
      />

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        brandContext={selectedBrandMatch?.brandChart.brand}
        sizeContext={selectedBrandMatch?.recommendedSize}
      />
    </div>
  );
};

export default App;
