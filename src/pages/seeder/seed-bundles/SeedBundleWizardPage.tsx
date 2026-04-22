/**
 * Seeder Generator Wizard — /m/seeder/seed_bundles/new.
 *
 * 10-step flow (per the owner directive 2026-04-23):
 *   1. Pick module
 *   2. Pick entities
 *   3. Tune factors
 *   4. Override field defaults
 *   5. Count
 *   6. Preview → 3 sample rows
 *   7. Save draft (POST /seed-bundles)
 *   8. Generate full bundle (PATCH /seed-bundles/:id)
 *   9. Run against API (POST /seed-bundles/:id/runs)
 *  10. Deliver to module (POST /seed-bundles/:id/deliveries)
 *
 * Added 2026-04-23 by Soldier AV.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Package,
  Eye,
  Save,
  Play,
  Send,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  seederBundlesService,
  type FactorDefinition,
  type ModuleIntrospection,
} from '../../../services/seederBundles';

type Step = 'module' | 'entities' | 'factors' | 'overrides' | 'count' | 'preview' | 'save';

export default function SeedBundleWizardPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('module');
  const [moduleIdInput, setModuleIdInput] = useState('');
  const [intro, setIntro] = useState<ModuleIntrospection | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [factors, setFactors] = useState<Record<string, unknown>>({});
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});
  const [count, setCount] = useState(25);
  const [preview, setPreview] = useState<Record<string, unknown[]> | null>(null);
  const [bundleId, setBundleId] = useState<string | null>(null);
  const [globalFactors, setGlobalFactors] = useState<FactorDefinition[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);

  const flashMsg = (ok: boolean, msg: string) => {
    setFlash({ ok, msg });
    setTimeout(() => setFlash(null), 5000);
  };

  // ---- Step 1: load introspection when module chosen ----
  const loadIntrospection = useCallback(async () => {
    if (!moduleIdInput) return;
    setBusy('introspect');
    try {
      const i = await seederBundlesService.introspectModule(moduleIdInput);
      setIntro(i);
      setSelectedEntities(i.entities.map((e) => e.entity));
      setCount(i.seed?.generator?.defaultCount ?? 25);
      // Seed factors with the module's declared defaults.
      const initFactors: Record<string, unknown> = {};
      for (const fm of i.factorMixes || []) {
        initFactors[fm.key] = {
          options: fm.options || [],
          weights: fm.defaultWeights || [],
        };
      }
      setFactors(initFactors);
      setStep('entities');
    } catch (e: any) {
      flashMsg(false, e?.response?.data?.message || e?.message || 'introspection failed');
    } finally {
      setBusy(null);
    }
  }, [moduleIdInput]);

  useEffect(() => {
    seederBundlesService
      .listFactors()
      .then((r) => setGlobalFactors(r.data || []))
      .catch(() => {});
  }, []);

  const handlePreview = useCallback(async () => {
    if (!intro) return;
    setBusy('preview');
    try {
      // Create a draft bundle first so we can call /previews.
      const created = await seederBundlesService.createBundle({
        moduleId: intro.moduleId,
        entities: selectedEntities,
        factors,
        overrides,
        count: 3,
        label: `Preview @ ${new Date().toISOString()}`,
      });
      const p = await seederBundlesService.createPreview(created.bundleId);
      setBundleId(created.bundleId);
      setPreview(p);
      setStep('preview');
    } catch (e: any) {
      flashMsg(false, e?.response?.data?.message || e?.message || 'preview failed');
    } finally {
      setBusy(null);
    }
  }, [intro, selectedEntities, factors, overrides]);

  const handleSave = useCallback(async () => {
    if (!intro) return;
    setBusy('save');
    try {
      const created = await seederBundlesService.createBundle({
        moduleId: intro.moduleId,
        entities: selectedEntities,
        factors,
        overrides,
        count,
      });
      setBundleId(created.bundleId);
      flashMsg(true, `Bundle ${created.bundleId} generated`);
      nav(`/m/seeder/seed_bundles/${created.bundleId}`);
    } catch (e: any) {
      flashMsg(false, e?.response?.data?.message || e?.message || 'save failed');
    } finally {
      setBusy(null);
    }
  }, [intro, selectedEntities, factors, overrides, count, nav]);

  const handleRun = useCallback(async () => {
    if (!bundleId) return;
    setBusy('run');
    try {
      const res = await seederBundlesService.startRun(bundleId);
      flashMsg(true, `Run ${res.runId} started (${res.total} requests)`);
      nav(`/m/seeder/seed_bundles/${bundleId}/runs/${res.runId}`);
    } catch (e: any) {
      flashMsg(false, e?.response?.data?.message || e?.message || 'run failed');
    } finally {
      setBusy(null);
    }
  }, [bundleId, nav]);

  const handleDeliver = useCallback(async () => {
    if (!bundleId) return;
    setBusy('deliver');
    try {
      const res = await seederBundlesService.deliver(bundleId, { target: 'module' });
      flashMsg(true, `Delivered to ${res.modulePath || 'central'} (${res.sqlBytes} bytes)`);
    } catch (e: any) {
      flashMsg(false, e?.response?.data?.message || e?.message || 'delivery failed');
    } finally {
      setBusy(null);
    }
  }, [bundleId]);

  const toggleEntity = (slug: string) => {
    setSelectedEntities((arr) =>
      arr.includes(slug) ? arr.filter((s) => s !== slug) : [...arr, slug],
    );
  };

  const allFactors = useMemo(() => {
    const mine = intro?.factorMixes?.map((m) => ({
      key: m.key,
      label: m.label,
      type: m.type,
      options: m.options,
      defaultWeights: m.defaultWeights,
      scope: 'module' as const,
    })) || [];
    return [...globalFactors, ...mine];
  }, [globalFactors, intro]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1"
          onClick={() => nav('/m/seeder/seed_bundles')}
        >
          <ChevronLeft size={14} /> Back
        </button>
        <Sparkles size={20} className="text-indigo-600" />
        <h1 className="text-xl font-semibold">Seed Bundle Wizard</h1>
        <div className="flex-1" />
        <span className="text-xs text-gray-500">step: {step}</span>
      </div>

      {flash && (
        <div
          className={`mb-3 px-3 py-2 rounded text-sm border ${
            flash.ok
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {flash.ok ? (
            <CheckCircle2 size={12} className="inline mr-1" />
          ) : (
            <AlertCircle size={12} className="inline mr-1" />
          )}
          {flash.msg}
        </div>
      )}

      {/* ---- Step 1: module picker ---- */}
      {step === 'module' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <Package size={14} /> 1. Pick a module
          </h4>
          <input
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            placeholder="moduleId (e.g. zorbit-app-hi_quotation)"
            value={moduleIdInput}
            onChange={(e) => setModuleIdInput(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={loadIntrospection}
              disabled={!moduleIdInput || !!busy}
              className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {busy === 'introspect' ? 'Loading…' : 'Introspect →'}
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 2: entity picker ---- */}
      {step !== 'module' && intro && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold mb-2">2. Pick entities ({intro.entities.length} available)</h4>
          {intro.entities.length === 0 && (
            <div className="text-xs text-gray-500 italic">
              This module has not declared any entities in its manifest. The wizard
              can still generate factor-mix-driven records, but there's nothing to
              seed until the module adds an <code>entities[]</code> block.
            </div>
          )}
          {intro.entities.map((e) => (
            <label key={e.entity} className="block text-sm mb-1">
              <input
                type="checkbox"
                className="mr-2"
                checked={selectedEntities.includes(e.entity)}
                onChange={() => toggleEntity(e.entity)}
              />
              <code className="text-xs">{e.entity}</code>
              <span className="text-xs text-gray-500 ml-2">
                ({e.fields.length} fields
                {e.hashIdPrefix ? `, prefix ${e.hashIdPrefix}` : ''})
              </span>
            </label>
          ))}
        </div>
      )}

      {/* ---- Step 3: factors ---- */}
      {step !== 'module' && intro && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold mb-2">3. Tune factors</h4>
          {allFactors.length === 0 && (
            <div className="text-xs text-gray-500 italic">No factor definitions available.</div>
          )}
          {allFactors.map((f) => (
            <FactorCard
              key={f.key}
              factor={f}
              value={factors[f.key]}
              onChange={(v) => setFactors((old) => ({ ...old, [f.key]: v }))}
            />
          ))}
        </div>
      )}

      {/* ---- Step 5: count ---- */}
      {step !== 'module' && intro && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold mb-2">5. Row count</h4>
          <input
            type="number"
            min={intro.seed?.generator?.minCount ?? 1}
            max={intro.seed?.generator?.maxCount ?? 5000}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10) || 25)}
            className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm w-32"
          />
        </div>
      )}

      {/* ---- Step 6: preview ---- */}
      {step === 'preview' && preview && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold mb-2">6. Preview (3 sample rows per entity)</h4>
          {Object.entries(preview).map(([entity, rows]) => (
            <div key={entity} className="mb-3">
              <div className="text-xs font-semibold mb-1">{entity}</div>
              <pre className="text-[11px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 overflow-auto max-h-60">
                {JSON.stringify(rows, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* ---- Action bar ---- */}
      {step !== 'module' && intro && (
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!!busy}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!!busy}
            className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white inline-flex items-center gap-1 hover:bg-indigo-700 disabled:bg-gray-400"
          >
            <Save size={14} /> Generate full bundle
          </button>
          {bundleId && (
            <>
              <button
                type="button"
                onClick={handleRun}
                disabled={!!busy}
                className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white inline-flex items-center gap-1 hover:bg-emerald-700 disabled:bg-gray-400"
              >
                <Play size={14} /> Run against API
              </button>
              <button
                type="button"
                onClick={handleDeliver}
                disabled={!!busy}
                className="text-sm px-3 py-1.5 rounded bg-amber-600 text-white inline-flex items-center gap-1 hover:bg-amber-700 disabled:bg-gray-400"
              >
                <Send size={14} /> Deliver to module
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// FactorCard — minimal editor per factor type.
// ============================================================
function FactorCard({
  factor,
  value,
  onChange,
}: {
  factor: FactorDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = `${factor.label} (${factor.scope}${factor.declaredBy ? ` — ${factor.declaredBy}` : ''})`;

  const renderWeightedEnum = () => {
    const opts = (value as any)?.options || factor.options || [];
    const weights = (value as any)?.weights || factor.defaultWeights || [];
    return (
      <div className="grid grid-cols-2 gap-1 mt-1">
        {opts.map((o: string, i: number) => (
          <div key={o} className="flex items-center gap-2 text-xs">
            <code className="flex-1 truncate">{o}</code>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              className="w-20 px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              value={Array.isArray(weights) ? weights[i] ?? 0 : (weights as any)[o] ?? 0}
              onChange={(e) => {
                const w = [...(Array.isArray(weights) ? weights : opts.map((x: string) => (weights as any)[x] ?? 0))];
                w[i] = parseFloat(e.target.value) || 0;
                onChange({ options: opts, weights: w });
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderLocale = () => {
    const map = ((value as any) || factor.defaultWeights || {}) as Record<string, number>;
    return (
      <div className="grid grid-cols-2 gap-1 mt-1">
        {Object.entries(map).map(([loc, w]) => (
          <div key={loc} className="flex items-center gap-2 text-xs">
            <code className="flex-1 truncate">{loc}</code>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              className="w-20 px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              value={w}
              onChange={(e) => {
                const next = { ...map, [loc]: parseFloat(e.target.value) || 0 };
                onChange(next);
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-2 mb-2 bg-gray-50 dark:bg-gray-900">
      <div className="text-xs font-semibold">{label}</div>
      {factor.description && (
        <div className="text-[11px] text-gray-500 mb-1">{factor.description}</div>
      )}
      {factor.type === 'weightedEnum' && renderWeightedEnum()}
      {factor.type === 'localeDistribution' && renderLocale()}
      {factor.type === 'numericDistribution' && (
        <div className="text-[11px] text-gray-500 italic">
          (Phase 3 — numeric distribution editor coming. Defaults honoured.)
        </div>
      )}
      {factor.type === 'timeWindow' && (
        <div className="text-[11px] text-gray-500 italic">
          (Phase 3 — time-window editor coming. Defaults honoured.)
        </div>
      )}
    </div>
  );
}
