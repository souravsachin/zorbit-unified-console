/**
 * ZMB Module Drafts — authoring UI at /m/zmb-factory/module-drafts.
 *
 * Left rail  = tree of manifest sections.
 * Center     = contextual editor for the selected section.
 * Right rail = live manifest JSON + validation + toolbar (Import / Preview /
 *              Export to server / Download ZIP).
 *
 * Renamed 2026-04-23 from ComposePage. Old /compose path hard-deleted,
 * no Navigate shim. Pre-launch; clean code wins.
 */
import React, { useCallback, useMemo, useReducer, useState } from 'react';
import {
  Download,
  Eye,
  Save,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Factory,
  Server,
  FileText,
  Navigation,
  GitBranch,
  Layers,
  Tag,
  Database,
  Zap,
  Globe,
  Cpu,
} from 'lucide-react';
import JsonViewer from '../../../components/shared/JsonViewer';
import {
  zmbModuleDraftsService,
  type ModuleDraftValidationResult,
} from '../../../services/zmbModuleDrafts';
import type { ModuleDraftManifest, SectionKey } from './types';
import { SECTION_LABELS } from './types';
import { buildDefaultManifest } from './defaultManifest';
import {
  IdentityEditor,
  PlacementEditor,
  MenuEditor,
  FeComponentsEditor,
  BeRoutesEditor,
  DependenciesEditor,
  PrivilegesEditor,
  EntitiesEditor,
  SeedsEditor,
  EventsEditor,
} from './editors';
import { GuideEditor } from './GuideEditor';
import PreviewModal from './PreviewModal';

type Patch = (m: ModuleDraftManifest) => ModuleDraftManifest;

interface State {
  manifest: ModuleDraftManifest;
  selected: SectionKey;
}

type Action =
  | { type: 'apply'; patch: Patch }
  | { type: 'select'; key: SectionKey }
  | { type: 'replace'; manifest: ModuleDraftManifest };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'apply':
      return { ...state, manifest: action.patch(state.manifest) };
    case 'select':
      return { ...state, selected: action.key };
    case 'replace':
      return { ...state, manifest: action.manifest };
    default:
      return state;
  }
}

const SECTION_ICON: Record<SectionKey, any> = {
  identity: Factory,
  placement: Layers,
  menu: Navigation,
  feComponents: Cpu,
  beRoutes: Server,
  dependencies: Globe,
  privileges: CheckCircle2,
  entities: Database,
  seeds: FileText,
  guide: FileText,
  events: Zap,
};

const SECTIONS: SectionKey[] = [
  'identity',
  'placement',
  'menu',
  'feComponents',
  'beRoutes',
  'dependencies',
  'privileges',
  'entities',
  'seeds',
  'guide',
  'events',
];

export default function ModuleDraftsPage() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    manifest: buildDefaultManifest(),
    selected: 'identity' as SectionKey,
  }));

  const [validation, setValidation] = useState<ModuleDraftValidationResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [targetRoot, setTargetRoot] = useState<'dev' | 'uat'>('uat');
  const [fileInputKey, setFileInputKey] = useState(0);

  const apply = useCallback((patch: Patch) => dispatch({ type: 'apply', patch }), []);
  const select = useCallback((key: SectionKey) => dispatch({ type: 'select', key }), []);

  const flashMsg = (kind: 'success' | 'error' | 'info', message: string) => {
    setFlash({ kind, message });
    setTimeout(() => setFlash(null), 5000);
  };

  const handleValidate = useCallback(async () => {
    setBusy('validate');
    try {
      const r = await zmbModuleDraftsService.validate(state.manifest);
      setValidation(r);
      flashMsg(
        r.valid ? 'success' : 'error',
        r.valid
          ? `Validated — ${r.issues.length} warning(s)`
          : `Validation failed — ${r.issues.filter((i) => i.level === 'error').length} error(s)`,
      );
    } catch (e: any) {
      flashMsg('error', `Validation call failed: ${e?.message || e}`);
    } finally {
      setBusy(null);
    }
  }, [state.manifest]);

  const handleExportServer = useCallback(async () => {
    setBusy('export-server');
    try {
      const root =
        targetRoot === 'dev'
          ? '/Users/s/workspace/zorbit/02_repos'
          : '/opt/zorbit-platform/services';
      const res = await zmbModuleDraftsService.materialiseModule(state.manifest, undefined, root);
      flashMsg(
        'success',
        `Exported to ${res.modulePath} (${res.fileCount} files, ${res.audioBundleCount || 0} audio)`,
      );
    } catch (e: any) {
      const errData = e?.response?.data;
      const detail =
        (errData?.issues || []).map((i: any) => `${i.level}: ${i.path} — ${i.message}`).join('; ') ||
        e?.message || 'export failed';
      flashMsg('error', `Export failed — ${detail}`);
    } finally {
      setBusy(null);
    }
  }, [state.manifest, targetRoot]);

  const handleDownloadZip = useCallback(async () => {
    setBusy('zip');
    try {
      const { blob, fileName } = await zmbModuleDraftsService.createExport(state.manifest);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flashMsg('success', `Downloaded ${fileName}`);
    } catch (e: any) {
      flashMsg('error', `Zip download failed: ${e?.message || e}`);
    } finally {
      setBusy(null);
    }
  }, [state.manifest]);

  const handleImport = useCallback(async (file: File) => {
    setBusy('import');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await zmbModuleDraftsService.createDraft(parsed);
      dispatch({ type: 'replace', manifest: res.manifest });
      setValidation(res.validation);
      flashMsg('success', `Imported ${res.manifest?.moduleId || file.name} (${res.hash})`);
    } catch (e: any) {
      flashMsg('error', `Import failed: ${e?.message || e}`);
    } finally {
      setBusy(null);
      setFileInputKey((k) => k + 1);
    }
  }, []);

  const handleNew = useCallback(() => {
    if (confirm('Discard current manifest and start a fresh one?')) {
      dispatch({ type: 'replace', manifest: buildDefaultManifest() });
      setValidation(null);
    }
  }, []);

  const renderEditor = useMemo(() => {
    switch (state.selected) {
      case 'identity':
        return <IdentityEditor manifest={state.manifest} apply={apply} />;
      case 'placement':
        return <PlacementEditor manifest={state.manifest} apply={apply} />;
      case 'menu':
        return <MenuEditor manifest={state.manifest} apply={apply} />;
      case 'feComponents':
        return <FeComponentsEditor manifest={state.manifest} apply={apply} />;
      case 'beRoutes':
        return <BeRoutesEditor manifest={state.manifest} apply={apply} />;
      case 'dependencies':
        return <DependenciesEditor manifest={state.manifest} apply={apply} />;
      case 'privileges':
        return <PrivilegesEditor manifest={state.manifest} apply={apply} />;
      case 'entities':
        return <EntitiesEditor manifest={state.manifest} apply={apply} />;
      case 'seeds':
        return <SeedsEditor manifest={state.manifest} apply={apply} />;
      case 'guide':
        return <GuideEditor manifest={state.manifest} apply={apply} />;
      case 'events':
        return <EventsEditor manifest={state.manifest} apply={apply} />;
      default:
        return null;
    }
  }, [state.manifest, state.selected, apply]);

  const issueCount = validation
    ? {
        errors: validation.issues.filter((i) => i.level === 'error').length,
        warnings: validation.issues.filter((i) => i.level === 'warning').length,
      }
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Factory size={18} className="text-indigo-600" />
        <h1 className="text-lg font-semibold">ZMB Module Drafts</h1>
        <span className="text-xs text-gray-400 hidden md:inline">
          — author a Zorbit module manifest end-to-end
        </span>
        <div className="flex-1" />

        <button
          type="button"
          onClick={handleNew}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          New
        </button>

        <label className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 inline-flex items-center gap-1 cursor-pointer">
          <Upload size={14} /> Import
          <input
            key={fileInputKey}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
        </label>

        <button
          type="button"
          onClick={handleValidate}
          disabled={!!busy}
          className="text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 inline-flex items-center gap-1"
        >
          <CheckCircle2 size={14} /> Validate
        </button>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 inline-flex items-center gap-1"
        >
          <Eye size={14} /> Preview
        </button>

        <select
          value={targetRoot}
          onChange={(e) => setTargetRoot(e.target.value as any)}
          className="text-xs px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          title="Target root for server export"
        >
          <option value="uat">Server: /opt/zorbit-platform/services</option>
          <option value="dev">Dev: /Users/s/workspace/zorbit/02_repos</option>
        </select>

        <button
          type="button"
          onClick={handleExportServer}
          disabled={!!busy}
          className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 inline-flex items-center gap-1"
        >
          <Save size={14} /> Export to server
        </button>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={!!busy}
          className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400 inline-flex items-center gap-1"
        >
          <Download size={14} /> Download ZIP
        </button>
      </div>

      {flash && (
        <div
          className={`px-4 py-2 text-sm border-b ${
            flash.kind === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : flash.kind === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          {flash.message}
        </div>
      )}

      {/* Body: 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left rail — tree */}
        <div className="w-56 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-y-auto py-2">
          {SECTIONS.map((k) => {
            const Icon = SECTION_ICON[k];
            const isActive = state.selected === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => select(k)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={14} />
                {SECTION_LABELS[k]}
              </button>
            );
          })}
        </div>

        {/* Center — editor */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-950">{renderEditor}</div>

        {/* Right rail — JSON preview + validation */}
        <div className="w-[28rem] border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <FileText size={14} />
            <span className="text-sm font-semibold">Live manifest</span>
            <div className="flex-1" />
            {issueCount && (
              <>
                {issueCount.errors > 0 ? (
                  <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700">
                    <XCircle size={12} /> {issueCount.errors} error{issueCount.errors !== 1 && 's'}
                  </span>
                ) : (
                  <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={12} /> valid
                  </span>
                )}
                {issueCount.warnings > 0 && (
                  <span className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 ml-1">
                    <AlertTriangle size={12} /> {issueCount.warnings}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <JsonViewer value={state.manifest as any} />
          </div>
          {validation && validation.issues.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto p-2 text-xs">
              {validation.issues.map((i, idx) => (
                <div
                  key={idx}
                  className={`mb-1 px-2 py-1 rounded flex items-start gap-2 ${
                    i.level === 'error'
                      ? 'bg-red-50 text-red-800'
                      : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  {i.level === 'error' ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                  <div>
                    <div className="font-mono text-[10px]">{i.path}</div>
                    <div>{i.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewOpen && (
        <PreviewModal manifest={state.manifest} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
}
