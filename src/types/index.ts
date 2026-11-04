export type Gender = 'men' | 'women' | 'unisex';
export type ClothingCategory = 't-shirt' | 'shirt' | 'pants' | 'jacket';
export type UnitSystem = 'metric' | 'imperial';
export type FitPreference = 'snug' | 'regular' | 'loose';
export type MatchStatus = 'great' | 'between' | 'poor';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type RegionFilter = 'all' | 'global' | 'local';
export type SortOption = 'match' | 'brand-asc' | 'size';
export type ChartType = 'body' | 'garment';

export type BrandSize = SizeItem;

export interface SizeItem {
  label: string;
  chest?: [number, number]; // [min, max] in cm
  waist?: [number, number]; // [min, max] in cm
  hips?: [number, number];  // [min, max] in cm
  length?: [number, number];
  garmentChest?: [number, number];
  garmentWaist?: [number, number];
}

export interface BrandChart {
  id: string;
  brand: string;
  region: 'global' | 'local';
  gender: Gender;
  category: ClothingCategory;
  fit: 'regular' | 'slim' | 'relaxed';
  chartType: ChartType;
  unit: 'cm' | 'in';
  source: string;
  sourceUrl: string;
  updated: string;
  brandUrl: string;
  sizes: SizeItem[];
}

export interface UserMeasurements {
  gender: Gender;
  category: ClothingCategory;
  unit: UnitSystem;
  height: number; // in cm (stored in metric, displayed converted)
  weight: number; // in kg (stored in metric, displayed converted)
  chest?: number; // in cm
  waist?: number; // in cm
  hips?: number;  // in cm
  fitPreference: FitPreference;
}

export interface SizeEvaluation {
  size: SizeItem;
  sizeIndex: number;
  score: number; // weighted distance in cm
  chestDist: number;
  waistDist: number;
  hipsDist: number;
  isInside: boolean;
  relativePosition: 'tight' | 'ideal' | 'roomy';
}

export interface BrandMatchResult {
  brandChart: BrandChart;
  recommendedSize: string; // e.g. "M" or "S/M"
  primarySizeIndex: number;
  secondarySizeIndex?: number;
  matchStatus: MatchStatus;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  verdict: string;
  tip: string;
  chestRangeText: string;
  waistRangeText: string;
  overallScore: number;
  sizeEvaluations: SizeEvaluation[];
  // Ruler visualization metrics
  ruler: {
    minScale: number;
    maxScale: number;
    userDotPercent: number;
    primaryBarLeftPercent: number;
    primaryBarWidthPercent: number;
    primaryBarColor: string;
    secondaryBarLeftPercent?: number;
    secondaryBarWidthPercent?: number;
    secondaryBarColor?: string;
  };
}

export interface SavedBrand {
  brandId: string;
  savedAt: string;
}

export interface UserFeedback {
  brandId: string;
  size: string;
  sentiment: 'well' | 'tight' | 'loose';
  timestamp: string;
}

