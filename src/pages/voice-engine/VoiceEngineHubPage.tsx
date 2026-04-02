import React from 'react';
import {
  Mic,
  Volume2,
  Globe,
  Zap,
  Radio,
  Settings,
  Layers,
  Shield,
  Code,
  FileText,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Voice Engine Presentation Slides
// ---------------------------------------------------------------------------

const VOICE_ENGINE_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Voice Engine',
    subtitle: 'Unified TTS & STT Platform Service',
    icon: <Mic size={32} />,
    audioSrc: '/audio/voice-engine/slide_01.mp3',
    background: 'bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Text-to-Speech</p>
          <p className="text-white/60 text-xs mt-1">Multiple engines, 400+ voices</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Speech-to-Text</p>
          <p className="text-white/60 text-xs mt-1">Whisper, OpenAI, GCP</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Multi-Engine</p>
          <p className="text-white/60 text-xs mt-1">Local + cloud providers</p>
        </div>
      </div>
    ),
  },
  {
    id: 'tts-engines',
    title: 'TTS Engines',
    subtitle: 'Edge TTS, Piper, ElevenLabs, Sarvam, OpenAI',
    icon: <Volume2 size={32} />,
    audioSrc: '/audio/voice-engine/slide_02.mp3',
    background: 'bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800',
    content: (
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-emerald-300">Edge TTS (Default)</p>
          <p className="text-white/60 text-xs mt-1">Free, high-quality Microsoft voices. 300+ voices, 70+ languages.</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-blue-300">Piper (Local)</p>
          <p className="text-white/60 text-xs mt-1">On-premise neural TTS. Zero network latency, full data privacy.</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-amber-300">ElevenLabs</p>
          <p className="text-white/60 text-xs mt-1">Ultra-realistic AI voices. Voice cloning, emotion control.</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-purple-300">Sarvam AI</p>
          <p className="text-white/60 text-xs mt-1">Indian language specialists. Hindi, Tamil, Telugu, and more.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'stt-engines',
    title: 'STT Engines',
    subtitle: 'Speech recognition with multiple backends',
    icon: <Mic size={32} />,
    audioSrc: '/audio/voice-engine/slide_03.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800',
    content: (
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        {[
          { label: 'Whisper (Local)', desc: 'OpenAI Whisper running on-premise' },
          { label: 'OpenAI API', desc: 'Cloud Whisper with latest models' },
          { label: 'Google Cloud', desc: 'GCP Speech-to-Text API' },
        ].map((item) => (
          <div key={item.label} className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <p className="font-semibold text-white">{item.label}</p>
            <p className="text-white/50 text-xs mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'streaming',
    title: 'Streaming Audio',
    subtitle: 'Real-time audio generation and transcription',
    icon: <Radio size={32} />,
    audioSrc: '/audio/voice-engine/slide_04.mp3',
    background: 'bg-gradient-to-br from-rose-700 via-pink-700 to-red-800',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-cyan-300">Streaming TTS</p>
          <p className="text-white/60 text-xs mt-1">
            Audio chunks streamed as they are generated. Sub-second time-to-first-byte for real-time voice interactions.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-amber-300">Streaming STT</p>
          <p className="text-white/60 text-xs mt-1">
            Real-time transcription with interim results. Supports live microphone input and file uploads.
          </p>
        </div>
      </div>
    ),
  },
];

const VoiceEngineHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="voice-engine"
      moduleName="Voice Engine"
      moduleDescription="Unified Text-to-Speech & Speech-to-Text Platform Service"
      moduleIntro="Voice Engine is a shared platform service that provides Text-to-Speech (TTS) and Speech-to-Text (STT) capabilities through a unified API. Developers choose an engine (Edge TTS, Piper, ElevenLabs, Sarvam, OpenAI, Whisper, GCP) and the service handles routing, format conversion, caching, and streaming. It integrates with the AI Gateway for bundled LLM+TTS+STT workflows."
      icon={Mic}
      slides={VOICE_ENGINE_SLIDES}
      capabilities={[
        {
          icon: Volume2,
          title: 'Text-to-Speech',
          description: 'Convert text to natural-sounding speech. Multiple engines, 400+ voices, 70+ languages. MP3, WAV, and streaming output.',
        },
        {
          icon: Mic,
          title: 'Speech-to-Text',
          description: 'Transcribe audio to text with high accuracy. Whisper (local), OpenAI, and GCP backends. JSON, plain text, and SRT output.',
        },
        {
          icon: Layers,
          title: 'Multi-Engine Support',
          description: 'Swap between local engines (Piper, Whisper) and cloud providers (ElevenLabs, OpenAI, GCP, Sarvam) via a single API parameter.',
        },
        {
          icon: Radio,
          title: 'Streaming Audio',
          description: 'Real-time audio streaming for voice interactions. Sub-second latency with chunked transfer encoding.',
        },
        {
          icon: Globe,
          title: 'Indian Language Support',
          description: 'Sarvam AI integration for Hindi, Tamil, Telugu, Kannada, and other Indian languages with native pronunciation.',
        },
        {
          icon: Shield,
          title: 'Platform Integration',
          description: 'JWT-authenticated, namespace-isolated, fully audited. Integrates with AI Gateway, Interaction Recorder, and PII Vault.',
        },
      ]}
      targetUsers={[
        { role: 'Platform Developers', desc: 'Integrate TTS/STT into applications via the unified REST API.' },
        { role: 'AI Engineers', desc: 'Build voice-enabled AI agents and conversational interfaces.' },
        { role: 'Product Managers', desc: 'Enable voice capabilities across enterprise applications.' },
        { role: 'Operations Teams', desc: 'Monitor engine health, usage metrics, and cost attribution.' },
      ]}
      lifecycleStages={[
        { label: 'Request', description: 'Client sends text (TTS) or audio (STT) with engine selection.', color: '#f59e0b' },
        { label: 'Route', description: 'Voice Engine routes to the selected engine backend.', color: '#3b82f6' },
        { label: 'Process', description: 'Engine generates audio (TTS) or transcribes text (STT).', color: '#8b5cf6' },
        { label: 'Deliver', description: 'Result returned as binary audio, JSON text, or streaming chunks.', color: '#10b981' },
      ]}
      swaggerUrl="/api/voice-engine/api-docs"
      faqs={[
        { question: 'Which TTS engine should I use?', answer: 'Edge TTS is the default and recommended for most use cases — it is free, high quality, and supports 300+ voices. Use ElevenLabs for ultra-realistic voices, Piper for fully on-premise deployments, and Sarvam for Indian languages.' },
        { question: 'How does streaming work?', answer: 'Set format to "streaming" in the TTS request. The response uses chunked transfer encoding, delivering audio segments as they are generated. This reduces time-to-first-byte to under 500ms.' },
        { question: 'Can I use custom voices?', answer: 'ElevenLabs supports voice cloning and custom voice creation. Piper supports custom ONNX voice models. Edge TTS uses Microsoft\'s pre-trained voice library.' },
        { question: 'What audio formats are supported?', answer: 'TTS outputs MP3 (default) or WAV. STT accepts MP3, WAV, WEBM, OGG, and FLAC input. Streaming TTS uses MP3 chunks.' },
        { question: 'How is STT billing handled?', answer: 'Local Whisper has no per-request cost. OpenAI and GCP STT are billed by audio duration through their respective API keys configured at the organization level.' },
      ]}
      resources={[
        { label: 'Voice Engine API (Swagger)', url: 'https://scalatics.com:3127/api', icon: FileText },
        { label: 'Edge TTS Voice List', url: 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4', icon: Code },
        { label: 'Whisper Documentation', url: 'https://github.com/openai/whisper', icon: Code },
      ]}
    />
  );
};

export default VoiceEngineHubPage;
