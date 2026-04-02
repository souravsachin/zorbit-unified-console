import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  PieChart,
  TrendingUp,
  Palette,
  Blocks,
  FileText,
  Code,
  ArrowRight,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Dashboard Presentation Slides
// ---------------------------------------------------------------------------

const DASHBOARD_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Dashboard',
    subtitle: 'Platform Overview and Analytics Hub',
    icon: <LayoutDashboard size={32} />,
    audioSrc: '/audio/dashboard/slide_01.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Summary Cards</p>
          <p className="text-white/60 text-xs mt-1">Key metrics at a glance</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Widget Registry</p>
          <p className="text-white/60 text-xs mt-1">Pluggable visualization tiles</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Designer</p>
          <p className="text-white/60 text-xs mt-1">Drag-and-drop layout builder</p>
        </div>
      </div>
    ),
  },
  {
    id: 'widgets',
    title: 'Widget Tiers',
    subtitle: 'Tiered widget registry with adaptive rendering',
    icon: <Blocks size={32} />,
    audioSrc: '/audio/dashboard/slide_02.mp3',
    background: 'bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900',
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
  {
    id: 'designer',
    title: 'Dashboard Designer',
    subtitle: 'Build custom dashboards with drag-and-drop',
    icon: <Palette size={32} />,
    audioSrc: '/audio/dashboard/slide_03.mp3',
    background: 'bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { step: 'Select Widgets', desc: 'Choose from registry', color: 'bg-blue-500/30 border-blue-400' },
          { step: 'Arrange Layout', desc: 'Drag to position', color: 'bg-purple-500/30 border-purple-400' },
          { step: 'Save & Share', desc: 'Persist configuration', color: 'bg-emerald-500/30 border-emerald-400' },
        ].map((s, i) => (
          <React.Fragment key={s.step}>
            {i > 0 && <ArrowRight size={20} className="text-white/40" />}
            <div className={`${s.color} border backdrop-blur rounded-lg p-4 text-center min-w-[130px]`}>
              <p className="font-bold text-white">{s.step}</p>
              <p className="text-white/60 text-xs mt-1">{s.desc}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DashboardHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="dashboard"
      moduleName="Dashboard"
      moduleDescription="Platform overview, analytics, and customizable widget-based dashboards"
      moduleIntro="The Dashboard is the landing page of the Zorbit Unified Console. It provides a summary view of platform health, key metrics, and recent activity. The Dashboard Designer allows administrators to create custom widget layouts using a tiered widget registry, and users can switch between pre-built and custom dashboard views."
      icon={LayoutDashboard}
      slides={DASHBOARD_SLIDES}
      capabilities={[
        {
          icon: BarChart3,
          title: 'Summary Cards',
          description: 'At-a-glance KPI cards showing user counts, active sessions, recent events, and service health status.',
        },
        {
          icon: PieChart,
          title: 'Analytics Widgets',
          description: 'Chart widgets for trends, distributions, and comparisons. Supports bar, line, pie, and area charts.',
        },
        {
          icon: TrendingUp,
          title: 'Real-Time Metrics',
          description: 'Live-updating metrics from platform services including request rates, event throughput, and error rates.',
        },
        {
          icon: Palette,
          title: 'Dashboard Designer',
          description: 'Drag-and-drop layout builder for creating custom dashboards. Save, share, and set as default per user or org.',
        },
        {
          icon: Blocks,
          title: 'Widget Registry',
          description: 'Tiered widget registry (Tier 1-4) with adaptive rendering. Modules register their own widgets.',
        },
        {
          icon: LayoutDashboard,
          title: 'Multi-View',
          description: 'Switch between platform overview, module-specific dashboards, and custom user-created views.',
        },
      ]}
      targetUsers={[
        { role: 'Platform Administrators', desc: 'Monitor platform health, service status, and key operational metrics.' },
        { role: 'Business Users', desc: 'View module-specific dashboards and key performance indicators.' },
        { role: 'Organization Managers', desc: 'Track organization activity, user counts, and resource usage.' },
      ]}
      lifecycleStages={[
        { label: 'View', description: 'User lands on the dashboard and sees the default or last-used view.', color: '#3b82f6' },
        { label: 'Customize', description: 'User opens the Designer to add, remove, or rearrange widgets.', color: '#f59e0b' },
        { label: 'Save', description: 'Custom layout is saved and persisted for the user or shared with the organization.', color: '#10b981' },
        { label: 'Refresh', description: 'Widgets auto-refresh on configurable intervals to show current data.', color: '#06b6d4' },
      ]}
      recordings={[]}
      videosBaseUrl="/demos/dashboard/"
      faqs={[
        { question: 'Can I create my own dashboard?', answer: 'Yes. Open the Dashboard Designer from the top-right menu. Add widgets from the registry, arrange them with drag-and-drop, and save your layout.' },
        { question: 'What are widget tiers?', answer: 'Widgets are organized into 4 tiers: Tier 1 (Hero KPIs, always visible), Tier 2 (Operational, up to 4), Tier 3 (Rich context, charts and feeds), Tier 4 (Full detail, everything surfaced).' },
        { question: 'Can I share a dashboard with my team?', answer: 'Yes. Saved dashboards can be shared at the organization level so all users in the org see the same layout as their default view.' },
      ]}
      resources={[
        { label: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { label: 'Dashboard Designer', url: '/dashboard/designer', icon: Palette },
        { label: 'Platform Documentation', url: '/api-docs', icon: Code },
      ]}
    />
  );
};

export default DashboardHubPage;
