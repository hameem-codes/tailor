import { describe, it, expect } from 'vitest';
import { matchBrand, matchAllBrands } from './engine';
import {
  cmToInches,
  inchesToCm,
  kgToLbs,
  lbsToKg,
  estimateMeasurementsFromHeightWeight,
  validateHeightWeight
} from './helpers';
import { BrandChart, UserMeasurements } from '../../types';

const sampleHM: BrandChart = {
  id: 'hm_test',
  brand: 'H&M',
  region: 'global',
  gender: 'men',
  category: 't-shirt',
  fit: 'regular',
  chartType: 'body',
  unit: 'cm',
  source: 'H&M Size Guide',
  sourceUrl: 'https://hm.com',
  updated: 'Nov 2026',
  brandUrl: 'https://hm.com',
  sizes: [
    { label: 'XS', chest: [80, 87], waist: [70, 75] },
    { label: 'S', chest: [88, 95], waist: [76, 81] },
    { label: 'M', chest: [96, 103], waist: [82, 89] },
    { label: 'L', chest: [104, 111], waist: [90, 97] },
    { label: 'XL', chest: [112, 119], waist: [98, 105] },
  ],
};

const sampleZara: BrandChart = {
  id: 'zara_test',
  brand: 'ZARA',
  region: 'global',
  gender: 'men',
  category: 't-shirt',
  fit: 'slim',
  chartType: 'body',
  unit: 'cm',
  source: 'ZARA Guide',
  sourceUrl: 'https://zara.com',
  updated: 'Nov 2026',
  brandUrl: 'https://zara.com',
  sizes: [
    { label: 'S', chest: [92, 99], waist: [78, 85] },
    { label: 'M', chest: [100, 107], waist: [86, 93] },
    { label: 'L', chest: [108, 115], waist: [94, 101] },
  ],
};

const sampleUniqlo: BrandChart = {
  id: 'uniqlo_test',
  brand: 'UNIQLO',
  region: 'global',
  gender: 'men',
  category: 't-shirt',
  fit: 'regular',
  chartType: 'body',
  unit: 'cm',
  source: 'Uniqlo Guide',
  sourceUrl: 'https://uniqlo.com',
  updated: 'Nov 2026',
  brandUrl: 'https://uniqlo.com',
  sizes: [
    { label: 'S', chest: [90, 95], waist: [75, 81] },
    { label: 'M', chest: [97, 104], waist: [82, 89] },
    { label: 'L', chest: [105, 112], waist: [90, 97] },
  ],
};

const sampleGarmentBrand: BrandChart = {
  id: 'garment_test',
  brand: 'COS Garment',
  region: 'global',
  gender: 'men',
  category: 't-shirt',
  fit: 'regular',
  chartType: 'garment',
  unit: 'cm',
  source: 'COS Garment Specs',
  sourceUrl: 'https://cos.com',
  updated: 'Nov 2026',
  brandUrl: 'https://cos.com',
  sizes: [
    { label: 'M', garmentChest: [102, 109], waist: [82, 89] },
  ],
};

describe('Matching Engine', () => {
  const baseUser: UserMeasurements = {
    gender: 'men',
    category: 't-shirt',
    unit: 'metric',
    height: 175,
    weight: 70,
    chest: 96,
    waist: 82,
    fitPreference: 'regular',
  };

  it('correctly matches H&M to size M with great match for chest 96 cm', () => {
    const result = matchBrand(sampleHM, baseUser);
    expect(result.recommendedSize).toBe('M');
    expect(result.matchStatus).toBe('great');
    expect(result.overallScore).toBe(0);
    expect(result.confidence).toBe('high');
    expect(result.tip).toContain('True to size');
  });

  it('correctly matches Zara to size S with great match for chest 96 cm', () => {
    const result = matchBrand(sampleZara, baseUser);
    expect(result.recommendedSize).toBe('S');
    expect(result.matchStatus).toBe('great');
    expect(result.overallScore).toBe(0);
    expect(result.tip).toContain('Runs slim');
  });

  it('detects between sizes for Uniqlo when chest 96 sits in the gap between S (95) and M (97)', () => {
    const result = matchBrand(sampleUniqlo, baseUser);
    expect(result.recommendedSize).toBe('S/M');
    expect(result.matchStatus).toBe('between');
    expect(result.tip).toContain('Take M for regular, S for snug');
  });

  it('handles exact boundary values', () => {
    // Exactly at min boundary of M (96)
    const resultExactMin = matchBrand(sampleHM, { ...baseUser, chest: 96, waist: 82 });
    expect(resultExactMin.recommendedSize).toBe('M');
    expect(resultExactMin.matchStatus).toBe('great');

    // Exactly at max boundary of M (103)
    const resultExactMax = matchBrand(sampleHM, { ...baseUser, chest: 103, waist: 85 });
    expect(resultExactMax.recommendedSize).toBe('M');
    expect(resultExactMax.matchStatus).toBe('great');
  });

  it('evaluates poor match when measurements are far outside chart', () => {
    const hugeUser: UserMeasurements = {
      ...baseUser,
      chest: 140, // Far above XL (119)
      waist: 125,
    };
    const result = matchBrand(sampleHM, hugeUser);
    expect(result.matchStatus).toBe('poor');
    expect(result.overallScore).toBeGreaterThan(4.0);
    expect(result.tip).toContain('Nearest size is');
  });

  it('adjusts size when user chooses Snug vs Loose fit preference near boundary', () => {
    // User is chest 95.8 cm (right at boundary between S: 88-95 and M: 96-103)
    const boundaryUser: UserMeasurements = {
      ...baseUser,
      chest: 95.5,
      waist: 81.5,
      fitPreference: 'snug',
    };
    const snugResult = matchBrand(sampleHM, boundaryUser);
    expect(snugResult.primarySizeIndex).toBe(1); // S (smaller)

    const looseUser: UserMeasurements = {
      ...boundaryUser,
      fitPreference: 'loose',
    };
    const looseResult = matchBrand(sampleHM, looseUser);
    expect(looseResult.primarySizeIndex).toBe(2); // M (larger)
  });

  it('handles missing chest and waist by estimating from height and weight', () => {
    const noMeasurementsUser: UserMeasurements = {
      gender: 'men',
      category: 't-shirt',
      unit: 'metric',
      height: 175,
      weight: 70,
      fitPreference: 'regular',
    };
    const result = matchBrand(sampleHM, noMeasurementsUser);
    expect(result.confidence).toBe('low');
    expect(result.confidenceReason).toContain('Estimated from height and weight');
    expect(result.recommendedSize).toBeDefined();
  });

  it('handles missing waist with chest provided (confidence medium)', () => {
    const chestOnlyUser: UserMeasurements = {
      ...baseUser,
      waist: undefined,
    };
    const result = matchBrand(sampleHM, chestOnlyUser);
    expect(result.confidence).toBe('medium');
    expect(result.confidenceReason).toContain('Based on chest only');
    expect(result.recommendedSize).toBe('M');
  });

  it('applies garment ease allowance for garment-tagged size charts', () => {
    const result = matchBrand(sampleGarmentBrand, baseUser);
    expect(result.recommendedSize).toBe('M');
  });

  it('filters and sorts brands using matchAllBrands', () => {
    const allMatches = matchAllBrands([sampleHM, sampleZara, sampleUniqlo], baseUser, 'Zara', 'all', 'match');
    expect(allMatches.length).toBe(1);
    expect(allMatches[0].brandChart.brand).toBe('ZARA');
  });
});

describe('Unit Conversion and Validation Helpers', () => {
  it('converts inches to cm and cm to inches correctly', () => {
    expect(inchesToCm(10)).toBe(25.4);
    expect(cmToInches(25.4)).toBe(10);
    expect(cmToInches(96)).toBe(37.8);
  });

  it('converts kg to lbs and lbs to kg correctly', () => {
    expect(kgToLbs(70)).toBe(154);
    expect(lbsToKg(154)).toBe(70);
  });

  it('validates height and weight bounds according to PRD', () => {
    expect(validateHeightWeight(175, 70).heightValid).toBe(true);
    expect(validateHeightWeight(20, 70).heightValid).toBe(false);
    expect(validateHeightWeight(175, 20).weightValid).toBe(false);
  });

  it('estimates anthropometric chest, waist, and hips based on height and weight', () => {
    const estMen = estimateMeasurementsFromHeightWeight(175, 70, 'men');
    expect(estMen.chest).toBeGreaterThan(85);
    expect(estMen.chest).toBeLessThan(105);
    expect(estMen.waist).toBeGreaterThan(70);
    expect(estMen.waist).toBeLessThan(95);
  });
});
