import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  background?: string; // tailwind gradient or color class
  icon?: React.ReactNode;
  audioSrc?: string; // URL to narration audio for this slide
}

export interface SlidePlayerProps {
  slides: Slide[];
  autoPlay?: boolean;
  autoPlayInterval?: number; // ms, default 6000 (used when no audio)
  className?: string;
}

// ---------------------------------------------------------------------------
// SlidePlayer — Central presentation component with audio narration
// ---------------------------------------------------------------------------

const SlidePlayer: React.FC<SlidePlayerProps> = ({
  slides,
  autoPlay = false,
  autoPlayInterval = 6000,
  className = '',
}) => {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [fullscreen, setFullscreen] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [muted, setMuted] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const total = slides.length;
  const slide = slides[current];
  const hasAudio = !!slide.audioSrc;

  // ---- Navigation ----

  const goTo = useCallback(
    (index: number, dir?: 'next' | 'prev') => {
      setDirection(dir || (index > current ? 'next' : 'prev'));
      setCurrent(index);
      setAudioProgress(0);
      setAudioDuration(0);
    },
    [current],
  );

  const next = useCallback(() => {
    goTo(current < total - 1 ? current + 1 : 0, 'next');
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo(current > 0 ? current - 1 : total - 1, 'prev');
  }, [current, total, goTo]);

  // ---- Audio management ----

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset
    audio.pause();
    setAudioProgress(0);
    setAudioDuration(0);

    if (slide.audioSrc) {
      audio.src = slide.audioSrc;
      audio.muted = muted;
      if (playing) {
        audio.play().catch(() => {
          // Autoplay may be blocked by browser policy
        });
      }
    } else {
      audio.removeAttribute('src');
      audio.load();
    }
  }, [current, slide.audioSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  // Play/pause audio with play state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !slide.audioSrc) return;
    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [playing, slide.audioSrc]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setAudioProgress(audio.currentTime);
    const onLoadedMetadata = () => setAudioDuration(audio.duration);
    const onEnded = () => {
      if (playing) {
        // Auto-advance to next slide when narration ends
        if (current < total - 1) {
          next();
        } else {
          setPlaying(false);
        }
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playing, current, total, next]);

  // Auto-play timer (only when no audio on current slide)
  useEffect(() => {
    if (!playing || hasAudio) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [playing, hasAudio, next, autoPlayInterval]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
      if (e.key === 'f') {
        setFullscreen((f) => !f);
      }
      if (e.key === 'm') {
        setMuted((m) => !m);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, fullscreen]);

  // ---- Audio progress bar click ----

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audioDuration;
  };

  // ---- Format time ----

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ---- Render ----

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 bg-gray-900'
    : `relative rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 ${className}`;

  return (
    <div className={containerClass}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" />

      {/* Slide content */}
      <div
        className={`relative w-full ${fullscreen ? 'h-full' : 'h-[480px]'} overflow-hidden`}
      >
        <div
          key={slide.id}
          className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-500 ease-in-out ${
            slide.background || 'bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700'
          }`}
          style={{
            animation: `${direction === 'next' ? 'slideInRight' : 'slideInLeft'} 0.4s ease-out`,
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-white/15 blur-xl" />
          </div>

          {/* Slide number */}
          <div className="absolute top-4 right-4 text-white/40 text-sm font-mono">
            {current + 1} / {total}
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-3xl w-full text-center">
            {slide.icon && (
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                  {slide.icon}
                </div>
              </div>
            )}
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-lg text-white/70 mb-6">{slide.subtitle}</p>
            )}
            <div className="text-white/90">{slide.content}</div>
          </div>
        </div>
      </div>

      {/* Audio progress bar (only when slide has audio) */}
      {hasAudio && audioDuration > 0 && (
        <div
          className="h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer"
          onClick={handleProgressClick}
          title="Seek"
        >
          <div
            className="h-full bg-indigo-500 transition-all duration-200"
            style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
          />
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {/* Left: prev/play/next */}
        <div className="flex items-center space-x-2">
          <button
            onClick={prev}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            title="Previous (←)"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={next}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            title="Next (→)"
          >
            <ChevronRight size={20} />
          </button>

          {/* Mute/unmute */}
          <button
            onClick={() => setMuted((m) => !m)}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              muted ? 'text-red-400' : 'text-gray-600 dark:text-gray-300'
            }`}
            title={muted ? 'Unmute (M)' : 'Mute (M)'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Audio time */}
          {hasAudio && audioDuration > 0 && (
            <span className="text-xs text-gray-400 font-mono ml-1">
              {formatTime(audioProgress)} / {formatTime(audioDuration)}
            </span>
          )}
        </div>

        {/* Center: dots */}
        <div className="flex items-center space-x-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-indigo-600 w-6'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Right: fullscreen */}
        <button
          onClick={() => setFullscreen((f) => !f)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (F)'}
        >
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default SlidePlayer;
