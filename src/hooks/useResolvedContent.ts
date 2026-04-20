import { useEffect, useRef, useState } from 'react';

/**
 * US-MF-2100 — allow manifest blocks to reference external content via `$src`.
 *
 * If a manifest value looks like `{ "$src": "/api/...json" }`, this hook
 * fetches that URL and returns the parsed JSON body. Otherwise the value is
 * returned unchanged, synchronously.
 *
 * Caching: results are cached by `${moduleVersion}::${$src}` for the life of
 * the SPA session. When the manifest version changes, old cache entries
 * become unreachable and eventually fall out of scope; within a single
 * version the same URL is fetched at most once per session.
 *
 * Schema caveats:
 * - `$src` is OPTIONAL. Inline data still works.
 * - Nested `$src` is NOT supported in v1. One level only.
 * - `$src` URLs must be same-origin. No cross-origin fetches.
 *
 * Usage:
 *   const { data, loading, error } = useResolvedContent<Slide[]>(
 *     manifest?.guide?.slides?.deck,
 *     manifest?.version || '0',
 *   );
 */

export interface SrcRef {
  $src: string;
}

export interface ResolvedContentState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
}

/**
 * Shape guard — does `v` look like `{ "$src": "url" }`?
 */
function isSrcRef(v: unknown): v is SrcRef {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as Record<string, unknown>).$src === 'string'
  );
}

/**
 * Module-scoped cache. Key = `${version}::${url}`.
 * Stored value is a Promise<unknown> so concurrent consumers share one fetch.
 */
const resolverCache = new Map<string, Promise<unknown>>();

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const token = localStorage.getItem('zorbit_token');
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
    }
    return await res.json();
  } finally {
    clearTimeout(tid);
  }
}

export function useResolvedContent<T>(
  value: T | SrcRef | undefined | null,
  moduleVersion: string | undefined,
): ResolvedContentState<T> {
  // Synchronous initial state — if value is already inline, the hook must
  // return data on the very first render (no flash of "Loading").
  const initialInline: T | undefined =
    value == null ? undefined : isSrcRef(value) ? undefined : (value as T);
  const initialLoading = value != null && isSrcRef(value);

  const [state, setState] = useState<ResolvedContentState<T>>({
    data: initialInline,
    loading: initialLoading,
    error: null,
  });

  // Track the cache key we're currently waiting on so a quick $src change
  // doesn't race and land the earlier response.
  const activeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Inline case — value may have changed, sync state and bail.
    if (value == null) {
      activeKeyRef.current = null;
      setState({ data: undefined, loading: false, error: null });
      return;
    }

    if (!isSrcRef(value)) {
      activeKeyRef.current = null;
      setState({ data: value as T, loading: false, error: null });
      return;
    }

    const url = value.$src;
    const version = moduleVersion || '0';
    const key = `${version}::${url}`;
    activeKeyRef.current = key;

    setState((s) => ({ data: s.data, loading: true, error: null }));

    const existing = resolverCache.get(key);
    const p = existing ?? fetchWithTimeout(url, 10_000);
    if (!existing) resolverCache.set(key, p);

    p.then(
      (data) => {
        if (activeKeyRef.current !== key) return; // stale
        setState({ data: data as T, loading: false, error: null });
      },
      (err: unknown) => {
        if (activeKeyRef.current !== key) return;
        // Evict failed entries so a retry on remount actually retries.
        if (resolverCache.get(key) === p) resolverCache.delete(key);
        const e = err instanceof Error ? err : new Error(String(err));
        setState({ data: undefined, loading: false, error: e });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Re-run when the $src URL or the module version changes. Stringify
    // object values so a re-created inline array doesn't cause loops.
    isSrcRef(value) ? value.$src : typeof value === 'object' ? JSON.stringify(value) : value,
    moduleVersion,
  ]);

  return state;
}

/**
 * Test-only: clear the internal resolver cache. Not exported from any
 * barrel; only used by diagnostics or unit tests.
 */
export function __clearResolverCache(): void {
  resolverCache.clear();
}

export default useResolvedContent;
