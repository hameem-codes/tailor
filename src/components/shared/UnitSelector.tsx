import React from 'react';
import { UnitSystem } from '../../types';
import { SlidingTabs } from '../SlidingTabs';

interface UnitSelectorProps {
  value: UnitSystem;
  onChange: (u: UnitSystem) => void;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const UNIT_OPTIONS = [
  { id: 'metric' as const, label: 'cm · kg' },
  { id: 'imperial' as const, label: 'in · lb' },
];

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  value,
  onChange,
  className = '',
  buttonClassName = '',
  disabled = false,
  ariaLabel = 'Unit of measurement',
}) => {
  return (
    <div className={`flex gap-1.5 ${className}`} role="radiogroup" aria-label={ariaLabel}>
      <SlidingTabs<'metric' | 'imperial'>
        ariaLabel={ariaLabel}
        className={`flex gap-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        buttonClassName={`!min-h-[38px] !px-3 text-xs sm:text-sm ${buttonClassName}`}
        value={value}
        onChange={(u) => !disabled && onChange(u)}
        options={UNIT_OPTIONS}
      />
    </div>
  );
};
