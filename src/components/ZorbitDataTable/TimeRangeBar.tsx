import React, { useState } from 'react';
import { Check, Infinity } from 'lucide-react';
import type { TimeRangePreset } from '../../types/dataTable';

const DEFAULT_PRESETS: TimeRangePreset[] = [
  { label: '1D', value: '1d', duration_hours: 24 },
  { label: '7D', value: '7d', duration_hours: 168 },
  { label: '30D', value: '30d', duration_hours: 720 },
  { label: 'ALL', value: 'all', duration_hours: null },
];

interface TimeRangeBarProps {
  presets?: TimeRangePreset[];
  active: string;
  onPresetChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onCustomApply: () => void;
}

const TimeRangeBar: React.FC<TimeRangeBarProps> = ({
  presets,
  active,
  onPresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onCustomApply,
}) => {
  const displayPresets = presets && presets.length > 0 ? presets : DEFAULT_PRESETS;
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayPresets.map((preset) => {
        const isActive = active === preset.value;
        return (
          <button
            key={preset.value}
            onClick={() => {
              onPresetChange(preset.value);
              setShowCustom(false);
            }}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {preset.duration_hours === null ? (
              <span className="flex items-center space-x-1">
                <Infinity size={14} />
              </span>
            ) : (
              preset.label
            )}
          </button>
        );
      })}

      <button
        onClick={() => setShowCustom(!showCustom)}
        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
          showCustom
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Custom
      </button>

      {showCustom && (
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="input-field text-sm py-1 w-36"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="input-field text-sm py-1 w-36"
          />
          <button
            onClick={() => {
              onPresetChange('custom');
              onCustomApply();
            }}
            className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
            title="Apply custom range"
          >
            <Check size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeRangeBar;
