import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useModuleContext } from '../../contexts/ModuleContext';
import { useResolvedContent } from '../../hooks/useResolvedContent';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Info } from 'lucide-react';

type Slide = { title: string; body: string; image?: string };

/**
 * Renders `guide.slides.deck[]` with prev/next, keyboard arrows,
 * fullscreen toggle, and progress dots.
 *
 * US-MF-2100 — supports both inline `deck: [...]` and externalised
 * `deck: { $src: "/api/.../slides.json" }`.
 */
const SlideDeckPlayer: React.FC = () => {
  const { manifest, moduleId, loading } = useModuleContext();
  const [idx, setIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Resolve deck through $src-aware resolver. If inline → returned as-is.
  const {
    data: resolvedDeck,
    loading: resolving,
    error: resolveError,
  } = useResolvedContent<Slide[]>(
    manifest?.guide?.slides?.deck as Slide[] | { $src: string } | undefined,
    manifest?.version,
  );
  const deck: Slide[] = resolvedDeck || [];

  const next = useCallback(() => setIdx((i) => Math.min(i + 1, deck.length - 1)), [deck.length]);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape' && fullscreen) setFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, fullscreen]);

  const toggleFullscreen = () => {
    if (!fullscreen && containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => { /* noop */ });
    } else if (fullscreen && document.exitFullscreen) {
      document.exitFullscreen().catch(() => { /* noop */ });
    }
    setFullscreen((v) => !v);
  };

  if (loading || resolving) return <div className="p-6 text-gray-500 text-sm">Loading slide deck…</div>;

  if (resolveError) {
    const srcUrl = (manifest?.guide?.slides?.deck as { $src?: string } | undefined)?.$src;
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-5 flex gap-3 items-start">
          <Info className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="font-semibold text-red-900 dark:text-red-200">Slide deck failed to load</h2>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">{resolveError.message}</p>
            {srcUrl && (
              <p className="text-[11px] font-mono text-red-700 dark:text-red-400 mt-2 break-all">
                $src = {srcUrl}
              </p>
            )}
            <p className="text-[11px] text-red-700 dark:text-red-400 mt-1">
              Manifest path: <code>guide.slides.deck</code> on module <code>{moduleId || '?'}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (deck.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-5 flex gap-3 items-start">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="font-semibold text-amber-900 dark:text-amber-200">Slide deck not supplied</h2>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
              Module <code className="font-mono">{moduleId || '?'}</code> did not declare <code>guide.slides</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const current = deck[idx];
  return (
    <div
      ref={containerRef}
      className={`${fullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'max-w-5xl mx-auto p-6'}`}
    >
      <div className={`rounded-xl ${fullscreen ? 'h-full bg-white dark:bg-gray-800 flex flex-col' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500">Slide {idx + 1} / {deck.length}</div>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>

        <div className={`p-10 ${fullscreen ? 'flex-1 flex flex-col justify-center' : 'min-h-[360px]'}`}>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {current.title}
          </h2>
          {current.image && (
            <img src={current.image} alt="" className="max-h-64 rounded-md mb-4 border border-gray-200 dark:border-gray-700" />
          )}
          <div className="text-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
            {current.body}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>

          <div className="flex gap-1.5">
            {deck.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all ${
                  i === idx ? 'w-6 bg-indigo-600' : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            disabled={idx === deck.length - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideDeckPlayer;
