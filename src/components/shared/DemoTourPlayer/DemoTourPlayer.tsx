import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Link2,
  ChevronRight,
} from 'lucide-react';
import type { DemoTourPlayerProps, LayoutMode, ManifestEntry, ChapterMarker } from './types';
import {
  formatDuration,
  formatMs,
  chapterDuration,
  activeChapterIndex,
  formatDate,
  formatTime,
} from './utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_LAYOUTS: { key: LayoutMode; label: string }[] = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'netflix', label: 'Netflix' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'chapters', label: 'Chapters' },
  { key: 'podcast', label: 'Podcast' },
  { key: 'mosaic', label: 'Mosaic' },
];

// ---------------------------------------------------------------------------
// Video player hook
// ---------------------------------------------------------------------------

function useVideoPlayer(baseUrl: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [ended, setEnded] = useState(false);
  const onEndedCallbackRef = useRef<(() => void) | null>(null);

  const play = useCallback(() => {
    videoRef.current?.play().catch(() => {});
    setPlaying(true);
  }, []);
  const pause = useCallback(() => {
    videoRef.current?.pause();
    setPlaying(false);
  }, []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const seek = useCallback((t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  }, []);
  const seekMs = useCallback((ms: number) => seek(ms / 1000), [seek]);
  const toggleMute = useCallback(() => {
    if (videoRef.current) videoRef.current.muted = !muted;
    setMuted((m) => !m);
  }, [muted]);
  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    if (videoRef.current) videoRef.current.playbackRate = next;
    setPlaybackRate(next);
  }, [playbackRate]);

  const loadVideo = useCallback(
    (file: string) => {
      if (videoRef.current) {
        videoRef.current.src = `${baseUrl}${file}`;
        videoRef.current.load();
        setCurrentTime(0);
        setDuration(0);
        setPlaying(false);
      }
    },
    [baseUrl],
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onPlay = () => { setPlaying(true); setEnded(false); };
    const onPause = () => setPlaying(false);
    const onEnd = () => { setEnded(true); setPlaying(false); onEndedCallbackRef.current?.(); };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnd);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnd);
    };
  }, []);

  return {
    videoRef,
    playing,
    currentTime,
    duration,
    muted,
    playbackRate,
    play,
    pause,
    toggle,
    seek,
    seekMs,
    toggleMute,
    cycleSpeed,
    loadVideo,
    ended,
    setOnEnded: (cb: (() => void) | null) => { onEndedCallbackRef.current = cb; },
  };
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function ChapterPill({
  chapter,
  active,
  onClick,
}: {
  chapter: ChapterMarker;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs border transition-colors whitespace-nowrap ${
        active
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-blue-500 hover:text-gray-200'
      }`}
    >
      {chapter.title}
    </button>
  );
}

function VideoOverlay({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  const [showPause, setShowPause] = useState(false);

  const handleClick = () => {
    onToggle();
    if (playing) {
      setShowPause(true);
      setTimeout(() => setShowPause(false), 800);
    }
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
      onClick={handleClick}
    >
      {!playing && !showPause && (
        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
          <Play size={28} className="text-gray-900 ml-1" />
        </div>
      )}
      {showPause && (
        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <Pause size={28} className="text-gray-900" />
        </div>
      )}
    </div>
  );
}

function ProgressBar({
  currentTime,
  duration,
  chapters,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  chapters?: ChapterMarker[];
  onSeek: (t: number) => void;
}) {
  const pct = duration ? (currentTime / duration) * 100 : 0;
  return (
    <div
      className="relative h-1.5 bg-gray-700 cursor-pointer group"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek(((e.clientX - rect.left) / rect.width) * duration);
      }}
    >
      <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      {chapters?.map((ch) => {
        const pos = duration ? (ch.startMs / 1000 / duration) * 100 : 0;
        return (
          <div
            key={ch.startMs}
            className="absolute top-0 w-0.5 h-full bg-gray-500/60"
            style={{ left: `${pos}%` }}
            title={ch.title}
          />
        );
      })}
    </div>
  );
}

/** Hook: auto-hide control bar on mouse inactivity */
function useControlBarVisibility(containerRef: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const show = () => {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 3000);
    };
    el.addEventListener('mousemove', show);
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', () => setVisible(false));
    // Start the hide timer
    timerRef.current = setTimeout(() => setVisible(false), 3000);
    return () => {
      el.removeEventListener('mousemove', show);
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('mouseleave', () => setVisible(false));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [containerRef]);

  return visible;
}

/** Transport control bar shown at bottom of video */
function TransportBar({
  vp,
  chapters,
  containerRef,
}: {
  vp: ReturnType<typeof useVideoPlayer>;
  chapters?: ChapterMarker[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const barContainerRef = useRef<HTMLDivElement>(null);
  const visible = useControlBarVisibility(barContainerRef);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen().catch(() => {});
    }
  };

  const activeIdx = chapters ? activeChapterIndex(chapters, vp.currentTime) : 0;

  return (
    <div
      ref={barContainerRef}
      className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Gradient backdrop */}
      <div className="bg-gradient-to-t from-black/80 to-transparent pt-8 pb-2 px-3">
        {/* Progress bar */}
        <ProgressBar
          currentTime={vp.currentTime}
          duration={vp.duration}
          chapters={chapters}
          onSeek={vp.seek}
        />
        {/* Controls row */}
        <div className="flex items-center gap-2 mt-1.5">
          {/* Prev chapter */}
          <button
            onClick={() => {
              if (chapters && activeIdx > 0) vp.seekMs(chapters[activeIdx - 1].startMs);
            }}
            className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title="Previous chapter"
          >
            <SkipBack size={16} />
          </button>
          {/* Play/Pause */}
          <button
            onClick={vp.toggle}
            className="p-1 rounded hover:bg-white/20 text-white transition-colors"
            title={vp.playing ? 'Pause' : 'Play'}
          >
            {vp.playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          {/* Next chapter */}
          <button
            onClick={() => {
              if (chapters && activeIdx < chapters.length - 1) vp.seekMs(chapters[activeIdx + 1].startMs);
            }}
            className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title="Next chapter"
          >
            <SkipForward size={16} />
          </button>
          {/* Time */}
          <span className="text-[11px] text-white/70 font-mono ml-1">
            {formatDuration(vp.currentTime)} / {formatDuration(vp.duration)}
          </span>
          <div className="flex-1" />
          {/* Speed */}
          <button
            onClick={vp.cycleSpeed}
            className="px-1.5 py-0.5 rounded text-[11px] text-white/70 hover:text-white hover:bg-white/20 transition-colors font-mono"
            title="Playback speed"
          >
            {vp.playbackRate}x
          </button>
          {/* Mute */}
          <button
            onClick={vp.toggleMute}
            className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title={vp.muted ? 'Unmute' : 'Mute'}
          >
            {vp.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout Components
// ---------------------------------------------------------------------------

interface LayoutProps {
  recordings: ManifestEntry[];
  selected: number;
  setSelected: (i: number) => void;
  vp: ReturnType<typeof useVideoPlayer>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  baseUrl: string;
}

/* ---- YouTube ---- */
function YouTubeLayout({
  recordings,
  selected,
  setSelected,
  vp,
  containerRef,
  baseUrl,
}: LayoutProps) {
  const rec = recordings[selected];
  const activeIdx = activeChapterIndex(rec.chapters, vp.currentTime);

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 14rem)' }}>
      {/* Player */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={vp.videoRef} className="w-full h-full" />
          <VideoOverlay playing={vp.playing} onToggle={vp.toggle} />
          <TransportBar vp={vp} chapters={rec.chapters} containerRef={containerRef} />
        </div>
        <div className="pt-3">
          <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(rec.timestamp)} · {formatDuration(rec.duration)} · {rec.chapters.length} chapters
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap pt-2">
          {rec.chapters.map((ch, i) => (
            <ChapterPill
              key={ch.startMs}
              chapter={ch}
              active={i === activeIdx}
              onClick={() => vp.seekMs(ch.startMs)}
            />
          ))}
        </div>
      </div>

      {/* Playlist sidebar */}
      <div className="w-80 flex-shrink-0 overflow-y-auto space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Playlist ({recordings.length})
        </p>
        {recordings.map((r, i) => (
          <div
            key={r.file}
            onClick={() => setSelected(i)}
            className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
              i === selected ? 'bg-gray-700 border border-blue-500' : 'hover:bg-gray-800 border border-transparent'
            }`}
          >
            <div className="w-36 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded flex items-center justify-center flex-shrink-0 relative">
              {r.thumbnail ? (
                <img src={r.thumbnail ? `${baseUrl}${r.thumbnail}` : ''} alt="" className="w-full h-full object-cover rounded" />
              ) : (
                <Play size={20} className="text-gray-500" />
              )}
              <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1 rounded font-mono">
                {formatDuration(r.duration)}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{r.title}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {formatDuration(r.duration)} · {r.chapters.length} ch
              </p>
              {i === selected && (
                <span className="inline-block mt-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">
                  NOW PLAYING
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Netflix ---- */
function NetflixLayout({
  recordings,
  selected,
  setSelected,
  vp,
  containerRef,
  baseUrl,
}: LayoutProps) {
  const rec = recordings[selected];
  const activeIdx = activeChapterIndex(rec.chapters, vp.currentTime);

  return (
    <div>
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden aspect-[21/9] mb-6">
        <video ref={vp.videoRef} className="w-full h-full object-cover" />
        <VideoOverlay playing={vp.playing} onToggle={vp.toggle} />
        <TransportBar vp={vp} chapters={rec.chapters} containerRef={containerRef} />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900/95 to-transparent">
          <h3 className="text-xl font-bold text-white">{rec.title}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {formatDuration(rec.duration)} · {rec.chapters.length} chapters · {formatDate(rec.timestamp)}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {rec.chapters.map((ch, i) => (
              <ChapterPill
                key={ch.startMs}
                chapter={ch}
                active={i === activeIdx}
                onClick={() => vp.seekMs(ch.startMs)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* All recordings row */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        All Recordings
      </p>
      <div className="grid grid-cols-3 gap-4">
        {recordings.map((r, i) => (
          <div
            key={r.file}
            onClick={() => setSelected(i)}
            className={`rounded-lg overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl ${
              i === selected ? 'border-blue-500' : 'border-gray-700'
            }`}
          >
            <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative">
              {r.thumbnail ? (
                <img src={r.thumbnail ? `${baseUrl}${r.thumbnail}` : ''} alt="" className="w-full h-full object-cover" />
              ) : (
                <Play size={24} className="text-gray-500" />
              )}
            </div>
            <div className="p-3 bg-gray-800">
              <p className="text-sm font-semibold text-white">{r.title}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {formatDuration(r.duration)} · {r.chapters.length} chapters · {formatDate(r.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Timeline ---- */
function TimelineLayout({
  recordings,
  selected,
  setSelected,
  vp,
  containerRef,
  baseUrl,
}: LayoutProps) {
  const activeIdx = activeChapterIndex(recordings[selected].chapters, vp.currentTime);

  return (
    <div className="max-w-4xl mx-auto relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-gray-700" />

      {recordings.map((r, i) => (
        <div key={r.file} className="relative mb-8">
          {/* Dot */}
          <div
            className={`absolute -left-8 top-2 w-4 h-4 rounded-full border-2 ${
              i === selected ? 'bg-blue-500 border-blue-500' : 'bg-gray-800 border-gray-600'
            }`}
          />

          <div
            className={`rounded-xl border overflow-hidden transition-colors ${
              i === selected ? 'border-blue-500' : 'border-gray-700 hover:border-blue-500/50'
            }`}
          >
            {/* Header */}
            <div
              className="flex gap-4 p-4 cursor-pointer"
              onClick={() => setSelected(i)}
            >
              <div className="w-48 h-28 bg-gradient-to-br from-gray-700 to-gray-800 rounded flex items-center justify-center flex-shrink-0">
                {r.thumbnail ? (
                  <img src={r.thumbnail ? `${baseUrl}${r.thumbnail}` : ''} alt="" className="w-full h-full object-cover rounded" />
                ) : (
                  <Play size={20} className="text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-500">{formatDate(r.timestamp)}, {formatTime(r.timestamp)}</p>
                <p className="text-base font-semibold text-white mt-0.5">{r.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDuration(r.duration)} · {r.chapters.length} chapters
                </p>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {r.chapters.slice(0, 5).map((ch, ci) => (
                    <ChapterPill
                      key={ch.startMs}
                      chapter={ch}
                      active={i === selected && ci === activeIdx}
                      onClick={() => {
                        setSelected(i);
                        vp.seekMs(ch.startMs);
                      }}
                    />
                  ))}
                  {r.chapters.length > 5 && (
                    <span className="px-2 py-1 text-[11px] text-gray-500">
                      +{r.chapters.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded player */}
            {i === selected && (
              <div className="px-4 pb-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video ref={vp.videoRef} className="w-full h-full" />
                  <VideoOverlay playing={vp.playing} onToggle={vp.toggle} />
                  <TransportBar vp={vp} chapters={recordings[selected].chapters} containerRef={containerRef} />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Chapters ---- */
function ChaptersLayout({
  recordings,
  selected,
  setSelected,
  vp,
  containerRef,
  baseUrl,
}: LayoutProps) {
  const rec = recordings[selected];
  const activeIdx = activeChapterIndex(rec.chapters, vp.currentTime);

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 14rem)' }}>
      {/* Chapter sidebar */}
      <div className="w-96 flex-shrink-0 overflow-y-auto">
        {/* Recording selector */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {recordings.map((r, i) => (
            <button
              key={r.file}
              onClick={() => setSelected(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                i === selected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-blue-500'
              }`}
            >
              {r.title.split('—').pop()?.trim() || r.title}
            </button>
          ))}
        </div>

        {/* Chapter list */}
        <div className="space-y-1">
          {rec.chapters.map((ch, i) => (
            <div
              key={ch.startMs}
              onClick={() => vp.seekMs(ch.startMs)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                i === activeIdx ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-gray-800 border border-transparent'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === activeIdx ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${i === activeIdx ? 'text-white' : 'text-gray-300'}`}>
                  {ch.title}
                </p>
                <p className="text-[11px] text-gray-500">{formatMs(ch.startMs)}</p>
              </div>
              <span className="text-[11px] text-gray-500 font-mono">
                {chapterDuration(rec.chapters, i, rec.duration)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={vp.videoRef} className="w-full h-full" />
          <VideoOverlay playing={vp.playing} onToggle={vp.toggle} />
          <TransportBar vp={vp} chapters={rec.chapters} containerRef={containerRef} />
        </div>
        <div className="pt-3">
          <h3 className="text-base font-semibold text-white">{rec.title}</h3>
          <p className="text-xs text-gray-400 mt-1">
            Chapter {activeIdx + 1} of {rec.chapters.length} · {rec.chapters[activeIdx]?.title}
          </p>
        </div>
        {/* Chapter progress */}
        <div className="mt-3 bg-gray-800 rounded-lg p-3">
          <p className="text-[11px] text-gray-500 mb-2">
            Progress: {activeIdx} of {rec.chapters.length} chapters
          </p>
          <div className="flex gap-0.5">
            {rec.chapters.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < activeIdx ? 'bg-blue-500' : i === activeIdx ? 'bg-blue-400' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Podcast ---- */
function PodcastLayout({
  recordings,
  selected,
  setSelected,
  vp,
  containerRef,
  baseUrl,
}: LayoutProps) {
  const rec = recordings[selected];
  const activeIdx = activeChapterIndex(rec.chapters, vp.currentTime);

  return (
    <div className="flex gap-6">
      {/* Main player area */}
      <div className="flex-1">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video ref={vp.videoRef} className="w-full h-full" />
          <VideoOverlay playing={vp.playing} onToggle={vp.toggle} />
          <TransportBar vp={vp} chapters={rec.chapters} containerRef={containerRef} />
        </div>
        <div className="pt-3">
          <h3 className="text-base font-semibold text-white">{rec.title}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(rec.timestamp)} · {rec.chapters.length} chapters
          </p>
        </div>

        {/* Waveform-style bar */}
        <div className="mt-4 bg-gray-800 rounded-lg p-4">
          {/* Fake waveform */}
          <div className="flex items-end gap-[2px] h-12 mb-2">
            {Array.from({ length: 80 }).map((_, i) => {
              const h = 10 + Math.sin(i * 0.4) * 20 + Math.random() * 15;
              const pos = i / 80;
              const isPast = vp.duration ? pos < vp.currentTime / vp.duration : false;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-colors ${isPast ? 'bg-blue-500' : 'bg-gray-600'}`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>

          {/* Chapter markers */}
          <div className="flex gap-1.5 flex-wrap">
            {rec.chapters.map((ch, i) => (
              <ChapterPill
                key={ch.startMs}
                chapter={ch}
                active={i === activeIdx}
                onClick={() => vp.seekMs(ch.startMs)}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => {
                if (activeIdx > 0) vp.seekMs(rec.chapters[activeIdx - 1].startMs);
              }}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400 transition-colors"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={vp.toggle}
              className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              {vp.playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
            <button
              onClick={() => {
                if (activeIdx < rec.chapters.length - 1)
                  vp.seekMs(rec.chapters[activeIdx + 1].startMs);
              }}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400 transition-colors"
            >
              <SkipForward size={18} />
            </button>
            <span className="text-xs text-gray-400 font-mono">
              {formatDuration(vp.currentTime)} / {formatDuration(vp.duration || rec.duration)}
            </span>
            <div className="flex-1" />
            <button
              onClick={vp.cycleSpeed}
              className="px-2 py-1 rounded bg-gray-700 text-xs text-gray-300 hover:bg-gray-600"
            >
              {vp.playbackRate}x
            </button>
          </div>
        </div>
      </div>

      {/* Episodes sidebar */}
      <div className="w-80 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Episodes ({recordings.length})
        </p>
        {recordings.map((r, i) => (
          <div
            key={r.file}
            onClick={() => setSelected(i)}
            className={`rounded-lg border mb-3 cursor-pointer transition-colors ${
              i === selected ? 'border-blue-500 bg-gray-800/50' : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex gap-3 p-3">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded flex items-center justify-center flex-shrink-0">
                {r.thumbnail ? (
                  <img src={r.thumbnail ? `${baseUrl}${r.thumbnail}` : ''} alt="" className="w-full h-full object-cover rounded" />
                ) : (
                  <Play size={14} className="text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{r.title}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {formatDuration(r.duration)} · {r.chapters.length} chapters
                </p>
              </div>
            </div>
            {i === selected && (
              <div className="px-3 pb-3 space-y-1">
                {rec.chapters.map((ch, ci) => (
                  <div
                    key={ch.startMs}
                    onClick={(e) => {
                      e.stopPropagation();
                      vp.seekMs(ch.startMs);
                    }}
                    className="flex items-center gap-2 text-[11px] hover:text-blue-400 transition-colors"
                  >
                    <span className="text-blue-400 font-mono w-8">{formatMs(ch.startMs)}</span>
                    <span className={ci === activeChapterIndex(rec.chapters, vp.currentTime) ? 'text-white font-medium' : 'text-gray-400'}>
                      {ch.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Mosaic ---- */
function MosaicLayout({
  recordings,
  selected,
  setSelected,
  vp,
  containerRef,
  baseUrl,
}: LayoutProps) {
  const rec = recordings[selected];
  const activeIdx = activeChapterIndex(rec.chapters, vp.currentTime);
  const others = recordings.filter((_, i) => i !== selected);

  return (
    <div>
      <div className={`grid gap-4 ${others.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Featured */}
        <div className={`${others.length > 0 ? 'row-span-2' : ''} rounded-xl border border-blue-500 overflow-hidden`}>
          <div className="relative bg-black aspect-video">
            <video ref={vp.videoRef} className="w-full h-full" />
            <VideoOverlay playing={vp.playing} onToggle={vp.toggle} />
            <TransportBar vp={vp} chapters={rec.chapters} containerRef={containerRef} />
          </div>
          <div className="p-4 bg-gray-800/50">
            <h3 className="text-base font-semibold text-white">{rec.title}</h3>
            <p className="text-[11px] text-gray-400 mt-1">
              {formatDuration(rec.duration)} · {rec.chapters.length} chapters · {formatDate(rec.timestamp)}
            </p>
            <div className="flex gap-1.5 flex-wrap mt-2">
              {rec.chapters.slice(0, 8).map((ch, i) => (
                <ChapterPill
                  key={ch.startMs}
                  chapter={ch}
                  active={i === activeIdx}
                  onClick={() => vp.seekMs(ch.startMs)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Others */}
        {others.map((r) => {
          const origIdx = recordings.indexOf(r);
          return (
            <div
              key={r.file}
              onClick={() => setSelected(origIdx)}
              className="rounded-xl border border-gray-700 overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all hover:scale-[1.01]"
            >
              <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative">
                {r.thumbnail ? (
                  <img src={r.thumbnail ? `${baseUrl}${r.thumbnail}` : ''} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Play size={24} className="text-gray-500" />
                )}
              </div>
              <div className="p-3 bg-gray-800/50">
                <p className="text-sm font-semibold text-white">{r.title}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {formatDuration(r.duration)} · {r.chapters.length} chapters · {formatDate(r.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DemoTourPlayer Component
// ---------------------------------------------------------------------------

const DemoTourPlayer: React.FC<DemoTourPlayerProps> = ({
  recordings,
  baseUrl,
  defaultLayout = 'youtube',
  layouts,
  title = 'Demo Recordings',
  enableDeepLink = true,
  className = '',
}) => {
  // Sort recordings: reverse chronological (latest first) by default
  const sortedRecordings = useMemo(
    () => [...recordings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [recordings],
  );

  const availableLayouts = layouts
    ? ALL_LAYOUTS.filter((l) => layouts.includes(l.key))
    : ALL_LAYOUTS;

  const [layout, setLayout] = useState<LayoutMode>(defaultLayout);
  const [selected, setSelected] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const vp = useVideoPlayer(baseUrl);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-advance to next video when current one ends
  useEffect(() => {
    vp.setOnEnded(() => {
      if (autoPlay && selected < sortedRecordings.length - 1) {
        const next = selected + 1;
        setSelected(next);
        vp.loadVideo(sortedRecordings[next].file);
        setTimeout(() => vp.play(), 500);
      }
    });
  }, [autoPlay, selected, sortedRecordings, vp]);

  // Load initial video
  useEffect(() => {
    if (sortedRecordings.length > 0) {
      vp.loadVideo(sortedRecordings[0].file);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle recording selection change
  const handleSelect = useCallback(
    (idx: number) => {
      setSelected(idx);
      vp.loadVideo(sortedRecordings[idx].file);
    },
    [sortedRecordings, vp],
  );

  // Deep link via hash
  useEffect(() => {
    if (!enableDeepLink) return;
    const hash = window.location.hash.slice(1);
    if (hash) {
      const idx = sortedRecordings.findIndex((r) => r.file === hash || r.file.includes(hash));
      if (idx >= 0) handleSelect(idx);
    }
  }, [enableDeepLink, sortedRecordings, handleSelect]);

  // Copy link
  const copyLink = () => {
    const url = `${window.location.pathname}#${sortedRecordings[selected].file}`;
    navigator.clipboard.writeText(window.location.origin + url).catch(() => {});
  };

  if (sortedRecordings.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-xl p-12 text-center ${className}`}>
        <Play size={48} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-300">No Recordings Yet</h3>
        <p className="text-sm text-gray-500 mt-2">Demo recordings will appear here once created.</p>
      </div>
    );
  }

  const layoutProps = { recordings: sortedRecordings, selected, setSelected: handleSelect, vp, containerRef, baseUrl };

  return (
    <div ref={containerRef} className={`bg-gray-900 text-gray-200 rounded-xl overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="flex items-center gap-3">
          {/* Auto-play toggle */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              autoPlay
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-600 hover:border-blue-500'
            }`}
            title={autoPlay ? 'Auto-play ON — next video plays automatically' : 'Auto-play OFF'}
          >
            <SkipForward size={12} />
            Auto
          </button>
          {/* Layout switcher */}
          <div className="flex gap-1">
            {availableLayouts.map((l) => (
              <button
                key={l.key}
                onClick={() => setLayout(l.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  layout === l.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 border border-gray-600 hover:border-blue-500 hover:text-gray-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          {/* Copy link */}
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-gray-800 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-blue-500 transition-colors"
          >
            <Link2 size={12} />
            Copy link
          </button>
        </div>
      </div>

      {/* Layout content */}
      <div className="p-6">
        {layout === 'youtube' && <YouTubeLayout {...layoutProps} />}
        {layout === 'netflix' && <NetflixLayout {...layoutProps} />}
        {layout === 'timeline' && <TimelineLayout {...layoutProps} />}
        {layout === 'chapters' && <ChaptersLayout {...layoutProps} />}
        {layout === 'podcast' && <PodcastLayout {...layoutProps} />}
        {layout === 'mosaic' && <MosaicLayout {...layoutProps} />}
      </div>
    </div>
  );
};

export default DemoTourPlayer;
