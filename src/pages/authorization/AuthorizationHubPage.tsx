import React from 'react';
import {
  ShieldCheck,
  Users,
  Key,
  Layers,
  Lock,
  Settings,
  FileText,
  ArrowRight,
  Code,
  Building2,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Authorization Presentation Slides
// ---------------------------------------------------------------------------

const AUTHORIZATION_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Authorization Service',
    subtitle: 'Role-Based Access Control for the Zorbit Platform',
    icon: <ShieldCheck size={32} />,
    audioSrc: '/audio/authorization/slide_01.mp3',
    background: 'bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Roles</p>
          <p className="text-white/60 text-xs mt-1">Named privilege bundles</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Privileges</p>
          <p className="text-white/60 text-xs mt-1">Granular permission keys</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Namespace Isolation</p>
          <p className="text-white/60 text-xs mt-1">Per-org access boundaries</p>
        </div>
      </div>
    ),
  },
  {
    id: 'rbac',
    title: 'RBAC Architecture',
    subtitle: 'Role -> Privilege -> User assignment chain',
    icon: <Key size={32} />,
    audioSrc: '/audio/authorization/slide_02.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { role: 'Privilege', desc: 'Atomic permission', color: 'bg-amber-500/30 border-amber-400' },
          { role: 'Section', desc: 'Privilege group', color: 'bg-purple-500/30 border-purple-400' },
          { role: 'Role', desc: 'Named bundle', color: 'bg-blue-500/30 border-blue-400' },
          { role: 'User', desc: 'Role assignment', color: 'bg-emerald-500/30 border-emerald-400' },
        ].map((r, i) => (
          <React.Fragment key={r.role}>
            {i > 0 && <ArrowRight size={20} className="text-white/40" />}
            <div className={`${r.color} border backdrop-blur rounded-lg p-3 text-center min-w-[110px]`}>
              <p className="font-bold text-white text-xs">{r.role}</p>
              <p className="text-white/60 text-[10px] mt-1">{r.desc}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
    ),
  },
  {
    id: 'privilege-sections',
    title: 'Privilege Sections',
    subtitle: 'Logical grouping of related permissions',
    icon: <Layers size={32} />,
    audioSrc: '/audio/authorization/slide_03.mp3',
    background: 'bg-gradient-to-br from-purple-700 via-violet-700 to-indigo-800',
    content: (
      <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
        {[
          'Identity', 'Authorization', 'Navigation', 'Messaging',
          'Audit', 'PII Vault', 'Customers', 'Products',
        ].map((section) => (
          <div key={section} className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <p className="font-medium text-white text-[11px]">{section}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'multi-level',
    title: 'Multi-Level Access',
    subtitle: 'Global, Organization, Department, and User scopes',
    icon: <Building2 size={32} />,
    audioSrc: '/audio/authorization/slide_04.mp3',
    background: 'bg-gradient-to-br from-amber-700 via-orange-700 to-red-800',
    content: (
      <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
        {[
          { ns: 'G', label: 'Global', desc: 'Platform-wide access' },
          { ns: 'O', label: 'Organization', desc: 'Tenant-scoped' },
          { ns: 'D', label: 'Department', desc: 'Team-scoped' },
          { ns: 'U', label: 'User', desc: 'Individual access' },
        ].map((n) => (
          <div key={n.ns} className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-white/20 mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm">
              {n.ns}
            </div>
            <p className="font-semibold text-white">{n.label}</p>
            <p className="text-white/50 text-[10px] mt-0.5">{n.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AuthorizationHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="authorization"
      moduleName="Authorization Service"
      moduleDescription="Role-based access control and privilege management for the Zorbit platform"
      moduleIntro="The Authorization Service manages roles, privileges, and privilege sections across the Zorbit platform. It provides a hierarchical RBAC model where atomic privileges are grouped into sections, bundled into roles, and assigned to users. All access control decisions across the platform are enforced against privileges managed by this service."
      icon={ShieldCheck}
      slides={AUTHORIZATION_SLIDES}
      capabilities={[
        {
          icon: Key,
          title: 'Roles',
          description: 'Named bundles of privileges that can be assigned to users. Each organization can define its own role hierarchy.',
        },
        {
          icon: Lock,
          title: 'Privileges',
          description: 'Atomic permission keys (e.g., users.read, products.write) that guard specific API endpoints and UI features.',
        },
        {
          icon: Layers,
          title: 'Privilege Sections',
          description: 'Logical grouping of related privileges into sections (Identity, Products, Claims) for organized management.',
        },
        {
          icon: Users,
          title: 'Role-Privilege Mapping',
          description: 'Map privileges to roles with a visual matrix. Bulk assign/revoke with conflict detection.',
        },
        {
          icon: Building2,
          title: 'Namespace Isolation',
          description: 'Roles and privilege assignments are scoped to the organization namespace. Cross-org access is impossible.',
        },
        {
          icon: Settings,
          title: 'Multi-Level Access',
          description: 'Four namespace levels: Global (G), Organization (O), Department (D), and User (U) for fine-grained access control.',
        },
      ]}
      targetUsers={[
        { role: 'Platform Administrators', desc: 'Create roles, assign privileges, manage the RBAC model.' },
        { role: 'Security Officers', desc: 'Audit role assignments, review privilege usage, enforce least-privilege.' },
        { role: 'Module Developers', desc: 'Register new privileges for their modules and guard API endpoints.' },
        { role: 'Organization Managers', desc: 'Assign roles to users within their organization.' },
      ]}
      lifecycleStages={[
        { label: 'Create Role', description: 'Administrator creates a new named role for the organization.', color: '#3b82f6' },
        { label: 'Assign Privileges', description: 'Map specific privileges to the role using the privilege matrix.', color: '#f59e0b' },
        { label: 'Attach to User', description: 'Assign the role to one or more users in the organization.', color: '#8b5cf6' },
        { label: 'Active', description: 'Role is active and enforced. Users gain access to guarded resources.', color: '#10b981' },
        { label: 'Revoked', description: 'Role or assignment is revoked. Access is immediately removed.', color: '#64748b' },
      ]}
      recordings={[]}
      videosBaseUrl="/demos/authorization/"
      swaggerUrl="https://zorbit.scalatics.com/api/authorization/api-docs"
      faqs={[
        { question: 'What is the difference between a role and a privilege?', answer: 'A privilege is an atomic permission key (e.g., users.read). A role is a named bundle of privileges (e.g., Admin role includes users.read, users.write, roles.manage). Users are assigned roles, not individual privileges.' },
        { question: 'Can I create custom roles per organization?', answer: 'Yes. Each organization can define its own roles with custom privilege combinations. There are also platform-level roles that apply across all organizations.' },
        { question: 'How are privileges enforced?', answer: 'Every API endpoint checks the JWT token for required privileges. The SDK middleware extracts the user claims and validates them against the privilege required by the endpoint.' },
        { question: 'What happens when I revoke a role?', answer: 'The role assignment is removed immediately. On the next API call, the JWT will no longer carry the revoked privileges, and access will be denied.' },
      ]}
      resources={[
        { label: 'Authorization API (Swagger)', url: 'https://zorbit.scalatics.com/api/authorization/api-docs', icon: FileText },
        { label: 'Role Management', url: '/roles', icon: Key },
        { label: 'Privilege Matrix', url: '/privileges', icon: Layers },
        { label: 'Platform Documentation', url: '/api-docs', icon: Code },
      ]}
    />
  );
};

export default AuthorizationHubPage;
