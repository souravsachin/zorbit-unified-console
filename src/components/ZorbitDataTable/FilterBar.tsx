import React, { useState, useMemo } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { ColumnDef, FilterDef, FilterType, ActiveFilter } from '../../types/dataTable';

// ---------------------------------------------------------------------------
// Auto-detect filter type from column definition
// ---------------------------------------------------------------------------

function detectFilterType(col: ColumnDef): FilterType {
  if (col.enum_values && col.enum_values.length > 0) return 'multiselect';
  switch (col.type) {
    case 'enum':
    case 'badge':
      return 'multiselect';
    case 'number':
    case 'currency':
      return 'range';
    case 'date':
    case 'datetime':
      return 'daterange';
    case 'boolean':
      return 'boolean';
    default:
      return 'search';
  }
}

function buildFilterDefs(columns: ColumnDef[], explicitFilters?: FilterDef[]): FilterDef[] {
  if (explicitFilters && explicitFilters.length > 0) return explicitFilters;

  return columns
    .filter((c) => c.filterable)
    .map((col) => {
      const type = detectFilterType(col);
      const def: FilterDef = {
        column: col.name,
        type,
        label: col.label,
      };
      if (type === 'multiselect' && col.enum_values) {
        def.options = col.enum_values.map((ev) => ({ value: ev.value, label: ev.label }));
      }
      return def;
    });
}

// ---------------------------------------------------------------------------
// Filter Panel
// ---------------------------------------------------------------------------

interface FilterBarProps {
  columns: ColumnDef[];
  filters?: FilterDef[];
  activeFilters: ActiveFilter[];
  onApply: (filters: ActiveFilter[]) => void;
  onRemoveFilter: (column: string) => void;
  onClearAll: () => void;
  data?: Record<string, unknown>[]; // for smart enum detection
}

// ---------------------------------------------------------------------------
// Smart Enum Detection — auto-promote text columns with < 20 distinct values
// ---------------------------------------------------------------------------

function useSmartEnums(
  filterDefs: FilterDef[],
  data: Record<string, unknown>[],
): FilterDef[] {
  return useMemo(() => {
    if (!data || data.length === 0) return filterDefs;
    return filterDefs.map((f) => {
      if (f.type !== 'search' || (f.options && f.options.length > 0)) return f;
      const values = new Set<string>();
      for (const row of data) {
        const v = row[f.column];
        if (v !== null && v !== undefined && v !== '') values.add(String(v));
        if (values.size >= 20) break;
      }
      if (values.size > 0 && values.size < 20) {
        const options = Array.from(values)
          .sort()
          .map((v) => ({ value: v, label: v }));
        return { ...f, type: 'multiselect' as FilterType, options };
      }
      return f;
    });
  }, [filterDefs, data]);
}

// ---------------------------------------------------------------------------
// Individual Filter Renderers
// ---------------------------------------------------------------------------

interface DraftState {
  [column: string]: unknown;
}

function SearchFilter({
  def, draft, setDraft,
}: { def: FilterDef; draft: DraftState; setDraft: (d: DraftState) => void }) {
  return (
    <input
      type="text"
      value={(draft[def.column] as string) || ''}
      onChange={(e) => setDraft({ ...draft, [def.column]: e.target.value })}
      placeholder={def.placeholder || `Search ${def.label || def.column}...`}
      className="input-field text-sm"
    />
  );
}

function MultiselectFilter({
  def, draft, setDraft,
}: { def: FilterDef; draft: DraftState; setDraft: (d: DraftState) => void }) {
  const selected = (draft[def.column] as string[]) || [];
  const options = def.options || [];

  const toggle = (val: string) => {
    const next = selected.includes(val)
      ? selected.filter((v) => v !== val)
      : [...selected, val];
    setDraft({ ...draft, [def.column]: next });
  };

  return (
    <div className="max-h-40 overflow-y-auto space-y-1">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span>{opt.label}</span>
        </label>
      ))}
      {options.length === 0 && (
        <p className="text-xs text-gray-400 px-2 py-1">No options available</p>
      )}
    </div>
  );
}

function RangeFilter({
  def, draft, setDraft,
}: { def: FilterDef; draft: DraftState; setDraft: (d: DraftState) => void }) {
  const val = (draft[def.column] as { min?: string; max?: string; operator?: string }) || {};
  const update = (patch: Partial<typeof val>) =>
    setDraft({ ...draft, [def.column]: { ...val, ...patch } });

  return (
    <div className="space-y-2">
      <select
        value={val.operator || 'between'}
        onChange={(e) => update({ operator: e.target.value })}
        className="input-field text-sm"
      >
        <option value="between">Between</option>
        <option value="eq">=</option>
        <option value="lt">&lt;</option>
        <option value="gt">&gt;</option>
        <option value="lte">&lt;=</option>
        <option value="gte">&gt;=</option>
      </select>
      <div className="flex space-x-2">
        <input
          type="number"
          placeholder="Min"
          value={val.min || ''}
          onChange={(e) => update({ min: e.target.value })}
          className="input-field text-sm flex-1"
        />
        {(val.operator || 'between') === 'between' && (
          <input
            type="number"
            placeholder="Max"
            value={val.max || ''}
            onChange={(e) => update({ max: e.target.value })}
            className="input-field text-sm flex-1"
          />
        )}
      </div>
    </div>
  );
}

function DateRangeFilter({
  def, draft, setDraft,
}: { def: FilterDef; draft: DraftState; setDraft: (d: DraftState) => void }) {
  const val = (draft[def.column] as { from?: string; to?: string }) || {};
  const update = (patch: Partial<typeof val>) =>
    setDraft({ ...draft, [def.column]: { ...val, ...patch } });

  return (
    <div className="flex space-x-2">
      <input
        type="date"
        value={val.from || ''}
        onChange={(e) => update({ from: e.target.value })}
        className="input-field text-sm flex-1"
      />
      <input
        type="date"
        value={val.to || ''}
        onChange={(e) => update({ to: e.target.value })}
        className="input-field text-sm flex-1"
      />
    </div>
  );
}

function BooleanFilter({
  def, draft, setDraft,
}: { def: FilterDef; draft: DraftState; setDraft: (d: DraftState) => void }) {
  const val = draft[def.column] as boolean | undefined;
  return (
    <div className="flex items-center space-x-3">
      <label className="flex items-center space-x-2 cursor-pointer text-sm">
        <input
          type="radio"
          name={`bool-${def.column}`}
          checked={val === true}
          onChange={() => setDraft({ ...draft, [def.column]: true })}
          className="text-primary-600 focus:ring-primary-500"
        />
        <span>Yes</span>
      </label>
      <label className="flex items-center space-x-2 cursor-pointer text-sm">
        <input
          type="radio"
          name={`bool-${def.column}`}
          checked={val === false}
          onChange={() => setDraft({ ...draft, [def.column]: false })}
          className="text-primary-600 focus:ring-primary-500"
        />
        <span>No</span>
      </label>
      <button
        type="button"
        onClick={() => {
          const d = { ...draft };
          delete d[def.column];
          setDraft(d);
        }}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        Clear
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Filter Pills
// ---------------------------------------------------------------------------

function ActiveFilterPills({
  filters,
  onRemove,
  onClear,
}: {
  filters: ActiveFilter[];
  onRemove: (column: string) => void;
  onClear: () => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => (
        <span
          key={f.column}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
        >
          <span className="font-semibold mr-1">{f.label}:</span>
          <span className="max-w-[140px] truncate">{f.displayValue}</span>
          <button
            onClick={() => onRemove(f.column)}
            className="ml-1.5 hover:text-primary-600"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        onClick={onClear}
        className="text-xs text-gray-500 hover:text-red-500 font-medium"
      >
        Clear all
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FilterBar
// ---------------------------------------------------------------------------

const FilterBar: React.FC<FilterBarProps> = ({
  columns,
  filters,
  activeFilters,
  onApply,
  onRemoveFilter,
  onClearAll,
  data,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const baseDefs = useMemo(() => buildFilterDefs(columns, filters), [columns, filters]);
  const filterDefs = useSmartEnums(baseDefs, data || []);

  // Draft state mirrors activeFilters for editing
  const [draft, setDraft] = useState<DraftState>(() => {
    const d: DraftState = {};
    for (const af of activeFilters) {
      d[af.column] = af.value;
    }
    return d;
  });

  // Sync draft when activeFilters change externally
  React.useEffect(() => {
    const d: DraftState = {};
    for (const af of activeFilters) {
      d[af.column] = af.value;
    }
    setDraft(d);
  }, [activeFilters]);

  const handleApply = () => {
    const result: ActiveFilter[] = [];
    for (const def of filterDefs) {
      const val = draft[def.column];
      if (val === undefined || val === null || val === '') continue;
      if (Array.isArray(val) && val.length === 0) continue;
      if (typeof val === 'object' && !Array.isArray(val)) {
        const obj = val as Record<string, unknown>;
        const hasValue = Object.values(obj).some((v) => v !== undefined && v !== null && v !== '');
        if (!hasValue) continue;
      }

      let displayValue = '';
      if (Array.isArray(val)) {
        displayValue = (val as string[]).join(', ');
      } else if (typeof val === 'object' && val !== null) {
        const obj = val as Record<string, unknown>;
        displayValue = Object.entries(obj)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      } else {
        displayValue = String(val);
      }

      const col = columns.find((c) => c.name === def.column);
      result.push({
        column: def.column,
        label: def.label || col?.label || def.column,
        type: def.type,
        value: val,
        displayValue,
      });
    }
    onApply(result);
    setIsOpen(false);
  };

  const handleReset = () => {
    setDraft({});
    onClearAll();
    setIsOpen(false);
  };

  // Group filters by type for organized display
  const grouped = useMemo(() => {
    const groups: Record<string, FilterDef[]> = {
      multiselect: [],
      daterange: [],
      search: [],
      range: [],
      boolean: [],
    };
    for (const def of filterDefs) {
      const key = def.type === 'custom' ? 'search' : def.type;
      if (groups[key]) groups[key].push(def);
      else groups.search.push(def);
    }
    return groups;
  }, [filterDefs]);

  const groupLabels: Record<string, { label: string; color: string }> = {
    multiselect: { label: 'Selections', color: 'border-purple-400' },
    daterange: { label: 'Date Ranges', color: 'border-blue-400' },
    search: { label: 'Text Search', color: 'border-green-400' },
    range: { label: 'Number Ranges', color: 'border-amber-400' },
    boolean: { label: 'Toggles', color: 'border-gray-400' },
  };

  if (filterDefs.length === 0) {
    return <ActiveFilterPills filters={activeFilters} onRemove={onRemoveFilter} onClear={onClearAll} />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            isOpen || activeFilters.length > 0
              ? 'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Filter size={16} />
          <span>Filters</span>
          {activeFilters.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary-600 text-white">
              {activeFilters.length}
            </span>
          )}
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <ActiveFilterPills filters={activeFilters} onRemove={onRemoveFilter} onClear={onClearAll} />
      </div>

      {isOpen && (
        <div className="card p-4 space-y-4">
          {Object.entries(grouped).map(([key, defs]) => {
            if (defs.length === 0) return null;
            const g = groupLabels[key];
            return (
              <div key={key} className={`border-l-4 ${g.color} pl-3 space-y-3`}>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {g.label}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {defs.map((def) => (
                    <div key={def.column} className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        {def.label || def.column}
                      </label>
                      {def.type === 'search' && (
                        <SearchFilter def={def} draft={draft} setDraft={setDraft} />
                      )}
                      {def.type === 'multiselect' && (
                        <MultiselectFilter def={def} draft={draft} setDraft={setDraft} />
                      )}
                      {def.type === 'range' && (
                        <RangeFilter def={def} draft={draft} setDraft={setDraft} />
                      )}
                      {def.type === 'daterange' && (
                        <DateRangeFilter def={def} draft={draft} setDraft={setDraft} />
                      )}
                      {def.type === 'boolean' && (
                        <BooleanFilter def={def} draft={draft} setDraft={setDraft} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button onClick={handleReset} className="btn-secondary text-sm">
              Reset
            </button>
            <button onClick={handleApply} className="btn-primary text-sm flex items-center space-x-1.5">
              <Check size={14} />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
