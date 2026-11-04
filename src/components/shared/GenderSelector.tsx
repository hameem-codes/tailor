import React from 'react';
import { Gender } from '../../types';

interface GenderSelectorProps {
  value: Gender;
  onChange: (g: Gender) => void;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({
  value,
  onChange,
  className = '',
  buttonClassName = '',
  disabled = false,
}) => {
  const options: Gender[] = ['men', 'women', 'unisex'];

  return (
    <div
      role="radiogroup"
      aria-label="Gender selection"
      className={`grid grid-cols-3 gap-2 ${className}`}
    >
      {options.map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={value === g}
          onClick={() => !disabled && onChange(g)}
          disabled={disabled}
          className={`pill-btn btn-press w-full text-center capitalize ${buttonClassName} ${
            value === g ? 'pill-active' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {g}
        </button>
      ))}
    </div>
  );
};
