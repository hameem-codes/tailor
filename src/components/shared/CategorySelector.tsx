import React from 'react';
import { ClothingCategory } from '../../types';

interface CategorySelectorProps {
  value: ClothingCategory;
  onChange: (c: ClothingCategory) => void;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

const CATEGORY_OPTIONS: { id: ClothingCategory; label: string }[] = [
  { id: 't-shirt', label: 'T-shirt' },
  { id: 'shirt', label: 'Shirt' },
  { id: 'pants', label: 'Pants' },
  { id: 'jacket', label: 'Jacket' },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  className = '',
  buttonClassName = '',
  disabled = false,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Clothing category selection"
      className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 ${className}`}
    >
      {CATEGORY_OPTIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          onClick={() => !disabled && onChange(c.id)}
          disabled={disabled}
          className={`pill-btn btn-press w-full !px-1 sm:!px-3 !text-[13px] sm:!text-sm text-center justify-center truncate ${buttonClassName} ${
            value === c.id ? 'pill-active' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
};
