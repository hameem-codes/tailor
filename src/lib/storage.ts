import { UserMeasurements, UserFeedback } from '../types';

const MEASUREMENTS_KEY = 'tailor_user_measurements_v1';
const SAVED_BRANDS_KEY = 'tailor_saved_brands_v1';
const TIP_DISMISSED_KEY = 'tailor_tip_dismissed_v1';
const FEEDBACK_KEY = 'tailor_feedback_v1';
const ONBOARDING_SEEN_KEY = 'tailor_onboarding_seen_v1';

export const DEFAULT_MEASUREMENTS: UserMeasurements = {
  gender: 'men',
  category: 't-shirt',
  unit: 'metric',
  height: 175,
  weight: 70,
  chest: 96,
  waist: 82,
  fitPreference: 'regular',
};

export function loadStoredMeasurements(): UserMeasurements {
  try {
    const raw = localStorage.getItem(MEASUREMENTS_KEY);
    if (!raw) return DEFAULT_MEASUREMENTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MEASUREMENTS,
      ...parsed,
    };
  } catch (e) {
    console.warn('[Tailor] Failed to load stored measurements:', e);
    return DEFAULT_MEASUREMENTS;
  }
}

export function saveStoredMeasurements(measurements: UserMeasurements): void {
  try {
    localStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(measurements));
  } catch (e) {
    console.warn('[Tailor] Failed to save measurements to localStorage:', e);
  }
}

export function loadSavedBrands(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_BRANDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[Tailor] Failed to load saved brands:', e);
    return [];
  }
}

export function toggleSavedBrand(brandId: string): string[] {
  try {
    const current = loadSavedBrands();
    const updated = current.includes(brandId)
      ? current.filter(id => id !== brandId)
      : [...current, brandId];
    localStorage.setItem(SAVED_BRANDS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('[Tailor] Failed to toggle saved brand:', e);
    return [];
  }
}

export function isTipDismissed(): boolean {
  try {
    return localStorage.getItem(TIP_DISMISSED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setTipDismissed(dismissed: boolean = true): void {
  try {
    localStorage.setItem(TIP_DISMISSED_KEY, dismissed ? 'true' : 'false');
  } catch (e) {
    console.warn('[Tailor] Failed to save tip dismissed state:', e);
  }
}

export function saveLocalFeedback(feedback: UserFeedback): void {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const list: UserFeedback[] = raw ? JSON.parse(raw) : [];
    list.push(feedback);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[Tailor] Failed to save local feedback:', e);
  }
}

export function isOnboardingSeen(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setOnboardingSeen(seen: boolean = true): void {
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, seen ? 'true' : 'false');
  } catch (e) {
    console.warn('[Tailor] Failed to save onboarding state:', e);
  }
}
