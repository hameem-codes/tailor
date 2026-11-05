import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadTablePreferences,
  saveTablePreferences,
  encodeShareData,
  decodeShareData,
  loadMeasurementPresets,
  saveMeasurementPreset,
  deleteMeasurementPreset,
  DEFAULT_MEASUREMENTS,
} from '../storage';
import { UserMeasurements } from '../../types';

// Mock localStorage for node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('storage: table preferences persistence (Issue 15)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default table preferences if none stored', () => {
    const prefs = loadTablePreferences();
    expect(prefs.tableUnit).toBe('metric');
    expect(prefs.tableMeasurementType).toBe('body');
  });

  it('persists and loads updated table preferences across sessions', () => {
    saveTablePreferences({
      tableUnit: 'imperial',
      tableMeasurementType: 'garment',
    });

    const reloaded = loadTablePreferences();
    expect(reloaded.tableUnit).toBe('imperial');
    expect(reloaded.tableMeasurementType).toBe('garment');
  });
});

describe('storage: share URL data encoding and decoding (Issue 14)', () => {
  it('encodes and decodes measurements accurately', () => {
    const sample: UserMeasurements = {
      ...DEFAULT_MEASUREMENTS,
      gender: 'women',
      category: 'shirt',
      height: 168,
      weight: 58,
      chest: 88,
      waist: 68,
      fitPreference: 'snug',
    };

    const encoded = encodeShareData(sample);
    expect(encoded).toBeTruthy();

    const decoded = decodeShareData(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.gender).toBe('women');
    expect(decoded?.category).toBe('shirt');
    expect(decoded?.height).toBe(168);
    expect(decoded?.weight).toBe(58);
    expect(decoded?.fitPreference).toBe('snug');
  });
});

describe('storage: measurement presets (Issue 16)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves, loads, and deletes measurement presets', () => {
    expect(loadMeasurementPresets()).toHaveLength(0);

    const saved = saveMeasurementPreset({
      name: 'Partner',
      measurements: {
        ...DEFAULT_MEASUREMENTS,
        gender: 'women',
        height: 165,
        weight: 55,
      },
    });

    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('Partner');
    expect(saved[0].measurements.height).toBe(165);

    const reloaded = loadMeasurementPresets();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].name).toBe('Partner');

    const updated = deleteMeasurementPreset(reloaded[0].id);
    expect(updated).toHaveLength(0);
    expect(loadMeasurementPresets()).toHaveLength(0);
  });
});

