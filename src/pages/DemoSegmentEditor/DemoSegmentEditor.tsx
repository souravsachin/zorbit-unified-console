import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Eye,
} from 'lucide-react';
import { useToast } from '../../components/shared/Toast';
import {
  demoService,
  DemoStep,
  VideoChapter,
  SegmentType,
  StepAction,
  CreateSegmentPayload,
} from '../../services/demo';
import DemoPlayer from '../../components/DemoPlayer/DemoPlayer';

const STEP_ACTIONS: StepAction[] = ['info', 'navigate', 'type', 'click', 'highlight', 'scroll', 'wait'];
const CATEGORIES = ['Getting Started', 'Identity', 'Authorization', 'Navigation', 'Messaging', 'Audit', 'PII Vault', 'Advanced'];

const emptyStep = (): DemoStep => ({
  seq: 0,
  action: 'info',
  target: '',
  value: '',
  delay_ms: 2000,
  narration: '',
});

const emptyChapter = (): VideoChapter => ({
  title: '',
  timestamp: 0,
});

const DemoSegmentEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState<SegmentType>('interactive');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [steps, setSteps] = useState<DemoStep[]>([emptyStep()]);
  const [videoUrl, setVideoUrl] = useState('');
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    demoService.getSegment(id)
      .then((res) => {
        const seg = res.data;
        setTitle(seg.title);
        setDescription(seg.description);
        setCategory(seg.category);
        setType(seg.type);
        setTtsEnabled(seg.tts_enabled);
        setSteps(seg.steps?.length ? seg.steps : [emptyStep()]);
        setVideoUrl(seg.video_url || '');
        setChapters(seg.chapters || []);
      })
      .catch(() => {
        toast('Failed to load segment', 'error');
        navigate('/demo-training');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const computeDuration = (): number => {
    if (type === 'interactive') {
      return Math.round(steps.reduce((sum, s) => sum + (s.delay_ms || 2000), 0) / 1000);
    }
    return 0; // video duration is determined by the video itself
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast('Title is required', 'warning');
      return;
    }

    setSaving(true);
    const payload: CreateSegmentPayload = {
      title: title.trim(),
      description: description.trim(),
      duration: computeDuration(),
      type,
      category,
      steps: type === 'interactive' ? steps.map((s, i) => ({ ...s, seq: i + 1 })) : [],
      video_url: type === 'video' ? videoUrl : '',
      chapters: type === 'video' ? chapters : [],
      tts_enabled: ttsEnabled,
    };

    try {
      if (isEdit) {
        await demoService.updateSegment(id, payload);
        toast('Segment updated', 'success');
      } else {
        await demoService.createSegment(payload);
        toast('Segment created', 'success');
      }
      navigate('/demo-training');
    } catch (err: any) {
      const msg = err?.response?.status === 403 ? 'Cannot modify built-in segments' : 'Failed to save segment';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Step management
  const addStep = () => {
    setSteps([...steps, emptyStep()]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof DemoStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  // Chapter management
  const addChapter = () => {
    setChapters([...chapters, emptyChapter()]);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const updateChapter = (index: number, field: keyof VideoChapter, value: any) => {
    const newChapters = [...chapters];
    newChapters[index] = { ...newChapters[index], [field]: value };
    setChapters(newChapters);
  };

  const previewSegment = () => {
    setPreviewing(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-gray-400">Loading segment...</p>
      </div>
    );
  }

  const previewData = {
    id: id || 'preview',
    title,
    description,
    duration: computeDuration(),
    type,
    builtin: false,
    category,
    steps: type === 'interactive' ? steps.map((s, i) => ({ ...s, seq: i + 1 })) : [],
    video_url: type === 'video' ? videoUrl : '',
    chapters: type === 'video' ? chapters : [],
    tts_enabled: ttsEnabled,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Preview overlay */}
      {previewing && (
        <DemoPlayer
          segment={previewData}
          ttsEnabled={ttsEnabled}
          onClose={() => setPreviewing(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/demo-training')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Edit Segment' : 'Create Segment'}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={previewSegment}
            className="btn-secondary flex items-center space-x-2"
          >
            <Eye size={16} />
            <span>Preview</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Metadata Form */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Segment Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Getting Started with Users"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SegmentType)}
              className="input-field"
            >
              <option value="interactive">Interactive</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={(e) => setTtsEnabled(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Text-to-Speech
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            rows={3}
            placeholder="Describe what this demo covers..."
          />
        </div>
      </div>

      {/* Interactive Steps Editor */}
      {type === 'interactive' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Steps ({steps.length})</h2>
            <button onClick={addStep} className="btn-primary text-sm flex items-center space-x-1">
              <Plus size={14} />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase">
                    Step {i + 1}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveStep(i, -1)}
                      disabled={i === 0}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveStep(i, 1)}
                      disabled={i === steps.length - 1}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => removeStep(i)}
                      disabled={steps.length <= 1}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded disabled:opacity-30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                    <select
                      value={step.action}
                      onChange={(e) => updateStep(i, 'action', e.target.value)}
                      className="input-field text-sm"
                    >
                      {STEP_ACTIONS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Target (CSS selector)
                    </label>
                    <input
                      type="text"
                      value={step.target}
                      onChange={(e) => updateStep(i, 'target', e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g., #username, .nav-link"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={step.delay_ms}
                      onChange={(e) => updateStep(i, 'delay_ms', parseInt(e.target.value) || 0)}
                      className="input-field text-sm"
                      min={0}
                      step={100}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                  <textarea
                    value={step.value}
                    onChange={(e) => updateStep(i, 'value', e.target.value)}
                    className="input-field text-sm"
                    rows={2}
                    placeholder="Text to type, info message, or other value..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Narration</label>
                  <textarea
                    value={step.narration}
                    onChange={(e) => updateStep(i, 'narration', e.target.value)}
                    className="input-field text-sm"
                    rows={2}
                    placeholder="TTS narration text for this step..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Editor */}
      {type === 'video' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Video Settings</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Video URL
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="input-field"
              placeholder="https://example.com/video.mp4"
            />
            <p className="text-xs text-gray-400 mt-1">Supports MP4 and WebM direct URLs.</p>
          </div>

          {/* Chapters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Chapters</h3>
              <button onClick={addChapter} className="btn-secondary text-sm flex items-center space-x-1">
                <Plus size={14} />
                <span>Add Chapter</span>
              </button>
            </div>

            {chapters.length === 0 ? (
              <p className="text-sm text-gray-400">No chapters added. The video will play without chapter navigation.</p>
            ) : (
              <div className="space-y-2">
                {chapters.map((ch, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) => updateChapter(i, 'title', e.target.value)}
                      className="input-field text-sm flex-1"
                      placeholder="Chapter title"
                    />
                    <input
                      type="number"
                      value={ch.timestamp}
                      onChange={(e) => updateChapter(i, 'timestamp', parseInt(e.target.value) || 0)}
                      className="input-field text-sm w-28"
                      placeholder="Seconds"
                      min={0}
                    />
                    <button
                      onClick={() => removeChapter(i)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-end space-x-3 pb-8">
        <button
          onClick={() => navigate('/demo-training')}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center space-x-2"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Segment'}</span>
        </button>
      </div>
    </div>
  );
};

export default DemoSegmentEditor;
