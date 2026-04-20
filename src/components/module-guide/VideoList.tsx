import React, { useState, useEffect, useRef } from 'react';
import { useModuleContext } from '../../contexts/ModuleContext';
import { useResolvedContent } from '../../hooks/useResolvedContent';
import { Info, Play, X, CheckCircle2, XCircle } from 'lucide-react';

type PlayerType = 'simple' | 'chapter-list' | 'sidebyside' | 'picture-in-picture' | 'quiz' | 'tour';

interface VideoChapter {
  t: number;
  label: string;
  src2?: string;
  annotation?: string;
  quiz?: { q: string; options: string[]; answerIndex: number };
}

interface VideoEntry {
  title: string;
  duration?: number;
  playerType: PlayerType;
  src: string;
  src2?: string;
  poster?: string;
  chapters?: VideoChapter[];
}

function fmtDuration(s?: number): string {
  if (!s && s !== 0) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/* ================= Player variants ================= */

const SimplePlayer: React.FC<{ v: VideoEntry }> = ({ v }) => (
  <video
    src={v.src}
    poster={v.poster}
    controls
    className="w-full rounded-md bg-black"
  />
);

const ChapterListPlayer: React.FC<{ v: VideoEntry }> = ({ v }) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const chapters = v.chapters || [];

  const onTime = () => {
    if (!ref.current) return;
    const t = ref.current.currentTime;
    let idx = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (t >= chapters[i].t) idx = i;
    }
    setActiveIdx(idx);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <video
          ref={ref}
          src={v.src}
          poster={v.poster}
          controls
          onTimeUpdate={onTime}
          className="w-full rounded-md bg-black"
        />
      </div>
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        <div className="text-[11px] uppercase font-semibold text-gray-500">Chapters</div>
        {chapters.map((c, i) => (
          <button
            key={i}
            onClick={() => {
              if (ref.current) { ref.current.currentTime = c.t; ref.current.play(); }
            }}
            className={`w-full text-left px-3 py-2 rounded text-sm ${
              i === activeIdx
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{c.label}</span>
              <span className="text-[10px] text-gray-500 font-mono">{fmtDuration(c.t)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const SideBySidePlayer: React.FC<{ v: VideoEntry }> = ({ v }) => {
  const leftRef = useRef<HTMLVideoElement | null>(null);
  const rightRef = useRef<HTMLVideoElement | null>(null);
  const second = v.src2 || v.chapters?.find((c) => c.src2)?.src2;
  const sync = (src: 'left' | 'right') => {
    const a = leftRef.current;
    const b = rightRef.current;
    if (!a || !b) return;
    if (src === 'left') b.currentTime = a.currentTime;
    else a.currentTime = b.currentTime;
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <video ref={leftRef} src={v.src} poster={v.poster} controls onSeeked={() => sync('left')} className="w-full rounded-md bg-black" />
      <video ref={rightRef} src={second} controls onSeeked={() => sync('right')} className="w-full rounded-md bg-black" />
    </div>
  );
};

const PictureInPicturePlayer: React.FC<{ v: VideoEntry }> = ({ v }) => (
  <div className="relative">
    <video src={v.src} poster={v.poster} controls className="w-full rounded-md bg-black" />
    {v.src2 && (
      <video src={v.src2} muted autoPlay loop className="absolute bottom-4 right-4 w-48 h-28 rounded-md border-2 border-white shadow-lg bg-black" />
    )}
  </div>
);

const QuizPlayer: React.FC<{ v: VideoEntry }> = ({ v }) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  const chapters = v.chapters || [];
  const [activeQuiz, setActiveQuiz] = useState<VideoChapter | null>(null);
  const [answered, setAnswered] = useState<Record<number, number>>({});
  const triggeredRef = useRef<Set<number>>(new Set());

  const onTime = () => {
    if (!ref.current || activeQuiz) return;
    const t = ref.current.currentTime;
    for (const c of chapters) {
      if (!c.quiz) continue;
      if (t >= c.t && !triggeredRef.current.has(c.t)) {
        triggeredRef.current.add(c.t);
        ref.current.pause();
        setActiveQuiz(c);
        break;
      }
    }
  };

  const answer = (optIdx: number) => {
    if (!activeQuiz) return;
    setAnswered({ ...answered, [activeQuiz.t]: optIdx });
  };
  const dismiss = () => {
    setActiveQuiz(null);
    if (ref.current) ref.current.play();
  };

  return (
    <div className="relative">
      <video ref={ref} src={v.src} poster={v.poster} controls onTimeUpdate={onTime} className="w-full rounded-md bg-black" />
      {activeQuiz && activeQuiz.quiz && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase font-semibold text-indigo-600">Knowledge check</div>
              <button onClick={dismiss} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="font-semibold mb-3">{activeQuiz.quiz.q}</div>
            <div className="space-y-1.5">
              {activeQuiz.quiz.options.map((opt, i) => {
                const chosen = answered[activeQuiz.t];
                const correct = activeQuiz.quiz!.answerIndex;
                const isChosen = chosen === i;
                const isCorrect = i === correct;
                const showColor = chosen !== undefined;
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={chosen !== undefined}
                    className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                      showColor && isCorrect
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/30'
                        : showColor && isChosen
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/30'
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {showColor && isCorrect && <CheckCircle2 size={14} className="text-green-600" />}
                      {showColor && isChosen && !isCorrect && <XCircle size={14} className="text-red-600" />}
                      <span>{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {answered[activeQuiz.t] !== undefined && (
              <button onClick={dismiss} className="mt-4 w-full px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm">
                Continue video
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TourPlayer: React.FC<{ v: VideoEntry }> = ({ v }) => {
  const ref = useRef<HTMLVideoElement | null>(null);
  const chapters = v.chapters || [];
  const [annotation, setAnnotation] = useState<string | null>(null);

  const onTime = () => {
    if (!ref.current) return;
    const t = ref.current.currentTime;
    let current: string | null = null;
    for (const c of chapters) {
      if (t >= c.t && c.annotation) current = c.annotation;
    }
    setAnnotation(current);
  };

  return (
    <div className="relative">
      <video ref={ref} src={v.src} poster={v.poster} controls onTimeUpdate={onTime} className="w-full rounded-md bg-black" />
      {annotation && (
        <div className="absolute top-4 left-4 right-4 md:right-auto md:max-w-md bg-black/85 text-white text-sm rounded-lg p-3 border border-yellow-400 shadow-xl">
          <div className="text-[10px] uppercase font-semibold text-yellow-400 mb-1">Step</div>
          {annotation}
        </div>
      )}
    </div>
  );
};

/* ================= Dispatcher ================= */

const renderPlayer = (v: VideoEntry): React.ReactNode => {
  switch (v.playerType) {
    case 'chapter-list':      return <ChapterListPlayer v={v} />;
    case 'sidebyside':        return <SideBySidePlayer v={v} />;
    case 'picture-in-picture':return <PictureInPicturePlayer v={v} />;
    case 'quiz':              return <QuizPlayer v={v} />;
    case 'tour':              return <TourPlayer v={v} />;
    case 'simple':
    default:                  return <SimplePlayer v={v} />;
  }
};

/* ================= List entry ================= */

const VideoList: React.FC = () => {
  const { manifest, moduleId, loading } = useModuleContext();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // US-MF-2100 — resolve inline OR $src-externalised entries.
  const {
    data: resolvedEntries,
    loading: resolving,
    error: resolveError,
  } = useResolvedContent<VideoEntry[]>(
    manifest?.guide?.videos?.entries as VideoEntry[] | { $src: string } | undefined,
    manifest?.version,
  );
  const entries: VideoEntry[] = resolvedEntries || [];

  // Keyboard: escape closes modal
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIdx(null);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (loading || resolving) return <div className="p-6 text-gray-500 text-sm">Loading videos…</div>;

  if (resolveError) {
    const srcUrl = (manifest?.guide?.videos?.entries as { $src?: string } | undefined)?.$src;
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-5 flex gap-3 items-start">
          <Info className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="font-semibold text-red-900 dark:text-red-200">Videos failed to load</h2>
            <p className="text-sm text-red-800 dark:text-red-300 mt-1">{resolveError.message}</p>
            {srcUrl && (
              <p className="text-[11px] font-mono text-red-700 dark:text-red-400 mt-2 break-all">
                $src = {srcUrl}
              </p>
            )}
            <p className="text-[11px] text-red-700 dark:text-red-400 mt-1">
              Manifest path: <code>guide.videos.entries</code> on module <code>{moduleId || '?'}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-5 flex gap-3 items-start">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h2 className="font-semibold text-amber-900 dark:text-amber-200">Videos not supplied</h2>
            <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
              Module <code className="font-mono">{moduleId || '?'}</code> did not declare <code>guide.videos</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const active = activeIdx != null ? entries[activeIdx] : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Video tutorials</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((v, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:border-indigo-400 hover:shadow-sm transition-all"
          >
            <div className="relative aspect-video bg-gray-200 dark:bg-gray-900">
              {v.poster ? (
                <img src={v.poster} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Play size={32} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>
              {v.duration && (
                <div className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-mono">
                  {fmtDuration(v.duration)}
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{v.title}</div>
              <div className="text-[10px] uppercase font-semibold text-gray-500 mt-1">{v.playerType}</div>
            </div>
          </button>
        ))}
      </div>

      {active != null && activeIdx != null && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setActiveIdx(null)}>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="font-semibold text-gray-900 dark:text-gray-100">{active.title}</div>
                <div className="text-[10px] uppercase font-semibold text-gray-500 mt-0.5">{active.playerType}</div>
              </div>
              <button onClick={() => setActiveIdx(null)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">{renderPlayer(active)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;
