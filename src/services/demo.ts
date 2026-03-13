import { API_CONFIG } from '../config';
import api from './api';

// --- Types ---

export type StepAction = 'info' | 'navigate' | 'type' | 'click' | 'highlight' | 'scroll' | 'wait';

export interface DemoStep {
  seq: number;
  action: StepAction;
  target: string;
  value: string;
  delay_ms: number;
  narration: string;
}

export interface VideoChapter {
  title: string;
  timestamp: number; // seconds
}

export type SegmentType = 'interactive' | 'video';

export interface DemoSegment {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  type: SegmentType;
  builtin: boolean;
  category: string;
  steps: DemoStep[];
  video_url: string;
  chapters: VideoChapter[];
  tts_enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSegmentPayload {
  title: string;
  description: string;
  duration: number;
  type: SegmentType;
  category: string;
  steps: DemoStep[];
  video_url: string;
  chapters: VideoChapter[];
  tts_enabled: boolean;
}

export interface DemoPlaylist {
  id: string;
  name: string;
  segments: PlaylistEntry[];
  createdAt?: string;
}

export interface PlaylistEntry {
  segmentId: string;
  autoPlay: boolean;
  order: number;
}

export interface CreatePlaylistPayload {
  name: string;
  segments: PlaylistEntry[];
}

// --- API Functions ---

const BASE = () => `${API_CONFIG.IDENTITY_URL}/api/v1/G/demo`;

export const demoService = {
  // Segments
  getSegments: () =>
    api.get<DemoSegment[]>(`${BASE()}/segments`),

  getSegment: (id: string) =>
    api.get<DemoSegment>(`${BASE()}/segments/${id}`),

  createSegment: (payload: CreateSegmentPayload) =>
    api.post<DemoSegment>(`${BASE()}/segments`, payload),

  updateSegment: (id: string, payload: Partial<CreateSegmentPayload>) =>
    api.put<DemoSegment>(`${BASE()}/segments/${id}`, payload),

  deleteSegment: (id: string) =>
    api.delete(`${BASE()}/segments/${id}`),

  duplicateSegment: (id: string) =>
    api.post<DemoSegment>(`${BASE()}/segments/${id}/duplicate`),

  // Playlists
  getPlaylists: (userId: string) =>
    api.get<DemoPlaylist[]>(`${API_CONFIG.IDENTITY_URL}/api/v1/U/${userId}/demo/playlists`),

  createPlaylist: (userId: string, payload: CreatePlaylistPayload) =>
    api.post<DemoPlaylist>(`${API_CONFIG.IDENTITY_URL}/api/v1/U/${userId}/demo/playlists`, payload),
};
