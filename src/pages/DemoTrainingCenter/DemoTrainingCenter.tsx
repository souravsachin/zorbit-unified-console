import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Copy,
  Edit3,
  Trash2,
  Lock,
  Plus,
  Volume2,
  VolumeX,
  Clock,
  Film,
  Monitor,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { demoService, DemoSegment } from '../../services/demo';
import DemoPlayer from '../../components/DemoPlayer/DemoPlayer';
import PlaylistBuilder from '../../components/PlaylistBuilder/PlaylistBuilder';

const CATEGORIES = ['All', 'Getting Started', 'Identity', 'Authorization', 'Navigation', 'Messaging', 'Audit', 'PII Vault', 'Advanced'];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const DemoTrainingCenter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [segments, setSegments] = useState<DemoSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('zorbit_tts') === 'true');
  const [builtinCategory, setBuiltinCategory] = useState('All');
  const [customCategory, setCustomCategory] = useState('All');
  const [playingSegment, setPlayingSegment] = useState<DemoSegment | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const loadSegments = async () => {
    setLoading(true);
    try {
      const res = await demoService.getSegments();
      setSegments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load demo segments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSegments(); }, []);

  useEffect(() => {
    localStorage.setItem('zorbit_tts', String(ttsEnabled));
  }, [ttsEnabled]);

  const builtinSegments = useMemo(() => {
    const filtered = segments.filter((s) => s.builtin);
    if (builtinCategory === 'All') return filtered;
    return filtered.filter((s) => s.category === builtinCategory);
  }, [segments, builtinCategory]);

  const customSegments = useMemo(() => {
    const filtered = segments.filter((s) => !s.builtin);
    if (customCategory === 'All') return filtered;
    return filtered.filter((s) => s.category === customCategory);
  }, [segments, customCategory]);

  const handleDuplicate = async (id: string) => {
    try {
      await demoService.duplicateSegment(id);
      toast('Segment duplicated', 'success');
      loadSegments();
    } catch {
      toast('Failed to duplicate segment', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this custom segment?')) return;
    try {
      await demoService.deleteSegment(id);
      toast('Segment deleted', 'success');
      loadSegments();
    } catch (err: any) {
      const msg = err?.response?.status === 403 ? 'Cannot delete built-in segments' : 'Failed to delete segment';
      toast(msg, 'error');
    }
  };

  const CategoryTabs: React.FC<{ active: string; onChange: (c: string) => void }> = ({ active, onChange }) => (
    <div className="flex flex-wrap gap-2 mb-4">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            active === cat
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  const SegmentCard: React.FC<{ segment: DemoSegment }> = ({ segment }) => (
    <div className="card p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {segment.builtin && <Lock size={14} className="text-gray-400" />}
          {segment.type === 'video' ? (
            <Film size={16} className="text-blue-500" />
          ) : (
            <Monitor size={16} className="text-green-500" />
          )}
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {segment.category}
          </span>
        </div>
        <div className="flex items-center text-xs text-gray-400">
          <Clock size={12} className="mr-1" />
          {formatDuration(segment.duration)}
        </div>
      </div>

      <h3 className="font-semibold text-base mb-1">{segment.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 line-clamp-2">
        {segment.description}
      </p>

      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => setPlayingSegment(segment)}
          className="btn-primary text-sm flex items-center space-x-1 py-1.5 px-3"
        >
          <Play size={14} />
          <span>Play</span>
        </button>
        {segment.builtin ? (
          <button
            onClick={() => handleDuplicate(segment.id)}
            className="btn-secondary text-sm flex items-center space-x-1 py-1.5 px-3"
          >
            <Copy size={14} />
            <span>Duplicate</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => navigate(`/demo-training/segments/${segment.id}/edit`)}
              className="btn-secondary text-sm flex items-center space-x-1 py-1.5 px-3"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleDelete(segment.id)}
              className="btn-danger text-sm flex items-center space-x-1 py-1.5 px-3"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Player overlay */}
      {playingSegment && (
        <DemoPlayer
          segment={playingSegment}
          ttsEnabled={ttsEnabled}
          onClose={() => setPlayingSegment(null)}
        />
      )}

      {/* Hero Banner */}
      <div className="card p-8 bg-gradient-to-r from-primary-600 to-primary-800 text-white border-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center space-x-2">
              <Sparkles size={28} />
              <span>Interactive Demo & Training Platform</span>
            </h1>
            <p className="text-primary-100 mb-4 max-w-2xl">
              Explore the Zorbit platform through guided interactive demos, video walkthroughs,
              and hands-on training segments. Build your own custom training sequences.
            </p>
            <div className="flex items-center gap-6 text-sm text-primary-200">
              <span className="flex items-center space-x-1">
                <BookOpen size={16} />
                <span>Step-by-step guides</span>
              </span>
              <span className="flex items-center space-x-1">
                <Film size={16} />
                <span>Video tutorials</span>
              </span>
              <span className="flex items-center space-x-1">
                <Zap size={16} />
                <span>Interactive walkthroughs</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ttsEnabled
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-primary-200 hover:bg-white/15'
              }`}
            >
              {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{ttsEnabled ? 'TTS Enabled' : 'Enable TTS'}</span>
            </button>
            <button
              onClick={() => navigate('/demo-training/segments/new')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-white text-primary-700 hover:bg-primary-50 transition-colors"
            >
              <Plus size={16} />
              <span>Create Segment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Built-in Segments */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2">
          <Lock size={18} className="text-gray-400" />
          <span>Built-in Segments</span>
        </h2>
        <CategoryTabs active={builtinCategory} onChange={setBuiltinCategory} />
        {loading ? (
          <p className="text-gray-400 text-sm">Loading segments...</p>
        ) : builtinSegments.length === 0 ? (
          <p className="text-gray-400 text-sm">No built-in segments found for this category.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {builtinSegments.map((seg) => (
              <SegmentCard key={seg.id} segment={seg} />
            ))}
          </div>
        )}
      </section>

      {/* Custom Segments */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2">
          <Edit3 size={18} className="text-gray-400" />
          <span>Your Custom Segments</span>
        </h2>
        <CategoryTabs active={customCategory} onChange={setCustomCategory} />
        {loading ? (
          <p className="text-gray-400 text-sm">Loading segments...</p>
        ) : customSegments.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No Custom Segments Yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Create your first segment or duplicate a built-in one to get started.
            </p>
            <button
              onClick={() => navigate('/demo-training/segments/new')}
              className="btn-primary mt-4 inline-flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Create Segment</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customSegments.map((seg) => (
              <SegmentCard key={seg.id} segment={seg} />
            ))}
          </div>
        )}
      </section>

      {/* Custom Playlist Builder */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center space-x-2">
          <ListOrdered size={18} className="text-gray-400" />
          <span>Custom Playlist Builder</span>
        </h2>
        <div className="card p-6">
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="btn-secondary flex items-center space-x-2 mb-4"
          >
            {showPlaylist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{showPlaylist ? 'Hide Builder' : 'Show Builder'}</span>
          </button>

          {!showPlaylist && (
            <div className="flex items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">How It Works:</p>
              <div className="flex items-center gap-6">
                <span className="flex items-center space-x-1">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Choose Segments</span>
                </span>
                <span className="text-gray-300 dark:text-gray-600">&#8594;</span>
                <span className="flex items-center space-x-1">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Watch Auto-Play</span>
                </span>
                <span className="text-gray-300 dark:text-gray-600">&#8594;</span>
                <span className="flex items-center space-x-1">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Control Playback</span>
                </span>
              </div>
            </div>
          )}

          {showPlaylist && (
            <PlaylistBuilder
              segments={segments}
              userId={user?.id || ''}
              onPlaySegment={(seg) => setPlayingSegment(seg)}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default DemoTrainingCenter;
