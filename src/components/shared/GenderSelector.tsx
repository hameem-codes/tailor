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

  // WAI-ARIA radiogroup keyboard model: arrow keys move the selection.
  const activeIndex = Math.max(0, options.indexOf(value));
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = (activeIndex + delta + options.length) % options.length;
    onChange(options[next]);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Gender selection"
      className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${className}`}
      onKeyDown={handleKeyDown}
    >
      {options.map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={value === g}
          tabIndex={value === g ? 0 : -1}
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
