import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  UserPlus,
  X,
  Clock,
  Circle,
  Send,
  ChevronLeft,
  PhoneIncoming,
  PhoneCall,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Room, RoomEvent, Track } from 'livekit-client';
import { API_CONFIG } from '../../config';
import api from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrgMember {
  id: string;
  hashId: string;
  displayName: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  lastSeen?: string;
  phone?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  senderHashId?: string;
  text: string;
  time: string;
  isYou: boolean;
}

interface ChatChannel {
  hashId: string;
  channelHashId?: string;
  type: string;
  memberHashIds: string[];
}

/* ------------------------------------------------------------------ */
/*  Fallback Data                                                      */
/* ------------------------------------------------------------------ */

const FALLBACK_MEMBERS: OrgMember[] = [
  { id: '1', hashId: 'U-2971', displayName: 'Sourav Sachin', email: 'sourav@scalatics.com', role: 'Platform Architect', department: 'Engineering', status: 'online', phone: '+91-98765-43210' },
  { id: '2', hashId: 'U-3A82', displayName: 'Ruth Anderson', email: 'ruth@scalatics.com', role: 'Product Manager', department: 'Product', status: 'online', phone: '+1-555-0142' },
  { id: '3', hashId: 'U-4B93', displayName: 'Priya Sharma', email: 'priya@scalatics.com', role: 'Frontend Developer', department: 'Engineering', status: 'busy', phone: '+91-87654-32100' },
  { id: '4', hashId: 'U-5C04', displayName: 'James Chen', email: 'james@scalatics.com', role: 'Backend Developer', department: 'Engineering', status: 'away', lastSeen: '15 min ago' },
  { id: '5', hashId: 'U-6D15', displayName: 'Anita Desai', email: 'anita@scalatics.com', role: 'QA Lead', department: 'Quality', status: 'online', phone: '+91-76543-21000' },
  { id: '6', hashId: 'U-7E26', displayName: 'Michael Torres', email: 'michael@scalatics.com', role: 'DevOps Engineer', department: 'Infrastructure', status: 'offline', lastSeen: '2 hours ago' },
  { id: '7', hashId: 'U-8F37', displayName: 'Kavita Nair', email: 'kavita@scalatics.com', role: 'Data Analyst', department: 'Analytics', status: 'online', phone: '+91-65432-10009' },
  { id: '8', hashId: 'U-9G48', displayName: 'David Kim', email: 'david@scalatics.com', role: 'Security Engineer', department: 'Security', status: 'busy', phone: '+1-555-0198' },
  { id: '9', hashId: 'U-AH59', displayName: 'Meera Patel', email: 'meera@scalatics.com', role: 'UX Designer', department: 'Design', status: 'away', lastSeen: '30 min ago' },
  { id: '10', hashId: 'U-BJ60', displayName: 'Alex Rivera', email: 'alex@scalatics.com', role: 'Support Agent', department: 'Support', status: 'online', phone: '+1-555-0167' },
];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  online: '#22c55e',
  away: '#eab308',
  busy: '#ef4444',
  offline: '#9ca3af',
};

const DEPT_COLORS: Record<string, string> = {
  'Executive': '#6366f1',
  'Engineering': '#3b82f6',
  'Engineering — AI': '#8b5cf6',
  'Customer Success Engineering': '#06b6d4',
  'Finance & Accounts': '#f59e0b',
  'Operations': '#ec4899',
  'Strategy': '#14b8a6',
  'Business Development': '#f97316',
  'Human Resources': '#10b981',
  'External': '#9ca3af',
};

const FILTER_OPTIONS = ['All', 'Online', 'Executive', 'Engineering', 'Engineering — AI', 'Customer Success Engineering', 'Finance & Accounts', 'Business Development', 'Human Resources'];

type ActiveView = 'directory' | 'chat' | 'voice-call' | 'video-call';
type CallState = 'ringing' | 'connected' | 'ended';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Decode JWT payload without library */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getAuthInfo() {
  const token = localStorage.getItem('zorbit_token') || '';
  const payload = token ? decodeJwtPayload(token) : null;
  return {
    token,
    orgId: (payload?.org as string) || (payload?.organizationHashId as string) || (payload?.orgId as string) || '',
    userHashId: (payload?.sub as string) || (payload?.userHashId as string) || (payload?.hashId as string) || '',
    displayName: (payload?.displayName as string) || 'You',
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DirectoryPage: React.FC = () => {
  /* ---- State ---- */
  const [members, setMembers] = useState<OrgMember[]>(FALLBACK_MEMBERS);
  const [membersSource, setMembersSource] = useState<'loading' | 'api' | 'fallback'>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('directory');
  const [callState, setCallState] = useState<CallState>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [groupCallMembers, setGroupCallMembers] = useState<OrgMember[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  // Connection status
  const [chatConnected, setChatConnected] = useState(false);
  const [rtcConnected, setRtcConnected] = useState(false);

  // Active channel for chat
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Active call
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    callerName: string;
    callerHashId: string;
    type: 'voice' | 'video';
    roomName: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatSocketRef = useRef<Socket | null>(null);
  const rtcSocketRef = useRef<Socket | null>(null);
  const livekitRoomRef = useRef<Room | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const remoteAudioRef = useRef<HTMLDivElement>(null);

  const auth = getAuthInfo();

  /* ---- Fetch real members from Identity API ---- */
  useEffect(() => {
    if (!auth.orgId || !auth.token) {
      setMembersSource('fallback');
      return;
    }

    api.get(`${API_CONFIG.IDENTITY_URL}/api/v1/O/${auth.orgId}/users`)
      .then((res) => {
        const users = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (users.length > 0) {
          const EXCLUDE_NAMES = ['cli user', 'deploy bot', 'menu admin', 'seed tester', 'seeder3', 'seeder4', 'seeder5'];
          const mapped: OrgMember[] = users
            .filter((u: Record<string, unknown>) => u.status === 'active' && !EXCLUDE_NAMES.includes(((u.displayName as string) || '').toLowerCase()))
            .map((u: Record<string, unknown>, idx: number) => ({
            id: (u.id as string) || String(idx + 1),
            hashId: (u.hashId as string) || (u.userHashId as string) || `U-${String(idx).padStart(4, '0')}`,
            displayName: (u.displayName as string) || (u.name as string) || (u.email as string) || 'Unknown',
            email: (u.email as string) || '',
            role: (u.title as string) || (u.role as string) || 'Team Member',
            department: (u.department as string) || '',
            avatar: (u.avatarUrl as string) || undefined,
            status: 'offline' as const,
            lastSeen: u.lastSeen as string | undefined,
            phone: u.phone as string | undefined,
          }))
          .sort((a: OrgMember, b: OrgMember) => {
            // Sort: online first, then by department, then by name
            if (a.status !== b.status) return a.status === 'online' ? -1 : 1;
            if (a.department !== b.department) return a.department.localeCompare(b.department);
            return a.displayName.localeCompare(b.displayName);
          });
          setMembers(mapped);
          setMembersSource('api');
        } else {
          setMembersSource('fallback');
        }
      })
      .catch(() => {
        setMembersSource('fallback');
      });
  }, [auth.orgId, auth.token]);

  /* ---- Connect Chat WebSocket ---- */
  useEffect(() => {
    if (!auth.token) return;

    const wsUrl = API_CONFIG.CHAT_WS_URL || window.location.origin;
    const socket = io(`${wsUrl}/chat`, {
      auth: { token: auth.token },
      transports: ['polling', 'websocket'],
      path: '/api/chat/socket.io',
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Directory] Chat WebSocket connected');
      setChatConnected(true);
      // Announce presence
      socket.emit('presence:update', { status: 'online' });
    });

    socket.on('disconnect', () => {
      console.log('[Directory] Chat WebSocket disconnected');
      setChatConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Directory] Chat WS connect error:', err.message);
      setChatConnected(false);
    });

    // Presence updates from other users
    socket.on('presence:changed', ({ userHashId, status }: { userHashId: string; status: string }) => {
      setMembers(prev => prev.map(m =>
        m.hashId === userHashId ? { ...m, status: status as OrgMember['status'] } : m
      ));
    });

    // Incoming chat messages
    socket.on('chat:message', (msg: {
      id?: string;
      messageHashId?: string;
      senderHashId?: string;
      senderName?: string;
      content?: string;
      text?: string;
      channelHashId?: string;
      createdAt?: string;
    }) => {
      const senderHId = msg.senderHashId || '';
      if (senderHId === auth.userHashId) return; // skip own echo
      const chatMsg: ChatMessage = {
        id: msg.id || msg.messageHashId || `msg-${Date.now()}`,
        sender: msg.senderName || 'Them',
        senderHashId: senderHId,
        text: msg.content || msg.text || '',
        time: msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isYou: false,
      };
      setMessages(prev => [...prev, chatMsg]);
    });

    // Typing indicators
    socket.on('chat:typing', ({ userHashId, displayName, isTyping: typing }: {
      userHashId: string; displayName: string; isTyping: boolean;
    }) => {
      if (userHashId !== auth.userHashId) {
        setIsTyping(typing);
        setTypingUser(displayName || 'Someone');
      }
    });

    chatSocketRef.current = socket;

    return () => {
      socket.emit('presence:update', { status: 'offline' });
      socket.disconnect();
      chatSocketRef.current = null;
    };
  }, [auth.token, auth.userHashId]);

  /* ---- Connect RTC WebSocket ---- */
  useEffect(() => {
    if (!auth.token) return;

    const wsUrl = API_CONFIG.RTC_WS_URL || window.location.origin;
    const socket = io(`${wsUrl}/rtc`, {
      auth: { token: auth.token },
      transports: ['polling', 'websocket'],
      path: '/api/rtc/socket.io',
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Directory] RTC WebSocket connected');
      setRtcConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Directory] RTC WebSocket disconnected');
      setRtcConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Directory] RTC WS connect error:', err.message);
      setRtcConnected(false);
    });

    // Incoming call
    socket.on('call:incoming', (data: {
      callId: string; callerName: string; callerHashId: string; type: 'voice' | 'video'; roomName: string;
    }) => {
      console.log('[Directory] Incoming call:', data);
      setIncomingCall(data);
      setShowIncomingCall(true);
    });

    // Call accepted — receive LiveKit token
    socket.on('call:token', async ({ token, livekitUrl }: { token: string; livekitUrl?: string }) => {
      console.log('[Directory] Received LiveKit token');
      try {
        await connectToLivekitRoom(token, livekitUrl);
      } catch (err) {
        console.error('[Directory] LiveKit connect failed:', err);
      }
    });

    // Call rejected by remote
    socket.on('call:rejected', () => {
      console.log('[Directory] Call was rejected');
      setCallState('ended');
      cleanupLivekit();
      setTimeout(() => {
        setActiveView('directory');
        setSelectedMember(null);
        setActiveCallId(null);
      }, 1500);
    });

    // Call ended by remote
    socket.on('call:ended', () => {
      console.log('[Directory] Call ended by remote');
      setCallState('ended');
      cleanupLivekit();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setTimeout(() => {
        setActiveView('directory');
        setSelectedMember(null);
        setActiveCallId(null);
      }, 1000);
    });

    rtcSocketRef.current = socket;

    return () => {
      socket.disconnect();
      rtcSocketRef.current = null;
      cleanupLivekit();
    };
  }, [auth.token]);

  /* ---- LiveKit Room Connection ---- */
  const connectToLivekitRoom = async (token: string, livekitUrl?: string) => {
    const url = livekitUrl || API_CONFIG.LIVEKIT_URL;
    const room = new Room();

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        const audioEl = track.attach();
        if (remoteAudioRef.current) {
          remoteAudioRef.current.appendChild(audioEl);
        } else {
          document.body.appendChild(audioEl);
        }
      }
      if (track.kind === Track.Kind.Video) {
        const videoEl = track.attach();
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'cover';
        if (videoContainerRef.current) {
          videoContainerRef.current.appendChild(videoEl);
        }
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach(el => el.remove());
    });

    room.on(RoomEvent.Disconnected, () => {
      console.log('[Directory] LiveKit room disconnected');
    });

    await room.connect(url, token);
    livekitRoomRef.current = room;
    setCallState('connected');

    // Publish local media based on call type
    try {
      if (activeView === 'video-call') {
        await room.localParticipant.enableCameraAndMicrophone();
      } else {
        await room.localParticipant.setMicrophoneEnabled(true);
      }
    } catch (err) {
      console.warn('[Directory] Could not enable local media:', err);
    }
  };

  const cleanupLivekit = () => {
    if (livekitRoomRef.current) {
      try {
        livekitRoomRef.current.disconnect();
      } catch { /* ignore */ }
      livekitRoomRef.current = null;
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call timer
  useEffect(() => {
    if (callState === 'connected' && (activeView === 'voice-call' || activeView === 'video-call')) {
      callTimerRef.current = setInterval(() => {
        setCallSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState, activeView]);

  /* ---- Actions ---- */

  /** Find or create a DM channel, load history, join WS room */
  const openChat = useCallback(async (member: OrgMember) => {
    setSelectedMember(member);
    setActiveView('chat');
    setMessages([]);
    setIsTyping(false);

    if (!auth.orgId || !chatSocketRef.current?.connected) {
      // Fallback: no backend, show placeholder
      setMessages([{
        id: 'sys-1',
        sender: 'System',
        text: chatConnected
          ? 'Starting conversation...'
          : 'Chat service not available. Messages will appear when the service connects.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isYou: false,
      }]);
      return;
    }

    try {
      // Create or find DM channel
      const channelRes = await api.post(
        `${API_CONFIG.CHAT_URL}/api/v1/O/${auth.orgId}/chat/channels`,
        { type: 'direct', memberUserHashIds: [auth.userHashId, member.hashId] }
      );
      const channel: ChatChannel = channelRes.data?.data || channelRes.data;
      const channelId = channel?.hashId || channel?.channelHashId;

      if (channelId) {
        setActiveChannelId(channelId);
        // Join channel on WS
        chatSocketRef.current.emit('chat:join', { channelHashId: channelId });

        // Load message history
        try {
          const historyRes = await api.get(
            `${API_CONFIG.CHAT_URL}/api/v1/O/${auth.orgId}/chat/channels/${channelId}/messages`
          );
          const rawMessages = Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data?.data || []);
          const mapped: ChatMessage[] = rawMessages.map((m: Record<string, unknown>) => ({
            id: (m.id as string) || (m.hashId as string) || `msg-${Date.now()}-${Math.random()}`,
            sender: (m.senderHashId as string) === auth.userHashId
              ? 'You'
              : (m.senderName as string) || member.displayName,
            senderHashId: m.senderHashId as string,
            text: (m.content as string) || (m.text as string) || '',
            time: m.createdAt
              ? new Date(m.createdAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
            isYou: (m.senderHashId as string) === auth.userHashId,
          }));
          setMessages(mapped);
        } catch {
          // History load failed — messages will come from WS
          console.warn('[Directory] Could not load message history');
        }
      }
    } catch (err) {
      console.warn('[Directory] Could not create/find chat channel:', err);
      setMessages([{
        id: 'sys-err',
        sender: 'System',
        text: 'Could not connect to chat channel. You can still try sending messages.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isYou: false,
      }]);
    }
  }, [auth.orgId, auth.userHashId, auth.token, chatConnected]);

  const startCall = useCallback((member: OrgMember, type: 'voice-call' | 'video-call') => {
    setSelectedMember(member);
    setActiveView(type);
    setCallState('ringing');
    setCallSeconds(0);
    setIsMuted(false);
    setIsVideoOn(type === 'video-call');
    setIsScreenSharing(false);
    setGroupCallMembers([]);
    setShowAddParticipant(false);

    // Emit call initiation to RTC backend
    if (rtcSocketRef.current?.connected) {
      const callType = type === 'video-call' ? 'video' : 'voice';
      rtcSocketRef.current.emit('call:initiate', {
        targetUserHashIds: [member.hashId],
        type: callType,
        roomName: `call-${Date.now()}`,
      });

      // Listen for one-time call ID assignment
      rtcSocketRef.current.once('call:initiated', (data: { callId: string }) => {
        setActiveCallId(data.callId);
      });

      // If no response within 30s, auto-end
      setTimeout(() => {
        setCallState(prev => {
          if (prev === 'ringing') {
            endCall();
            return 'ended';
          }
          return prev;
        });
      }, 30000);
    } else {
      // Fallback: simulate ringing then connect
      console.warn('[Directory] RTC not connected — simulating call');
      setTimeout(() => setCallState('connected'), 3000);
    }
  }, []);

  const endCall = useCallback(() => {
    setCallState('ended');
    if (callTimerRef.current) clearInterval(callTimerRef.current);

    // Signal end to RTC backend
    if (rtcSocketRef.current?.connected && activeCallId) {
      rtcSocketRef.current.emit('call:end', { callId: activeCallId });
    }

    // Disconnect LiveKit
    cleanupLivekit();

    // Disable local media
    if (livekitRoomRef.current) {
      try {
        livekitRoomRef.current.localParticipant.setMicrophoneEnabled(false);
        livekitRoomRef.current.localParticipant.setCameraEnabled(false);
      } catch { /* ignore */ }
    }

    setTimeout(() => {
      setActiveView('directory');
      setSelectedMember(null);
      setActiveCallId(null);
    }, 500);
  }, [activeCallId]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: `c${Date.now()}`,
      sender: 'You',
      senderHashId: auth.userHashId,
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isYou: true,
    };
    console.log('[Directory] sendMessage called, activeChannelId:', activeChannelId, 'wsConnected:', chatSocketRef.current?.connected, 'msg:', msg.text);
    setMessages(prev => {
      console.log('[Directory] setMessages: prev count:', prev.length, 'adding:', msg.text);
      return [...prev, msg];
    });

    // Send via WebSocket
    if (chatSocketRef.current?.connected && activeChannelId) {
      console.log('[Directory] Sending via WebSocket to channel:', activeChannelId);
      chatSocketRef.current.emit('chat:message', {
        channelHashId: activeChannelId,
        content: newMessage.trim(),
      });
    } else {
      console.log('[Directory] WS not connected or no channel, trying REST. channelId:', activeChannelId);
      // Fallback: try REST
      if (auth.orgId && activeChannelId) {
        api.post(
          `${API_CONFIG.CHAT_URL}/api/v1/O/${auth.orgId}/chat/channels/${activeChannelId}/messages`,
          { content: newMessage.trim() }
        ).catch((err) => {
          console.warn('[Directory] REST message send failed:', err.message);
        });
      }
    }

    setNewMessage('');
  }, [newMessage, activeChannelId, auth.orgId, auth.userHashId]);

  // Typing indicator: emit when user types
  const handleTyping = useCallback(() => {
    if (chatSocketRef.current?.connected && activeChannelId) {
      chatSocketRef.current.emit('chat:typing', { channelHashId: activeChannelId });
    }
  }, [activeChannelId]);

  const acceptIncomingCall = useCallback(() => {
    setShowIncomingCall(false);

    if (incomingCall && rtcSocketRef.current?.connected) {
      // Accept via signaling
      rtcSocketRef.current.emit('call:accept', { callId: incomingCall.callId });
      setActiveCallId(incomingCall.callId);

      // Find caller in members
      const caller = members.find(m => m.hashId === incomingCall.callerHashId);
      const callerMember: OrgMember = caller || {
        id: incomingCall.callerHashId,
        hashId: incomingCall.callerHashId,
        displayName: incomingCall.callerName,
        email: '',
        role: '',
        department: 'Engineering',
        status: 'online',
      };

      setSelectedMember(callerMember);
      setActiveView(incomingCall.type === 'video' ? 'video-call' : 'voice-call');
      setCallState('ringing'); // will switch to connected when token arrives
      setCallSeconds(0);
      setIsMuted(false);
      setIsVideoOn(incomingCall.type === 'video');
      setIsScreenSharing(false);
      setGroupCallMembers([]);
    } else {
      // Fallback: simulate with first online member
      const fallbackCaller = members.find(m => m.status === 'online' && m.hashId !== auth.userHashId) || members[1];
      if (fallbackCaller) {
        setSelectedMember(fallbackCaller);
        setActiveView('video-call');
        setCallState('ringing');
        setCallSeconds(0);
        setIsMuted(false);
        setIsVideoOn(true);
        setTimeout(() => setCallState('connected'), 3000);
      }
    }

    setIncomingCall(null);
  }, [incomingCall, members, auth.userHashId]);

  const declineIncomingCall = useCallback(() => {
    setShowIncomingCall(false);
    if (incomingCall && rtcSocketRef.current?.connected) {
      rtcSocketRef.current.emit('call:reject', { callId: incomingCall.callId });
    }
    setIncomingCall(null);
  }, [incomingCall]);

  const addParticipant = (member: OrgMember) => {
    if (!groupCallMembers.find(m => m.id === member.id) && member.id !== selectedMember?.id) {
      setGroupCallMembers(prev => [...prev, member]);

      // Signal to RTC backend
      if (rtcSocketRef.current?.connected && activeCallId) {
        rtcSocketRef.current.emit('call:add-participant', {
          callId: activeCallId,
          targetUserHashId: member.hashId,
        });
      }
    }
    setShowAddParticipant(false);
  };

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newVal = !prev;
      if (livekitRoomRef.current) {
        livekitRoomRef.current.localParticipant.setMicrophoneEnabled(!newVal);
      }
      return newVal;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOn(prev => {
      const newVal = !prev;
      if (livekitRoomRef.current) {
        livekitRoomRef.current.localParticipant.setCameraEnabled(newVal);
      }
      return newVal;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!livekitRoomRef.current) {
      setIsScreenSharing(prev => !prev);
      return;
    }
    try {
      if (!isScreenSharing) {
        await livekitRoomRef.current.localParticipant.setScreenShareEnabled(true);
      } else {
        await livekitRoomRef.current.localParticipant.setScreenShareEnabled(false);
      }
      setIsScreenSharing(prev => !prev);
    } catch (err) {
      console.warn('[Directory] Screen share toggle failed:', err);
    }
  }, [isScreenSharing]);

  const closeRightPanel = () => {
    if (activeView === 'voice-call' || activeView === 'video-call') endCall();
    else {
      // Leave chat channel
      if (chatSocketRef.current?.connected && activeChannelId) {
        chatSocketRef.current.emit('chat:leave', { channelHashId: activeChannelId });
      }
      setActiveView('directory');
      setSelectedMember(null);
      setActiveChannelId(null);
    }
  };

  /* ---- Filtering ---- */

  const filteredMembers = members.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || m.displayName.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.department.toLowerCase().includes(q);
    const matchesFilter = activeFilter === 'All' || activeFilter === 'Online' ? true : m.department === activeFilter;
    const matchesOnline = activeFilter === 'Online' ? m.status === 'online' : true;
    return matchesSearch && matchesFilter && matchesOnline;
  });

  const onlineCount = members.filter(m => m.status === 'online').length;

  /* ---- Render helpers ---- */

  const renderAvatar = (member: OrgMember, size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
    const sizeClasses = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' };
    const bg = DEPT_COLORS[member.department] || '#6366f1';
    return (
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`} style={{ backgroundColor: bg }}>
        {getInitials(member.displayName)}
      </div>
    );
  };

  const renderStatusDot = (status: string, className = '') => (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} style={{ backgroundColor: STATUS_COLORS[status] || '#9ca3af' }} />
  );

  /** Connection status indicator */
  const renderConnectionStatus = () => {
    const connected = chatConnected || rtcConnected;
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{
        backgroundColor: connected ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        borderColor: connected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      }}>
        {connected ? <Wifi className="h-3 w-3 text-green-600 dark:text-green-400" /> : <WifiOff className="h-3 w-3 text-red-500 dark:text-red-400" />}
        <span className={`text-xs font-medium ${connected ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>
    );
  };

  /* ---- Right Panel: Chat ---- */

  const renderChat = () => {
    if (!selectedMember) return null;
    return (
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={closeRightPanel} className="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            {renderAvatar(selectedMember, 'sm')}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{selectedMember.displayName}</p>
              <div className="flex items-center gap-1.5">
                {renderStatusDot(selectedMember.status)}
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{selectedMember.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => startCall(selectedMember, 'voice-call')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Voice call">
              <Phone className="h-4 w-4" />
            </button>
            <button onClick={() => startCall(selectedMember, 'video-call')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Video call">
              <Video className="h-4 w-4" />
            </button>
            <button onClick={closeRightPanel} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.isYou ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${msg.isYou ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'}`}>
                {!msg.isYou && <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 mb-0.5">{msg.sender}</p>}
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.isYou ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">{typingUser || selectedMember.displayName} is typing...</p>
                <div className="flex gap-1 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button onClick={sendMessage} className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---- Right Panel: Call ---- */

  const renderCall = () => {
    if (!selectedMember) return null;
    const isVideo = activeView === 'video-call';
    const totalParticipants = 1 + groupCallMembers.length + 1; // you + selected + group
    const isGroupCall = groupCallMembers.length > 0;

    return (
      <div className="flex flex-col h-full bg-gray-900 text-white relative">
        {/* Hidden audio container for remote tracks */}
        <div ref={remoteAudioRef} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button onClick={closeRightPanel} className="lg:hidden p-1 rounded hover:bg-gray-700">
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <PhoneCall className="h-5 w-5 text-green-400" />
            <div>
              <p className="font-semibold text-sm">
                {isGroupCall ? `Group Call \u2014 ${totalParticipants} participants` : selectedMember.displayName}
              </p>
              <p className="text-xs text-gray-400">
                {callState === 'ringing' ? 'Ringing...' : callState === 'connected' ? formatTimer(callSeconds) : 'Call ended'}
              </p>
            </div>
          </div>
          <button onClick={closeRightPanel} className="p-2 rounded hover:bg-gray-700 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Call area */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
          {callState === 'ringing' ? (
            /* Ringing state */
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {/* Pulsing rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="absolute h-24 w-24 rounded-full border-2 border-green-400/40" style={{ animation: 'ring-pulse 1.5s ease-out infinite' }} />
                  <span className="absolute h-24 w-24 rounded-full border-2 border-green-400/30" style={{ animation: 'ring-pulse 1.5s ease-out 0.5s infinite' }} />
                  <span className="absolute h-24 w-24 rounded-full border-2 border-green-400/20" style={{ animation: 'ring-pulse 1.5s ease-out 1s infinite' }} />
                </div>
                {renderAvatar(selectedMember, 'xl')}
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{selectedMember.displayName}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Calling<span className="inline-block w-6 text-left" style={{ animation: 'none' }}>...</span>
                </p>
              </div>
              <button onClick={endCall} className="mt-4 p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors">
                <PhoneOff className="h-6 w-6" />
              </button>
            </div>
          ) : callState === 'connected' ? (
            /* Connected state */
            <div className="flex-1 w-full flex flex-col">
              {/* Group call participant avatars */}
              {isGroupCall && (
                <div className="flex items-center justify-center gap-2 py-3 border-b border-gray-700">
                  {renderAvatar(selectedMember, 'sm')}
                  {groupCallMembers.map(gm => (
                    <div key={gm.id} className="relative">
                      {renderAvatar(gm, 'sm')}
                    </div>
                  ))}
                </div>
              )}

              {/* Video / Audio area */}
              <div className="flex-1 flex items-center justify-center p-4">
                {isVideo && isVideoOn ? (
                  /* Video grid */
                  <div className={`w-full h-full grid gap-2 ${isGroupCall && totalParticipants > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div ref={videoContainerRef} className="rounded-xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {renderAvatar(selectedMember, 'lg')}
                        <p className="mt-2 text-sm font-medium">{selectedMember.displayName}</p>
                        <p className="text-xs text-gray-400">{formatTimer(callSeconds)}</p>
                      </div>
                    </div>
                    {/* Your feed */}
                    <div className="rounded-xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center text-xl font-semibold text-white">You</div>
                        <p className="mt-2 text-sm font-medium">You</p>
                      </div>
                    </div>
                    {/* Group members */}
                    {groupCallMembers.map(gm => (
                      <div key={gm.id} className="rounded-xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${DEPT_COLORS[gm.department] || '#6366f1'}33 0%, ${DEPT_COLORS[gm.department] || '#6366f1'}66 100%)` }}>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {renderAvatar(gm, 'lg')}
                          <p className="mt-2 text-sm font-medium">{gm.displayName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Audio-only view */
                  <div className="flex flex-col items-center gap-4">
                    {renderAvatar(selectedMember, 'xl')}
                    <p className="text-lg font-semibold">{selectedMember.displayName}</p>
                    <div className="flex items-center gap-2 text-green-400">
                      <Circle className="h-2.5 w-2.5 fill-current" />
                      <span className="text-sm">Connected</span>
                    </div>
                    <p className="text-2xl font-mono tabular-nums">{formatTimer(callSeconds)}</p>
                  </div>
                )}
              </div>

              {/* Controls toolbar */}
              <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-700 bg-gray-800/50">
                <button onClick={toggleMute} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                {isVideo && (
                  <button onClick={toggleVideo} className={`p-3 rounded-full transition-colors ${!isVideoOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`} title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}>
                    {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </button>
                )}
                <button onClick={toggleScreenShare} className={`p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'}`} title="Share screen">
                  <Monitor className="h-5 w-5" />
                </button>
                <div className="relative">
                  <button onClick={() => setShowAddParticipant(!showAddParticipant)} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors" title="Add participant">
                    <UserPlus className="h-5 w-5" />
                  </button>
                  {/* Add participant dropdown */}
                  {showAddParticipant && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-20">
                      <p className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-700">Add participant</p>
                      <div className="max-h-48 overflow-y-auto">
                        {members.filter(m => m.status === 'online' && m.id !== selectedMember?.id && !groupCallMembers.find(g => g.id === m.id)).map(m => (
                          <button key={m.id} onClick={() => addParticipant(m)} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 transition-colors text-left">
                            {renderAvatar(m, 'sm')}
                            <span className="text-sm truncate">{m.displayName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={endCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors" title="End call">
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  /* ---- Incoming Call Overlay ---- */

  const renderIncomingCall = () => {
    if (!showIncomingCall) return null;
    const caller = incomingCall
      ? (members.find(m => m.hashId === incomingCall.callerHashId) || {
          id: incomingCall.callerHashId,
          hashId: incomingCall.callerHashId,
          displayName: incomingCall.callerName,
          email: '',
          role: '',
          department: 'Engineering',
          status: 'online' as const,
        })
      : members.find(m => m.id === '2') || members[1];

    if (!caller) return null;

    return (
      <div className="fixed top-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ animation: 'shake 0.4s ease-in-out infinite' }}>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2">
          <div className="flex items-center gap-2 text-white">
            <PhoneIncoming className="h-4 w-4" />
            <span className="text-sm font-medium">Incoming Call</span>
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              {renderAvatar(caller, 'md')}
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{caller.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{incomingCall?.type === 'voice' ? 'Voice' : 'Video'} call</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={declineIncomingCall} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium">
              <PhoneOff className="h-4 w-4" />
              Decline
            </button>
            <button onClick={acceptIncomingCall} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium">
              <Phone className="h-4 w-4" />
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---- Main Render ---- */

  const showRightPanel = activeView !== 'directory';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* CSS Animations */}
      <style>{`
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>

      {renderIncomingCall()}

      {/* ---- Header ---- */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800 px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-7xl flex items-center gap-4">
          <Users className="h-10 w-10 text-white/90 shrink-0" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Organization Directory</h1>
            <p className="mt-1 text-indigo-100 text-lg">Connect with your team — chat, voice, and video</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {renderConnectionStatus()}
          </div>
        </div>
      </section>

      {/* ---- Search & Filters ---- */}
      <section className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, role, or department..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {/* Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">{onlineCount} online</span>
              </div>
              {membersSource === 'api' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">Live</span>
                </div>
              )}
              {membersSource === 'fallback' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Sample data</span>
                </div>
              )}
            </div>
          </div>
          {/* Filter chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeFilter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Main Content ---- */}
      <section className="mx-auto max-w-7xl px-6 py-6 sm:px-10">
        <div className="flex gap-6 h-[calc(100vh-320px)] min-h-[500px]">
          {/* Left Panel: Member List */}
          <div className={`${showRightPanel ? 'hidden lg:block' : ''} w-full lg:w-[420px] shrink-0 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
            <div className="p-3 space-y-2">
              {filteredMembers.length === 0 ? (
                <div className="py-12 text-center text-gray-400 dark:text-gray-500">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No members found</p>
                </div>
              ) : (
                filteredMembers.map(member => (
                  <div
                    key={member.id}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors cursor-pointer ${
                      selectedMember?.id === member.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                    }`}
                  >
                    {/* Avatar + status */}
                    <div className="relative" onClick={() => openChat(member)}>
                      {renderAvatar(member)}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800"
                        style={{ backgroundColor: STATUS_COLORS[member.status] }}
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0" onClick={() => openChat(member)}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.role} — {member.department}</p>
                      {(member.status === 'away' || member.status === 'offline') && member.lastSeen && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5" /> {member.lastSeen}
                        </p>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openChat(member)} className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Chat">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button onClick={() => startCall(member, 'voice-call')} className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors" title="Voice call">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button onClick={() => startCall(member, 'video-call')} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Video call">
                        <Video className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel */}
          {showRightPanel ? (
            <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
              {activeView === 'chat' && renderChat()}
              {(activeView === 'voice-call' || activeView === 'video-call') && renderCall()}
            </div>
          ) : (
            /* Placeholder when no interaction is active */
            <div className="hidden lg:flex flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 items-center justify-center">
              <div className="text-center text-gray-400 dark:text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a team member to start a conversation</p>
                <p className="text-xs mt-1">Chat, voice call, or video call</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Hidden demo trigger — triple-click to simulate incoming call */}
      <div className="flex justify-end px-6 pb-1">
        <button
          onClick={() => setShowIncomingCall(true)}
          className="opacity-0 hover:opacity-30 transition-opacity duration-500 p-1"
          title="Demo mode"
        >
          <PhoneIncoming className="h-3 w-3 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default DirectoryPage;
