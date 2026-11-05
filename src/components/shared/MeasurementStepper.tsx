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
    <div
      className={`field-container flex flex-col justify-between !py-2.5 !px-3.5 gap-1.5 overflow-hidden ${
        !isValid ? 'field-container-error' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor={errorId || label.toLowerCase().replace(' ', '-') + '-input'}
          className="font-semibold text-sm sm:text-base text-white select-none"
        >
          {label}
        </label>
      </div>

      {/* Symmetrical stepper control group: [ - ]  [ value unit ]  [ + ] */}
      <div className="flex items-center justify-between w-full pt-0.5">
        <button
          type="button"
          onClick={() => stepValue(-step)}
          className="circle-btn circle-btn-sm btn-press !w-8 !h-8 !min-w-[32px] !min-h-[32px] !text-base !font-bold flex items-center justify-center border border-white/10 hover:border-white/30 active:scale-95 transition-all select-none"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
        >
          −
        </button>

        <div className="flex items-baseline justify-center">
          <input
            id={errorId || label.toLowerCase().replace(' ', '-') + '-input'}
            type="number"
            inputMode="decimal"
            value={displayValue}
            onChange={(e) => handleInput(e.target.value)}
            aria-invalid={!isValid}
            aria-describedby={!isValid ? errorId : undefined}
            className={`number-input number-input-sm text-white !w-14 !text-2xl sm:!text-[28px] font-barlow font-semibold text-center !p-0 ${inputClassName}`}
          />
          <span className="text-secText text-xs sm:text-sm font-medium ml-1 select-none flex-none">
            {unitLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => stepValue(step)}
          className="circle-btn circle-btn-sm btn-press !w-8 !h-8 !min-w-[32px] !min-h-[32px] !text-base !font-bold flex items-center justify-center border border-white/10 hover:border-white/30 active:scale-95 transition-all select-none"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
};
