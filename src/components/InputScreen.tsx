import React, { useState } from 'react';
import { UserMeasurements, Gender, ClothingCategory, UnitSystem, FitPreference } from '../types';
import { HangerIcon, LockIcon, WarningTriangleIcon } from './Icons';
import {
  cmToInches,
  inchesToCm,
  kgToLbs,
  lbsToKg,
  validateHeightWeight
} from '../lib/matching/helpers';

interface InputScreenProps {
  measurements: UserMeasurements;
  onMeasurementsChange: (m: UserMeasurements) => void;
  onSubmit: () => void;
  onOpenAbout: () => void;
  onOpenHowToMeasure: () => void;
}

export const InputScreen: React.FC<InputScreenProps> = ({
  measurements,
  onMeasurementsChange,
  onSubmit,
  onOpenAbout,
  onOpenHowToMeasure,
}) => {
  // "Chest and waist" must be COLLAPSED by default
  const [chestWaistOpen, setChestWaistOpen] = useState(false);

  const isImperial = measurements.unit === 'imperial';
  const isPants = measurements.category === 'pants';

  // Display values converted for imperial/metric
  const displayHeight = isImperial ? cmToInches(measurements.height) : Math.round(measurements.height);
  const displayWeight = isImperial ? kgToLbs(measurements.weight) : Math.round(measurements.weight);
  const displayChest = measurements.chest ? (isImperial ? cmToInches(measurements.chest) : Math.round(measurements.chest)) : '';
  const displayWaist = measurements.waist ? (isImperial ? cmToInches(measurements.waist) : Math.round(measurements.waist)) : '';
  const displayHips = measurements.hips ? (isImperial ? cmToInches(measurements.hips) : Math.round(measurements.hips)) : '';

  // Validation
  const validation = validateHeightWeight(measurements.height, measurements.weight);
  const isFormValid = validation.heightValid && validation.weightValid;

  const updateMeasurement = (key: keyof UserMeasurements, value: any) => {
    onMeasurementsChange({
      ...measurements,
      [key]: value,
    });
  };

  const handleUnitToggle = (newUnit: UnitSystem) => {
    if (newUnit === measurements.unit) return;
    updateMeasurement('unit', newUnit);
  };

  const stepHeight = (delta: number) => {
    const step = isImperial ? delta * 2.54 : delta;
    const newHeight = Math.max(10, Math.min(260, measurements.height + step));
    updateMeasurement('height', Math.round(newHeight * 10) / 10);
  };

  const stepWeight = (delta: number) => {
    const step = isImperial ? delta * 0.453592 : delta;
    const newWeight = Math.max(10, Math.min(300, measurements.weight + step));
    updateMeasurement('weight', Math.round(newWeight * 10) / 10);
  };

  const handleHeightInput = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return;
    const heightCm = isImperial ? inchesToCm(val) : val;
    updateMeasurement('height', heightCm);
  };

  const handleWeightInput = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return;
    const weightKg = isImperial ? lbsToKg(val) : val;
    updateMeasurement('weight', weightKg);
  };

  const handleChestInput = (valStr: string) => {
    if (!valStr) {
      updateMeasurement('chest', undefined);
      return;
    }
    const val = parseFloat(valStr);
    if (isNaN(val)) return;
    const chestCm = isImperial ? inchesToCm(val) : val;
    updateMeasurement('chest', chestCm);
  };

  const handleWaistInput = (valStr: string) => {
    if (!valStr) {
      updateMeasurement('waist', undefined);
      return;
    }
    const val = parseFloat(valStr);
    if (isNaN(val)) return;
    const waistCm = isImperial ? inchesToCm(val) : val;
    updateMeasurement('waist', waistCm);
  };

  const handleHipsInput = (valStr: string) => {
    if (!valStr) {
      updateMeasurement('hips', undefined);
      return;
    }
    const val = parseFloat(valStr);
    if (isNaN(val)) return;
    const hipsCm = isImperial ? inchesToCm(val) : val;
    updateMeasurement('hips', hipsCm);
  };

  const fitDescriptions: Record<FitPreference, string> = {
    snug: 'Snug: form-fitting, less excess fabric.',
    regular: 'Regular: true to size, with room to move.',
    loose: 'Loose: relaxed drape, maximum ease.',
  };

  return (
    <div className="w-full max-w-[520px] mx-auto min-h-screen flex flex-col gap-3.5 px-4 sm:px-6 pt-6 pb-20 page-transition">
      {/* Brand Header & About Action */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <HangerIcon size={26} className="text-white" />
          <span className="font-barlow text-3xl font-semibold text-white tracking-wide">
            Tailor
          </span>
        </div>
        <button
          onClick={onOpenAbout}
          className="circle-btn btn-press text-lg font-serif italic"
          aria-label="About Tailor"
        >
          i
        </button>
      </div>

      {/* Main Heading */}
      <h1 className="font-barlow text-5xl sm:text-[52px] font-semibold text-white mt-1 leading-[1.05]">
        Find your fit.
      </h1>

      {/* "Who and What" Card */}
      <fieldset className="glass-card p-4 sm:p-5 flex flex-col gap-3 border border-white/12">
        <legend className="text-base font-semibold text-[#D6D6DC] px-1">Who and what</legend>

        {/* Gender Segment - ONE row of 3 equal chips */}
        <div
          role="radiogroup"
          aria-label="Gender selection"
          className="grid grid-cols-3 gap-2"
        >
          {(['men', 'women', 'unisex'] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={measurements.gender === g}
              onClick={() => updateMeasurement('gender', g)}
              className={`pill-btn btn-press w-full text-center capitalize ${
                measurements.gender === g ? 'pill-active' : ''
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Category Segment - ONE row of 4 equal chips (no wrap) */}
        <div
          role="radiogroup"
          aria-label="Clothing category selection"
          className="grid grid-cols-4 gap-1.5 sm:gap-2"
        >
          {([
            { id: 't-shirt', label: 'T-shirt' },
            { id: 'shirt', label: 'Shirt' },
            { id: 'pants', label: 'Pants' },
            { id: 'jacket', label: 'Jacket' },
          ] as { id: ClothingCategory; label: string }[]).map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={measurements.category === c.id}
              onClick={() => updateMeasurement('category', c.id)}
              className={`pill-btn btn-press w-full !px-1 sm:!px-3 !text-[13px] sm:!text-sm text-center justify-center truncate ${
                measurements.category === c.id ? 'pill-active' : ''
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Measurements Card */}
      <div className="glass-card p-4 sm:p-5 flex flex-col gap-3.5 border border-white/12">
        {/* How to measure link + Unit switcher */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onOpenHowToMeasure}
            className="text-[#4ADE80] font-semibold text-sm min-h-[44px] inline-flex items-center hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
          >
            How to measure
          </button>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Unit of measurement">
            <button
              type="button"
              role="radio"
              aria-checked={!isImperial}
              onClick={() => handleUnitToggle('metric')}
              className={`pill-btn btn-press !min-h-[38px] !px-3 text-xs sm:text-sm ${
                !isImperial ? 'pill-active' : ''
              }`}
            >
              cm · kg
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={isImperial}
              onClick={() => handleUnitToggle('imperial')}
              className={`pill-btn btn-press !min-h-[38px] !px-3 text-xs sm:text-sm ${
                isImperial ? 'pill-active' : ''
              }`}
            >
              in · lb
            </button>
          </div>
        </div>

        {/* Height Field with Steppers */}
        <div
          className={`field-container flex items-center justify-between ${
            !validation.heightValid ? 'field-container-error' : ''
          }`}
        >
          <label htmlFor="height-input" className="font-semibold text-base text-white">
            Height
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => stepHeight(-1)}
              className="circle-btn btn-press"
              aria-label="Decrease Height"
            >
              −
            </button>
            <input
              id="height-input"
              type="number"
              inputMode="decimal"
              value={displayHeight}
              onChange={(e) => handleHeightInput(e.target.value)}
              aria-invalid={!validation.heightValid}
              aria-describedby={!validation.heightValid ? 'height-error' : undefined}
              className="number-input text-white"
            />
            <span className="text-secText w-7 text-sm sm:text-base font-medium">
              {isImperial ? 'in' : 'cm'}
            </span>
            <button
              type="button"
              onClick={() => stepHeight(1)}
              className="circle-btn btn-press"
              aria-label="Increase Height"
            >
              +
            </button>
          </div>
        </div>

        {/* Height Error Message */}
        {!validation.heightValid && (
          <div
            id="height-error"
            role="alert"
            className="flex items-start gap-2 text-[#FCA5A5] text-xs sm:text-sm leading-snug px-1 animate-fade-in"
          >
            <WarningTriangleIcon size={16} className="flex-none mt-0.5" />
            <span>Height should be between 120 and 230 cm. Check the number and try again.</span>
          </div>
        )}

        {/* Weight Field with Steppers */}
        <div
          className={`field-container flex items-center justify-between ${
            !validation.weightValid ? 'field-container-error' : ''
          }`}
        >
          <label htmlFor="weight-input" className="font-semibold text-base text-white">
            Weight
          </label>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => stepWeight(-1)}
              className="circle-btn btn-press"
              aria-label="Decrease Weight"
            >
              −
            </button>
            <input
              id="weight-input"
              type="number"
              inputMode="decimal"
              value={displayWeight}
              onChange={(e) => handleWeightInput(e.target.value)}
              aria-invalid={!validation.weightValid}
              aria-describedby={!validation.weightValid ? 'weight-error' : undefined}
              className="number-input text-white"
            />
            <span className="text-secText w-7 text-sm sm:text-base font-medium">
              {isImperial ? 'lb' : 'kg'}
            </span>
            <button
              type="button"
              onClick={() => stepWeight(1)}
              className="circle-btn btn-press"
              aria-label="Increase Weight"
            >
              +
            </button>
          </div>
        </div>

        {/* Weight Error Message */}
        {!validation.weightValid && (
          <div
            id="weight-error"
            role="alert"
            className="flex items-start gap-2 text-[#FCA5A5] text-xs sm:text-sm leading-snug px-1 animate-fade-in"
          >
            <WarningTriangleIcon size={16} className="flex-none mt-0.5" />
            <span>Weight should be between 30 and 250 kg. Check the number and try again.</span>
          </div>
        )}

        {/* Expandable Chest & Waist Card - COLLAPSED BY DEFAULT */}
        <div className="field-container !p-0 overflow-hidden">
          <div
            onClick={() => setChestWaistOpen(!chestWaistOpen)}
            className="min-h-[64px] flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer select-none"
          >
            <div>
              <span className="font-semibold text-base text-white block">
                {isPants ? 'Waist and hips' : 'Chest and waist'}
              </span>
              <span className="text-secText text-xs sm:text-sm block mt-0.5">
                Improves accuracy
              </span>
            </div>
            <button
              type="button"
              className="pill-btn btn-press !border-[#4ADE80] !text-[#4ADE80] !font-semibold !text-sm !min-h-[38px] !px-3.5"
              aria-expanded={chestWaistOpen}
            >
              {chestWaistOpen ? 'Hide' : '+ Add'}
            </button>
          </div>

          {chestWaistOpen && (
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
                      onChange={(e) => handleChestInput(e.target.value)}
                      className="number-input !text-left !w-16 text-white"
                    />
                    <span className="text-secText text-sm">{isImperial ? 'in' : 'cm'}</span>
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
                    onChange={(e) => handleWaistInput(e.target.value)}
                    className="number-input !text-left !w-16 text-white"
                  />
                  <span className="text-secText text-sm">{isImperial ? 'in' : 'cm'}</span>
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
                      onChange={(e) => handleHipsInput(e.target.value)}
                      className="number-input !text-left !w-16 text-white"
                    />
                    <span className="text-secText text-sm">{isImperial ? 'in' : 'cm'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preferred Fit - ONE row of 3 equal chips */}
        <div className="space-y-2 mt-1">
          <div className="text-base font-semibold text-white">Preferred fit</div>
          <div
            role="radiogroup"
            aria-label="Preferred fit"
            className="grid grid-cols-3 gap-2"
          >
            {(['snug', 'regular', 'loose'] as FitPreference[]).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={measurements.fitPreference === f}
                onClick={() => updateMeasurement('fitPreference', f)}
                className={`pill-btn btn-press w-full text-center capitalize ${
                  measurements.fitPreference === f ? 'pill-active' : ''
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="text-sm sm:text-[15px] text-[#D6D6DC] leading-snug pt-0.5">
            {fitDescriptions[measurements.fitPreference]}
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onSubmit}
        disabled={!isFormValid}
        aria-disabled={!isFormValid}
        className="primary-btn btn-press w-full mt-1"
      >
        Find my size
      </button>

      {/* Privacy Notice */}
      <div className="flex items-center justify-center gap-1.5 text-[15px] sm:text-base text-secText py-2">
        <LockIcon size={16} className="text-secText flex-none" />
        <span>Your measurements stay on your device.</span>
      </div>
    </div>
  );
};
