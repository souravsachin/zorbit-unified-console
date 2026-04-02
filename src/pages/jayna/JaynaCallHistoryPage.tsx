import React, { useEffect, useState } from 'react';
import {
  Phone,
  Loader2,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  TestTube,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Activity,
  User,
  Bot,
} from 'lucide-react';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import { useAuth } from '../../hooks/useAuth';

interface TranscriptTurn {
  role: 'agent' | 'caller';
  text: string;
  timestamp: string;
}

interface CallSession {
  hashId: string;
  organizationHashId: string;
  agentHashId: string;
  workflowHashId?: string;
  lineHashId?: string;
  status: 'active' | 'completed' | 'failed';
  direction: 'inbound' | 'outbound' | 'test';
  callerNumber?: string;
  duration?: number;
  transcript: TranscriptTurn[];
  outcome?: string;
  recordingUrl?: string;
  startedAt: string;
  endedAt?: string;
  _isDemo?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const DIRECTION_ICONS: Record<string, React.ElementType> = {
  inbound: PhoneIncoming,
  outbound: PhoneOutgoing,
  test: TestTube,
};

function formatDuration(seconds?: number): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const JaynaCallHistoryPage: React.FC = () => {
  const { orgId } = useAuth();
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallSession | null>(null);

  const base = (API_CONFIG as Record<string, string>).JAYNA_URL || '/api/jayna';

  const fetchCalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/jayna/calls`);
      const d = res.data;
      setCalls(d?.calls || d?.data || (Array.isArray(d) ? d : []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCalls(); }, [orgId]);

  const viewTranscript = async (call: CallSession) => {
    if (selectedCall?.hashId === call.hashId) {
      setSelectedCall(null);
      return;
    }
    // If transcript already loaded inline, just expand
    if (call.transcript && call.transcript.length > 0) {
      setSelectedCall(call);
      return;
    }
    // Otherwise fetch full details
    try {
      const res = await api.get(`${base}/api/v1/O/${orgId}/jayna/calls/${call.hashId}`);
      setSelectedCall(res.data);
    } catch {
      setSelectedCall(call);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <Phone className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View past calls with transcripts, outcomes, and recordings
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400">{calls.length} calls</span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : calls.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-16 text-center">
          <Phone className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No call history yet</p>
          <p className="text-xs text-gray-400">Start a test call or seed demo data from the Setup page</p>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Call List */}
          <div className={`${selectedCall ? 'w-1/2' : 'w-full'} space-y-2 transition-all`}>
            {calls.map((call) => {
              const DirIcon = DIRECTION_ICONS[call.direction] || Phone;
              const isSelected = selectedCall?.hashId === call.hashId;
              return (
                <div
                  key={call.hashId}
                  onClick={() => viewTranscript(call)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-400 dark:border-blue-600 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <DirIcon className={`h-4 w-4 shrink-0 ${call.direction === 'inbound' ? 'text-green-500' : call.direction === 'outbound' ? 'text-blue-500' : 'text-violet-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {call.agentHashId}
                        </span>
                        {call.callerNumber && (
                          <span className="text-xs text-gray-400 font-mono">{call.callerNumber}</span>
                        )}
                        {call._isDemo && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 font-medium">
                            demo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-mono text-gray-400">{call.hashId}</span>
                        {call.outcome && (
                          <span className="text-[10px] text-gray-500">{call.outcome}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLES[call.status] || 'bg-gray-100 text-gray-600'}`}>
                        {call.status}
                      </span>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {formatDuration(call.duration)}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {call.startedAt ? new Date(call.startedAt).toLocaleString() : '--'}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transcript Panel */}
          {selectedCall && (
            <div className="w-1/2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-4 max-h-[80vh] flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Call Transcript</h3>
                  <span className="text-[10px] font-mono text-gray-400">{selectedCall.hashId}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCall.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : selectedCall.status === 'failed' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                  )}
                  <button onClick={() => setSelectedCall(null)} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4 text-[10px] text-gray-400 shrink-0">
                <span>Duration: {formatDuration(selectedCall.duration)}</span>
                <span>Direction: {selectedCall.direction}</span>
                {selectedCall.outcome && <span>Outcome: {selectedCall.outcome}</span>}
              </div>

              {/* Transcript */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                  selectedCall.transcript.map((turn, idx) => (
                    <div key={idx} className={`flex gap-2 ${turn.role === 'agent' ? '' : 'flex-row-reverse'}`}>
                      <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                        turn.role === 'agent'
                          ? 'bg-violet-100 dark:bg-violet-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {turn.role === 'agent' ? (
                          <Bot className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-gray-500" />
                        )}
                      </div>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                        turn.role === 'agent'
                          ? 'bg-violet-50 dark:bg-violet-900/20 text-gray-800 dark:text-gray-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        <p className="text-xs leading-relaxed">{turn.text}</p>
                        <span className="text-[9px] text-gray-400 mt-1 block">
                          {turn.timestamp ? new Date(turn.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-xs text-gray-400 py-8">
                    No transcript available for this call
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JaynaCallHistoryPage;
