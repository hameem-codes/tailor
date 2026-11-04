import React, { useState } from 'react';
import {
  cmToInches,
  inchesToCm,
} from '../../lib/matching/helpers';
import { UserMeasurements } from '../../types';

interface BodyMeasurementsExpandableProps {
  measurements: UserMeasurements;
  onChange: (key: keyof UserMeasurements, value: number | undefined) => void;
  isPants: boolean;
  isImperial: boolean;
  className?: string;
  openByDefault?: boolean;
}

export const BodyMeasurementsExpandable: React.FC<BodyMeasurementsExpandableProps> = ({
  measurements,
  onChange,
  isPants,
  isImperial,
  className = '',
  openByDefault = false,
}) => {
  const [open, setOpen] = useState(openByDefault);

  const displayChest = measurements.chest
    ? isImperial
      ? cmToInches(measurements.chest)
      : Math.round(measurements.chest)
    : '';
  const displayWaist = measurements.waist
    ? isImperial
      ? cmToInches(measurements.waist)
      : Math.round(measurements.waist)
    : '';
  const displayHips = measurements.hips
    ? isImperial
      ? cmToInches(measurements.hips)
      : Math.round(measurements.hips)
    : '';

  const handleNumericInput = (key: 'chest' | 'waist' | 'hips', valStr: string) => {
    if (!valStr) {
      onChange(key, undefined);
      return;
    }
    const val = parseFloat(valStr);
    if (isNaN(val)) return;
    const converted = isImperial ? inchesToCm(val) : val;
    onChange(key, converted);
  };

  const title = isPants ? 'Waist and hips' : 'Chest and waist';

  return (
    <div className={`field-container !p-0 overflow-hidden ${className}`}>
      <div
        onClick={() => setOpen(!open)}
        className="min-h-[56px] flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer select-none"
      >
        <div>
          <span className="font-semibold text-sm sm:text-base text-white block">
            {title}
          </span>
          <span className="text-secText text-xs block">Improves accuracy</span>
        </div>
        <button
          type="button"
          className="pill-btn btn-press !border-[#4ADE80] !text-[#4ADE80] !font-semibold !text-xs sm:!text-sm !min-h-[34px] !px-3"
          aria-expanded={open}
        >
          {open ? 'Hide' : '+ Add'}
        </button>
      </div>

      {open && (
        <div className="flex border-t border-white/15 px-3.5 py-3 gap-3 animate-fade-in">
          {!isPants && (
            <div className="flex-1">
              <label htmlFor="chest-val" className="text-secText text-xs sm:text-sm block mb-1">
                Chest
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  id="chest-val"
                  type="number"
                  inputMode="decimal"
                  value={displayChest}
                  placeholder="96"
                  onChange={(e) => handleNumericInput('chest', e.target.value)}
                  className="number-input !text-left !w-16 text-white !text-2xl"
                />
                <span className="text-secText text-xs">{isImperial ? 'in' : 'cm'}</span>
              </div>
            </div>
          )}

          <div className="flex-1 border-l border-white/15 pl-3">
            <label htmlFor="waist-val" className="text-secText text-xs sm:text-sm block mb-1">
              Waist
            </label>
            <div className="flex items-baseline gap-1">
              <input
                id="waist-val"
                type="number"
                inputMode="decimal"
                value={displayWaist}
                placeholder="82"
                onChange={(e) => handleNumericInput('waist', e.target.value)}
                className="number-input !text-left !w-16 text-white !text-2xl"
              />
              <span className="text-secText text-xs">{isImperial ? 'in' : 'cm'}</span>
            </div>
          </div>

          {isPants && (
            <div className="flex-1 border-l border-white/15 pl-3">
              <label htmlFor="hips-val" className="text-secText text-xs sm:text-sm block mb-1">
                Hips
              </label>
              <div className="flex items-baseline gap-1">
                <input
                  id="hips-val"
                  type="number"
                  inputMode="decimal"
                  value={displayHips}
                  placeholder="96"
                  onChange={(e) => handleNumericInput('hips', e.target.value)}
                  className="number-input !text-left !w-16 text-white !text-2xl"
                />
                <span className="text-secText text-xs">{isImperial ? 'in' : 'cm'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
