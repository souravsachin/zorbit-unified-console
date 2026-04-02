import React, { useState } from 'react';
import {
  Info,
  Layers,
  Play,
  Video,
  BookOpen,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import SlidePlayer, { type Slide } from '../SlidePlayer';
import { DemoTourPlayer } from '../DemoTourPlayer';
import type { ManifestEntry } from '../DemoTourPlayer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModuleCapability {
  icon: React.ElementType;
  title: string;
  description: string;
}

export interface LifecycleStage {
  label: string;
  description: string;
  color: string;
}

export interface ModuleFAQ {
  question: string;
  answer: string;
}

export interface ModuleResource {
  label: string;
  url: string;
  icon?: React.ElementType;
}

export interface ModuleHubPageProps {
  moduleId: string;
  moduleName: string;
  moduleDescription: string;
  moduleIntro?: string;
  icon: React.ElementType;

  // Tab 1: Introduction
  capabilities: ModuleCapability[];
  targetUsers?: { role: string; desc: string }[];

  // Tab 2: Presentation
  slides?: Slide[];

  // Tab 3: Lifecycle
  lifecycleStages: LifecycleStage[];

  // Tab 4: Video Tutorials
  recordings?: ManifestEntry[];
  videosBaseUrl?: string;

  // Tab 5: Resources & Docs
  swaggerUrl?: string;
  faqs?: ModuleFAQ[];
  resources?: ModuleResource[];

  /** Extra content rendered at the top of the Resources tab (e.g. seed tools) */
  extraResourceContent?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Tab key type
// ---------------------------------------------------------------------------

type TabKey = 'introduction' | 'presentation' | 'lifecycle' | 'videos' | 'resources';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'introduction', label: 'Introduction', icon: Info },
  { key: 'presentation', label: 'Presentation', icon: Play },
  { key: 'lifecycle', label: 'Lifecycle', icon: Layers },
  { key: 'videos', label: 'Video Tutorials', icon: Video },
  { key: 'resources', label: 'Resources & Docs', icon: BookOpen },
];

// ---------------------------------------------------------------------------
// Capability color palette (cycles through these)
// ---------------------------------------------------------------------------

const CAP_COLORS = [
  'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
  'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  'text-rose-600 bg-rose-50 dark:bg-rose-900/30',
  'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30',
];

// ---------------------------------------------------------------------------
// Lifecycle stage color palette
// ---------------------------------------------------------------------------

const STAGE_COLORS = [
  { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700' },
  { text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700' },
  { text: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-300 dark:border-indigo-700' },
  { text: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700' },
  { text: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700' },
  { text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-700' },
  { text: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-300 dark:border-cyan-700' },
  { text: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-300 dark:border-rose-700' },
];

// ---------------------------------------------------------------------------
// Placeholder message
// ---------------------------------------------------------------------------

function PlaceholderMessage({ section }: { section: string }) {
  return (
    <div className="card p-12 text-center">
      <MessageSquare size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        The <strong>{section}</strong> section is being prepared.
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
        Contact the module administrator to contribute content.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ Accordion
// ---------------------------------------------------------------------------

function FAQAccordion({ faqs }: { faqs: ModuleFAQ[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="card overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <HelpCircle size={16} className="text-primary-500 shrink-0" />
              <span className="text-sm font-medium">{faq.question}</span>
            </div>
            {open === i ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {open === i && (
            <div className="px-4 pb-4 pl-10 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModuleHubPage
// ---------------------------------------------------------------------------

const ModuleHubPage: React.FC<ModuleHubPageProps> = (props) => {
  // Deep linking: read tab from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const tabFromUrl = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(tabFromUrl || 'introduction');

  // Update URL when tab changes
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };
  const Icon = props.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
          <Icon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{props.moduleName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {props.moduleDescription}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6 overflow-x-auto">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center space-x-2 pb-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <TabIcon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'introduction' && <IntroductionTab {...props} />}
      {activeTab === 'presentation' && <PresentationTab slides={props.slides} />}
      {activeTab === 'lifecycle' && <LifecycleTab stages={props.lifecycleStages} />}
      {activeTab === 'videos' && <VideoTutorialsTab recordings={props.recordings} baseUrl={props.videosBaseUrl} moduleName={props.moduleName} />}
      {activeTab === 'resources' && <ResourcesTab swaggerUrl={props.swaggerUrl} faqs={props.faqs} resources={props.resources} extraContent={props.extraResourceContent} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab: Introduction
// ---------------------------------------------------------------------------

function IntroductionTab(props: ModuleHubPageProps) {
  return (
    <div className="space-y-8">
      {/* Description */}
      {props.moduleIntro && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-3">What is {props.moduleName}?</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {props.moduleIntro}
          </p>
        </div>
      )}

      {/* Key Capabilities */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {props.capabilities.map((cap, i) => {
            const CapIcon = cap.icon;
            const color = CAP_COLORS[i % CAP_COLORS.length];
            return (
              <div key={cap.title} className="card p-5">
                <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
                  <CapIcon size={20} />
                </div>
                <h3 className="font-semibold mb-1">{cap.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {cap.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Users */}
      {props.targetUsers && props.targetUsers.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-3">Target Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {props.targetUsers.map((user) => (
              <div key={user.role} className="flex items-start space-x-3">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{user.role}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Presentation
// ---------------------------------------------------------------------------

function PresentationTab({ slides }: { slides?: Slide[] }) {
  if (!slides || slides.length === 0) {
    return <PlaceholderMessage section="Presentation" />;
  }
  return <SlidePlayer slides={slides} autoPlay={false} />;
}

// ---------------------------------------------------------------------------
// Tab: Lifecycle
// ---------------------------------------------------------------------------

function LifecycleTab({ stages }: { stages: LifecycleStage[] }) {
  if (!stages || stages.length === 0) {
    return <PlaceholderMessage section="Lifecycle" />;
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-2">Lifecycle Stages</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        The progression of status through the module workflow.
      </p>

      <div className="flex flex-col lg:flex-row items-stretch gap-3">
        {stages.map((stage, idx) => {
          const colors = STAGE_COLORS[idx % STAGE_COLORS.length];
          return (
            <React.Fragment key={stage.label}>
              {idx > 0 && (
                <div className="hidden lg:flex items-center justify-center">
                  <ArrowRight size={20} className="text-gray-300 dark:text-gray-600" />
                </div>
              )}
              <div
                className={`flex-1 rounded-lg border-2 ${colors.border} ${colors.bg} p-4 text-left`}
              >
                <span className={`font-semibold text-sm ${colors.text}`}>
                  {stage.label}
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
                  {stage.description}
                </p>
                {stage.color && (
                  <div className="mt-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                      title={stage.color}
                    />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Video Tutorials
// ---------------------------------------------------------------------------

function VideoTutorialsTab({
  recordings,
  baseUrl,
  moduleName,
}: {
  recordings?: ManifestEntry[];
  baseUrl?: string;
  moduleName: string;
}) {
  if (!recordings || recordings.length === 0) {
    return <PlaceholderMessage section="Video Tutorials" />;
  }
  return (
    <DemoTourPlayer
      recordings={recordings}
      baseUrl={baseUrl || '/demos/'}
      defaultLayout="podcast"
      title={`${moduleName} Tutorials`}
    />
  );
}

// ---------------------------------------------------------------------------
// Tab: Resources & Docs
// ---------------------------------------------------------------------------

function ResourcesTab({
  swaggerUrl,
  faqs,
  resources,
  extraContent,
}: {
  swaggerUrl?: string;
  faqs?: ModuleFAQ[];
  resources?: ModuleResource[];
  extraContent?: React.ReactNode;
}) {
  const hasContent = swaggerUrl || (faqs && faqs.length > 0) || (resources && resources.length > 0) || extraContent;

  if (!hasContent) {
    return <PlaceholderMessage section="Resources & Docs" />;
  }

  return (
    <div className="space-y-8">
      {/* Extra content (e.g. seed tools) */}
      {extraContent}

      {/* API Documentation */}
      {swaggerUrl && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-3">API Documentation</h2>
          <a
            href={swaggerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <ExternalLink size={16} />
            <span>Open Swagger UI</span>
          </a>
        </div>
      )}

      {/* Resources */}
      {resources && resources.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-3">Related Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resources.map((r, i) => {
              const RIcon = r.icon || ExternalLink;
              return (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <RIcon size={18} className="text-primary-500 shrink-0" />
                  <span className="text-sm font-medium">{r.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Frequently Asked Questions</h2>
          <FAQAccordion faqs={faqs} />
        </div>
      )}

      {/* CTA */}
      <div className="card p-6 bg-gray-50 dark:bg-gray-800/50 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Need more resources? Talk to the module administrator to add documentation, guides, and tutorials.
        </p>
      </div>
    </div>
  );
}

export default ModuleHubPage;
export type { Slide };
