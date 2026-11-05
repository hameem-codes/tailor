import React from 'react';
import { SizeItem, UnitSystem, ChartType } from '../../types';
import { SlidingTabs, SlidingTabOption } from '../SlidingTabs';
import { formatRange } from '../../lib/matching/helpers';

interface BrandSizeChartTableProps {
  sizes: SizeItem[];
  selectedSizeIdx: number;
  onSelectSize: (idx: number) => void;
  tableUnit: UnitSystem;
  onUnitChange: (u: UnitSystem) => void;
  tableMeasurementType: ChartType;
  onMeasurementTypeChange: (t: ChartType) => void;
  isPants: boolean;
  source: string;
  sourceUrl?: string;
  updated: string;
  className?: string;
}

const tableUnitOptions: SlidingTabOption<UnitSystem>[] = [
  { id: 'metric', label: 'cm' },
  { id: 'imperial', label: 'in' },
];

const measurementTypeOptions: SlidingTabOption<ChartType>[] = [
  { id: 'body', label: 'Body' },
  { id: 'garment', label: 'Garment' },
];

export const BrandSizeChartTable: React.FC<BrandSizeChartTableProps> = ({
  sizes,
  selectedSizeIdx,
  onSelectSize,
  tableUnit,
  onUnitChange,
  tableMeasurementType,
  onMeasurementTypeChange,
  isPants,
  source,
  sourceUrl,
  updated,
  className = '',
}) => {
  return (
    <div className={`glass-card p-4 sm:p-6 flex flex-col gap-3 rounded-[24px] sm:rounded-[28px] shadow-xl ${className}`}>
      {/* Unit & Measurement Type Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="text-secText text-xs sm:text-sm font-medium">Unit</span>
          <SlidingTabs<UnitSystem>
            ariaLabel="Table unit"
            className="flex gap-1"
            buttonClassName="!min-h-[34px] !py-0 !px-3 text-xs sm:text-sm"
            value={tableUnit}
            onChange={onUnitChange}
            options={tableUnitOptions}
          />
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="text-secText text-xs sm:text-sm font-medium">Type</span>
          <SlidingTabs<ChartType>
            ariaLabel="Measurement type"
            className="flex gap-1"
            buttonClassName="!min-h-[34px] !py-0 !px-3 text-xs sm:text-sm"
            value={tableMeasurementType}
            onChange={onMeasurementTypeChange}
            options={measurementTypeOptions}
          />
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto w-full">
        <div className="min-w-[280px]">
          <div className="flex text-secText text-xs sm:text-sm font-semibold px-3 py-1.5 border-b border-white/10 mb-1">
            <span className="w-16 text-center">Size</span>
            <span className="flex-1">{isPants ? 'Waist' : 'Chest'} ({tableUnit === 'imperial' ? 'in' : 'cm'})</span>
            <span className="flex-1">{isPants ? 'Hips' : 'Waist'} ({tableUnit === 'imperial' ? 'in' : 'cm'})</span>
          </div>

          <div className="space-y-1">
            {sizes.map((s, idx) => {
              const isCurrent = idx === selectedSizeIdx;
              const chestR =
                tableMeasurementType === 'garment' && s.garmentChest
                  ? s.garmentChest
                  : s.chest ?? [80, 88];
              const waistR =
                tableMeasurementType === 'garment' && s.garmentWaist
                  ? s.garmentWaist
                  : s.waist ?? [70, 78];

              const col1Range = isPants ? s.waist ?? [70, 78] : chestR;
              const col2Range = isPants ? s.hips ?? [85, 95] : waistR;

              return (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => onSelectSize(idx)}
                  className={`w-full flex items-center px-3 py-2 text-xs sm:text-sm text-left rounded-[14px] transition-all duration-200 cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#1DA84A] to-[#15803d] text-white font-bold shadow-[0_4px_16px_rgba(29,168,74,0.3)] ring-1 ring-[#4ADE80]/50'
                      : 'hover:bg-white/[0.07] text-white/90'
                  }`}
                  aria-selected={isCurrent}
                >
                  <span className="w-16 text-center font-bold">{s.label}</span>
                  <span className="flex-1">
                    {formatRange(col1Range[0], col1Range[1], tableUnit).replace(' cm', '').replace(' in', '')}
                  </span>
                  <span className="flex-1">
                    {formatRange(col2Range[0], col2Range[1], tableUnit).replace(' cm', '').replace(' in', '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Source Citation */}
      <div className="text-xs text-secText pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
        <span>
          Source:{' '}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4ADE80] hover:underline"
            >
              {source}
            </a>
          ) : (
            source
          )}{' '}
          · Updated {updated}
        </span>
      </div>
    </div>
  );
};
