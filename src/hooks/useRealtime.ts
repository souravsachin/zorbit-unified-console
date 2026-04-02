import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const REALTIME_URL =
  import.meta.env.VITE_REALTIME_WS_URL || '';

// ── Singleton connection ─────────────────────────────────────────────

let socket: Socket | null = null;
let refCount = 0;
const channelListeners = new Map<string, Set<(data: unknown) => void>>();

function getOrCreateSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  if (socket) {
    // Existing socket that is disconnected — reconnect
    socket.connect();
    return socket;
  }

  socket = io(`${REALTIME_URL}/realtime`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('[realtime] connected', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[realtime] disconnected:', reason);
  });

  socket.on('error', (err: { message: string }) => {
    console.warn('[realtime] error:', err.message);
  });

  socket.on('rate_limited', (data: { channel: string }) => {
    console.warn('[realtime] rate limited on channel:', data.channel);
  });

  return socket;
}

function destroySocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  channelListeners.clear();
}

// ── useRealtime: manages the singleton connection lifecycle ──────────

export interface UseRealtimeReturn {
  connected: boolean;
  subscribe: (event: string, handler: (data: unknown) => void) => () => void;
  emit: (event: string, data: unknown) => void;
  socketId: string | null;
}

export function useRealtime(): UseRealtimeReturn {
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('zorbit_token');
    if (!token) return;

    refCount++;
    const s = getOrCreateSocket(token);
    socketRef.current = s;

    const onConnect = () => {
      setConnected(true);
      setSocketId(s.id ?? null);
    };
    const onDisconnect = () => {
      setConnected(false);
      setSocketId(null);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    // If already connected
    if (s.connected) {
      setConnected(true);
      setSocketId(s.id ?? null);
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      refCount--;
      if (refCount <= 0) {
        destroySocket();
        refCount = 0;
      }
    };
  }, []);

  const subscribe = useCallback(
    (event: string, handler: (data: unknown) => void): (() => void) => {
      const s = socketRef.current;
      if (!s) return () => {};

      s.on(event, handler);
      return () => {
        s.off(event, handler);
      };
    },
    [],
  );

  const emit = useCallback((event: string, data: unknown) => {
    const s = socketRef.current;
    if (s && s.connected) {
      s.emit(event, data);
    }
  }, []);

  return { connected, subscribe, emit, socketId };
}

// ── useChannel: subscribe to a specific event and get latest data ────

export function useChannel<T = unknown>(event: string): {
  data: T | null;
  connected: boolean;
} {
  const { connected, subscribe } = useRealtime();
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!event) return;
    const unsub = subscribe(event, (payload: unknown) => {
      setData(payload as T);
    });
    return unsub;
  }, [event, subscribe]);

  return { data, connected };
}
