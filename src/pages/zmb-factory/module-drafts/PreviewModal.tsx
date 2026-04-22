/**
 * PreviewModal — renders the manifest's sidebar and guide as they would
 * appear when registered. Pure FE — no backend round-trip.
 *
 * Added 2026-04-22 by Soldier AU.
 */
import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Play } from 'lucide-react';
import type { ModuleDraftManifest, MenuItem } from './types';
import { playNarration } from '../../../services/zmbModuleDrafts';

function MenuItemView({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = (item.items || []).length > 0;
  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded cursor-pointer"
        style={{ paddingLeft: 4 + depth * 16 }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        {hasChildren ? (
          open ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <span style={{ width: 12 }} />
        )}
        <span className="text-sm">{item.label}</span>
        {item.feRoute && (
          <span className="text-[10px] text-gray-400 ml-auto truncate max-w-[180px]">{item.feRoute}</span>
        )}
      </div>
      {open && (item.items || []).map((c, i) => <MenuItemView key={i} item={c} depth={depth + 1} />)}
    </div>
  );
}

function SidebarPreview({ manifest }: { manifest: ModuleDraftManifest }) {
  const placement = manifest.placement || {};
  return (
    <div className="w-full">
      <div className="text-xs text-gray-500 mb-2">Sidebar preview</div>
      <div className="text-[10px] text-gray-400 mb-1">
        {placement.scaffold} &rsaquo; {placement.edition || '-'} &rsaquo; {placement.businessLine || '-'} &rsaquo; {placement.capabilityArea || '-'}
      </div>
      <div
        className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900"
        style={{ minHeight: '320px' }}
      >
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
            style={{ backgroundColor: manifest.color || '#6366f1' }}
          >
            {(manifest.displayName || manifest.moduleName || '?').charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold">{manifest.displayName || manifest.moduleName}</div>
            <div className="text-[10px] text-gray-500">{manifest.moduleId}</div>
          </div>
        </div>
        {(manifest.navigation?.sections || []).map((s, i) => (
          <div key={i} className="mb-2">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{s.label}</div>
            {(s.items || []).map((it, j) => (
              <MenuItemView key={j} item={it} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuidePreview({ manifest }: { manifest: ModuleDraftManifest }) {
  const g = manifest.guide || {};
  const slides = g.slides?.deck || [];
  const [slideIdx, setSlideIdx] = useState(0);
  const current = slides[slideIdx];

  return (
    <div className="w-full">
      <div className="text-xs text-gray-500 mb-2">Guide preview</div>
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900 mb-3">
        <h4 className="text-lg font-bold">{g.intro?.headline || manifest.displayName}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">{g.intro?.summary}</p>
        {g.intro?.narration && (
          <button
            type="button"
            className="mt-2 text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => playNarration(g.intro?.narration || '')}
          >
            <Play size={10} /> Play narration
          </button>
        )}
      </div>
      {slides.length > 0 && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900 mb-3">
          <div className="flex items-center mb-3">
            <span className="text-xs font-semibold">Slide {slideIdx + 1} / {slides.length}</span>
            <div className="flex-1" />
            <button
              type="button"
              className="text-xs px-2 py-1 mr-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
              disabled={slideIdx === 0}
              onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"
              disabled={slideIdx === slides.length - 1}
              onClick={() => setSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
            >
              Next
            </button>
          </div>
          <h5 className="text-base font-semibold mb-2">{current?.title}</h5>
          {current?.image && (
            <img src={current.image} alt={current.title} className="mb-2 rounded border border-gray-200 dark:border-gray-700 max-h-40" />
          )}
          <p className="text-sm mb-2">{current?.body}</p>
          {current?.bullets && current.bullets.length > 0 && (
            <ul className="text-sm list-disc pl-5 mb-2">
              {current.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {current?.narration && (
            <button
              type="button"
              className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => playNarration(current.narration || '')}
            >
              <Play size={10} /> Play narration
            </button>
          )}
        </div>
      )}
      {g.lifecycle?.phases && g.lifecycle.phases.length > 0 && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900 mb-3">
          <div className="text-xs font-semibold mb-2">Lifecycle</div>
          <div className="flex flex-wrap gap-2">
            {g.lifecycle.phases.map((p, i) => (
              <div key={i} className="px-3 py-1 rounded bg-indigo-100 text-indigo-800 text-xs">
                {p.name}
              </div>
            ))}
          </div>
        </div>
      )}
      {g.pricing?.tiers && g.pricing.tiers.length > 0 && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900">
          <div className="text-xs font-semibold mb-2">Pricing ({g.pricing.status})</div>
          <div className="grid grid-cols-3 gap-2">
            {g.pricing.tiers.map((t, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-2">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-gray-500">
                  {t.monthlyPrice == null ? 'Contact us' : `${t.monthlyPrice}/mo`}
                </div>
                <ul className="text-[10px] mt-1 list-disc pl-4">
                  {(t.features || []).map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EntityPreview({ manifest }: { manifest: ModuleDraftManifest }) {
  const ents = manifest.entities || [];
  if (ents.length === 0)
    return <div className="text-xs text-gray-500">No entities declared — nothing to preview.</div>;
  return (
    <div>
      {ents.map((e, i) => (
        <div key={i} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-3 bg-white dark:bg-gray-900">
          <div className="text-sm font-semibold">
            {e.displayName || e.entity} <span className="text-gray-400 text-xs">({e.hashIdPrefix}-XXXX)</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">Table: {e.table} · Namespace: {e.namespace}</div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="text-left px-2 py-1">field</th>
                <th className="text-left px-2 py-1">type</th>
                <th className="text-left px-2 py-1">req</th>
                <th className="text-left px-2 py-1">PII</th>
              </tr>
            </thead>
            <tbody>
              {e.fields.map((f, j) => (
                <tr key={j} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-2 py-1 font-mono">{f.key}</td>
                  <td className="px-2 py-1 text-gray-500">{f.type}</td>
                  <td className="px-2 py-1">{f.required ? '✓' : ''}</td>
                  <td className="px-2 py-1">{(f as any).pii ? '🔒' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function PreviewModal({
  manifest,
  onClose,
}: {
  manifest: ModuleDraftManifest;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'sidebar' | 'guide' | 'entities'>('sidebar');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[min(90vw,1100px)] h-[min(90vh,800px)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 flex items-center border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold">Manifest Preview — {manifest.displayName || manifest.moduleId}</h2>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-900"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pt-3">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {(['sidebar', 'guide', 'entities'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`px-3 py-1 text-sm ${
                  tab === k
                    ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {tab === 'sidebar' && <SidebarPreview manifest={manifest} />}
          {tab === 'guide' && <GuidePreview manifest={manifest} />}
          {tab === 'entities' && <EntityPreview manifest={manifest} />}
        </div>
      </div>
    </div>
  );
}
