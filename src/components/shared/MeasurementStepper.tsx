import React from 'react';
import {
  cmToInches,
  inchesToCm,
  kgToLbs,
  lbsToKg,
} from '../../lib/matching/helpers';

interface MeasurementStepperProps {
  label: string;
  value: number;
  unit: UnitSystem;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  errorId?: string;
  errorMessage?: string;
  isValid: boolean;
  className?: string;
  inputClassName?: string;
}

type UnitSystem = 'metric' | 'imperial';

export const MeasurementStepper: React.FC<MeasurementStepperProps> = ({
  label,
  value,
  unit,
  onChange,
  step,
  min,
  max,
  errorId,
  isValid,
  className = '',
  inputClassName = '',
}) => {
  const isImperial = unit === 'imperial';
  const displayValue = isImperial
    ? label === 'Height'
      ? cmToInches(value)
      : kgToLbs(value)
    : Math.round(value);

  const handleInput = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return;
    const converted = isImperial
      ? label === 'Height'
        ? inchesToCm(val)
        : lbsToKg(val)
      : val;
    onChange(Math.max(min, Math.min(max, converted)));
  };

  const stepValue = (delta: number) => {
    const stepConverted = isImperial
      ? label === 'Height'
        ? delta * 2.54
        : delta * 0.453592
      : delta;
    const newValue = Math.max(min, Math.min(max, value + stepConverted));
    onChange(Math.round(newValue * 10) / 10);
  };

  const unitLabel = isImperial
    ? label === 'Height'
      ? 'in'
      : 'lb'
    : label === 'Height'
      ? 'cm'
      : 'kg';

  return (
    <div className={`field-container flex items-center justify-between ${!isValid ? 'field-container-error' : ''} ${className}`}>
      <label
        htmlFor={errorId || label.toLowerCase().replace(' ', '-') + '-input'}
        className="font-semibold text-base text-white"
      >
        {label}
      </label>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => stepValue(-step)}
          className="circle-btn btn-press"
          aria-label={`Decrease ${label}`}
          disabled={!isValid}
        >
          −
        </button>
        <input
          id={errorId || label.toLowerCase().replace(' ', '-') + '-input'}
          type="number"
          inputMode="decimal"
          value={displayValue}
          onChange={(e) => handleInput(e.target.value)}
          aria-invalid={!isValid}
          aria-describedby={!isValid ? errorId : undefined}
          className={`number-input text-white ${inputClassName}`}
        />
        <span className="text-secText w-7 text-sm sm:text-base font-medium">
          {unitLabel}
        </span>
        <button
          type="button"
          onClick={() => stepValue(step)}
          className="circle-btn btn-press"
          aria-label={`Increase ${label}`}
          disabled={!isValid}
        >
          +
        </button>
      </div>
    </div>
  );
};
