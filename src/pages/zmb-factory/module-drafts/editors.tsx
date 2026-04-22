/**
 * Inline section editors for the ZMB Module Drafts UI.
 * Each editor takes (manifest, patch) and emits patches rather than the full
 * manifest so wiring is cheap.
 */
import React, { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, ChevronDown, ChevronRight } from 'lucide-react';
import type {
  ModuleDraftManifest,
  NavSection,
  MenuItem,
  FeComponentDecl,
  BeRouteDecl,
  PrivilegeDecl,
  EntityDecl,
  EntityFieldDecl,
} from './types';

type Patch = (m: ModuleDraftManifest) => ModuleDraftManifest;

function field<K extends keyof any>(
  label: string,
  children: React.ReactNode,
  hint?: string,
  key?: K,
) {
  return (
    <label key={String(key || label)} className="block mb-3">
      <span className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs text-gray-400 mt-1">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

// -------------------- Identity --------------------
export function IdentityEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold mb-3">Identity</h3>
      {field(
        'Module ID',
        <input
          className={inputCls}
          value={manifest.moduleId || ''}
          onChange={(e) => apply((m) => ({ ...m, moduleId: e.target.value }))}
          placeholder="zorbit-app-something"
        />,
        'Lowercase slug, must match source repo name (e.g. zorbit-app-hi_claim_initiation)',
      )}
      {field(
        'Display Name',
        <input
          className={inputCls}
          value={manifest.displayName || manifest.moduleName || ''}
          onChange={(e) =>
            apply((m) => ({ ...m, displayName: e.target.value, moduleName: e.target.value }))
          }
          placeholder="HI Claim Initiation"
        />,
      )}
      {field(
        'Version',
        <input
          className={inputCls}
          value={manifest.version || '0.1.0'}
          onChange={(e) => apply((m) => ({ ...m, version: e.target.value }))}
        />,
        'Semver — bump this when manifest content changes',
      )}
      {field(
        'Description',
        <textarea
          className={inputCls}
          rows={3}
          value={manifest.description || ''}
          onChange={(e) => apply((m) => ({ ...m, description: e.target.value }))}
          placeholder="One-paragraph pitch shown in the admin drawer."
        />,
      )}
      <div className="grid grid-cols-2 gap-3">
        {field(
          'Icon',
          <input
            className={inputCls}
            value={manifest.icon || ''}
            onChange={(e) => apply((m) => ({ ...m, icon: e.target.value }))}
            placeholder="widgets"
          />,
          'Material icon name',
        )}
        {field(
          'Color',
          <input
            type="color"
            className="w-16 h-9 rounded border border-gray-300"
            value={manifest.color || '#6366f1'}
            onChange={(e) => apply((m) => ({ ...m, color: e.target.value }))}
          />,
        )}
      </div>
      {field(
        'Module Type',
        <select
          className={inputCls}
          value={manifest.moduleType || 'app'}
          onChange={(e) => apply((m) => ({ ...m, moduleType: e.target.value as any }))}
        >
          <option value="cor">Platform Core (cor)</option>
          <option value="pfs">Platform Feature Service (pfs)</option>
          <option value="app">Business App (app)</option>
          <option value="adm">Admin (adm)</option>
          <option value="ai">AI (ai)</option>
          <option value="tpm">Third-Party Module (tpm)</option>
        </select>,
      )}
      {field(
        'Owner',
        <input
          className={inputCls}
          value={manifest.owner || ''}
          onChange={(e) => apply((m) => ({ ...m, owner: e.target.value }))}
        />,
      )}
    </div>
  );
}

// -------------------- Placement --------------------
const SCAFFOLDS = [
  'Platform Core',
  'Platform Feature Services',
  'Business',
  'AI and Voice',
  'Administration',
];
const BUSINESS_LINES = ['Distribution', 'Servicing', 'Finance', 'Advisory', 'Operations'];

export function PlacementEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const p = manifest.placement || {};
  const mut = (patch: Partial<typeof p>) =>
    apply((m) => ({ ...m, placement: { ...(m.placement || {}), ...patch } }));

  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold mb-3">Placement</h3>
      {field(
        'Scaffold (L1)',
        <select className={inputCls} value={p.scaffold || 'Business'} onChange={(e) => mut({ scaffold: e.target.value })}>
          {SCAFFOLDS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>,
      )}
      {p.scaffold === 'Business' && (
        <>
          {field(
            'Edition',
            <input className={inputCls} value={p.edition || ''} onChange={(e) => mut({ edition: e.target.value })} placeholder="Health Insurance" />,
            'Edition dropdown label — required for Business scaffold',
          )}
          {field(
            'Business Line',
            <select
              className={inputCls}
              value={p.businessLine || ''}
              onChange={(e) => mut({ businessLine: e.target.value })}
            >
              <option value="">— select —</option>
              {BUSINESS_LINES.map((bl) => (
                <option key={bl} value={bl}>{bl}</option>
              ))}
            </select>,
          )}
        </>
      )}
      {field(
        'Capability Area',
        <input className={inputCls} value={p.capabilityArea || ''} onChange={(e) => mut({ capabilityArea: e.target.value })} placeholder="Claims Management" />,
        'L3 label; free-form Title Case',
      )}
      {field(
        'Sort Order',
        <input
          type="number"
          className={inputCls}
          value={p.sortOrder ?? 500}
          onChange={(e) => mut({ sortOrder: parseInt(e.target.value, 10) })}
        />,
      )}
    </div>
  );
}

// -------------------- Menu (recursive editor) --------------------
function MenuItemEditor({
  item,
  onChange,
  onRemove,
  onMove,
  depth,
}: {
  item: MenuItem;
  onChange: (next: MenuItem) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth < 2);
  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-2"
      style={{ marginLeft: depth * 8 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-gray-500 hover:text-gray-900">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <input
          className={`${inputCls} flex-1`}
          value={item.label}
          onChange={(e) => onChange({ ...item, label: e.target.value })}
          placeholder="Label"
        />
        <button type="button" onClick={() => onMove('up')} className="p-1 text-gray-500 hover:text-indigo-600" title="Move up">
          <MoveUp size={14} />
        </button>
        <button type="button" onClick={() => onMove('down')} className="p-1 text-gray-500 hover:text-indigo-600" title="Move down">
          <MoveDown size={14} />
        </button>
        <button type="button" onClick={onRemove} className="p-1 text-gray-500 hover:text-red-600" title="Remove">
          <Trash2 size={14} />
        </button>
      </div>
      {open && (
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} value={item.feRoute || ''} onChange={(e) => onChange({ ...item, feRoute: e.target.value })} placeholder="feRoute: /m/slug/feature" />
          <input className={inputCls} value={item.icon || ''} onChange={(e) => onChange({ ...item, icon: e.target.value })} placeholder="icon: BookOpen" />
          <input className={inputCls} value={item.feComponent || ''} onChange={(e) => onChange({ ...item, feComponent: e.target.value })} placeholder="feComponent: @platform:GuideIntroView" />
          <input className={inputCls} value={item.privilege || ''} onChange={(e) => onChange({ ...item, privilege: e.target.value })} placeholder="privilege: slug.resource.read" />
          <input className={inputCls} value={item.beRoute || ''} onChange={(e) => onChange({ ...item, beRoute: e.target.value })} placeholder="beRoute (optional)" />
          <input type="number" className={inputCls} value={item.sortOrder ?? ''} onChange={(e) => onChange({ ...item, sortOrder: parseInt(e.target.value, 10) || 0 })} placeholder="sortOrder" />
        </div>
      )}
      {open && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Children</div>
          {(item.items || []).map((child, i) => (
            <MenuItemEditor
              key={i}
              item={child}
              depth={depth + 1}
              onChange={(c) => {
                const next = [...(item.items || [])];
                next[i] = c;
                onChange({ ...item, items: next });
              }}
              onRemove={() => {
                const next = [...(item.items || [])];
                next.splice(i, 1);
                onChange({ ...item, items: next });
              }}
              onMove={(dir) => {
                const next = [...(item.items || [])];
                const j = dir === 'up' ? i - 1 : i + 1;
                if (j < 0 || j >= next.length) return;
                [next[i], next[j]] = [next[j], next[i]];
                onChange({ ...item, items: next });
              }}
            />
          ))}
          <button
            type="button"
            className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            onClick={() =>
              onChange({
                ...item,
                items: [...(item.items || []), { label: 'New child', feRoute: '', icon: '' }],
              })
            }
          >
            <Plus size={12} /> Add child
          </button>
        </div>
      )}
    </div>
  );
}

export function MenuEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const sections = manifest.navigation?.sections || [];
  const setSections = (next: NavSection[]) =>
    apply((m) => ({ ...m, navigation: { sections: next } }));

  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-semibold mb-3">Navigation Menu</h3>
      <p className="text-xs text-gray-500 mb-3">
        Define the sidebar sections and items that will appear when your module is active.
        Each section can have nested children.
      </p>
      {sections.map((s, i) => (
        <div key={i} className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <input
              className={`${inputCls} flex-1`}
              value={s.label}
              onChange={(e) => {
                const next = [...sections];
                next[i] = { ...s, label: e.target.value };
                setSections(next);
              }}
              placeholder="Section label"
            />
            <input
              className={`${inputCls} w-40`}
              value={s.id}
              onChange={(e) => {
                const next = [...sections];
                next[i] = { ...s, id: e.target.value };
                setSections(next);
              }}
              placeholder="id"
            />
            <input
              type="number"
              className={`${inputCls} w-24`}
              value={s.sortOrder ?? 0}
              onChange={(e) => {
                const next = [...sections];
                next[i] = { ...s, sortOrder: parseInt(e.target.value, 10) };
                setSections(next);
              }}
              placeholder="sort"
            />
            <button
              type="button"
              onClick={() => {
                const next = [...sections];
                next.splice(i, 1);
                setSections(next);
              }}
              className="p-2 text-gray-500 hover:text-red-600"
              title="Remove section"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div>
            {(s.items || []).map((it, j) => (
              <MenuItemEditor
                key={j}
                item={it}
                depth={0}
                onChange={(next) => {
                  const secs = [...sections];
                  const its = [...(secs[i].items || [])];
                  its[j] = next;
                  secs[i] = { ...secs[i], items: its };
                  setSections(secs);
                }}
                onRemove={() => {
                  const secs = [...sections];
                  const its = [...(secs[i].items || [])];
                  its.splice(j, 1);
                  secs[i] = { ...secs[i], items: its };
                  setSections(secs);
                }}
                onMove={(dir) => {
                  const secs = [...sections];
                  const its = [...(secs[i].items || [])];
                  const k = dir === 'up' ? j - 1 : j + 1;
                  if (k < 0 || k >= its.length) return;
                  [its[j], its[k]] = [its[k], its[j]];
                  secs[i] = { ...secs[i], items: its };
                  setSections(secs);
                }}
              />
            ))}
            <button
              type="button"
              className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              onClick={() => {
                const secs = [...sections];
                secs[i] = {
                  ...s,
                  items: [...(s.items || []), { label: 'New item', feRoute: '', icon: '' }],
                };
                setSections(secs);
              }}
            >
              <Plus size={12} /> Add item
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() =>
          setSections([
            ...sections,
            {
              id: `section-${sections.length}`,
              label: 'New Section',
              sortOrder: 10 * (sections.length + 1),
              items: [],
            },
          ])
        }
      >
        <Plus size={14} /> Add section
      </button>
    </div>
  );
}

// -------------------- FE Components --------------------
export function FeComponentsEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const comps = (manifest.frontend?.components as FeComponentDecl[]) || [];
  const set = (next: FeComponentDecl[]) =>
    apply((m) => ({
      ...m,
      frontend: { ...(m.frontend || {}), components: next },
    }));
  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-semibold mb-3">Frontend Components</h3>
      <p className="text-xs text-gray-500 mb-3">
        Declare which React components this module exports. Reference them from menu items as{' '}
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1">moduleId:ComponentName</code>.
      </p>
      {comps.map((c, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 mb-2 items-center">
          <input
            className={inputCls}
            value={c.name}
            onChange={(e) => {
              const next = [...comps];
              next[i] = { ...c, name: e.target.value };
              set(next);
            }}
            placeholder="ComponentName"
          />
          <input
            className={inputCls}
            value={c.importPath || ''}
            onChange={(e) => {
              const next = [...comps];
              next[i] = { ...c, importPath: e.target.value };
              set(next);
            }}
            placeholder="import path (optional)"
          />
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={c.$src || ''}
              onChange={(e) => {
                const next = [...comps];
                next[i] = { ...c, $src: e.target.value };
                set(next);
              }}
              placeholder="$src URL (optional)"
            />
            <button
              type="button"
              onClick={() => {
                const next = [...comps];
                next.splice(i, 1);
                set(next);
              }}
              className="p-2 text-gray-500 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => set([...comps, { name: 'NewComponent' }])}
      >
        <Plus size={14} /> Add component
      </button>
    </div>
  );
}

// -------------------- BE Routes --------------------
export function BeRoutesEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const rts = (manifest.backend?.endpoints as BeRouteDecl[]) || [];
  const set = (next: BeRouteDecl[]) =>
    apply((m) => ({ ...m, backend: { ...(m.backend || {}), endpoints: next } }));
  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-semibold mb-3">Backend Routes</h3>
      <p className="text-xs text-gray-500 mb-3">
        Override the default CRUD-derived routes. Leave empty to use auto-generated routes.
      </p>
      {rts.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <select
            className={`${inputCls} col-span-2`}
            value={r.method}
            onChange={(e) => {
              const next = [...rts];
              next[i] = { ...r, method: e.target.value as any };
              set(next);
            }}
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            className={`${inputCls} col-span-5`}
            value={r.path}
            onChange={(e) => {
              const next = [...rts];
              next[i] = { ...r, path: e.target.value };
              set(next);
            }}
            placeholder="/claims"
          />
          <input
            className={`${inputCls} col-span-4`}
            value={r.privilege || ''}
            onChange={(e) => {
              const next = [...rts];
              next[i] = { ...r, privilege: e.target.value };
              set(next);
            }}
            placeholder="privilege"
          />
          <button
            type="button"
            className="col-span-1 p-2 text-gray-500 hover:text-red-600"
            onClick={() => {
              const next = [...rts];
              next.splice(i, 1);
              set(next);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => set([...rts, { method: 'GET', path: '/' }])}
      >
        <Plus size={14} /> Add route
      </button>
    </div>
  );
}

// -------------------- Dependencies --------------------
export function DependenciesEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const deps: any = manifest.dependencies || {};
  const requires: string[] = deps.requires || deps.platform || [];
  const optional: string[] = deps.optional || [];
  const set = (patch: Partial<{ requires: string[]; optional: string[] }>) =>
    apply((m) => ({ ...m, dependencies: { ...((m.dependencies as any) || {}), ...patch } }));

  const renderList = (
    title: string,
    values: string[],
    key: 'requires' | 'optional',
  ) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      {values.map((v, i) => (
        <div key={i} className="flex gap-2 mb-1">
          <input
            className={`${inputCls} flex-1`}
            value={v}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              set({ [key]: next } as any);
            }}
            placeholder="zorbit-cor-identity"
          />
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-red-600"
            onClick={() => {
              const next = [...values];
              next.splice(i, 1);
              set({ [key]: next } as any);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => set({ [key]: [...values, ''] } as any)}
      >
        <Plus size={14} /> Add
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold mb-3">Dependencies</h3>
      {renderList('Requires', requires, 'requires')}
      {renderList('Optional', optional, 'optional')}
    </div>
  );
}

// -------------------- Privileges --------------------
export function PrivilegesEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const privs = (manifest.privileges as PrivilegeDecl[]) || [];
  const set = (next: PrivilegeDecl[]) => apply((m) => ({ ...m, privileges: next }));
  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-semibold mb-3">Privileges</h3>
      <p className="text-xs text-gray-500 mb-3">
        Declare RBAC codes this module seeds. Pattern:{' '}
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1">&lt;slug&gt;.&lt;resource&gt;.&lt;action&gt;</code>
      </p>
      {privs.map((p, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <input
            className={`${inputCls} col-span-4`}
            value={p.code}
            onChange={(e) => {
              const next = [...privs];
              next[i] = { ...p, code: e.target.value };
              set(next);
            }}
            placeholder="claims.claim.read"
          />
          <input
            className={`${inputCls} col-span-4`}
            value={p.label || ''}
            onChange={(e) => {
              const next = [...privs];
              next[i] = { ...p, label: e.target.value };
              set(next);
            }}
            placeholder="Read claims"
          />
          <input
            className={`${inputCls} col-span-3`}
            value={p.description || ''}
            onChange={(e) => {
              const next = [...privs];
              next[i] = { ...p, description: e.target.value };
              set(next);
            }}
            placeholder="description"
          />
          <button
            type="button"
            className="col-span-1 p-2 text-gray-500 hover:text-red-600"
            onClick={() => {
              const next = [...privs];
              next.splice(i, 1);
              set(next);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => set([...privs, { code: '', label: '' }])}
      >
        <Plus size={14} /> Add privilege
      </button>
    </div>
  );
}

// -------------------- Entities --------------------
const FIELD_TYPES = ['text', 'number', 'integer', 'boolean', 'date', 'datetime', 'enum', 'id', 'ref', 'json'];

function EntityCard({
  entity,
  onChange,
  onRemove,
}: {
  entity: EntityDecl;
  onChange: (next: EntityDecl) => void;
  onRemove: () => void;
}) {
  const mut = (patch: Partial<EntityDecl>) => onChange({ ...entity, ...patch });
  const setFields = (fields: EntityFieldDecl[]) => onChange({ ...entity, fields });

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-3 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <input
          className={`${inputCls} flex-1`}
          value={entity.entity}
          onChange={(e) => mut({ entity: e.target.value })}
          placeholder="entity slug — claim"
        />
        <input
          className={`${inputCls} w-40`}
          value={entity.hashIdPrefix}
          onChange={(e) => mut({ hashIdPrefix: e.target.value })}
          placeholder="CLM"
        />
        <input
          className={`${inputCls} w-40`}
          value={entity.table}
          onChange={(e) => mut({ table: e.target.value })}
          placeholder="claims"
        />
        <select
          className={`${inputCls} w-24`}
          value={entity.namespace}
          onChange={(e) => mut({ namespace: e.target.value as any })}
        >
          {['G', 'O', 'D', 'U'].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button type="button" onClick={onRemove} className="p-2 text-gray-500 hover:text-red-600">
          <Trash2 size={14} />
        </button>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-2">Fields</div>
        {entity.fields.map((f, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 mb-1 items-center">
            <input
              className={`${inputCls} col-span-3`}
              value={f.key}
              onChange={(e) => {
                const next = [...entity.fields];
                next[i] = { ...f, key: e.target.value };
                setFields(next);
              }}
              placeholder="fieldKey"
            />
            <select
              className={`${inputCls} col-span-2`}
              value={f.type}
              onChange={(e) => {
                const next = [...entity.fields];
                next[i] = { ...f, type: e.target.value };
                setFields(next);
              }}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="col-span-2 text-xs flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!f.required}
                onChange={(e) => {
                  const next = [...entity.fields];
                  next[i] = { ...f, required: e.target.checked };
                  setFields(next);
                }}
              />
              required
            </label>
            <label className="col-span-2 text-xs flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!f.pii}
                onChange={(e) => {
                  const next = [...entity.fields];
                  next[i] = { ...f, pii: e.target.checked };
                  setFields(next);
                }}
              />
              PII
            </label>
            <input
              className={`${inputCls} col-span-2`}
              value={(f.values || []).join(',')}
              onChange={(e) => {
                const next = [...entity.fields];
                next[i] = { ...f, values: e.target.value ? e.target.value.split(',').map((s) => s.trim()) : undefined };
                setFields(next);
              }}
              placeholder="enum values"
            />
            <button
              type="button"
              className="col-span-1 p-1 text-gray-500 hover:text-red-600"
              onClick={() => {
                const next = [...entity.fields];
                next.splice(i, 1);
                setFields(next);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 mt-2"
          onClick={() => setFields([...entity.fields, { key: 'newField', type: 'text' }])}
        >
          <Plus size={12} /> Add field
        </button>
      </div>
    </div>
  );
}

export function EntitiesEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const ents = (manifest.entities as EntityDecl[]) || [];
  const set = (next: EntityDecl[]) => apply((m) => ({ ...m, entities: next }));
  return (
    <div className="max-w-4xl">
      <h3 className="text-base font-semibold mb-3">Entities</h3>
      <p className="text-xs text-gray-500 mb-3">
        Each entity generates a DataTable list page, CRUD backend routes, and an entity schema file.
        Toggle PII on sensitive fields to enable vault tokenisation.
      </p>
      {ents.map((e, i) => (
        <EntityCard
          key={i}
          entity={e}
          onChange={(next) => {
            const nextArr = [...ents];
            nextArr[i] = next;
            set(nextArr);
          }}
          onRemove={() => {
            const nextArr = [...ents];
            nextArr.splice(i, 1);
            set(nextArr);
          }}
        />
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() =>
          set([
            ...ents,
            {
              entity: 'new_entity',
              namespace: 'O',
              hashIdPrefix: 'NEW',
              table: 'new_entities',
              fields: [{ key: 'hashId', type: 'id', readonly: true }],
              audit: { eventPrefix: 'new_entity' },
            },
          ])
        }
      >
        <Plus size={14} /> Add entity
      </button>
    </div>
  );
}

// -------------------- Seeds --------------------
export function SeedsEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const sm = manifest.seed?.systemMin || '';
  const dm = manifest.seed?.demo || '';
  const mut = (patch: { systemMin?: string; demo?: string }) =>
    apply((m) => ({ ...m, seed: { ...(m.seed || {}), ...patch } }));
  return (
    <div className="max-w-3xl">
      <h3 className="text-base font-semibold mb-3">Seeds</h3>
      <div className="mb-4">
        <div className="text-sm font-semibold mb-1">System-Min SQL</div>
        <textarea
          rows={8}
          className={`${inputCls} font-mono text-xs`}
          value={sm}
          onChange={(e) => mut({ systemMin: e.target.value })}
        />
      </div>
      <div className="mb-4">
        <div className="text-sm font-semibold mb-1">Demo SQL</div>
        <p className="text-xs text-gray-500 mb-1">
          Identifiers must be prefixed with <code>DEMO-</code> so they are detectable for flushing.
        </p>
        <textarea
          rows={8}
          className={`${inputCls} font-mono text-xs`}
          value={dm}
          onChange={(e) => mut({ demo: e.target.value })}
        />
      </div>
    </div>
  );
}

// -------------------- Events --------------------
export function EventsEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  const pub = manifest.events?.publishes || [];
  const sub = manifest.events?.consumes || [];
  const set = (patch: { publishes?: string[]; consumes?: string[] }) =>
    apply((m) => ({ ...m, events: { ...(m.events || {}), ...patch } }));
  const renderList = (title: string, vals: string[], key: 'publishes' | 'consumes') => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      {vals.map((v, i) => (
        <div key={i} className="flex gap-2 mb-1">
          <input
            className={`${inputCls} flex-1`}
            value={v}
            onChange={(e) => {
              const next = [...vals];
              next[i] = e.target.value;
              set({ [key]: next } as any);
            }}
            placeholder="domain.entity.action"
          />
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-red-600"
            onClick={() => {
              const next = [...vals];
              next.splice(i, 1);
              set({ [key]: next } as any);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => set({ [key]: [...vals, ''] } as any)}
      >
        <Plus size={14} /> Add
      </button>
    </div>
  );
  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold mb-3">Events</h3>
      {renderList('Publishes', pub, 'publishes')}
      {renderList('Consumes', sub, 'consumes')}
    </div>
  );
}
