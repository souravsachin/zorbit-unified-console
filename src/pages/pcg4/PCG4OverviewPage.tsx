import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info,
  Layers,
  FileText,
  Shield,
  Settings,
  Users,
  Play,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Rocket,
  PenLine,
  Workflow,
  BookOpen,
  BarChart3,
  Globe,
  DollarSign,
  Lock,
} from 'lucide-react';
import SlidePlayer, { type Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabKey = 'introduction' | 'presentation' | 'lifecycle';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'introduction', label: 'Introduction', icon: Info },
  { key: 'presentation', label: 'Presentation', icon: Play },
  { key: 'lifecycle', label: 'Lifecycle', icon: Layers },
];

// ---------------------------------------------------------------------------
// Capability cards for Introduction tab
// ---------------------------------------------------------------------------

interface Capability {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: FileText,
    title: 'Configuration Designer',
    description:
      'Build insurance product configurations with a visual step-by-step wizard covering plan details, benefits, encounters, and rules.',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  },
  {
    icon: Shield,
    title: 'Approval Workflows',
    description:
      'Multi-step Maker-Checker-Publisher workflow ensures every configuration is reviewed and approved before deployment.',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30',
  },
  {
    icon: Layers,
    title: 'Version Control',
    description:
      'Every configuration change is versioned. Compare drafts, roll back to previous versions, and audit the full change history.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  },
  {
    icon: Settings,
    title: 'Template Library',
    description:
      'Start from curated templates (HMO, PPO, HDHP) or clone existing configurations to accelerate product development.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description:
      'Granular roles — Drafter, Reviewer, Approver, Publisher — control who can create, review, and deploy configurations.',
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30',
  },
  {
    icon: Rocket,
    title: 'Deployment Pipeline',
    description:
      'Publish approved configurations to target environments with a single click. Track deployment history and rollback if needed.',
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30',
  },
];

// ---------------------------------------------------------------------------
// Lifecycle stages for Lifecycle tab
// ---------------------------------------------------------------------------

interface LifecycleStage {
  status: string;
  label: string;
  role: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    status: 'draft',
    label: 'Draft',
    role: 'Maker',
    description: 'Product analyst creates or edits the configuration using the visual designer.',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-300 dark:border-amber-700',
    icon: PenLine,
  },
  {
    status: 'in_review',
    label: 'In Review',
    role: 'Checker',
    description: 'Clinical or actuarial reviewer validates the configuration and requests changes if needed.',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-700',
    icon: Eye,
  },
  {
    status: 'approved',
    label: 'Approved',
    role: 'Checker',
    description: 'Senior manager approves the reviewed configuration for publication.',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: CheckCircle2,
  },
  {
    status: 'published',
    label: 'Published',
    role: 'Publisher',
    description: 'Operations team releases the configuration to the target environment.',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    icon: Rocket,
  },
  {
    status: 'deployed',
    label: 'Deployed',
    role: 'System',
    description: 'Configuration is live and serving production traffic.',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    icon: Clock,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PCG4OverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('introduction');
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">PCG4 Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Product Configurator for Group &amp; Individual health insurance
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 pb-3 border-b-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'introduction' && <IntroductionTab />}
      {activeTab === 'presentation' && <PresentationTab />}
      {activeTab === 'lifecycle' && <LifecycleTab navigate={navigate} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Introduction Tab
// ---------------------------------------------------------------------------

function IntroductionTab() {
  return (
    <div className="space-y-8">
      {/* What is PCG4 */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">What is PCG4?</h2>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          PCG4 (Product Configurator Generation 4) is Zorbit's module for designing, reviewing, and
          deploying insurance product configurations. It provides a visual, step-by-step wizard that
          guides product analysts through plan details, benefit structures, encounter definitions,
          copay/coinsurance rules, and network tiers — then routes the finished configuration through
          a controlled approval workflow before publishing to production systems.
        </p>
      </div>

      {/* Key Capabilities */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Capabilities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="card p-5">
                <div className={`inline-flex p-2 rounded-lg mb-3 ${cap.color}`}>
                  <Icon size={20} />
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
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">Target Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { role: 'Product Analysts', desc: 'Design and configure insurance products using the visual wizard.' },
            { role: 'Clinical Reviewers', desc: 'Validate benefit structures and encounter definitions for clinical accuracy.' },
            { role: 'Actuarial Reviewers', desc: 'Verify copay, coinsurance, and deductible rules meet pricing models.' },
            { role: 'Operations Managers', desc: 'Approve and deploy configurations to production environments.' },
          ].map((user) => (
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Presentation Tab
// ---------------------------------------------------------------------------

const PCG4_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Product Configurator Gen 4',
    subtitle: 'Enterprise Insurance Product Configuration Platform',
    icon: <Layers size={32} />,
    audioSrc: '/audio/pcg4/slide_01.mp3',
    background: 'bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">8-Step Wizard</p>
          <p className="text-white/60 text-xs mt-1">Guided product design</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">43 Encounter Types</p>
          <p className="text-white/60 text-xs mt-1">Comprehensive taxonomy</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Multi-Plan</p>
          <p className="text-white/60 text-xs mt-1">Bronze to Platinum tiers</p>
        </div>
      </div>
    ),
  },
  {
    id: 'architecture',
    title: 'MACH Architecture',
    subtitle: 'Microservices, API-first, Cloud-native, Headless',
    icon: <Globe size={32} />,
    audioSrc: '/audio/pcg4/slide_02.mp3',
    background: 'bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900',
    content: (
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-emerald-300">Independent Service</p>
          <p className="text-white/60 text-xs mt-1">Own database, own deployment, own lifecycle</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-blue-300">REST API Grammar</p>
          <p className="text-white/60 text-xs mt-1">/api/app/pcg4/v1/O/:orgId/configurations</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-amber-300">Event-Driven</p>
          <p className="text-white/60 text-xs mt-1">17 Kafka events published across the lifecycle</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-purple-300">Namespace Isolation</p>
          <p className="text-white/60 text-xs mt-1">Multi-tenant by organization (O-xxxx)</p>
        </div>
      </div>
    ),
  },
  {
    id: 'wizard',
    title: 'The 8-Step Configuration Wizard',
    subtitle: 'From insurer details to production deployment',
    icon: <Workflow size={32} />,
    audioSrc: '/audio/pcg4/slide_03.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800',
    content: (
      <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
        {[
          { n: '1', t: 'Insurer Details', d: 'Company info & codes' },
          { n: '2', t: 'Product Details', d: 'Product specs & rules' },
          { n: '3', t: 'Create Plans', d: 'Tiers, regions, currency' },
          { n: '4', t: 'Base Config', d: 'Limits & deductibles' },
          { n: '5', t: 'Encounters', d: '43 types in 10 categories' },
          { n: '6', t: 'Benefits', d: 'Copay & coinsurance' },
          { n: '7', t: 'Overrides', d: 'Per-plan customization' },
          { n: '8', t: 'Review & Publish', d: 'Validate & deploy' },
        ].map((s) => (
          <div key={s.n} className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <div className="w-6 h-6 rounded-full bg-white/20 mx-auto mb-1 flex items-center justify-center text-white font-bold text-xs">
              {s.n}
            </div>
            <p className="font-semibold text-white">{s.t}</p>
            <p className="text-white/50 text-[10px] mt-0.5">{s.d}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'encounters',
    title: 'Encounter Type Taxonomy',
    subtitle: '43 encounter types across 10 clinical categories',
    icon: <BookOpen size={32} />,
    audioSrc: '/audio/pcg4/slide_04.mp3',
    background: 'bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800',
    content: (
      <div className="grid grid-cols-5 gap-2 mt-4 text-xs">
        {[
          'Preventive Care',
          'Primary Care',
          'Specialist Care',
          'Emergency',
          'Hospital / Inpatient',
          'Outpatient / Surgical',
          'Mental Health',
          'Maternity',
          'Rehabilitation',
          'Diagnostics & Lab',
        ].map((cat) => (
          <div key={cat} className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <p className="font-medium text-white text-[11px]">{cat}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'workflow',
    title: 'Maker-Checker-Publisher',
    subtitle: 'Enterprise governance with segregation of duties',
    icon: <Shield size={32} />,
    audioSrc: '/audio/pcg4/slide_05.mp3',
    background: 'bg-gradient-to-br from-amber-700 via-orange-700 to-red-800',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { role: 'Maker', desc: 'Creates & edits', color: 'bg-amber-500/30 border-amber-400' },
          { role: 'Checker', desc: 'Reviews & approves', color: 'bg-blue-500/30 border-blue-400' },
          { role: 'Publisher', desc: 'Deploys to prod', color: 'bg-emerald-500/30 border-emerald-400' },
        ].map((r, i) => (
          <React.Fragment key={r.role}>
            {i > 0 && <ArrowRight size={20} className="text-white/40" />}
            <div className={`${r.color} border backdrop-blur rounded-lg p-4 text-center min-w-[140px]`}>
              <p className="font-bold text-white">{r.role}</p>
              <p className="text-white/60 text-xs mt-1">{r.desc}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    ),
  },
  {
    id: 'pricing',
    title: 'Product Pricing Engine',
    subtitle: 'Actuarial risk underwriting — not module licensing',
    icon: <DollarSign size={32} />,
    audioSrc: '/audio/pcg4/slide_06.mp3',
    background: 'bg-gradient-to-br from-violet-700 via-purple-800 to-fuchsia-900',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-green-300">Product Pricing</p>
          <p className="text-white/60 text-xs mt-1">
            What actuaries decide to charge for underwriting risk — premiums, rate tables,
            age-band factors, geographic adjustments, and loss ratios.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-amber-300" />
            <p className="font-semibold text-amber-300">Access Restricted</p>
          </div>
          <p className="text-white/60 text-xs mt-1">
            Requires the products.pcg4.pricing privilege. Hidden from the main navigation
            — only accessible to authorized pricing analysts.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'deployment',
    title: 'Deployment Pipeline',
    subtitle: 'Environment-aware publishing with rollback',
    icon: <Rocket size={32} />,
    audioSrc: '/audio/pcg4/slide_07.mp3',
    background: 'bg-gradient-to-br from-cyan-700 via-blue-800 to-indigo-900',
    content: (
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        {[
          { env: 'Staging', desc: 'Integration testing', color: 'border-amber-400 bg-amber-500/20' },
          { env: 'Production', desc: 'Live traffic', color: 'border-emerald-400 bg-emerald-500/20' },
          { env: 'Testing', desc: 'QA validation', color: 'border-blue-400 bg-blue-500/20' },
        ].map((e) => (
          <div key={e.env} className={`${e.color} border backdrop-blur rounded-lg p-3 text-center`}>
            <p className="font-bold text-white">{e.env}</p>
            <p className="text-white/50 text-xs mt-1">{e.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'metrics',
    title: 'Dashboard & Analytics',
    subtitle: 'Tiered widget registry with adaptive rendering',
    icon: <BarChart3 size={32} />,
    audioSrc: '/audio/pcg4/slide_08.mp3',
    background: 'bg-gradient-to-br from-rose-700 via-pink-700 to-purple-800',
    content: (
      <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
        {[
          { tier: 'Tier 1', label: 'Hero KPIs', desc: '2 widgets always shown' },
          { tier: 'Tier 2', label: 'Operational', desc: 'Up to 4 widgets' },
          { tier: 'Tier 3', label: 'Rich Context', desc: 'Charts & feeds' },
          { tier: 'Tier 4', label: 'Full Detail', desc: 'Everything surfaced' },
        ].map((t) => (
          <div key={t.tier} className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <p className="font-bold text-white">{t.tier}</p>
            <p className="text-white/60 text-[10px] mt-0.5">{t.label}</p>
            <p className="text-white/40 text-[9px]">{t.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
];

function PresentationTab() {
  return <SlidePlayer slides={PCG4_SLIDES} autoPlay={false} />;
}

// ---------------------------------------------------------------------------
// Lifecycle Tab
// ---------------------------------------------------------------------------

function LifecycleTab({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-2">Configuration Lifecycle</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Every configuration moves through these stages. Click a stage to view configurations in that status.
        </p>

        {/* Workflow diagram */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <React.Fragment key={stage.status}>
                {idx > 0 && (
                  <div className="hidden lg:flex items-center justify-center">
                    <ArrowRight size={20} className="text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <button
                  onClick={() =>
                    navigate(`/app/pcg4/configurations?status=${stage.status}`)
                  }
                  className={`flex-1 rounded-lg border-2 ${stage.borderColor} ${stage.bgColor} p-4 text-left hover:shadow-md transition-shadow group`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon size={18} className={stage.color} />
                    <span className={`font-semibold text-sm ${stage.color}`}>
                      {stage.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    {stage.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                      {stage.role}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                    />
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Role legend */}
      <div className="card p-6">
        <h3 className="font-semibold mb-3">Role Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-medium">
              Maker
            </span>
            <span className="text-gray-600 dark:text-gray-400">Creates and edits drafts</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium">
              Checker
            </span>
            <span className="text-gray-600 dark:text-gray-400">Reviews and approves</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium">
              Publisher
            </span>
            <span className="text-gray-600 dark:text-gray-400">Deploys to production</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PCG4OverviewPage;
