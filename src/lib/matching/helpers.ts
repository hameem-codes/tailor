import { UnitSystem, Gender, ClothingCategory } from '../../types';

export const CM_PER_INCH = 2.54;
export const LBS_PER_KG = 2.20462262;

export function cmToInches(cm: number): number {
  return Math.round((cm / CM_PER_INCH) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * CM_PER_INCH * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG);
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs / LBS_PER_KG);
}

export function formatDimension(cm: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${cmToInches(cm)} in`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatRange(minCm: number, maxCm: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${cmToInches(minCm)}–${cmToInches(maxCm)} in`;
  }
  return `${Math.round(minCm)}–${Math.round(maxCm)} cm`;
}

/**
 * Validates height and weight numbers
 */
export function validateHeightWeight(heightCm: number, weightKg: number): {
  heightValid: boolean;
  weightValid: boolean;
  heightError?: string;
  weightError?: string;
} {
  const heightValid = heightCm >= 120 && heightCm <= 230;
  const weightValid = weightKg >= 30 && weightKg <= 250;

  return {
    heightValid,
    weightValid,
    heightError: heightValid ? undefined : 'Height should be between 120 and 230 cm. Check the number and try again.',
    weightError: weightValid ? undefined : 'Weight should be between 30 and 250 kg. Check the number and try again.',
  };
}

/**
 * Standard anthropometric estimation when chest/waist/hips are omitted
 * Uses BMI and anatomical body proportion models
 */
export function estimateMeasurementsFromHeightWeight(
  heightCm: number,
  weightKg: number,
  gender: Gender
): { chest: number; waist: number; hips: number } {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  if (gender === 'women') {
    const chest = Math.round(heightCm * 0.52 + (bmi - 21) * 1.6);
    const waist = Math.round(heightCm * 0.43 + (bmi - 21) * 1.8);
    const hips = Math.round(heightCm * 0.58 + (bmi - 21) * 1.5);
    return { chest, waist, hips };
  } else if (gender === 'men') {
    const chest = Math.round(heightCm * 0.54 + (bmi - 22) * 1.5);
    const waist = Math.round(heightCm * 0.46 + (bmi - 22) * 1.8);
    const hips = Math.round(heightCm * 0.55 + (bmi - 22) * 1.3);
    return { chest, waist, hips };
  } else {
    // Unisex average
    const chest = Math.round(heightCm * 0.53 + (bmi - 21.5) * 1.55);
    const waist = Math.round(heightCm * 0.445 + (bmi - 21.5) * 1.8);
    const hips = Math.round(heightCm * 0.565 + (bmi - 21.5) * 1.4);
    return { chest, waist, hips };
  }
}

/**
 * Standard ease allowance in centimeters for garment measurements
 * When comparing body measurements against a garment-measurement chart
 */
export function getEaseAllowance(category: ClothingCategory, fit: 'regular' | 'slim' | 'relaxed'): { chest: number; waist: number } {
  if (category === 'jacket') {
    if (fit === 'slim') return { chest: 10, waist: 8 };
    if (fit === 'relaxed') return { chest: 16, waist: 14 };
    return { chest: 12, waist: 10 };
  }
  if (category === 't-shirt' || category === 'shirt') {
    if (fit === 'slim') return { chest: 4, waist: 3 };
    if (fit === 'relaxed') return { chest: 10, waist: 8 };
    return { chest: 6, waist: 5 };
  }
  // pants
  if (fit === 'slim') return { chest: 0, waist: 1 };
  if (fit === 'relaxed') return { chest: 0, waist: 4 };
  return { chest: 0, waist: 2 };
}
