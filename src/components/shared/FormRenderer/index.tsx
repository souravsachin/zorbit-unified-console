/* FormRenderer — `zorbit-pfs-form_builder:FormRenderer`.
 *
 * A platform-wide, cross-module exported component that renders a
 * form-builder-defined form by `formId` (hashId) or `formSlug`.
 *
 * Usage (manifest / programmatic):
 *   <FormRenderer formId="FRM-IDT-INVITE-USER" initialData={row}
 *                 submitRouteOverride="POST /api/identity/..."
 *                 onSubmitted={(data) => {...}} />
 *
 * Fetch path:
 *   - If formSlug: GET /api/form-builder/api/v1/O/{orgId}/form-builder/forms?...
 *     then match by slug (tolerates missing-by-slug).
 *   - If formId / hashId: the same listing endpoint + match on hashId.
 *
 * If the form definition 404s, render a helpful message:
 *   "Form FRM-… not found. Ask the form author to publish it first."
 *
 * Submit path precedence (first match wins):
 *   1. `submitRoute` prop (explicit override from caller, e.g. DataTable
 *      passes the tableAction / rowAction's beRoute)
 *   2. form.submitRoute from the form definition (if form-builder supplies)
 *   3. none → just call onSubmitted({ data }) and let the caller handle it.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Formio } from '@formio/js';
import '@formio/js/dist/formio.form.min.css';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';

interface FormDefinition {
  _id?: string;
  hashId: string;
  organizationHashId?: string;
  name: string;
  slug: string;
  description?: string;
  version?: number;
  status?: string;
  formType?: string;
  schema: {
    display: string;
    components: any[];
  };
  submitRoute?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormRendererProps {
  /** FRM-…. Matched against hashId. */
  formId?: string;
  /** Slug fallback. */
  formSlug?: string;
  /** Pre-fill form with these values (row from DataTable etc.) */
  initialData?: Record<string, unknown>;
  /** Full override: `POST /api/identity/api/v1/O/{{org_id}}/users`. */
  submitRoute?: string;
  /** Called on successful submission with the backend response body. */
  onSubmitted?: (response: any, data: Record<string, unknown>) => void;
  /** Called on cancel or close. */
  onCancel?: () => void;
  /** readOnly pass-through for formio. */
  readOnly?: boolean;
  /** When embedded in a modal, hide the outer heading; caller renders it. */
  hideHeader?: boolean;
}

/** Try multiple URL shapes to find the form definition. The form-builder
 *  service exposes:
 *    - /api/form-builder/api/v1/O/:orgId/form-builder/forms    (list, authed)
 *    - /api/form-builder/api/v1/O/:orgId/form-builder/forms/:slug (by slug)
 *    - /api/form-builder/api/v1/G/form-builder/templates       (templates, public)
 *  We try direct-by-slug first, then fall back to list-and-match.
 */
async function fetchFormDefinition(
  orgId: string,
  formId?: string,
  formSlug?: string,
): Promise<FormDefinition | null> {
  const base = '/api/form-builder/api/v1';

  // 1) Try GET /O/{orgId}/form-builder/forms/{slug}
  if (formSlug) {
    try {
      const res = await api.get(`${base}/O/${orgId}/form-builder/forms/${formSlug}`);
      if (res.data) return (res.data?.form || res.data) as FormDefinition;
    } catch {
      /* fall through */
    }
  }
  // Try the same direct-by-slug using formId as slug (some callers may
  // have lower-cased slugs matching the id).
  if (formId) {
    try {
      const res = await api.get(
        `${base}/O/${orgId}/form-builder/forms/${String(formId).toLowerCase()}`,
      );
      if (res.data) return (res.data?.form || res.data) as FormDefinition;
    } catch {
      /* fall through */
    }
  }

  // 2) List + match
  try {
    const res = await api.get(`${base}/O/${orgId}/form-builder/forms`);
    const list: FormDefinition[] = res.data?.forms || res.data?.items || res.data || [];
    if (Array.isArray(list)) {
      if (formId) {
        const byId = list.find((f) => f.hashId === formId);
        if (byId) return byId;
      }
      if (formSlug) {
        const bySlug = list.find((f) => f.slug === formSlug);
        if (bySlug) return bySlug;
      }
    }
  } catch {
    /* fall through */
  }

  // 3) Last-resort: template catalogue (global, public — no auth).
  try {
    const res = await api.get(`${base}/G/form-builder/templates`);
    const list: FormDefinition[] = res.data?.templates || res.data?.items || res.data || [];
    if (Array.isArray(list)) {
      if (formId) {
        const byId = list.find((f) => f.hashId === formId);
        if (byId) return byId;
      }
      if (formSlug) {
        const bySlug = list.find((f) => f.slug === formSlug);
        if (bySlug) return bySlug;
      }
    }
  } catch {
    /* fall through */
  }
  return null;
}

const FormRenderer: React.FC<FormRendererProps> = ({
  formId,
  formSlug,
  initialData,
  submitRoute,
  onSubmitted,
  onCancel,
  readOnly = false,
  hideHeader = false,
}) => {
  const { orgId } = useAuth();
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setForm(null);
    fetchFormDefinition(orgId, formId, formSlug)
      .then((def) => {
        if (cancelled) return;
        if (!def) {
          setLoadError(
            `Form ${formId || formSlug} not found. Ask the form author to publish it first.`,
          );
        } else {
          setForm(def);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.message || 'Failed to load form definition');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formId, formSlug, orgId]);

  const handleSubmission = useCallback(
    async (data: Record<string, unknown>): Promise<void> => {
      setSubmitError(null);
      setSubmitting(true);
      try {
        const route = submitRoute || form?.submitRoute;
        let resp: any = { data };
        if (route) {
          const [method, rawUrl] = route.includes(' ')
            ? (route.split(' ', 2) as [string, string])
            : ['POST', route];
          const url = rawUrl
            .replace(/\{\{org_id\}\}/g, orgId)
            .replace(/\{([^}]+)\}/g, (_m, k) => {
              const v = (initialData as any)?.[k] ?? (data as any)[k];
              return v == null ? '' : String(v);
            });
          const res = await api.request({
            method: method.toLowerCase() as any,
            url,
            data,
          });
          resp = res.data;
        }
        setSubmitted(true);
        onSubmitted?.(resp, data);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('[FormRenderer] submit failed', err);
        setSubmitError(
          err?.response?.data?.message || err?.message || 'Submission failed',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [submitRoute, form, orgId, initialData, onSubmitted],
  );

  // Render form via formio when we have a definition.
  useEffect(() => {
    if (!form || !containerRef.current) return;
    let cancelled = false;
    containerRef.current.innerHTML = '';
    Formio.createForm(containerRef.current, form.schema, {
      readOnly,
      noAlerts: false,
    })
      .then((instance: any) => {
        if (cancelled) return;
        instanceRef.current = instance;
        if (initialData) {
          try {
            instance.submission = { data: initialData };
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[FormRenderer] could not pre-fill', e);
          }
        }
        instance.on('submit', (sub: { data: Record<string, unknown> }) => {
          void handleSubmission(sub.data);
        });
      })
      .catch((err: any) => {
        // eslint-disable-next-line no-console
        console.error('[FormRenderer] createForm failed', err);
        setLoadError('Could not render form (check console for formio error).');
      });
    return () => {
      cancelled = true;
      if (instanceRef.current?.destroy) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          /* ignore */
        }
      }
      instanceRef.current = null;
    };
  }, [form, readOnly, initialData, handleSubmission]);

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center text-sm text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading form…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="text-green-600 dark:text-green-400 font-medium">Submitted</div>
        <p className="text-sm text-gray-500 mt-1">
          {form?.name ? `${form.name} ` : ''}saved successfully.
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hideHeader && form && (
        <div>
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {form.name}
          </div>
          {form.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{form.description}</div>
          )}
        </div>
      )}
      {submitError && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
          {submitError}
        </div>
      )}
      {submitting && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Submitting…
        </div>
      )}
      <div ref={containerRef} className="formio-form-container" />
    </div>
  );
};

export default FormRenderer;
