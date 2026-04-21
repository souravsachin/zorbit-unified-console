import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PlayCircle,
  PauseCircle,
  Trash2,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Terminal as TerminalIcon,
} from 'lucide-react';
import api from '../../services/api';

/**
 * SeederConsole — live SSE-powered terminal UI for the Zorbit seeder.
 *
 * Kernel-style DEBUGLEVEL colouring (RFC 5424 syslog):
 *   DEBUG  gray      NOTICE amber
 *   INFO   blue      WARN   orange
 *   ERR    red       CRIT   red-800
 *   ALERT  fuchsia   EMERG  fuchsia-900
 *
 * Subscribes to /api/seeder/api/v1/G/seed/stream via EventSource.
 * Exposes three trigger buttons:
 *   1. Run system-min (all modules)
 *   2. Run demo (all modules, lenient DEMO- prefix mode)
 *   3. Delete demo (destruction-guarded)
 */

type Level =
  | 'DEBUG'
  | 'INFO'
  | 'NOTICE'
  | 'WARN'
  | 'ERR'
  | 'CRIT'
  | 'ALERT'
  | 'EMERG';

interface SeedEvent {
  runId?: string;
  ts: string;
  level: Level;
  module: string | null;
  phase: string;
  message: string;
  details?: Record<string, unknown>;
}

const LEVEL_STYLE: Record<Level, { text: string; label: string; bg: string }> = {
  DEBUG:  { text: 'text-gray-400',       label: 'DEBUG',  bg: 'bg-gray-100 dark:bg-gray-800' },
  INFO:   { text: 'text-blue-400',       label: 'INFO',   bg: 'bg-blue-100 dark:bg-blue-900/40' },
  NOTICE: { text: 'text-amber-400',      label: 'NOTICE', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  WARN:   { text: 'text-orange-400',     label: 'WARN',   bg: 'bg-orange-100 dark:bg-orange-900/40' },
  ERR:    { text: 'text-red-400',        label: 'ERR',    bg: 'bg-red-100 dark:bg-red-900/40' },
  CRIT:   { text: 'text-red-500',        label: 'CRIT',   bg: 'bg-red-200 dark:bg-red-900/60' },
  ALERT:  { text: 'text-fuchsia-400',    label: 'ALERT',  bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40' },
  EMERG:  { text: 'text-fuchsia-600',    label: 'EMERG',  bg: 'bg-fuchsia-200 dark:bg-fuchsia-900/60' },
};

const ALL_LEVELS: Level[] = [
  'DEBUG', 'INFO', 'NOTICE', 'WARN', 'ERR', 'CRIT', 'ALERT', 'EMERG',
];

const SSE_URL = '/api/seeder/api/v1/G/seed/stream';
const API_BASE = '/api/seeder/api/v1/G/seed';

const SeederConsole: React.FC = () => {
  const [events, setEvents] = useState<SeedEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const [filterLevels, setFilterLevels] = useState<Set<Level>>(
    () => new Set(ALL_LEVELS),
  );
  const [filterModule, setFilterModule] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null);
  const bufferRef = useRef<SeedEvent[]>([]);
  const pausedRef = useRef(paused);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // --- SSE subscription -----------------------------------------------
  useEffect(() => {
    const es = new EventSource(SSE_URL);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (msg) => {
      try {
        const parsed: SeedEvent = JSON.parse(msg.data);
        if (pausedRef.current) {
          bufferRef.current.push(parsed);
          if (bufferRef.current.length > 2000) {
            bufferRef.current.splice(0, bufferRef.current.length - 2000);
          }
        } else {
          setEvents((prev) => {
            const next = [...prev, parsed];
            if (next.length > 2000) next.splice(0, next.length - 2000);
            return next;
          });
        }
      } catch {
        // ignore malformed events
      }
    };
    return () => es.close();
  }, []);

  // Drain buffer when unpaused
  useEffect(() => {
    if (!paused && bufferRef.current.length > 0) {
      const drained = bufferRef.current.splice(0);
      setEvents((prev) => {
        const next = [...prev, ...drained];
        if (next.length > 2000) next.splice(0, next.length - 2000);
        return next;
      });
    }
  }, [paused]);

  // Autoscroll
  useEffect(() => {
    if (logRef.current && !paused) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events, paused]);

  const filtered = useMemo(() => {
    const mod = filterModule.trim().toLowerCase();
    return events.filter((e) => {
      if (!filterLevels.has(e.level)) return false;
      if (mod && (!e.module || !e.module.toLowerCase().includes(mod))) return false;
      return true;
    });
  }, [events, filterLevels, filterModule]);

  const counts = useMemo(() => {
    const c = {
      total: events.length,
      err: 0, warn: 0, info: 0, debug: 0,
    };
    for (const e of events) {
      if (e.level === 'ERR' || e.level === 'CRIT' || e.level === 'ALERT' || e.level === 'EMERG') c.err++;
      else if (e.level === 'WARN' || e.level === 'NOTICE') c.warn++;
      else if (e.level === 'INFO') c.info++;
      else c.debug++;
    }
    return c;
  }, [events]);

  const toggleLevel = (lv: Level) => {
    setFilterLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lv)) next.delete(lv);
      else next.add(lv);
      return next;
    });
  };

  // --- Trigger actions -------------------------------------------------
  const trigger = async (kind: 'system-min' | 'demo' | 'delete-demo') => {
    setBusy(kind);
    setMessage(null);
    try {
      if (kind === 'system-min') {
        const res = await api.post(`${API_BASE}/system-min?scope=all`);
        setMessage({ text: `system-min run ${res.data?.runId} started`, tone: 'ok' });
      } else if (kind === 'demo') {
        const res = await api.post(`${API_BASE}/demo?scope=all`);
        setMessage({ text: `demo run ${res.data?.runId} started`, tone: 'ok' });
      } else {
        const ok = window.confirm(
          'DESTRUCTIVE: remove all DEMO- prefixed rows across every module.\n\n' +
            'This is irreversible. Proceed?',
        );
        if (!ok) return;
        const res = await api.delete(
          `${API_BASE}/demo?scope=all&confirm=yes&confirm-module=all`,
        );
        setMessage({ text: `delete-demo run ${res.data?.runId} started`, tone: 'ok' });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setMessage({
        text: e.response?.data?.message || e.message || 'request failed',
        tone: 'err',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-emerald-500" />
          <h1 className="text-xl font-semibold">Seeder Console</h1>
          <span
            className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
              connected
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {connected ? 'SSE live' : 'SSE disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => trigger('system-min')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 disabled:opacity-50"
          >
            {busy === 'system-min' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            Run system-min (all)
          </button>
          <button
            onClick={() => trigger('demo')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 disabled:opacity-50"
          >
            {busy === 'demo' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4" />
            )}
            Run demo (all)
          </button>
          <button
            onClick={() => trigger('delete-demo')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 disabled:opacity-50"
          >
            {busy === 'delete-demo' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete demo
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${
            message.tone === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {message.tone === 'ok' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 p-2">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          Levels
        </div>
        {ALL_LEVELS.map((lv) => {
          const on = filterLevels.has(lv);
          const st = LEVEL_STYLE[lv];
          return (
            <button
              key={lv}
              onClick={() => toggleLevel(lv)}
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                on ? `${st.bg} ${st.text}` : 'bg-transparent text-gray-400 line-through opacity-60'
              }`}
            >
              {st.label}
            </button>
          );
        })}
        <div className="flex items-center gap-1 ml-2">
          <input
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            placeholder="filter by module..."
            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 w-48"
          />
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span>total {counts.total}</span>
          <span className="text-red-500">err {counts.err}</span>
          <span className="text-amber-500">warn {counts.warn}</span>
          <span className="text-blue-500">info {counts.info}</span>
          <span className="text-gray-400">dbg {counts.debug}</span>
          <button
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {paused ? (
              <>
                <PlayCircle className="w-3.5 h-3.5" /> Resume
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5" /> Pause
              </>
            )}
          </button>
          <button
            onClick={() => setEvents([])}
            className="inline-flex items-center gap-1 rounded border border-gray-300 dark:border-gray-700 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={logRef}
        className="flex-1 min-h-[400px] font-mono text-xs bg-gray-950 text-gray-200 rounded border border-gray-800 p-3 overflow-auto"
      >
        {filtered.length === 0 ? (
          <div className="text-gray-500 italic">
            waiting for events — trigger a run or watch another operator's run here
          </div>
        ) : (
          filtered.map((e, idx) => {
            const st = LEVEL_STYLE[e.level];
            const ts = new Date(e.ts);
            const hms = `${String(ts.getHours()).padStart(2, '0')}:${String(
              ts.getMinutes(),
            ).padStart(2, '0')}:${String(ts.getSeconds()).padStart(2, '0')}.${String(
              ts.getMilliseconds(),
            ).padStart(3, '0')}`;
            return (
              <div
                key={idx}
                className="whitespace-pre-wrap leading-5 border-b border-gray-900/80 py-0.5"
              >
                <span className="text-gray-500">{hms}</span>{' '}
                <span className={`${st.text} font-semibold`}>
                  [{st.label.padEnd(6, ' ')}]
                </span>{' '}
                <span className="text-cyan-400">
                  {(e.module ?? '-').padEnd(28, ' ').slice(0, 28)}
                </span>{' '}
                <span className="text-gray-400">{e.phase.padEnd(11, ' ')}</span>{' '}
                <span className="text-gray-100">{e.message}</span>
                {e.details ? (
                  <span className="text-gray-500">
                    {'  '}
                    {JSON.stringify(e.details)}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SeederConsole;
