import React, { useState, useEffect, useMemo } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
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
  hasStoredMeasurements,
  loadSavedBrands,
  toggleSavedBrand,
  isTipDismissed,
  setTipDismissed,
} from './lib/storage';
import { getInitialBrands, fetchBrandSizes } from './lib/data';
import { matchAllBrands, matchBrand } from './lib/matching/engine';
import { TopNavbar } from './components/TopNavbar';
import { InputScreen } from './components/InputScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { BrandDetail } from './components/BrandDetail';
import { AboutScreen } from './components/AboutScreen';
import { HowToMeasureModal } from './components/HowToMeasureModal';
import { HangerIcon } from './components/Icons';

// Route wrapper: Screen 1 (Input)
const InputScreenRoute: React.FC<{
  measurements: UserMeasurements;
  onMeasurementsChange: (m: UserMeasurements) => void;
  onOpenAbout: () => void;
  onOpenHowToMeasure: () => void;
}> = ({ measurements, onMeasurementsChange, onOpenAbout, onOpenHowToMeasure }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectReason = (location.state as any)?.redirectReason;

  const handleSubmit = () => {
    try {
      sessionStorage.setItem('tailor_searched', 'true');
    } catch (e) {
      // storage quota / privacy mode
    }
    saveStoredMeasurements(measurements);
    navigate('/loading');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {redirectReason && (
        <div role="status" className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-2">
          <div className="max-w-[540px] ml-auto rounded-[18px] bg-amber-500/15 border border-amber-500/40 p-3.5 text-amber-200 text-sm flex items-center justify-between animate-fade-in">
            <span>{redirectReason}</span>
          </div>
        </div>
      )}
      <InputScreen
        measurements={measurements}
        onMeasurementsChange={onMeasurementsChange}
        onSubmit={handleSubmit}
        onOpenAbout={onOpenAbout}
        onOpenHowToMeasure={onOpenHowToMeasure}
      />
    </div>
  );
};

// Route wrapper: Screen 2 (Loading)
const LoadingScreenRoute: React.FC<{
  measurements: UserMeasurements;
  brandCount: number;
}> = ({ measurements, brandCount }) => {
  const navigate = useNavigate();
  return (
    <LoadingScreen
      measurements={measurements}
      brandCount={brandCount}
      onCancel={() => navigate('/')}
      onFinished={() => navigate('/results')}
    />
  );
};

// Route wrapper: Screen 3 (Results)
const ResultsScreenRoute: React.FC<{
  results: BrandMatchResult[];
  measurements: UserMeasurements;
  savedBrandIds: string[];
  tipDismissed: boolean;
  onDismissTip: () => void;
  onToggleSave: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  regionFilter: RegionFilter;
  setRegionFilter: (r: RegionFilter) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
}> = (props) => {
  const navigate = useNavigate();

  // Restore scroll position when returning from Brand Detail
  useEffect(() => {
    try {
      const savedY = sessionStorage.getItem('tailor_results_scroll');
      if (savedY) {
        window.scrollTo({ top: parseInt(savedY, 10), behavior: 'instant' as ScrollBehavior });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Check if measurements are valid; if cleared or missing, redirect to Input with friendly message
  let searchedInSession = false;
  try {
    searchedInSession = sessionStorage.getItem('tailor_searched') === 'true';
  } catch (e) {
    searchedInSession = false;
  }

  if (!hasStoredMeasurements() && !searchedInSession) {
    return (
      <Navigate
        to="/"
        replace
        state={{ redirectReason: 'Please enter your measurements to view size recommendations.' }}
      />
    );
  }

  const handleOpenDetail = (match: BrandMatchResult) => {
    try {
      sessionStorage.setItem('tailor_results_scroll', window.scrollY.toString());
    } catch (e) {
      // ignore
    }
    navigate(`/brand/${match.brandChart.id}`);
  };

  const handleEditMeasurements = () => {
    try {
      sessionStorage.removeItem('tailor_results_scroll');
    } catch (e) {
      // ignore
    }
    navigate('/');
  };

  return (
    <ResultsScreen
      {...props}
      onOpenDetail={handleOpenDetail}
      onEditMeasurements={handleEditMeasurements}
    />
  );
};

// Route wrapper: Screen 4 (Brand Detail)
const BrandDetailRoute: React.FC<{
  brands: BrandChart[];
  measurements: UserMeasurements;
}> = ({ brands, measurements }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const brandChart = brands.find((b) => b.id === id);

  if (!brandChart) {
    return (
      <div className="w-full max-w-[560px] mx-auto min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center page-transition">
        <div className="glass-card p-8 flex flex-col items-center text-center gap-3 border border-white/12 w-full max-w-md shadow-2xl">
          <HangerIcon size={48} className="text-[#D6D6DC] my-1" />
          <h2 className="font-barlow text-3xl sm:text-4xl font-semibold text-white">
            Brand not found
          </h2>
          <p className="text-secText text-sm sm:text-base leading-relaxed mb-2">
            We couldn't locate this brand's size guide or it might have been removed.
          </p>
          <button
            onClick={() => navigate('/results')}
            className="primary-btn btn-press w-full !min-h-[48px] text-base font-semibold"
          >
            Back to results
          </button>
        </div>
      </div>
    );
  }

  const match = matchBrand(brandChart, measurements);
  return (
    <BrandDetail
      matchResult={match}
      measurements={measurements}
      onBack={() => navigate('/results')}
    />
  );
};

export const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMeasureModal, setShowMeasureModal] = useState(false);

  // Global & Persistent State
  const [measurements, setMeasurements] = useState<UserMeasurements>(loadStoredMeasurements);
  const [brands, setBrands] = useState<BrandChart[]>(getInitialBrands);
  const [savedBrandIds, setSavedBrandIds] = useState<string[]>(loadSavedBrands);
  const [tipDismissed, setTipDismissedState] = useState<boolean>(isTipDismissed);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('match');

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

  // Compute matches
  const matchResults = useMemo(() => {
    return matchAllBrands(brands, measurements, searchQuery, regionFilter, sortBy);
  }, [brands, measurements, searchQuery, regionFilter, sortBy]);

  // Stepper state
  const currentStep: 1 | 2 | 3 = location.pathname.startsWith('/brand/')
    ? 3
    : location.pathname === '/results' || location.pathname === '/loading'
    ? 2
    : 1;

  let searchedInSession = false;
  try {
    searchedInSession = sessionStorage.getItem('tailor_searched') === 'true';
  } catch (e) {
    searchedInSession = false;
  }
  const canGoToResults = hasStoredMeasurements() || searchedInSession;

  return (
    <div className="min-h-screen text-white relative w-full overflow-x-hidden flex flex-col">
      {/* Universal Desktop & Responsive Top Navbar matching design export */}
      {location.pathname !== '/loading' && (
        <TopNavbar
          currentStep={currentStep}
          canGoToResults={canGoToResults}
          onOpenHowToMeasure={() => setShowMeasureModal(true)}
          onOpenAbout={() => navigate('/about')}
        />
      )}

      {/* Global How to Measure Modal accessible from anywhere */}
      <HowToMeasureModal
        isOpen={showMeasureModal}
        onClose={() => setShowMeasureModal(false)}
        showHips={measurements.category === 'pants'}
      />

      <main className="flex-1 w-full">
        <Routes>
          <Route
            path="/"
            element={
              <InputScreenRoute
                measurements={measurements}
                onMeasurementsChange={handleMeasurementsChange}
                onOpenAbout={() => navigate('/about')}
                onOpenHowToMeasure={() => setShowMeasureModal(true)}
              />
            }
          />
          <Route
            path="/loading"
            element={
              <LoadingScreenRoute
                measurements={measurements}
                brandCount={matchResults.length}
              />
            }
          />
          <Route
            path="/results"
            element={
              <ResultsScreenRoute
                results={matchResults}
                measurements={measurements}
                savedBrandIds={savedBrandIds}
                tipDismissed={tipDismissed}
                onDismissTip={handleDismissTip}
                onToggleSave={handleToggleSave}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                regionFilter={regionFilter}
                setRegionFilter={setRegionFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            }
          />
          <Route
            path="/brand/:id"
            element={
              <BrandDetailRoute
                brands={brands}
                measurements={measurements}
              />
            }
          />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
