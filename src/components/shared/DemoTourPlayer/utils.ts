import type { ChapterMarker } from './types';

/** Format seconds to M:SS or H:MM:SS */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format ms to M:SS */
export function formatMs(ms: number): string {
  return formatDuration(ms / 1000);
}

/** Get chapter duration from next chapter or total */
export function chapterDuration(chapters: ChapterMarker[], index: number, totalDuration: number): string {
  const start = chapters[index].startMs / 1000;
  const end = index < chapters.length - 1 ? chapters[index + 1].startMs / 1000 : totalDuration;
  return formatDuration(end - start);
}

/** Find active chapter index for given time (seconds) */
export function activeChapterIndex(chapters: ChapterMarker[], currentTime: number): number {
  const timeMs = currentTime * 1000;
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (timeMs >= chapters[i].startMs) return i;
  }
  return 0;
}

/** Format date string for display */
export function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format time for display */
export function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
