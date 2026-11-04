import React, { useState } from 'react';
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
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  measurements,
  onLoadPreset,
}) => {
  const [presets, setPresets] = useState(() => loadMeasurementPresets());
  const [newPresetName, setNewPresetName] = useState('');

  const handleLoadPreset = (preset: { measurements: UserMeasurements }) => {
    onLoadPreset(preset.measurements);
  };

  const handleSavePreset = () => {
    const name = newPresetName.trim();
    if (!name) return;
    const updated = saveMeasurementPreset({
      name,
      measurements,
    });
    setPresets(updated);
    setNewPresetName('');
  };

  const handleDeletePreset = (id: string) => {
    const updated = deleteMeasurementPreset(id);
    setPresets(updated);
  };

  if (presets.length === 0 && !newPresetName) {
    return null;
  }

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-3 border border-white/12">
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-semibold text-[#D6D6DC]">
          Measurement presets
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {presets.map((p: MeasurementPreset) => (
          <button
            key={p.id}
            onClick={() => handleLoadPreset(p)}
            className="pill-btn btn-press text-xs sm:text-sm px-3 py-1.5 truncate max-w-[120px]"
          >
            {p.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePreset(p.id);
              }}
              className="ml-1.5 text-[#FCA5A5] hover:text-white"
              aria-label={`Delete ${p.name} preset`}
            >
              ×
            </button>
          </button>
        ))}

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Save as..."
            className="bg-white/10 border border-white/20 rounded-md px-2.5 py-1.5 text-white text-sm sm:text-base w-24 sm:w-32 focus:outline-none focus:border-[#4ADE80]"
          />
          <button
            onClick={handleSavePreset}
            disabled={!newPresetName.trim()}
            className="pill-btn btn-press text-xs sm:text-sm px-3"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
