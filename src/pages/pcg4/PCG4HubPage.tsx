import React from 'react';
import {
  Layers,
  FileText,
  Shield,
  Settings,
  Users,
  Rocket,
  Globe,
  Workflow,
  BookOpen,
  BarChart3,
  DollarSign,
  Lock,
  ArrowRight,
  Code,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// PCG4 Presentation Slides (preserved from original PCG4OverviewPage)
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
    subtitle: 'Actuarial risk underwriting -- not module licensing',
    icon: <DollarSign size={32} />,
    audioSrc: '/audio/pcg4/slide_06.mp3',
    background: 'bg-gradient-to-br from-violet-700 via-purple-800 to-fuchsia-900',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-green-300">Product Pricing</p>
          <p className="text-white/60 text-xs mt-1">
            What actuaries decide to charge for underwriting risk -- premiums, rate tables,
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
            -- only accessible to authorized pricing analysts.
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PCG4HubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="pcg4"
      moduleName="PCG4"
      moduleDescription="Product Configurator for Group &amp; Individual health insurance"
      moduleIntro="PCG4 (Product Configurator Generation 4) is Zorbit's module for designing, reviewing, and deploying insurance product configurations. It provides a visual, step-by-step wizard that guides product analysts through plan details, benefit structures, encounter definitions, copay/coinsurance rules, and network tiers -- then routes the finished configuration through a controlled approval workflow before publishing to production systems."
      icon={Layers}
      capabilities={[
        {
          icon: FileText,
          title: 'Configuration Designer',
          description: 'Build insurance product configurations with a visual step-by-step wizard covering plan details, benefits, encounters, and rules.',
        },
        {
          icon: Shield,
          title: 'Approval Workflows',
          description: 'Multi-step Maker-Checker-Publisher workflow ensures every configuration is reviewed and approved before deployment.',
        },
        {
          icon: Layers,
          title: 'Version Control',
          description: 'Every configuration change is versioned. Compare drafts, roll back to previous versions, and audit the full change history.',
        },
        {
          icon: Settings,
          title: 'Template Library',
          description: 'Start from curated templates (HMO, PPO, HDHP) or clone existing configurations to accelerate product development.',
        },
        {
          icon: Users,
          title: 'Role-Based Access',
          description: 'Granular roles -- Drafter, Reviewer, Approver, Publisher -- control who can create, review, and deploy configurations.',
        },
        {
          icon: Rocket,
          title: 'Deployment Pipeline',
          description: 'Publish approved configurations to target environments with a single click. Track deployment history and rollback if needed.',
        },
      ]}
      targetUsers={[
        { role: 'Product Analysts', desc: 'Design and configure insurance products using the visual wizard.' },
        { role: 'Clinical Reviewers', desc: 'Validate benefit structures and encounter definitions for clinical accuracy.' },
        { role: 'Actuarial Reviewers', desc: 'Verify copay, coinsurance, and deductible rules meet pricing models.' },
        { role: 'Operations Managers', desc: 'Approve and deploy configurations to production environments.' },
      ]}
      slides={PCG4_SLIDES}
      lifecycleStages={[
        { label: 'Draft', description: 'Product analyst creates or edits the configuration using the visual designer.', color: '#f59e0b' },
        { label: 'In Review', description: 'Clinical or actuarial reviewer validates the configuration and requests changes if needed.', color: '#3b82f6' },
        { label: 'Approved', description: 'Senior manager approves the reviewed configuration for publication.', color: '#10b981' },
        { label: 'Published', description: 'Operations team releases the configuration to the target environment.', color: '#059669' },
        { label: 'Deployed', description: 'Configuration is live and serving production traffic.', color: '#06b6d4' },
      ]}
      recordings={[
        {
          file: 'pcg4-overview.mp4',
          title: 'PCG4 Overview',
          thumbnail: '',
          timestamp: '2026-03-27',
          duration: 98,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Platform Context', startMs: 15000 },
            { title: '8-Step Wizard', startMs: 30000 },
            { title: 'Encounter Types', startMs: 50000 },
            { title: 'Approval Workflow', startMs: 70000 },
            { title: 'Deployment', startMs: 85000 },
          ],
        },
        {
          file: 'pcg4-deep-dive.mp4',
          title: 'Configuration Deep-Dive',
          thumbnail: '',
          timestamp: '2026-03-27',
          duration: 153,
          chapters: [
            { title: 'Insurer Details', startMs: 0 },
            { title: 'Product Details', startMs: 20000 },
            { title: 'Plan Creation', startMs: 40000 },
            { title: 'Base Configuration', startMs: 60000 },
            { title: 'Encounter Mapping', startMs: 80000 },
            { title: 'Benefits & Copay', startMs: 100000 },
            { title: 'Per-Plan Overrides', startMs: 120000 },
            { title: 'Review & Publish', startMs: 140000 },
          ],
        },
        {
          file: 'pcg4-encounters.mp4',
          title: 'Encounters Taxonomy',
          thumbnail: '',
          timestamp: '2026-03-27',
          duration: 103,
          chapters: [
            { title: 'Overview', startMs: 0 },
            { title: 'Clinical Categories', startMs: 15000 },
            { title: 'Encounter Details', startMs: 35000 },
            { title: 'Configuration Options', startMs: 55000 },
            { title: 'Category Mapping', startMs: 75000 },
            { title: 'Best Practices', startMs: 90000 },
          ],
        },
        {
          file: '../product-pricing/awnic-product-screencast.mp4',
          title: 'AWNIC Product Screencast',
          thumbnail: '',
          timestamp: '2026-03-31',
          duration: 180,
          chapters: [
            { title: 'Introduction', startMs: 0 },
            { title: 'Product Overview', startMs: 30000 },
            { title: 'Configuration Walkthrough', startMs: 60000 },
            { title: 'Plan Structure', startMs: 90000 },
            { title: 'Benefits & Copay', startMs: 120000 },
            { title: 'Summary', startMs: 150000 },
          ],
        },
      ]}
      videosBaseUrl="/demos/pcg4/"
      swaggerUrl="/api/app/pcg4/api-docs"
      faqs={[
        { question: 'What is an encounter type?', answer: 'An encounter type represents a category of healthcare service (e.g., preventive care visit, emergency room visit, specialist consultation). PCG4 supports 43 encounter types across 10 clinical categories.' },
        { question: 'How does the Maker-Checker-Publisher workflow work?', answer: 'A Maker creates/edits the configuration. A Checker (reviewer) validates it. Once approved, a Publisher deploys it to the target environment. Each role is a separate person for segregation of duties.' },
        { question: 'Can I start from a template?', answer: 'Yes. The Reference Library includes curated templates for common plan types (HMO, PPO, HDHP). You can clone any template and customize it.' },
        { question: 'What happens when a configuration is deployed?', answer: 'The configuration is published to the target environment (staging or production). Downstream systems (quotation, underwriting) use it for premium calculation and coverage validation.' },
      ]}
      resources={[
        { label: 'PCG4 API (Swagger)', url: '/api/app/pcg4/api-docs', icon: FileText },
        { label: 'Reference Library', url: '/app/pcg4/reference-library', icon: BookOpen },
        { label: 'Coverage Mapper', url: '/app/pcg4/coverage-mapper', icon: Code },
        { label: 'Encounter Taxonomy', url: '/app/pcg4/encounters', icon: Layers },
      ]}
    />
  );
};

export default PCG4HubPage;
