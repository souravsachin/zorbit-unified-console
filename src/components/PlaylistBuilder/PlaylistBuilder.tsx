import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Save,
  Search,
  Clock,
  Film,
  Monitor,
} from 'lucide-react';
import { useToast } from '../shared/Toast';
import { demoService, DemoSegment, PlaylistEntry } from '../../services/demo';

interface PlaylistBuilderProps {
  segments: DemoSegment[];
  userId: string;
  onPlaySegment: (segment: DemoSegment) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const PlaylistBuilder: React.FC<PlaylistBuilderProps> = ({ segments, userId, onPlaySegment }) => {
  const { toast } = useToast();
  const [playlistName, setPlaylistName] = useState('');
  const [entries, setEntries] = useState<(PlaylistEntry & { segment?: DemoSegment })[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredSegments = useMemo(() => {
    if (!search.trim()) return segments;
    const q = search.toLowerCase();
    return segments.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [segments, search]);

  const totalDuration = useMemo(() => {
    return entries.reduce((sum, e) => {
      const seg = segments.find((s) => s.id === e.segmentId);
      return sum + (seg?.duration || 0);
    }, 0);
  }, [entries, segments]);

  const addToPlaylist = (segment: DemoSegment) => {
    // Avoid duplicates
    if (entries.some((e) => e.segmentId === segment.id)) {
      toast('Segment already in playlist', 'info');
      return;
    }
    setEntries([
      ...entries,
      {
        segmentId: segment.id,
        autoPlay: true,
        order: entries.length + 1,
        segment,
      },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= entries.length) return;
    const newEntries = [...entries];
    [newEntries[index], newEntries[newIndex]] = [newEntries[newIndex], newEntries[index]];
    setEntries(newEntries.map((e, i) => ({ ...e, order: i + 1 })));
  };

  const toggleAutoPlay = (index: number) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], autoPlay: !newEntries[index].autoPlay };
    setEntries(newEntries);
  };

  const handleSave = async () => {
    if (!playlistName.trim()) {
      toast('Playlist name is required', 'warning');
      return;
    }
    if (entries.length === 0) {
      toast('Add at least one segment', 'warning');
      return;
    }
    if (!userId) {
      toast('User not authenticated', 'error');
      return;
    }

    setSaving(true);
    try {
      await demoService.createPlaylist(userId, {
        name: playlistName.trim(),
        segments: entries.map(({ segmentId, autoPlay, order }) => ({ segmentId, autoPlay, order })),
      });
      toast('Playlist saved', 'success');
      setPlaylistName('');
      setEntries([]);
    } catch {
      toast('Failed to save playlist', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Playlist name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Playlist Name
        </label>
        <input
          type="text"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          className="input-field"
          placeholder="e.g., Onboarding Training"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Segment selector */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-8 text-sm"
                placeholder="Search segments..."
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
            {filteredSegments.length === 0 ? (
              <p className="text-sm text-gray-400 p-3">No segments found.</p>
            ) : (
              filteredSegments.map((seg) => {
                const isAdded = entries.some((e) => e.segmentId === seg.id);
                return (
                  <div
                    key={seg.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {seg.type === 'video' ? (
                          <Film size={12} className="text-blue-500 flex-shrink-0" />
                        ) : (
                          <Monitor size={12} className="text-green-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{seg.title}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-gray-400">{seg.category}</span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock size={10} className="mr-0.5" />
                          {formatDuration(seg.duration)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToPlaylist(seg)}
                      disabled={isAdded}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isAdded
                          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          : 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected playlist */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium">
              Playlist ({entries.length} segments)
            </span>
            <span className="text-xs text-gray-400 flex items-center">
              <Clock size={12} className="mr-1" />
              Total: {formatDuration(totalDuration)}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-sm text-gray-400 p-3 text-center">
                Add segments from the left panel.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {entries.map((entry, i) => {
                  const seg = entry.segment || segments.find((s) => s.id === entry.segmentId);
                  return (
                    <div
                      key={entry.segmentId}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <span className="text-xs text-gray-400 w-5 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0 mx-2">
                        <span className="text-sm font-medium truncate block">
                          {seg?.title || entry.segmentId}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <label className="flex items-center space-x-1 text-xs text-gray-400 mr-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.autoPlay}
                            onChange={() => toggleAutoPlay(i)}
                            className="w-3 h-3 text-primary-600 rounded border-gray-300"
                          />
                          <span>Auto</span>
                        </label>
                        <button
                          onClick={() => {
                            if (seg) onPlaySegment(seg);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-primary-600"
                        >
                          <Play size={12} />
                        </button>
                        <button
                          onClick={() => moveEntry(i, -1)}
                          disabled={i === 0}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => moveEntry(i, 1)}
                          disabled={i === entries.length - 1}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown size={12} />
                        </button>
                        <button
                          onClick={() => removeEntry(i)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || entries.length === 0}
          className="btn-primary flex items-center space-x-2"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Playlist'}</span>
        </button>
      </div>
    </div>
  );
};

export default PlaylistBuilder;
