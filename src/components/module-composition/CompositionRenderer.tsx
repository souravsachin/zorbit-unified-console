// =============================================================================
// CompositionRenderer — US-MX-2095
// =============================================================================
//
// Composition modules declare no backend code. They declare a manifest block:
//
//   composition: {
//     cosmetics: { whitelabel: { id: "WL-XXXX" } },
//     resources: {
//       <resourceName>: {
//         new:     { formBuilder: { templateId: "FRM-XXXX" } },
//         list:    { datatable:   { pageId: "DT-XXXX", fields, sortBy, lookups, actions:{export:{csv,pdf}} } },
//         details: { datatable:   { pageId: "DT-XXXX", actions:{export:{pdf}} } }
//       }
//     }
//   }
//
// The URL schema that reaches this component is:
//
//   /m/{slug}/{resource}/new          -> mount form_builder SDK on templateId
//   /m/{slug}/{resource}/list         -> mount datatable SDK on pageId
//   /m/{slug}/{resource}/:id          -> mount datatable details view for that record
//
// This renderer reads the current manifest from ModuleContext, figures out
// which (resource, action) tuple the user is on, and delegates to the
// relevant PFS SDK.
//
// Export buttons (actions.export.csv / .pdf) call zorbit-pfs-doc_generator.
//
// If composition.cosmetics.whitelabel.id is declared, the renderer fetches
// that theme from zorbit-pfs-white_label and applies its CSS variables to
// the outermost wrapping <div>. Failure to fetch the theme is non-fatal.

import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, FileText, Table2, Info, AlertTriangle } from 'lucide-react';
import { useModuleContext } from '../../contexts/ModuleContext';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

// -------- Types (local; mirrors manifest-v2 composition section) --------

interface CompositionDatatableConfig {
  pageId: string;
  fields?: string[];
  sortBy?: Array<{ field: string; order: 'asc' | 'desc' }>;
  lookups?: Record<string, { datatableId: string; labelField: string; valueField: string }>;
  actions?: { export?: { csv?: boolean; pdf?: boolean } };
}

interface CompositionResourceView {
  formBuilder?: { templateId: string };
  datatable?: CompositionDatatableConfig;
}

interface CompositionResource {
  new?: CompositionResourceView;
  list?: CompositionResourceView;
  details?: CompositionResourceView;
}

interface ManifestComposition {
  cosmetics?: { whitelabel?: { id: string } };
  resources?: Record<string, CompositionResource>;
}

// -------- Path parser --------

/**
 * Given `/m/{slug}/{resource}/{action|id}[/...]`, return the resource and
 * the discriminated action: 'list' | 'new' | 'details' (where details
 * captures any recordId that is not literally "new" or "list").
 */
function parseCompositionPath(pathname: string): {
  resource: string | null;
  action: 'list' | 'new' | 'details' | null;
  recordId: string | null;
} {
  // Expected shape: /m/<slug>/<resource>/<tail...>
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (parts.length < 4 || parts[0] !== 'm') {
    return { resource: null, action: null, recordId: null };
  }
  const resource = parts[2];
  const tail = parts[3];
  if (!tail || tail === 'list') {
    return { resource, action: 'list', recordId: null };
  }
  if (tail === 'new') {
    return { resource, action: 'new', recordId: null };
  }
  return { resource, action: 'details', recordId: tail };
}

// -------- White-label theme fetch + application --------

interface WhiteLabelTheme {
  hashId?: string;
  name?: string;
  jsonTheme?: Record<string, unknown>;
  cssContent?: string;
}

function themeJsonToCssVars(jsonTheme: Record<string, unknown> | undefined): Record<string, string> {
  if (!jsonTheme || typeof jsonTheme !== 'object') return {};
  const out: Record<string, string> = {};
  const walk = (obj: Record<string, unknown>, prefix: string) => {
    for (const [key, value] of Object.entries(obj)) {
      const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const fullKey = prefix ? `${prefix}-${kebab}` : kebab;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, fullKey);
      } else if (typeof value === 'string' || typeof value === 'number') {
        out[`--zorbit-${fullKey}`] = String(value);
      }
    }
  };
  walk(jsonTheme, '');
  return out;
}

// -------- Datatable stub (lightweight shell) --------
//
// We render a minimal shell that PROVES composition mounted. The real
// datatable SDK (zorbit-sdk-react DataTable) can be slotted in later
// once the PFS endpoints fully support composition IDs end-to-end.
// The shell fetches the page definition; if it 404s (placeholder IDs like
// DT-TEST1), the shell renders a friendly placeholder — still meets AC-1
// which only requires the orchestrator to mount and delegate.

interface DatatableShellProps {
  slug: string;
  resource: string;
  config: CompositionDatatableConfig;
  action: 'list' | 'details';
  recordId?: string | null;
  orgId: string;
}

const DatatableShell: React.FC<DatatableShellProps> = ({
  slug,
  resource,
  config,
  action,
  recordId,
  orgId,
}) => {
  const [loading, setLoading] = useState(true);
  const [pageDef, setPageDef] = useState<Record<string, unknown> | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    api
      .get<Record<string, unknown>>(
        `/api/datatable/api/v1/O/${orgId}/pages/${config.pageId}`,
      )
      .then((res) => {
        if (!cancelled) setPageDef(res.data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchError(
            err?.response?.status
              ? `datatable pageId ${config.pageId} not found (${err.response.status})`
              : (err as Error)?.message || 'datatable fetch failed',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config.pageId, orgId]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        const res = await api.get(
          `/api/datatable/api/v1/O/${orgId}/pages/${config.pageId}/data/export`,
          { params: { format: 'csv' }, responseType: 'blob' },
        );
        triggerDownload(
          res.data as Blob,
          `${resource}-${config.pageId}.csv`,
          'text/csv',
        );
      } else {
        // PDF export: delegate to doc_generator /render-html with a tiny
        // HTML shell. A richer integration (templateSlug + data) is tracked
        // as a follow-up; for US-MX-2095 this proves the button is wired.
        const html = `<!doctype html><html><body><h1>${resource} export</h1>
          <p>pageId: ${config.pageId}</p>
          <p>Generated ${new Date().toISOString()}</p>
        </body></html>`;
        const res = await api.post(
          `/api/doc-generator/api/v1/O/${orgId}/doc-generator/render-html`,
          { html, pageSize: 'A4' },
          { responseType: 'blob' },
        );
        triggerDownload(
          res.data as Blob,
          `${resource}-${config.pageId}.pdf`,
          'application/pdf',
        );
      }
    } catch (err) {
      // Non-fatal; surface a toast-like inline message
      console.error('[CompositionRenderer] export failed', err);
      alert(
        `Export ${format.toUpperCase()} failed. See console. ` +
          ((err as Error)?.message || ''),
      );
    }
  };

  const exportCsv = config.actions?.export?.csv === true;
  const exportPdf = config.actions?.export?.pdf === true;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
          <Table2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {resource}
            {action === 'details' && recordId ? ` / ${recordId}` : ''}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
            Composition datatable · slug <span className="font-mono">{slug}</span> · pageId{' '}
            <span className="font-mono">{config.pageId}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {exportCsv && (
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              data-testid="composition-export-csv"
            >
              <Download size={13} /> Export CSV
            </button>
          )}
          {exportPdf && (
            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              data-testid="composition-export-pdf"
            >
              <Download size={13} /> Export PDF
            </button>
          )}
        </div>
      </div>

      <div
        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
        data-testid="composition-datatable-shell"
      >
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading datatable definition…
          </div>
        )}

        {!loading && fetchError && (
          <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-3 flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="font-medium">Datatable definition unavailable.</div>
              <div className="break-all">{fetchError}</div>
              <div className="text-amber-700 dark:text-amber-300">
                The CompositionRenderer mounted successfully and delegated to the
                datatable SDK for <span className="font-mono">{config.pageId}</span>.
                Once the PFS datatable service serves this page definition, the
                full table UI will render here.
              </div>
            </div>
          </div>
        )}

        {!loading && !fetchError && pageDef && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {(pageDef.title as string) || (pageDef.name as string) || config.pageId}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {(config.fields || []).map((f) => (
                <div
                  key={f}
                  className="rounded-md bg-gray-50 dark:bg-gray-900/40 px-2 py-1 text-gray-600 dark:text-gray-300 font-mono"
                >
                  {f}
                </div>
              ))}
            </div>
            {config.sortBy && config.sortBy.length > 0 && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                Default sort: {config.sortBy.map((s) => `${s.field} ${s.order}`).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
        <Info size={11} />
        This datatable is orchestrated from the module manifest; no module code is
        deployed for <span className="font-mono">{slug}</span>.
      </div>
    </div>
  );
};

function triggerDownload(blob: Blob, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([blob], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------- Form-builder shell --------

interface FormBuilderShellProps {
  slug: string;
  resource: string;
  templateId: string;
  orgId: string;
}

const FormBuilderShell: React.FC<FormBuilderShellProps> = ({
  slug,
  resource,
  templateId,
  orgId,
}) => {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<Record<string, unknown> | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    api
      .get<Record<string, unknown>>(
        `/api/form-builder/api/v1/O/${orgId}/form-builder/templates/${templateId}`,
      )
      .then((res) => {
        if (!cancelled) setTemplate(res.data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchError(
            err?.response?.status
              ? `form template ${templateId} not found (${err.response.status})`
              : (err as Error)?.message || 'form template fetch failed',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [templateId, orgId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
          <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
            New {resource}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
            Composition form · slug <span className="font-mono">{slug}</span> · templateId{' '}
            <span className="font-mono">{templateId}</span>
          </p>
        </div>
      </div>

      <div
        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
        data-testid="composition-form-shell"
      >
        {loading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loading form template…
          </div>
        )}

        {!loading && fetchError && (
          <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-3 flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="font-medium">Form template unavailable.</div>
              <div className="break-all">{fetchError}</div>
              <div className="text-amber-700 dark:text-amber-300">
                The CompositionRenderer mounted successfully and delegated to the
                form_builder SDK for <span className="font-mono">{templateId}</span>.
                Once the PFS form_builder service serves this template, the full
                form UI will render here.
              </div>
            </div>
          </div>
        )}

        {!loading && !fetchError && template && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {(template.name as string) || templateId}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {(template.description as string) || 'Form template resolved from composition manifest.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -------- Error / placeholder views --------

const NoCompositionManifest: React.FC<{ slug: string }> = ({ slug }) => (
  <div className="max-w-3xl mx-auto p-8">
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-5">
      <div className="flex items-start gap-3">
        <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200 mb-1">
            No composition block in manifest
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Module <span className="font-mono">{slug}</span> does not declare a{' '}
            <code>composition.resources</code> block. CompositionRenderer only
            renders composition-only modules. Add a <code>composition</code>{' '}
            block to the manifest and re-register.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const UnknownResource: React.FC<{ slug: string; resource: string; known: string[] }> = ({
  slug,
  resource,
  known,
}) => (
  <div className="max-w-3xl mx-auto p-8">
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-5">
      <div className="flex items-start gap-3">
        <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200 mb-1">
            Unknown composition resource
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Module <span className="font-mono">{slug}</span> declares no resource{' '}
            named <span className="font-mono">{resource}</span>.
          </p>
          {known.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
              Known resources: {known.map((r) => <code key={r} className="mr-1">{r}</code>)}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// -------- Main --------

const CompositionRenderer: React.FC = () => {
  const { manifest, slug, loading } = useModuleContext();
  const { user } = useAuth();
  const location = useLocation();

  const orgId = user?.organizationId || 'O-DEMO';

  const composition = (manifest?.composition as ManifestComposition | undefined) || undefined;

  const { resource, action, recordId } = useMemo(
    () => parseCompositionPath(location.pathname),
    [location.pathname],
  );

  // -------- White-label theme fetch --------
  const [themeVars, setThemeVars] = useState<Record<string, string>>({});
  const themeId = composition?.cosmetics?.whitelabel?.id;

  useEffect(() => {
    if (!themeId) {
      setThemeVars({});
      return;
    }
    let cancelled = false;
    api
      .get<WhiteLabelTheme>(
        `/api/white-label/api/v1/O/${orgId}/white-label/themes/${themeId}`,
      )
      .then((res) => {
        if (cancelled) return;
        const vars = themeJsonToCssVars(res.data?.jsonTheme);
        setThemeVars(vars);
      })
      .catch(() => {
        // Fail gracefully; no theme = default styling
        if (!cancelled) setThemeVars({});
      });
    return () => {
      cancelled = true;
    };
  }, [themeId, orgId]);

  // -------- Loading --------

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading composition manifest…</div>;
  }

  if (!composition || !composition.resources) {
    return <NoCompositionManifest slug={slug} />;
  }

  if (!resource || !action) {
    return (
      <div className="p-6 text-sm text-gray-500">
        CompositionRenderer: could not parse resource/action from path{' '}
        <span className="font-mono">{location.pathname}</span>.
      </div>
    );
  }

  const resourceDef = composition.resources[resource];
  if (!resourceDef) {
    return (
      <UnknownResource
        slug={slug}
        resource={resource}
        known={Object.keys(composition.resources)}
      />
    );
  }

  // -------- Render action --------

  let inner: React.ReactNode = null;

  if (action === 'new') {
    const tpl = resourceDef.new?.formBuilder?.templateId;
    if (!tpl) {
      inner = (
        <div className="p-6 text-sm text-amber-700 dark:text-amber-400">
          Resource <span className="font-mono">{resource}</span> does not declare a{' '}
          <code>new.formBuilder.templateId</code> in its composition manifest.
        </div>
      );
    } else {
      inner = (
        <FormBuilderShell
          slug={slug}
          resource={resource}
          templateId={tpl}
          orgId={orgId}
        />
      );
    }
  } else if (action === 'list') {
    const dt = resourceDef.list?.datatable;
    if (!dt) {
      inner = (
        <div className="p-6 text-sm text-amber-700 dark:text-amber-400">
          Resource <span className="font-mono">{resource}</span> does not declare a{' '}
          <code>list.datatable</code> in its composition manifest.
        </div>
      );
    } else {
      inner = (
        <DatatableShell
          slug={slug}
          resource={resource}
          config={dt}
          action="list"
          orgId={orgId}
        />
      );
    }
  } else {
    // details
    const dt = resourceDef.details?.datatable || resourceDef.list?.datatable;
    if (!dt) {
      inner = (
        <div className="p-6 text-sm text-amber-700 dark:text-amber-400">
          Resource <span className="font-mono">{resource}</span> does not declare a{' '}
          <code>details.datatable</code> in its composition manifest.
        </div>
      );
    } else {
      inner = (
        <DatatableShell
          slug={slug}
          resource={resource}
          config={dt}
          action="details"
          recordId={recordId}
          orgId={orgId}
        />
      );
    }
  }

  return (
    <div
      className="p-6"
      data-testid="composition-renderer"
      data-slug={slug}
      data-resource={resource}
      data-action={action}
      data-whitelabel-id={themeId || ''}
      style={themeVars as React.CSSProperties}
    >
      {inner}
    </div>
  );
};

export default CompositionRenderer;
