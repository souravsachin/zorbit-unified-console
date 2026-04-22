/**
 * Guide authoring editor — covers Intro / Presentation (slides) / Lifecycle
 * / Video / Pricing / Docs. Each text block can be auditioned via the TTS
 * service with a graceful fallback to browser SpeechSynthesis.
 *
 * Added 2026-04-22 by Soldier AU.
 */
import React, { useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Play,
  Pause,
  Volume2,
  Sparkles,
} from 'lucide-react';
import type { ModuleDraftManifest, GuideSlide, GuideVideo } from './types';
import { playNarration, zmbModuleDraftsService } from '../../../services/zmbModuleDrafts';

type Patch = (m: ModuleDraftManifest) => ModuleDraftManifest;

const inputCls =
  'w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

function NarrationField({
  value,
  onChange,
  voice,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  voice?: string;
  placeholder?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'synth'>('idle');
  const [mode, setMode] = useState<'voice-engine' | 'browser-fallback' | null>(null);

  const play = useCallback(async () => {
    if (!value || !value.trim()) return;
    setStatus('synth');
    try {
      const m = await playNarration(value, {
        voice,
        onFinish: () => setStatus('idle'),
      });
      setMode(m);
      setStatus('playing');
    } catch {
      setStatus('idle');
    }
  }, [value, voice]);

  const stop = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    setStatus('idle');
  }, []);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-2 bg-indigo-50/30 dark:bg-indigo-950/30">
      <div className="flex items-center gap-1 mb-1">
        <Volume2 size={12} className="text-indigo-500" />
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Narration</span>
        {mode === 'browser-fallback' && (
          <span className="text-[10px] ml-2 px-1 py-0.5 rounded bg-yellow-100 text-yellow-800">
            browser fallback
          </span>
        )}
        {mode === 'voice-engine' && (
          <span className="text-[10px] ml-2 px-1 py-0.5 rounded bg-emerald-100 text-emerald-800">
            voice-engine
          </span>
        )}
        <div className="flex-1" />
        {status === 'idle' ? (
          <button
            type="button"
            onClick={play}
            disabled={!value?.trim()}
            className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300"
          >
            <Play size={10} /> Play
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700"
          >
            <Pause size={10} /> Stop
          </button>
        )}
      </div>
      <textarea
        rows={2}
        className={`${inputCls} text-xs`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Narration text to accompany this section.'}
      />
    </div>
  );
}

// ---------------- Intro ----------------
function IntroEditor({ manifest, apply }: { manifest: ModuleDraftManifest; apply: (p: Patch) => void }) {
  const intro = manifest.guide?.intro || {};
  const mut = (patch: Partial<typeof intro>) =>
    apply((m) => ({
      ...m,
      guide: { ...(m.guide || {}), intro: { ...(m.guide?.intro || {}), ...patch } },
    }));
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-semibold mb-2">Intro</h4>
      <input
        className={`${inputCls} mb-2`}
        value={intro.headline || ''}
        onChange={(e) => mut({ headline: e.target.value })}
        placeholder="Headline"
      />
      <textarea
        rows={3}
        className={`${inputCls} mb-2`}
        value={intro.summary || ''}
        onChange={(e) => mut({ summary: e.target.value })}
        placeholder="One-paragraph summary"
      />
      <NarrationField value={intro.narration || ''} onChange={(v) => mut({ narration: v })} />
    </div>
  );
}

// ---------------- Presentation / Slides ----------------
function SlidesEditor({ manifest, apply }: { manifest: ModuleDraftManifest; apply: (p: Patch) => void }) {
  const deck: GuideSlide[] = manifest.guide?.slides?.deck || [];
  const set = (next: GuideSlide[]) =>
    apply((m) => ({
      ...m,
      guide: { ...(m.guide || {}), slides: { ...(m.guide?.slides || {}), deck: next } },
    }));

  const [rehearseIdx, setRehearseIdx] = useState<number | null>(null);

  const rehearseAll = useCallback(async () => {
    setRehearseIdx(0);
    for (let i = 0; i < deck.length; i++) {
      setRehearseIdx(i);
      const s = deck[i];
      if (s.narration && s.narration.trim()) {
        await playNarration(s.narration);
      }
    }
    setRehearseIdx(null);
  }, [deck]);

  const synthAll = useCallback(async () => {
    const items = deck
      .map((s, i) => ({ id: `slide-${i}`, text: s.narration || '' }))
      .filter((i) => i.text.trim());
    if (items.length === 0) return;
    const rsp = await zmbModuleDraftsService.synthNarrations(items);
    const next = [...deck];
    rsp.items.forEach((it) => {
      const m = /^slide-(\d+)$/.exec(it.id);
      if (m) {
        const idx = parseInt(m[1], 10);
        if (next[idx] && it.dataUrl) {
          next[idx] = { ...next[idx], narrationAudioDataUrl: it.dataUrl };
        }
      }
    });
    set(next);
    // eslint-disable-next-line no-alert
    alert(
      rsp.synthesiser === 'voice-engine'
        ? `Synthesised ${rsp.items.filter((i) => i.ok).length} slide narrations via voice_engine. Audio bundled into manifest.`
        : 'voice_engine unreachable — use the Play button on each slide to audition via the browser.',
    );
  }, [deck]);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center mb-3">
        <h4 className="text-sm font-semibold">Presentation — Slides</h4>
        <div className="flex-1" />
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center gap-1 mr-2"
          onClick={rehearseAll}
        >
          <Play size={12} /> Rehearse all
        </button>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1"
          onClick={synthAll}
          title="Pre-render every slide's narration via voice_engine and bundle audio into the manifest so the export includes MP3 files."
        >
          <Sparkles size={12} /> Pre-render narrations
        </button>
      </div>
      {deck.map((s, i) => (
        <div
          key={i}
          className={`border ${
            rehearseIdx === i ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-200 dark:border-gray-700'
          } rounded-md p-3 mb-2`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Slide {i + 1}</span>
            <input
              className={`${inputCls} flex-1`}
              value={s.title || ''}
              onChange={(e) => {
                const next = [...deck];
                next[i] = { ...s, title: e.target.value };
                set(next);
              }}
              placeholder="Slide title"
            />
            <button
              type="button"
              onClick={() => {
                const next = [...deck];
                const j = i - 1;
                if (j < 0) return;
                [next[i], next[j]] = [next[j], next[i]];
                set(next);
              }}
              className="p-1 text-gray-500 hover:text-indigo-600"
            >
              <MoveUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = [...deck];
                const j = i + 1;
                if (j >= deck.length) return;
                [next[i], next[j]] = [next[j], next[i]];
                set(next);
              }}
              className="p-1 text-gray-500 hover:text-indigo-600"
            >
              <MoveDown size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = [...deck];
                next.splice(i, 1);
                set(next);
              }}
              className="p-1 text-gray-500 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <textarea
            rows={2}
            className={`${inputCls} mb-2`}
            value={s.body || ''}
            onChange={(e) => {
              const next = [...deck];
              next[i] = { ...s, body: e.target.value };
              set(next);
            }}
            placeholder="Slide body"
          />
          <textarea
            rows={2}
            className={`${inputCls} mb-2 text-xs`}
            value={(s.bullets || []).join('\n')}
            onChange={(e) => {
              const next = [...deck];
              next[i] = { ...s, bullets: e.target.value.split('\n').filter((x) => x.trim()) };
              set(next);
            }}
            placeholder="Bullets (one per line)"
          />
          <input
            className={`${inputCls} mb-2 text-xs`}
            value={s.image || ''}
            onChange={(e) => {
              const next = [...deck];
              next[i] = { ...s, image: e.target.value };
              set(next);
            }}
            placeholder="Image URL (optional)"
          />
          <NarrationField
            value={s.narration || ''}
            onChange={(v) => {
              const next = [...deck];
              next[i] = { ...s, narration: v };
              set(next);
            }}
          />
          {s.narrationAudioDataUrl && (
            <div className="mt-2 text-xs text-emerald-600 inline-flex items-center gap-1">
              <Sparkles size={12} /> Pre-rendered MP3 bundled ({Math.round(s.narrationAudioDataUrl.length / 1024)} KB base64)
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => set([...deck, { title: `Slide ${deck.length + 1}`, body: '', narration: '' }])}
      >
        <Plus size={14} /> Add slide
      </button>
    </div>
  );
}

// ---------------- Lifecycle ----------------
function LifecycleEditor({ manifest, apply }: { manifest: ModuleDraftManifest; apply: (p: Patch) => void }) {
  const lc = manifest.guide?.lifecycle || { phases: [] };
  const mut = (patch: Partial<typeof lc>) =>
    apply((m) => ({
      ...m,
      guide: { ...(m.guide || {}), lifecycle: { ...(m.guide?.lifecycle || {}), ...patch } },
    }));
  const phases = lc.phases || [];
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-semibold mb-2">Lifecycle</h4>
      <NarrationField
        value={lc.narration || ''}
        onChange={(v) => mut({ narration: v })}
        placeholder="Overall lifecycle narration"
      />
      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2">Phases</div>
        {phases.map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-start">
            <input
              className={`${inputCls} col-span-3`}
              value={p.name}
              onChange={(e) => {
                const next = [...phases];
                next[i] = { ...p, name: e.target.value };
                mut({ phases: next });
              }}
              placeholder="Phase"
            />
            <input
              className={`${inputCls} col-span-8`}
              value={p.description || ''}
              onChange={(e) => {
                const next = [...phases];
                next[i] = { ...p, description: e.target.value };
                mut({ phases: next });
              }}
              placeholder="Description"
            />
            <button
              type="button"
              className="col-span-1 p-2 text-gray-500 hover:text-red-600"
              onClick={() => {
                const next = [...phases];
                next.splice(i, 1);
                mut({ phases: next });
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          onClick={() => mut({ phases: [...phases, { name: 'New phase', description: '' }] })}
        >
          <Plus size={14} /> Add phase
        </button>
      </div>
    </div>
  );
}

// ---------------- Videos ----------------
function VideosEditor({ manifest, apply }: { manifest: ModuleDraftManifest; apply: (p: Patch) => void }) {
  const vids: GuideVideo[] = manifest.guide?.videos?.entries || [];
  const set = (next: GuideVideo[]) =>
    apply((m) => ({
      ...m,
      guide: { ...(m.guide || {}), videos: { ...(m.guide?.videos || {}), entries: next } },
    }));
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-semibold mb-2">Videos</h4>
      {vids.map((v, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded p-2 mb-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              className={inputCls}
              value={v.title || ''}
              onChange={(e) => {
                const next = [...vids];
                next[i] = { ...v, title: e.target.value };
                set(next);
              }}
              placeholder="Title"
            />
            <select
              className={inputCls}
              value={v.playerType || 'simple'}
              onChange={(e) => {
                const next = [...vids];
                next[i] = { ...v, playerType: e.target.value };
                set(next);
              }}
            >
              {['simple', 'chapter-list', 'sidebyside', 'picture-in-picture', 'quiz', 'tour'].map(
                (t) => (
                  <option key={t} value={t}>{t}</option>
                ),
              )}
            </select>
            <input
              className={inputCls}
              value={v.src || ''}
              onChange={(e) => {
                const next = [...vids];
                next[i] = { ...v, src: e.target.value };
                set(next);
              }}
              placeholder="mp4 URL"
            />
            <input
              className={inputCls}
              value={v.poster || ''}
              onChange={(e) => {
                const next = [...vids];
                next[i] = { ...v, poster: e.target.value };
                set(next);
              }}
              placeholder="poster URL"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const next = [...vids];
              next.splice(i, 1);
              set(next);
            }}
            className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1"
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => set([...vids, { title: 'New video', src: '' }])}
      >
        <Plus size={14} /> Add video
      </button>
    </div>
  );
}

// ---------------- Pricing ----------------
function PricingEditor({ manifest, apply }: { manifest: ModuleDraftManifest; apply: (p: Patch) => void }) {
  const pr = manifest.guide?.pricing || { tiers: [] };
  const mut = (patch: Partial<typeof pr>) =>
    apply((m) => ({ ...m, guide: { ...(m.guide || {}), pricing: { ...(m.guide?.pricing || {}), ...patch } } }));
  const tiers = pr.tiers || [];
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-semibold mb-2">Pricing</h4>
      <select
        className={`${inputCls} mb-2`}
        value={pr.status || 'coming-soon'}
        onChange={(e) => mut({ status: e.target.value })}
      >
        <option value="coming-soon">Coming Soon</option>
        <option value="active">Active</option>
      </select>
      {tiers.map((t, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-start">
          <input
            className={`${inputCls} col-span-3`}
            value={t.name}
            onChange={(e) => {
              const next = [...tiers];
              next[i] = { ...t, name: e.target.value };
              mut({ tiers: next });
            }}
            placeholder="Tier name"
          />
          <input
            type="number"
            className={`${inputCls} col-span-2`}
            value={t.monthlyPrice ?? 0}
            onChange={(e) => {
              const next = [...tiers];
              next[i] = { ...t, monthlyPrice: e.target.value ? parseInt(e.target.value, 10) : null };
              mut({ tiers: next });
            }}
            placeholder="price/mo"
          />
          <input
            className={`${inputCls} col-span-6`}
            value={(t.features || []).join(', ')}
            onChange={(e) => {
              const next = [...tiers];
              next[i] = { ...t, features: e.target.value.split(',').map((s) => s.trim()) };
              mut({ tiers: next });
            }}
            placeholder="features (comma-separated)"
          />
          <button
            type="button"
            className="col-span-1 p-2 text-gray-500 hover:text-red-600"
            onClick={() => {
              const next = [...tiers];
              next.splice(i, 1);
              mut({ tiers: next });
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => mut({ tiers: [...tiers, { name: 'New tier', monthlyPrice: 0, features: [] }] })}
      >
        <Plus size={14} /> Add tier
      </button>
    </div>
  );
}

// ---------------- Docs ----------------
function DocsEditor({ manifest, apply }: { manifest: ModuleDraftManifest; apply: (p: Patch) => void }) {
  const dc = manifest.guide?.docs || { links: [] };
  const links = dc.links || [];
  const mut = (patch: Partial<typeof dc>) =>
    apply((m) => ({ ...m, guide: { ...(m.guide || {}), docs: { ...(m.guide?.docs || {}), ...patch } } }));
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-semibold mb-2">Docs</h4>
      {links.map((l, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-center">
          <input
            className={`${inputCls} col-span-4`}
            value={l.label}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...l, label: e.target.value };
              mut({ links: next });
            }}
            placeholder="label"
          />
          <input
            className={`${inputCls} col-span-7`}
            value={l.href}
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...l, href: e.target.value };
              mut({ links: next });
            }}
            placeholder="href"
          />
          <button
            type="button"
            className="col-span-1 p-2 text-gray-500 hover:text-red-600"
            onClick={() => {
              const next = [...links];
              next.splice(i, 1);
              mut({ links: next });
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
        onClick={() => mut({ links: [...links, { label: '', href: '' }] })}
      >
        <Plus size={14} /> Add link
      </button>
    </div>
  );
}

// ---------------- Combined GuideEditor ----------------
export function GuideEditor({
  manifest,
  apply,
}: {
  manifest: ModuleDraftManifest;
  apply: (p: Patch) => void;
}) {
  return (
    <div className="max-w-4xl">
      <h3 className="text-base font-semibold mb-3">Guide — Intro / Slides / Lifecycle / Video / Pricing / Docs</h3>
      <p className="text-xs text-gray-500 mb-3">
        Each text block can be auditioned with the "Play" button. Pre-render all slide narrations
        to bundle MP3 audio into the manifest export. Backend falls back to browser SpeechSynthesis
        when <code>zorbit-pfs-voice_engine</code> is unreachable.
      </p>
      <IntroEditor manifest={manifest} apply={apply} />
      <SlidesEditor manifest={manifest} apply={apply} />
      <LifecycleEditor manifest={manifest} apply={apply} />
      <VideosEditor manifest={manifest} apply={apply} />
      <PricingEditor manifest={manifest} apply={apply} />
      <DocsEditor manifest={manifest} apply={apply} />
    </div>
  );
}
