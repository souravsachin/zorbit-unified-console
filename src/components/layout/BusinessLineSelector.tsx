import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Circle, type LucideIcon } from 'lucide-react';
import { lucideIconByName } from './lucideIconMap';

// ─── Public types ─────────────────────────────────────────────────────
//
// A BusinessLine is now just a string — the edition's name as declared
// by a module manifest's `placement.edition.name`. No string-literal
// union, no hardcoded list of known editions.
export type BusinessLine = string;

// Edition metadata as carried by a module manifest's placement.edition.
// First-seen wins on conflict (logged as a console warning).
export interface EditionMeta {
  name: string;                  // "Health Insurance"
  category: string;              // "Insurer" | "UHC" | "TPA" | "Broker" | …
  categorySortOrder?: number;    // ordering of the category in the dropdown
  sortOrder?: number;            // ordering within the category
  icon?: string;                 // Lucide icon name (e.g. "Heart")
  iconBg?: string;
  iconColor?: string;
  iconRing?: string;
}

interface BusinessLineSelectorProps {
  value: BusinessLine;
  editions: EditionMeta[];       // collected at runtime from manifests
  onChange: (v: BusinessLine) => void;
}

// ─── Defaults for missing icon styling ────────────────────────────────
// Used only when a manifest forgot to provide its own colours. Logged
// as a warning at registry ingestion in a future iteration.
const FALLBACK_BG = '#f3f4f6';
const FALLBACK_ICON = '#4b5563';
const FALLBACK_RING = '#d1d5db';

interface CategoryGroup {
  label: string;
  sortOrder: number;
  editions: EditionMeta[];
}

function groupAndSortEditions(editions: EditionMeta[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  for (const e of editions) {
    const key = e.category || 'Other';
    if (!groups.has(key)) {
      groups.set(key, { label: key, sortOrder: e.categorySortOrder ?? 999, editions: [] });
    }
    const g = groups.get(key)!;
    if ((e.categorySortOrder ?? 999) < g.sortOrder) g.sortOrder = e.categorySortOrder ?? 999;
    g.editions.push(e);
  }
  for (const g of groups.values()) {
    g.editions.sort((a, b) => {
      const sa = a.sortOrder ?? 999;
      const sb = b.sortOrder ?? 999;
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });
}

const BusinessLineSelector: React.FC<BusinessLineSelectorProps> = ({ value, editions, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const groups = useMemo(() => groupAndSortEditions(editions), [editions]);
  const selected = useMemo(
    () => editions.find((e) => e.name === value) || editions[0],
    [editions, value],
  );

  if (!selected) {
    return (
      <div className="mx-2 my-1.5 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-300 dark:border-gray-700 text-[11px] text-gray-500">
        No editions registered yet
      </div>
    );
  }

  const SelIcon: LucideIcon = lucideIconByName(selected.icon) || Circle;
  const bg = selected.iconBg || FALLBACK_BG;
  const ic = selected.iconColor || FALLBACK_ICON;
  const ring = selected.iconRing || FALLBACK_RING;

  return (
    <div ref={ref} className="relative mx-2 my-1.5 shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left
          transition-all duration-150 outline-none
          border hover:shadow-sm
          ${open
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700'
            : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200/70 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/60'}
        `}
      >
        <span
          className="flex items-center justify-center rounded-md shrink-0"
          style={{ width: 26, height: 26, background: bg, border: `1px solid ${ring}` }}
        >
          <SelIcon size={13} style={{ color: ic }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 leading-tight">
            Edition
          </span>
          <span className="block text-[11.5px] font-semibold truncate text-gray-800 dark:text-gray-100 leading-tight mt-0.5">
            {selected.name}
          </span>
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-y-auto"
          style={{ animation: 'bzDropdown 120ms ease-out', maxHeight: 360 }}
        >
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pt-2.5 pb-1">
                <span className="text-[9.5px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
                  {group.label}
                </span>
              </div>
              {group.editions.map((e) => {
                const ItemIcon: LucideIcon = lucideIconByName(e.icon) || Circle;
                const ebg = e.iconBg || FALLBACK_BG;
                const eic = e.iconColor || FALLBACK_ICON;
                const ering = e.iconRing || FALLBACK_RING;
                const isSelected = value === e.name;
                return (
                  <button
                    key={e.name}
                    onClick={() => { onChange(e.name); setOpen(false); }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-1.5 text-left
                      transition-colors duration-100
                      ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}
                    `}
                  >
                    <span
                      className="flex items-center justify-center rounded-md shrink-0"
                      style={{ width: 24, height: 24, background: ebg, border: `1px solid ${ering}` }}
                    >
                      <ItemIcon size={12} style={{ color: eic }} />
                    </span>
                    <span className={`text-[12px] font-medium flex-1 truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>
                      {e.name}
                    </span>
                    {isSelected && (
                      <Check size={12} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-gray-500">No editions discovered</div>
          )}
          <div className="h-2" />
        </div>
      )}
    </div>
  );
};

export default BusinessLineSelector;

// ─── Backwards-compat exports ─────────────────────────────────────────
// Sidebar6Level still imports BUSINESS_LINE_LABELS / SHORT_LABELS in two
// trivial places. Provide identity helpers so no other file needs editing.
export const BUSINESS_LINE_LABELS: Record<string, string> = new Proxy({}, {
  get: (_t, prop: string) => prop,
});
export const SHORT_LABELS: Record<string, string> = new Proxy({}, {
  get: (_t, prop: string) => prop,
});
