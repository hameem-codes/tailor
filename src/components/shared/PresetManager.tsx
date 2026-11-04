import React, { useState, useEffect } from 'react';
import { UserMeasurements } from '../../types';
import {
  MeasurementPreset,
  loadMeasurementPresets,
  saveMeasurementPreset,
  deleteMeasurementPreset,
} from '../../lib/storage';

interface PresetManagerProps {
  measurements: UserMeasurements;
  onLoadPreset: (measurements: UserMeasurements) => void;
  className?: string;
}

const RECENT_SEARCHES_KEY = 'tailor_recent_searches_v1';

export interface RecentSearchItem {
  id: string;
  measurements: UserMeasurements;
  timestamp: string;
  label: string;
}

export function loadRecentSearches(): RecentSearchItem[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveRecentSearch(measurements: UserMeasurements): void {
  try {
    const current = loadRecentSearches();
    const isPants = measurements.category === 'pants';
    const primaryStr = isPants
      ? `${measurements.waist || 80}cm waist`
      : `${measurements.chest || 96}cm chest`;
    const label = `${measurements.gender} ${measurements.category} (${Math.round(measurements.height)}cm, ${primaryStr})`;

    const filtered = current.filter(
      (item) =>
        !(
          item.measurements.gender === measurements.gender &&
          item.measurements.category === measurements.category &&
          Math.round(item.measurements.height) === Math.round(measurements.height) &&
          Math.round(item.measurements.weight) === Math.round(measurements.weight)
        )
    );

    const newItem: RecentSearchItem = {
      id: crypto.randomUUID(),
      measurements,
      timestamp: new Date().toISOString(),
      label,
    };

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([newItem, ...filtered].slice(0, 4)));
  } catch (e) {
    // ignore
  }
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  measurements,
  onLoadPreset,
  className = '',
}) => {
  const [presets, setPresets] = useState<MeasurementPreset[]>(() => loadMeasurementPresets());
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => loadRecentSearches());
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Reload on mount
  useEffect(() => {
    setPresets(loadMeasurementPresets());
    setRecentSearches(loadRecentSearches());
  }, []);

  const handleSavePreset = (nameToSave?: string) => {
    const name = (nameToSave || newPresetName).trim();
    if (!name) return;

    const updated = saveMeasurementPreset({
      name,
      measurements,
    });
    setPresets(updated);
    setNewPresetName('');
    setIsCreating(false);
  };

  const handleDeletePreset = (id: string) => {
    const updated = deleteMeasurementPreset(id);
    setPresets(updated);
  };

  return (
    <div className={`flex flex-col gap-2.5 pb-2 border-b border-white/10 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-semibold text-[#D6D6DC]">
            Saved profiles & presets
          </span>
          {presets.length > 0 && (
            <span className="text-[11px] bg-white/15 px-1.5 py-0.2 rounded-full font-bold text-white">
              {presets.length}
            </span>
          )}
        </div>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="text-xs text-[#4ADE80] hover:underline font-semibold inline-flex items-center gap-1"
          >
            + Save current fit
          </button>
        )}
      </div>

      {/* Preset creation inline box */}
      {isCreating && (
        <div className="p-3 rounded-2xl bg-white/[0.06] border border-[#4ADE80]/40 flex flex-col gap-2 animate-fade-in">
          <div className="text-xs font-medium text-white flex items-center justify-between">
            <span>Name this measurement profile:</span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-secText hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="e.g. Myself, Partner, Dad..."
              autoFocus
              className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-white outline-none focus:border-[#4ADE80]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <button
              type="button"
              onClick={() => handleSavePreset()}
              disabled={!newPresetName.trim()}
              className="pill-btn btn-press !min-h-[34px] !px-3 text-xs font-bold !bg-[#1DA84A] text-white disabled:opacity-50"
            >
              Save
            </button>
          </div>
          {/* Quick template tags */}
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <span className="text-[11px] text-secText">Quick names:</span>
            {['Myself', 'Partner', 'Friend'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSavePreset(tag)}
                className="text-[11px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded-full transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preset Chips */}
      {presets.length > 0 && (
        <div className="flex gap-1.5 flex-wrap items-center">
          {presets.map((p) => {
            const detailStr = `${Math.round(p.measurements.height)}cm / ${Math.round(p.measurements.weight)}kg`;
            return (
              <div
                key={p.id}
                className="inline-flex items-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 transition-all text-xs text-white pl-3 pr-1.5 py-1 gap-1.5 group cursor-pointer"
                onClick={() => onLoadPreset(p.measurements)}
                title={`Load ${p.name}: ${p.measurements.gender} ${p.measurements.category} (${detailStr})`}
              >
                <span className="font-semibold">{p.name}</span>
                <span className="text-secText text-[11px] hidden sm:inline">({detailStr})</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePreset(p.id);
                  }}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-secText hover:text-red-400 hover:bg-white/10 transition-colors ml-0.5"
                  aria-label={`Delete ${p.name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent searches row */}
      {recentSearches.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px] text-secText">
          <span className="font-medium text-white/60">Recent:</span>
          {recentSearches.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onLoadPreset(item.measurements)}
              className="text-secText hover:text-white bg-white/[0.04] hover:bg-white/10 px-2 py-0.5 rounded-lg border border-white/5 transition-colors truncate max-w-[200px]"
              title={`Load search: ${item.label}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
