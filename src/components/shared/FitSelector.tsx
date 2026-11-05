import React from 'react';
import { FitPreference } from '../../types';
import { SlidingTabs } from '../SlidingTabs';

interface FitSelectorProps {
  value: FitPreference;
  onChange: (f: FitPreference) => void;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  showDescription?: boolean;
}

const FIT_OPTIONS = [
  { id: 'snug' as const, label: 'Snug' },
  { id: 'regular' as const, label: 'Regular' },
  { id: 'loose' as const, label: 'Loose' },
];

const FIT_DESCRIPTIONS: Record<FitPreference, string> = {
  snug: 'Snug: form-fitting, less excess fabric.',
  regular: 'Regular: true to size, with room to move.',
  loose: 'Loose: relaxed drape, maximum ease.',
};

export const FitSelector: React.FC<FitSelectorProps> = ({
  value,
  onChange,
  className = '',
  buttonClassName = '',
  disabled = false,
  showDescription = true,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-base font-semibold text-white">Preferred fit</div>
      <SlidingTabs<FitPreference>
        ariaLabel="Preferred fit"
        className={`overflow-x-auto no-scrollbar flex flex-col gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        buttonClassName={`w-full text-center capitalize ${buttonClassName}`}
        value={value}
        onChange={(f) => !disabled && onChange(f)}
        options={FIT_OPTIONS}
      />
      {showDescription && (
        <div className="text-sm sm:text-[15px] text-[#D6D6DC] leading-snug pt-0.5">
          {FIT_DESCRIPTIONS[value]}
        </div>
      )}
    </div>
  );
};
