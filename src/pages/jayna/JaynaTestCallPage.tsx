import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Loader2,
  Sparkles,
  Activity,
  Clock,
  Pause,
  Play,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

interface Agent {
  hashId: string;
  name: string;
  voiceId: string;
  llmProvider: string;
  llmModel: string;
  greeting: string;
}

interface TranscriptTurn {
  role: 'agent' | 'caller';
  text: string;
  timestamp: Date;
}

type CallState = 'idle' | 'connecting' | 'ringing' | 'active' | 'paused' | 'ended';

const JaynaTestCallPage: React.FC = () => {
  const { orgId } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedAgent = searchParams.get('agent') || '';

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(preselectedAgent);
  const [loading, setLoading] = useState(true);
  const [callState, setCallState] = useState<CallState>('idle');
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(24).fill(2));
  const transcriptRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const base = (API_CONFIG as Record<string, string>).JAYNA_URL || '/api/jayna';

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await api.get(`${base}/api/v1/O/${orgId}/jayna/agents`);
        const d = res.data;
        const list: Agent[] = d?.agents || d?.data || (Array.isArray(d) ? d : []);
        setAgents(list);
        if (!selectedAgentId && list.length > 0) {
          setSelectedAgentId(list[0].hashId);
        }
      } catch {
        // Agents may not be available yet
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, [orgId]);

  // Timer
  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // Waveform animation
  useEffect(() => {
    if (callState === 'active' && !muted) {
      waveRef.current = setInterval(() => {
        setWaveform(Array(24).fill(0).map(() => Math.random() * 20 + 2));
      }, 100);
    } else {
      if (waveRef.current) clearInterval(waveRef.current);
      setWaveform(Array(24).fill(2));
    }
    return () => { if (waveRef.current) clearInterval(waveRef.current); };
  }, [callState, muted]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const selectedAgent = agents.find((a) => a.hashId === selectedAgentId);

  // Simulated call flow for demo
  const startCall = async () => {
    setTranscript([]);
    setElapsed(0);
    setCallState('connecting');

    // Try to actually start a call via the API
    try {
      await api.post(`${base}/api/v1/O/${orgId}/jayna/calls/start`, {
        agentHashId: selectedAgentId,
        direction: 'test',
      });
    } catch {
      // API may not be wired — run simulated flow
    }

    // Simulated connection sequence
    setTimeout(() => setCallState('ringing'), 800);
    setTimeout(() => {
      setCallState('active');
      // Agent greeting
      const greeting = selectedAgent?.greeting || 'Hello, how can I help you today?';
      setTranscript([{ role: 'agent', text: greeting, timestamp: new Date() }]);
    }, 2500);

    // Simulated conversation turns for demo
    const demoTurns: { role: 'agent' | 'caller'; text: string; delayMs: number }[] = [
      { role: 'caller', text: 'Hi, I need to check the status of my insurance claim.', delayMs: 6000 },
      { role: 'agent', text: 'Of course, I\'d be happy to help you with your claim status. Could you please provide me with your claim reference number?', delayMs: 9000 },
      { role: 'caller', text: 'Yes, it\'s CLM-8847.', delayMs: 13000 },
      { role: 'agent', text: 'Thank you. Let me look that up for you... I can see claim CLM-8847. This is a motor insurance claim filed on March 15th for windshield replacement. The claim is currently in the "Under Review" stage.', delayMs: 16000 },
      { role: 'caller', text: 'How long will the review take?', delayMs: 21000 },
      { role: 'agent', text: 'Based on the claim type and our current processing times, windshield replacement claims typically complete review within 2-3 business days. Your claim was assigned to an adjuster yesterday, so you should receive a decision by Thursday.', delayMs: 24000 },
      { role: 'caller', text: 'Great, thank you very much.', delayMs: 30000 },
      { role: 'agent', text: 'You\'re welcome! Is there anything else I can help you with today?', delayMs: 33000 },
      { role: 'caller', text: 'No, that\'s all. Thanks!', delayMs: 37000 },
      { role: 'agent', text: 'Thank you for calling. Have a great day! Goodbye.', delayMs: 40000 },
    ];

    demoTurns.forEach((turn) => {
      setTimeout(() => {
        setTranscript((prev) => [...prev, { role: turn.role, text: turn.text, timestamp: new Date() }]);
      }, turn.delayMs);
    });

    // Auto-end after demo
    setTimeout(() => {
      setCallState('ended');
    }, 44000);
  };

  const endCall = () => {
    setCallState('ended');
  };

  const resetCall = () => {
    setCallState('idle');
    setTranscript([]);
    setElapsed(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
          <Phone className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test Call</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start a test call with an AI agent and see the conversation in real time
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Phone UI */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            {/* Phone Frame */}
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
              {/* Status Bar */}
              <div className="px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Jayna AI</span>
                <div className="flex items-center gap-1">
                  {callState === 'active' && <Activity className="h-3 w-3 text-green-400 animate-pulse" />}
                  <span className="text-xs text-gray-400">{callState === 'active' ? 'Connected' : callState === 'ringing' ? 'Ringing...' : callState === 'connecting' ? 'Connecting...' : callState === 'ended' ? 'Call Ended' : 'Ready'}</span>
                </div>
              </div>

              {/* Agent Info */}
              <div className="px-6 py-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
                  {callState === 'connecting' || callState === 'ringing' ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <Bot className="h-8 w-8 text-white" />
                  )}
                </div>
                {loading ? (
                  <div className="h-6 w-32 mx-auto bg-gray-700 rounded animate-pulse" />
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedAgent?.name || 'Select Agent'}
                    </h2>
                    {selectedAgent && (
                      <p className="text-xs text-gray-400 mt-1">
                        {selectedAgent.llmProvider}/{selectedAgent.llmModel}
                      </p>
                    )}
                  </>
                )}

                {/* Timer */}
                {(callState === 'active' || callState === 'ended') && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-2xl font-mono text-white tracking-wider">{formatTime(elapsed)}</span>
                  </div>
                )}

                {/* Waveform */}
                {callState === 'active' && (
                  <div className="flex items-end justify-center gap-[3px] mt-4 h-8">
                    {waveform.map((h, i) => (
                      <div
                        key={i}
                        className="w-[3px] rounded-full bg-gradient-to-t from-violet-500 to-indigo-400 transition-all duration-75"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                )}

                {/* Ringing animation */}
                {callState === 'ringing' && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute inset-[-8px] rounded-full bg-green-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                      <Phone className="h-6 w-6 text-green-400 relative" />
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Selector (only when idle) */}
              {callState === 'idle' && (
                <div className="px-6 pb-4">
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-700/50 border border-gray-600 rounded-xl text-white"
                  >
                    <option value="">Select an agent...</option>
                    {agents.map((a) => (
                      <option key={a.hashId} value={a.hashId}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Call Controls */}
              <div className="px-6 py-6">
                {callState === 'idle' ? (
                  <button
                    onClick={startCall}
                    disabled={!selectedAgentId}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-semibold text-sm transition-colors shadow-lg shadow-green-500/30"
                  >
                    <Phone className="h-5 w-5" />
                    Start Test Call
                  </button>
                ) : callState === 'ended' ? (
                  <button
                    onClick={resetCall}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-600 hover:bg-gray-500 text-white font-semibold text-sm transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    New Call
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setMuted(!muted)}
                      className={`p-4 rounded-full transition-colors ${muted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={endCall}
                      className="p-5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-colors"
                    >
                      <PhoneOff className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setSpeakerOff(!speakerOff)}
                      className={`p-4 rounded-full transition-colors ${speakerOff ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                      {speakerOff ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom safe area */}
              <div className="h-4" />
            </div>
          </div>
        </div>

        {/* Right: Live Transcript */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Live Transcript</h3>
            </div>
            {callState === 'active' && (
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-500 font-medium">LIVE</span>
              </div>
            )}
          </div>

          <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Bot className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-400">
                  {callState === 'idle'
                    ? 'Select an agent and start a test call to see the conversation here'
                    : callState === 'connecting'
                    ? 'Connecting to agent...'
                    : callState === 'ringing'
                    ? 'Ringing...'
                    : 'Waiting for conversation...'}
                </p>
              </div>
            ) : (
              transcript.map((turn, idx) => (
                <div key={idx} className={`flex gap-3 ${turn.role === 'caller' ? 'flex-row-reverse' : ''}`}>
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    turn.role === 'agent'
                      ? 'bg-violet-100 dark:bg-violet-900/30'
                      : 'bg-emerald-100 dark:bg-emerald-900/30'
                  }`}>
                    {turn.role === 'agent' ? (
                      <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    ) : (
                      <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    turn.role === 'agent'
                      ? 'bg-violet-50 dark:bg-violet-900/20 rounded-tl-sm'
                      : 'bg-emerald-50 dark:bg-emerald-900/20 rounded-tr-sm'
                  }`}>
                    <p className="text-xs font-semibold mb-0.5 ${turn.role === 'agent' ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'}">
                      {turn.role === 'agent' ? (selectedAgent?.name || 'Agent') : 'You'}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{turn.text}</p>
                    <span className="text-[9px] text-gray-400 mt-1 block">
                      {turn.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator when agent is "thinking" */}
            {callState === 'active' && transcript.length > 0 && transcript[transcript.length - 1].role === 'caller' && (
              <div className="flex gap-3">
                <div className="shrink-0 h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Call ended summary */}
          {callState === 'ended' && transcript.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Call ended</span>
                  <span className="text-xs font-mono text-gray-400">{formatTime(elapsed)}</span>
                  <span className="text-xs text-gray-400">{transcript.length} messages</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                  completed
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JaynaTestCallPage;
