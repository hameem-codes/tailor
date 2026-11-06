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
    // No role here: SlidingTabs already renders the radiogroup, and nesting two
    // groups with the same label was reported as duplicated interactive content.
    <div className={`flex gap-1.5 ${className}`}>
      <SlidingTabs<'metric' | 'imperial'>
        ariaLabel={ariaLabel}
        className={`flex gap-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        buttonClassName={`!px-3 text-xs sm:text-sm ${buttonClassName}`}
        value={value}
        onChange={(u) => !disabled && onChange(u)}
        options={UNIT_OPTIONS}
      />
    </div>
  );
};
