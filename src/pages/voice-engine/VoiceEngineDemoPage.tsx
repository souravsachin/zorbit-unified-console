import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Volume2,
  Play,
  Square,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TTSEngine {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'stub' | 'unavailable';
}

interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENGINES: TTSEngine[] = [
  { id: 'edge-tts', name: 'Edge TTS', description: 'Microsoft Edge neural voices (free)', status: 'available' },
  { id: 'piper', name: 'Piper', description: 'Local neural TTS (on-premise)', status: 'stub' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Ultra-realistic AI voices', status: 'stub' },
  { id: 'sarvam', name: 'Sarvam AI', description: 'Indian language voices', status: 'stub' },
  { id: 'openai', name: 'OpenAI', description: 'OpenAI TTS models', status: 'stub' },
];

const DEFAULT_VOICES: TTSVoice[] = [
  { id: 'en-US-AriaNeural', name: 'Aria (US)', language: 'en-US', gender: 'Female' },
  { id: 'en-US-GuyNeural', name: 'Guy (US)', language: 'en-US', gender: 'Male' },
  { id: 'en-US-JennyNeural', name: 'Jenny (US)', language: 'en-US', gender: 'Female' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', language: 'en-GB', gender: 'Female' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK)', language: 'en-GB', gender: 'Male' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (India)', language: 'en-IN', gender: 'Female' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat (India)', language: 'en-IN', gender: 'Male' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara (Hindi)', language: 'hi-IN', gender: 'Female' },
  { id: 'hi-IN-MadhurNeural', name: 'Madhur (Hindi)', language: 'hi-IN', gender: 'Male' },
  { id: 'ta-IN-PallaviNeural', name: 'Pallavi (Tamil)', language: 'ta-IN', gender: 'Female' },
  { id: 'te-IN-ShrutiNeural', name: 'Shruti (Telugu)', language: 'te-IN', gender: 'Female' },
  { id: 'fr-FR-DeniseNeural', name: 'Denise (French)', language: 'fr-FR', gender: 'Female' },
  { id: 'de-DE-KatjaNeural', name: 'Katja (German)', language: 'de-DE', gender: 'Female' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira (Spanish)', language: 'es-ES', gender: 'Female' },
  { id: 'ja-JP-NanamiNeural', name: 'Nanami (Japanese)', language: 'ja-JP', gender: 'Female' },
  { id: 'ar-SA-ZariyahNeural', name: 'Zariyah (Arabic)', language: 'ar-SA', gender: 'Female' },
];

const SAMPLE_TEXTS: { label: string; text: string }[] = [
  { label: 'English greeting', text: 'Hello! Welcome to the Zorbit Voice Engine. This platform service provides text-to-speech and speech-to-text capabilities through a unified API.' },
  { label: 'Hindi greeting', text: 'नमस्ते! ज़ोर्बिट वॉइस इंजन में आपका स्वागत है। यह प्लेटफ़ॉर्म सेवा एक एकीकृत API के माध्यम से टेक्स्ट-टू-स्पीच क्षमताएं प्रदान करती है।' },
  { label: 'Technical demo', text: 'The Voice Engine supports multiple backends including Edge TTS, Piper, ElevenLabs, and Sarvam AI. Each engine can be selected via a single API parameter.' },
  { label: 'Short test', text: 'Testing one, two, three. The quick brown fox jumps over the lazy dog.' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VoiceEngineDemoPage: React.FC = () => {
  const [text, setText] = useState(SAMPLE_TEXTS[0].text);
  const [engine, setEngine] = useState('edge-tts');
  const [voice, setVoice] = useState('en-US-AriaNeural');
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<TTSVoice[]>(DEFAULT_VOICES);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch voices from server when engine changes
  useEffect(() => {
    const fetchVoices = async () => {
      setLoadingVoices(true);
      try {
        const res = await api.get(`${API_CONFIG.VOICE_ENGINE_URL}/api/v1/G/voice/tts/voices`, {
          params: { engine },
        });
        if (res.data?.voices && res.data.voices.length > 0) {
          setVoices(res.data.voices);
          // Select first voice of the fetched list
          setVoice(res.data.voices[0].id);
        } else {
          setVoices(DEFAULT_VOICES);
        }
      } catch {
        // Fall back to default voices
        setVoices(DEFAULT_VOICES);
      } finally {
        setLoadingVoices(false);
      }
    };
    fetchVoices();
  }, [engine]);

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleSpeak = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    // Clean up previous audio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    try {
      // Get org from JWT
      const userStr = localStorage.getItem('zorbit_user');
      const orgId = userStr ? JSON.parse(userStr).organizationHashId || 'G' : 'G';

      const res = await api.post(
        `${API_CONFIG.VOICE_ENGINE_URL}/api/v1/O/${orgId}/voice/tts`,
        { text, engine, voice, format, speed },
        { responseType: 'blob' },
      );

      const blob = new Blob([res.data], { type: format === 'wav' ? 'audio/wav' : 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Auto-play
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play audio');
      };
      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      const msg = err.response?.data
        ? typeof err.response.data === 'string'
          ? err.response.data
          : err.response.data.message || 'TTS request failed'
        : err.message || 'TTS request failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voice-engine-output.${format}`;
    a.click();
  };

  const selectedEngine = ENGINES.find((e) => e.id === engine);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
          <Mic size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Voice Engine Demo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Try Text-to-Speech with different engines and voices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Text input */}
          <div className="card p-5">
            <label className="block text-sm font-medium mb-2">Text to speak</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter text to convert to speech..."
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {SAMPLE_TEXTS.map((sample) => (
                <button
                  key={sample.label}
                  onClick={() => setText(sample.text)}
                  className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Engine & Voice selection */}
          <div className="card p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Engine */}
              <div>
                <label className="block text-sm font-medium mb-2">Engine</label>
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {ENGINES.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} {e.status === 'stub' ? '(coming soon)' : ''}
                    </option>
                  ))}
                </select>
                {selectedEngine && (
                  <p className="text-xs text-gray-400 mt-1">{selectedEngine.description}</p>
                )}
              </div>

              {/* Voice */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Voice {loadingVoices && <Loader2 size={12} className="inline animate-spin ml-1" />}
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.language}) - {v.gender}
                    </option>
                  ))}
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium mb-2">Output Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'mp3' | 'wav')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                </select>
              </div>

              {/* Speed */}
              <div>
                <label className="block text-sm font-medium mb-2">Speed: {speed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSpeak}
              disabled={loading || !text.trim()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Volume2 size={18} />
              )}
              <span>{loading ? 'Generating...' : 'Speak'}</span>
            </button>

            {isPlaying && (
              <button
                onClick={handleStop}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <Square size={16} />
                <span>Stop</span>
              </button>
            )}

            {audioUrl && !isPlaying && (
              <>
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <Play size={16} />
                  <span>Replay</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start space-x-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">TTS Error</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Engine info */}
        <div className="space-y-4">
          {/* Engine status card */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Engine Status</h3>
            <div className="space-y-2">
              {ENGINES.map((e) => (
                <div
                  key={e.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    e.id === engine
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                      : ''
                  }`}
                >
                  <span className={e.id === engine ? 'font-medium' : 'text-gray-600 dark:text-gray-400'}>
                    {e.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      e.status === 'available'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                    }`}
                  >
                    {e.status === 'available' ? 'Ready' : 'Coming soon'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick info */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">API Quick Reference</h3>
            <div className="text-xs font-mono bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 overflow-x-auto">
              <p className="text-gray-500">POST /api/v1/O/:orgId/voice/tts</p>
              <p className="mt-2 text-gray-400">{'{'}</p>
              <p className="text-blue-600 dark:text-blue-400 ml-2">"text": "Hello world",</p>
              <p className="text-blue-600 dark:text-blue-400 ml-2">"engine": "edge-tts",</p>
              <p className="text-blue-600 dark:text-blue-400 ml-2">"voice": "en-US-AriaNeural",</p>
              <p className="text-blue-600 dark:text-blue-400 ml-2">"format": "mp3",</p>
              <p className="text-blue-600 dark:text-blue-400 ml-2">"speed": 1.0</p>
              <p className="text-gray-400">{'}'}</p>
            </div>
          </div>

          {/* Tips */}
          <div className="card p-5 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold mb-2 text-amber-800 dark:text-amber-300">Tips</h3>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1.5">
              <li>- Edge TTS is free and supports 300+ voices</li>
              <li>- Use Hindi voices (hi-IN-*) for Hindi text</li>
              <li>- Speed 0.8x works well for narration</li>
              <li>- MP3 is smaller; WAV is higher quality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceEngineDemoPage;
