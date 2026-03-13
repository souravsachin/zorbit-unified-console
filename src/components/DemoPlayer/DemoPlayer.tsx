import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Gauge,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from 'lucide-react';
import { DemoSegment, DemoStep } from '../../services/demo';

interface DemoPlayerProps {
  segment: DemoSegment;
  ttsEnabled: boolean;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

// --- Interactive Player ---

const InteractivePlayer: React.FC<DemoPlayerProps> = ({ segment, ttsEnabled, onClose }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [stepStatus, setStepStatus] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightRef = useRef<HTMLElement | null>(null);

  const steps = segment.steps || [];
  const step = steps[currentStep];

  const clearHighlight = useCallback(() => {
    if (highlightRef.current) {
      highlightRef.current.style.boxShadow = '';
      highlightRef.current.style.transition = '';
      highlightRef.current = null;
    }
  }, []);

  const speakNarration = useCallback((text: string) => {
    if (!ttsEnabled || !text) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled, speed]);

  const executeStep = useCallback(async (s: DemoStep): Promise<void> => {
    clearHighlight();

    if (s.narration) {
      speakNarration(s.narration);
    }

    const findTarget = (selector: string): HTMLElement | null => {
      if (!selector) return null;
      try {
        return document.querySelector(selector);
      } catch {
        return null;
      }
    };

    switch (s.action) {
      case 'info':
        setStepStatus(s.value || s.narration || '');
        break;

      case 'navigate':
        if (s.target) {
          try {
            navigate(s.target);
          } catch {
            console.warn(`[DemoPlayer] Failed to navigate to: ${s.target}`);
          }
        }
        break;

      case 'highlight': {
        const el = findTarget(s.target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'box-shadow 0.3s ease';
          el.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)';
          highlightRef.current = el;
        } else {
          console.warn(`[DemoPlayer] Target not found for highlight: ${s.target}`);
        }
        break;
      }

      case 'click': {
        const el = findTarget(s.target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.click();
        } else {
          console.warn(`[DemoPlayer] Target not found for click: ${s.target}`);
        }
        break;
      }

      case 'type': {
        const el = findTarget(s.target) as HTMLInputElement | null;
        if (el && s.value) {
          el.focus();
          el.value = '';
          for (let i = 0; i < s.value.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 50 / speed));
            el.value += s.value[i];
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } else {
          console.warn(`[DemoPlayer] Target not found for type: ${s.target}`);
        }
        break;
      }

      case 'scroll': {
        const el = findTarget(s.target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.warn(`[DemoPlayer] Target not found for scroll: ${s.target}`);
        }
        break;
      }

      case 'wait':
        // just wait — handled by delay
        break;

      default:
        console.warn(`[DemoPlayer] Unknown action: ${s.action}`);
    }
  }, [clearHighlight, speakNarration, navigate, speed]);

  const advanceStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      setStepStatus('Demo complete');
    }
  }, [currentStep, steps.length]);

  // Execute step and schedule advance
  useEffect(() => {
    if (!step || !isPlaying) return;

    executeStep(step);

    const delay = (step.delay_ms || 2000) / speed;
    timerRef.current = setTimeout(advanceStep, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStep, isPlaying, step, speed, executeStep, advanceStep]);

  // Display current step info when not auto-playing
  useEffect(() => {
    if (!isPlaying && step) {
      setStepStatus(step.narration || step.value || `Step ${currentStep + 1}: ${step.action}`);
    }
  }, [isPlaying, step, currentStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHighlight();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearHighlight]);

  const handlePrev = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    advanceStep();
  };

  const togglePlay = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(!isPlaying);
  };

  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-primary-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-4">
        {/* Step info */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
              {step && ` — ${step.action}`}
            </span>
            <span className="text-xs text-gray-400">
              {segment.title}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 min-h-[1.25rem]">
            {stepStatus || step?.narration || ''}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep >= steps.length - 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {/* Speed selector */}
            <div className="flex items-center space-x-1">
              <Gauge size={14} className="text-gray-400" />
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    speed === s
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* TTS indicator */}
            <span className="text-gray-400">
              {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </span>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Video Player ---

const VideoPlayer: React.FC<DemoPlayerProps> = ({ segment, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const chapters = segment.chapters || [];
  const hasChapters = chapters.length > 0;

  const currentChapterIndex = chapters.length > 0
    ? chapters.reduce((acc, ch, i) => (currentTime >= ch.timestamp ? i : acc), 0)
    : -1;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoaded = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(Number(e.target.value));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl w-full ${
          hasChapters ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-sm">{segment.title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`flex ${hasChapters ? '' : ''}`}>
          {/* Video area */}
          <div className={`${hasChapters ? 'flex-1' : 'w-full'}`}>
            <div className="bg-black aspect-video relative">
              {segment.video_url ? (
                <video
                  ref={videoRef}
                  src={segment.video_url}
                  className="w-full h-full"
                  onClick={togglePlay}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <p>No video URL provided</p>
                </div>
              )}

              {/* Play overlay when paused */}
              {!isPlaying && segment.video_url && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play size={28} className="text-gray-800 ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-4 py-3 space-y-2">
              {/* Seek bar */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button onClick={togglePlay} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <span className="text-xs text-gray-500 font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Speed */}
                  <div className="flex items-center space-x-1">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                          speed === s
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  {/* Volume */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setVolume(volume > 0 ? 0 : 1)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {volume > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter panel */}
          {hasChapters && (
            <div className="w-72 border-l border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[70vh]">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chapters</h4>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {chapters.map((ch, i) => (
                  <button
                    key={i}
                    onClick={() => seekTo(ch.timestamp)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      i === currentChapterIndex
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-600'
                        : ''
                    }`}
                  >
                    <p className={`text-sm font-medium ${
                      i === currentChapterIndex ? 'text-primary-700 dark:text-primary-300' : ''
                    }`}>
                      {ch.title}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {formatTime(ch.timestamp)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main DemoPlayer ---

const DemoPlayer: React.FC<DemoPlayerProps> = (props) => {
  if (props.segment.type === 'video') {
    return <VideoPlayer {...props} />;
  }
  return <InteractivePlayer {...props} />;
};

export default DemoPlayer;
