/** Chapter marker within a recording */
export interface ChapterMarker {
  title: string;
  startMs: number;
}

/** Single recording entry from manifest.json */
export interface ManifestEntry {
  file: string;
  title: string;
  thumbnail?: string;
  timestamp: string;
  duration: number; // seconds
  chapters: ChapterMarker[];
}

/** Layout modes for the demo tour player */
export type LayoutMode = 'youtube' | 'netflix' | 'timeline' | 'chapters' | 'podcast' | 'mosaic';

/** Props for the DemoTourPlayer component */
export interface DemoTourPlayerProps {
  /** Array of recording manifest entries */
  recordings: ManifestEntry[];
  /** Base URL for video files (e.g. '/demos/v1/') */
  baseUrl: string;
  /** Default layout mode */
  defaultLayout?: LayoutMode;
  /** Available layouts (subset to restrict) */
  layouts?: LayoutMode[];
  /** Module title shown in header */
  title?: string;
  /** Enable deep-link via hash */
  enableDeepLink?: boolean;
  /** Custom class */
  className?: string;
}
