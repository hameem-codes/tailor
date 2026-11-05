import React from 'react';
import { UserMeasurements, UnitSystem } from '../../types';
import { LockIcon, WarningTriangleIcon } from '../Icons';
import { GenderSelector } from './GenderSelector';
import { CategorySelector } from './CategorySelector';
import { FitSelector } from './FitSelector';
import { UnitSelector } from './UnitSelector';
import { MeasurementStepper } from './MeasurementStepper';
import { BodyMeasurementsExpandable } from './BodyMeasurementsExpandable';
import { PresetManager } from './PresetManager';

interface MeasurementFormProps {
  measurements: UserMeasurements;
  onMeasurementsChange: (m: UserMeasurements) => void;
  onSubmit: () => void;
  onOpenHowToMeasure: () => void;
  isFormValid: boolean;
  validation: {
    heightValid: boolean;
    heightError?: string;
    weightValid: boolean;
    weightError?: string;
  };
  className?: string;
  extraHeaderActions?: React.ReactNode;
}

export const MeasurementForm: React.FC<MeasurementFormProps> = ({
  measurements,
  onMeasurementsChange,
  onSubmit,
  onOpenHowToMeasure,
  isFormValid,
  validation,
  className = '',
  extraHeaderActions,
}) => {
  const isImperial = measurements.unit === 'imperial';
  const isPants = measurements.category === 'pants';

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

  return (
    <div className={`w-full max-w-[540px] glass-card p-5 sm:p-7 flex flex-col gap-4 border border-white/10 rounded-[28px] shadow-2xl ${className}`}>
      {/* Optional Preset / Extra header toolbar */}
      {extraHeaderActions}

      {/* Preset & Recent Profile Manager */}
      <PresetManager
        measurements={measurements}
        onLoadPreset={onMeasurementsChange}
      />

      {/* Section 1: Gender & Category */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-xs sm:text-sm font-semibold text-[#D6D6DC] px-0.5">
          Who and what
        </legend>
        <GenderSelector
          value={measurements.gender}
          onChange={(g) => updateMeasurement('gender', g)}
          buttonClassName="w-full text-center capitalize"
        />
        <CategorySelector
          value={measurements.category}
          onChange={(c) => updateMeasurement('category', c)}
          buttonClassName="w-full !px-1.5 sm:!px-3 !text-xs sm:!text-sm text-center justify-center truncate"
        />
      </fieldset>

      {/* Section 2: Height & Weight Steppers */}
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span className="text-xs sm:text-sm font-semibold text-[#D6D6DC] whitespace-nowrap">
              Your measurements
            </span>
            <button
              type="button"
              onClick={onOpenHowToMeasure}
              className="text-[#4ADE80] font-semibold text-xs sm:text-sm inline-flex items-center hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md whitespace-nowrap"
            >
              How to measure
            </button>
          </div>
          <UnitSelector
            value={measurements.unit}
            onChange={handleUnitToggle}
            buttonClassName="!min-h-[44px] sm:!min-h-[36px] !px-2.5 sm:!px-3.5 text-xs sm:text-sm flex-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MeasurementStepper
            label="Height"
            value={measurements.height}
            unit={measurements.unit}
            onChange={(v) => updateMeasurement('height', v)}
            step={1}
            min={10}
            max={260}
            errorId="form-height-error"
            errorMessage={validation.heightError}
            isValid={validation.heightValid}
          />
          <MeasurementStepper
            label="Weight"
            value={measurements.weight}
            unit={measurements.unit}
            onChange={(v) => updateMeasurement('weight', v)}
            step={1}
            min={10}
            max={300}
            errorId="form-weight-error"
            errorMessage={validation.weightError}
            isValid={validation.weightValid}
          />
        </div>

        {!validation.heightValid && (
          <div
            id="form-height-error"
            role="alert"
            className="flex items-start gap-2 text-[#FCA5A5] text-xs leading-snug px-1 animate-fade-in"
          >
            <WarningTriangleIcon size={14} className="flex-none mt-0.5" />
            <span>
              {validation.heightError ||
                (isImperial
                  ? 'Height should be between 47 and 91 in. Check the number and try again.'
                  : 'Height should be between 120 and 230 cm. Check the number and try again.')}
            </span>
          </div>
        )}
        {!validation.weightValid && (
          <div
            id="form-weight-error"
            role="alert"
            className="flex items-start gap-2 text-[#FCA5A5] text-xs leading-snug px-1 animate-fade-in"
          >
            <WarningTriangleIcon size={14} className="flex-none mt-0.5" />
            <span>
              {validation.weightError ||
                (isImperial
                  ? 'Weight should be between 66 and 550 lb. Check the number and try again.'
                  : 'Weight should be between 30 and 250 kg. Check the number and try again.')}
            </span>
          </div>
        )}

        {/* Section 3: Chest/Waist/Hips Expandable */}
        <BodyMeasurementsExpandable
          measurements={measurements}
          onChange={(key, value) => updateMeasurement(key, value)}
          isPants={isPants}
          isImperial={isImperial}
          openByDefault={false}
        />

        {/* Section 4: Fit Preference */}
        <FitSelector
          value={measurements.fitPreference}
          onChange={(f) => updateMeasurement('fitPreference', f)}
          showDescription={true}
        />
      </div>

      {/* Section 5: Action Button & Privacy Note */}
      <button
        onClick={onSubmit}
        disabled={!isFormValid}
        aria-disabled={!isFormValid}
        className="primary-btn btn-press w-full mt-1 !min-h-[52px] text-base sm:text-lg font-bold"
      >
        Find my size
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-secText py-0.5">
        <LockIcon size={14} className="text-secText flex-none" />
        <span>Your measurements stay on your device.</span>
      </div>
    </div>
  );
};
