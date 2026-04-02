import React from 'react';
import {
  Navigation,
  Menu,
  Route,
  Shield,
  Layers,
  RefreshCw,
  FileText,
  Globe,
  Code,
  ArrowRight,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Navigation Presentation Slides
// ---------------------------------------------------------------------------

const NAVIGATION_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Navigation Service',
    subtitle: 'Dynamic Menu Generation for the Zorbit Platform',
    icon: <Navigation size={32} />,
    audioSrc: '/audio/navigation/slide_01.mp3',
    background: 'bg-gradient-to-br from-cyan-700 via-blue-700 to-indigo-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Dynamic Menus</p>
          <p className="text-white/60 text-xs mt-1">Generated from navigation DB</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Privilege Filtering</p>
          <p className="text-white/60 text-xs mt-1">Show only allowed items</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Module Registry</p>
          <p className="text-white/60 text-xs mt-1">Self-registering modules</p>
        </div>
      </div>
    ),
  },
  {
    id: 'menu-structure',
    title: 'Menu Structure',
    subtitle: 'Sections, items, and nested groups',
    icon: <Menu size={32} />,
    audioSrc: '/audio/navigation/slide_02.mp3',
    background: 'bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-emerald-300">Sections</p>
          <p className="text-white/60 text-xs mt-1">
            Top-level sidebar groups: Platform Core, Business Modules, Admin. Each section
            contains one or more menu items.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-blue-300">Menu Items</p>
          <p className="text-white/60 text-xs mt-1">
            Individual navigation entries with label, icon, route, and required privilege.
            Items can be nested to create sub-menus.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'privilege-filter',
    title: 'Privilege-Based Filtering',
    subtitle: 'Users only see what they are allowed to access',
    icon: <Shield size={32} />,
    audioSrc: '/audio/navigation/slide_03.mp3',
    background: 'bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-800',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { step: 'JWT Claims', desc: 'Extract privileges', color: 'bg-blue-500/30 border-blue-400' },
          { step: 'Filter Menu', desc: 'Match required privs', color: 'bg-purple-500/30 border-purple-400' },
          { step: 'Render', desc: 'Show allowed items', color: 'bg-emerald-500/30 border-emerald-400' },
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
  {
    id: 'module-registration',
    title: 'Module Registration',
    subtitle: 'Services register their own menu items on startup',
    icon: <Layers size={32} />,
    audioSrc: '/audio/navigation/slide_04.mp3',
    background: 'bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800',
    content: (
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        {[
          { label: 'Self-Registration', desc: 'Each module declares its own menu items at deploy time' },
          { label: 'Route Templates', desc: '/O/{{org_id}}/module/page -- namespace-aware routes' },
          { label: 'Icon Registry', desc: 'Lucide icon names map to sidebar icons automatically' },
        ].map((r) => (
          <div key={r.label} className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <p className="font-semibold text-white text-xs">{r.label}</p>
            <p className="text-white/50 text-[10px] mt-1">{r.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NavigationHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="navigation"
      moduleName="Navigation Service"
      moduleDescription="Dynamic menu generation and route management for the Zorbit platform"
      moduleIntro="The Navigation Service generates the sidebar menu dynamically based on registered modules and user privileges. Instead of hard-coding navigation into the frontend, menu items are stored in a database and filtered at runtime based on the authenticated user's roles and privileges. New modules register their own menu items, making the navigation self-extending."
      icon={Navigation}
      slides={NAVIGATION_SLIDES}
      capabilities={[
        {
          icon: Menu,
          title: 'Dynamic Menus',
          description: 'Sidebar menus are generated from the navigation database. No hard-coded menu items in the frontend.',
        },
        {
          icon: Layers,
          title: 'Module Registration',
          description: 'Services register their own menu items with labels, icons, routes, and required privileges on deployment.',
        },
        {
          icon: Route,
          title: 'Route Management',
          description: 'Frontend and backend routes are declared in the navigation service. Route templates support namespace variables.',
        },
        {
          icon: Shield,
          title: 'Privilege-Based Filtering',
          description: 'Menu items are filtered based on the user JWT claims. Users only see menu items for which they have the required privilege.',
        },
        {
          icon: RefreshCw,
          title: 'Menu Caching',
          description: 'Navigation responses are cached and invalidated when menu items or privilege assignments change.',
        },
        {
          icon: Globe,
          title: 'Multi-Org Menus',
          description: 'Different organizations can have different menu configurations, enabling white-label and per-tenant customization.',
        },
      ]}
      targetUsers={[
        { role: 'Platform Administrators', desc: 'Configure menu items, manage sections, and control navigation layout.' },
        { role: 'Module Developers', desc: 'Register menu items for their modules via the navigation API.' },
        { role: 'Organization Managers', desc: 'Customize menu visibility for their organization.' },
      ]}
      lifecycleStages={[
        { label: 'Register', description: 'Module registers its menu items with the navigation service via API or seed.', color: '#3b82f6' },
        { label: 'Configure', description: 'Admin arranges sections, sets display order, and assigns required privileges.', color: '#f59e0b' },
        { label: 'Publish', description: 'Menu configuration is published and cached for runtime delivery.', color: '#8b5cf6' },
        { label: 'Render', description: 'Frontend fetches menu.json, filters by user privileges, and renders the sidebar.', color: '#10b981' },
      ]}
      recordings={[]}
      videosBaseUrl="/demos/navigation/"
      swaggerUrl="https://zorbit.scalatics.com/api/navigation/api-docs"
      faqs={[
        { question: 'How do I add a new menu item?', answer: 'Use the Navigation Admin page or call the POST /api/v1/O/:orgId/menu-items endpoint. Provide label, icon name, route template, section, display order, and required privilege.' },
        { question: 'What is a route template?', answer: 'Route templates use placeholders like /O/{{org_id}}/module/page. The frontend replaces {{org_id}} with the current organization hash ID at render time.' },
        { question: 'How does privilege filtering work?', answer: 'Each menu item has a requiredPrivilege field. When fetching the menu, the service checks the user JWT claims and only returns items where the user has the required privilege.' },
        { question: 'Can I reorder menu items?', answer: 'Yes. Each menu item has a displayOrder field. Update it via the Navigation Admin page or the PATCH API to reorder items within their section.' },
      ]}
      resources={[
        { label: 'Navigation API (Swagger)', url: 'https://zorbit.scalatics.com/api/navigation/api-docs', icon: FileText },
        { label: 'Menu Management', url: '/navigation/menus', icon: Menu },
        { label: 'Route Registry', url: '/navigation/routes', icon: Route },
        { label: 'Module Registry', url: '/admin/modules', icon: Code },
      ]}
    />
  );
};

export default NavigationHubPage;
