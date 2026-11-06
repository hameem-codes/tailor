import React, { useCallback, useEffect, useRef } from 'react';
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

  // Hold-to-repeat: a pointer press steps once immediately, then repeats with a
  // short delay and accelerates while held. Keyboard activation keeps using the
  // plain click path (detail === 0).
  const stepRef = useRef(stepValue);
  useEffect(() => {
    stepRef.current = stepValue;
  });
  const delayTimer = useRef<number | null>(null);
  const repeatTimer = useRef<number | null>(null);

  const clearRepeat = useCallback(() => {
    if (delayTimer.current !== null) {
      window.clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
    if (repeatTimer.current !== null) {
      window.clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  useEffect(() => clearRepeat, [clearRepeat]);

  const startRepeat = (delta: number) => {
    clearRepeat();
    stepRef.current(delta);
    delayTimer.current = window.setTimeout(() => {
      let speed = 150;
      repeatTimer.current = window.setInterval(() => {
        stepRef.current(delta);
        if (speed > 50) {
          speed = Math.max(50, speed - 25);
          if (repeatTimer.current !== null) window.clearInterval(repeatTimer.current);
          repeatTimer.current = window.setInterval(() => stepRef.current(delta), speed);
        }
      }, speed);
    }, 400);
  };

  const stopRepeat = () => clearRepeat();

  const handleClick = (delta: number) => (e: React.MouseEvent) => {
    // detail > 0 means a real pointer click, which was already handled by
    // onPointerDown; only keyboard/programmatic activation (detail === 0) lands here.
    if (e.detail !== 0) return;
    stepValue(delta);
  };

  const unitLabel = isImperial
    ? label === 'Height'
      ? 'in'
      : 'lb'
    : label === 'Height'
      ? 'cm'
      : 'kg';

  // The input needs its own id: `errorId` is the id of the error message node,
  // and reusing it put two elements with the same id on the page.
  const inputId = errorId
    ? `${errorId}-input`
    : `${label.toLowerCase().replace(/\s+/g, '-')}-input`;

  return (
    <div
      className={`field-container flex flex-col justify-between !py-2.5 !px-3.5 gap-1.5 overflow-hidden ${
        !isValid ? 'field-container-error' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="font-semibold text-sm sm:text-base text-white select-none"
        >
          {label}
        </label>
      </div>

      {/* Symmetrical stepper control group: [ - ]  [ value unit ]  [ + ] */}
      <div className="flex items-center justify-between w-full pt-0.5">
        <button
          type="button"
          onClick={handleClick(-step)}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            startRepeat(-step);
          }}
          onPointerUp={stopRepeat}
          onPointerCancel={stopRepeat}
          onPointerLeave={stopRepeat}
          onBlur={stopRepeat}
          className="circle-btn btn-press !w-10 !h-10 !min-w-[44px] !min-h-[44px] !text-base !font-bold flex items-center justify-center border border-white/10 hover:border-white/30 active:scale-95 transition-all select-none touch-none"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
        >
          −
        </button>

        <div className="flex items-baseline justify-center">
          <input
            id={inputId}
            type="number"
            inputMode="decimal"
            value={displayValue}
            onChange={(e) => handleInput(e.target.value)}
            aria-invalid={!isValid}
            aria-describedby={!isValid ? errorId : undefined}
            className={`number-input number-input-sm text-white !w-16 !text-2xl sm:!text-[28px] font-barlow font-semibold text-center !p-0 ${inputClassName}`}
          />
          <span className="text-secText text-xs sm:text-sm font-medium ml-1 select-none flex-none">
            {unitLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClick(step)}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            startRepeat(step);
          }}
          onPointerUp={stopRepeat}
          onPointerCancel={stopRepeat}
          onPointerLeave={stopRepeat}
          onBlur={stopRepeat}
          className="circle-btn btn-press !w-10 !h-10 !min-w-[44px] !min-h-[44px] !text-base !font-bold flex items-center justify-center border border-white/10 hover:border-white/30 active:scale-95 transition-all select-none touch-none"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
};
