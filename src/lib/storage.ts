import { UserMeasurements, UserFeedback, UnitSystem, ChartType } from '../types';

const MEASUREMENTS_KEY = 'tailor_user_measurements_v1';
const SAVED_BRANDS_KEY = 'tailor_saved_brands_v1';
const TIP_DISMISSED_KEY = 'tailor_tip_dismissed_v1';
const FEEDBACK_KEY = 'tailor_feedback_v1';
const ONBOARDING_SEEN_KEY = 'tailor_onboarding_seen_v1';
const MEASUREMENT_PRESETS_KEY = 'tailor_measurement_presets_v1';
const TABLE_PREFERENCES_KEY = 'tailor_table_preferences_v1';

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

export function hasStoredMeasurements(): boolean {
  try {
    const raw = localStorage.getItem(MEASUREMENTS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && typeof parsed.height === 'number' && parsed.height >= 120);
  } catch (e) {
    return false;
  }
}

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

export interface MeasurementPreset {
  id: string;
  name: string;
  measurements: UserMeasurements;
  createdAt: string;
}

export function loadMeasurementPresets(): MeasurementPreset[] {
  try {
    const raw = localStorage.getItem(MEASUREMENT_PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[Tailor] Failed to load measurement presets:', e);
    return [];
  }
}

export function saveMeasurementPreset(preset: Omit<MeasurementPreset, 'id' | 'createdAt'>): MeasurementPreset[] {
  try {
    const current = loadMeasurementPresets();
    const newPreset: MeasurementPreset = {
      ...preset,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newPreset, ...current].slice(0, 10);
    localStorage.setItem(MEASUREMENT_PRESETS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('[Tailor] Failed to save measurement preset:', e);
    return [];
  }
}

export function deleteMeasurementPreset(id: string): MeasurementPreset[] {
  try {
    const current = loadMeasurementPresets();
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(MEASUREMENT_PRESETS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('[Tailor] Failed to delete measurement preset:', e);
    return [];
  }
}

export interface TablePreferences {
  tableUnit: UnitSystem;
  tableMeasurementType: ChartType;
}

export function loadTablePreferences(): TablePreferences {
  try {
    const raw = localStorage.getItem(TABLE_PREFERENCES_KEY);
    return raw ? JSON.parse(raw) : { tableUnit: 'metric', tableMeasurementType: 'body' };
  } catch (e) {
    console.warn('[Tailor] Failed to load table preferences:', e);
    return { tableUnit: 'metric', tableMeasurementType: 'body' };
  }
}

export function saveTablePreferences(prefs: TablePreferences): void {
  try {
    localStorage.setItem(TABLE_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('[Tailor] Failed to save table preferences:', e);
  }
}

export function encodeShareData(measurements: UserMeasurements): string {
  try {
    const payload = JSON.stringify({
      gender: measurements.gender,
      category: measurements.category,
      unit: measurements.unit,
      height: measurements.height,
      weight: measurements.weight,
      chest: measurements.chest,
      waist: measurements.waist,
      hips: measurements.hips,
      fitPreference: measurements.fitPreference,
    });
    return btoa(payload);
  } catch (e) {
    return '';
  }
}

export function decodeShareData(encoded: string): Partial<UserMeasurements> | null {
  try {
    const payload = JSON.parse(atob(encoded));
    return payload;
  } catch (e) {
    return null;
  }
}

