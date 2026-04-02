import React from 'react';
import {
  Fingerprint,
  Users,
  Shield,
  Key,
  Building2,
  Clock,
  Lock,
  Globe,
  FileText,
  ArrowRight,
  Code,
} from 'lucide-react';
import { ModuleHubPage } from '../../components/shared/ModuleHubPage';
import type { Slide } from '../../components/shared/SlidePlayer';

// ---------------------------------------------------------------------------
// Identity Presentation Slides
// ---------------------------------------------------------------------------

const IDENTITY_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'Identity Service',
    subtitle: 'Central Authentication Authority for the Zorbit Platform',
    icon: <Fingerprint size={32} />,
    audioSrc: '/audio/identity/slide_01.mp3',
    background: 'bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-800',
    content: (
      <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">8 Auth Protocols</p>
          <p className="text-white/60 text-xs mt-1">Email, OAuth, SAML, RADIUS, Diameter</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">JWT Sessions</p>
          <p className="text-white/60 text-xs mt-1">Stateless token-based auth</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
          <p className="font-semibold text-white">Multi-Org</p>
          <p className="text-white/60 text-xs mt-1">Namespace-isolated tenancy</p>
        </div>
      </div>
    ),
  },
  {
    id: 'protocols',
    title: '8 Authentication Protocols',
    subtitle: 'From simple passwords to enterprise federation',
    icon: <Shield size={32} />,
    audioSrc: '/audio/identity/slide_02.mp3',
    background: 'bg-gradient-to-br from-slate-800 via-gray-800 to-zinc-900',
    content: (
      <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
        {[
          { n: 'Email/Password', d: 'Native' },
          { n: 'Google OAuth', d: 'Social' },
          { n: 'GitHub OAuth', d: 'Social' },
          { n: 'LinkedIn OAuth', d: 'Social' },
          { n: 'Generic OIDC', d: 'Federation' },
          { n: 'SAML 2.0', d: 'Enterprise' },
          { n: 'RADIUS', d: 'Network' },
          { n: 'Diameter', d: 'Telecom' },
        ].map((p) => (
          <div key={p.n} className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
            <p className="font-semibold text-white text-[11px]">{p.n}</p>
            <p className="text-white/50 text-[10px] mt-0.5">{p.d}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'jwt',
    title: 'JWT Token Architecture',
    subtitle: 'Stateless sessions with organization context',
    icon: <Key size={32} />,
    audioSrc: '/audio/identity/slide_03.mp3',
    background: 'bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800',
    content: (
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        {[
          { label: 'Access Token', desc: 'Short-lived, carries org + user claims', color: 'border-blue-400 bg-blue-500/20' },
          { label: 'Refresh Token', desc: 'Long-lived, used to rotate access tokens', color: 'border-emerald-400 bg-emerald-500/20' },
          { label: 'Claims', desc: 'userId, orgId, roles, privileges', color: 'border-amber-400 bg-amber-500/20' },
        ].map((t) => (
          <div key={t.label} className={`${t.color} border backdrop-blur rounded-lg p-3 text-center`}>
            <p className="font-bold text-white">{t.label}</p>
            <p className="text-white/50 text-xs mt-1">{t.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'multi-org',
    title: 'Multi-Organization Tenancy',
    subtitle: 'Namespace isolation at every level',
    icon: <Building2 size={32} />,
    audioSrc: '/audio/identity/slide_04.mp3',
    background: 'bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800',
    content: (
      <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-left">
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-emerald-300">Organization Scoping</p>
          <p className="text-white/60 text-xs mt-1">
            Every user belongs to an organization (O-xxxx). All API calls are scoped
            to the org namespace embedded in the JWT.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
          <p className="font-semibold text-blue-300">Cross-Org Isolation</p>
          <p className="text-white/60 text-xs mt-1">
            Users in org A can never see data from org B. Database queries, events,
            and navigation menus are all namespace-filtered.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'password-policy',
    title: 'Password Policy Engine',
    subtitle: 'Configurable strength, rotation, and lockout rules',
    icon: <Lock size={32} />,
    audioSrc: '/audio/identity/slide_05.mp3',
    background: 'bg-gradient-to-br from-amber-700 via-orange-700 to-red-800',
    content: (
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
        {[
          { label: 'Complexity', desc: 'Min length, uppercase, numbers, special chars' },
          { label: 'Rotation', desc: 'Configurable expiry and history checks' },
          { label: 'Lockout', desc: 'Failed attempt limits and cooldown periods' },
        ].map((r) => (
          <div key={r.label} className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <p className="font-semibold text-white">{r.label}</p>
            <p className="text-white/50 text-xs mt-1">{r.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'oauth-provider',
    title: 'OAuth 2.0 Provider',
    subtitle: 'Identity as an authorization server for third-party apps',
    icon: <Globe size={32} />,
    audioSrc: '/audio/identity/slide_06.mp3',
    background: 'bg-gradient-to-br from-violet-700 via-purple-800 to-fuchsia-900',
    content: (
      <div className="flex items-center justify-center gap-3 mt-4 text-sm">
        {[
          { role: 'Client App', desc: 'Requests access', color: 'bg-amber-500/30 border-amber-400' },
          { role: 'Identity', desc: 'Issues tokens', color: 'bg-blue-500/30 border-blue-400' },
          { role: 'Resource', desc: 'Validates JWT', color: 'bg-emerald-500/30 border-emerald-400' },
        ].map((r, i) => (
          <React.Fragment key={r.role}>
            {i > 0 && <ArrowRight size={20} className="text-white/40" />}
            <div className={`${r.color} border backdrop-blur rounded-lg p-4 text-center min-w-[130px]`}>
              <p className="font-bold text-white">{r.role}</p>
              <p className="text-white/60 text-xs mt-1">{r.desc}</p>
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

const IdentityHubPage: React.FC = () => {
  return (
    <ModuleHubPage
      moduleId="identity"
      moduleName="Identity Service"
      moduleDescription="Central authentication authority for the Zorbit platform"
      moduleIntro="The Identity Service is the single source of truth for user authentication across the Zorbit platform. It supports 8 authentication protocols -- from simple email/password to enterprise SAML 2.0 and telecom Diameter -- and issues JWT tokens that carry organization context, user claims, and privilege references. Every other service in the platform validates identity tokens against this service."
      icon={Fingerprint}
      slides={IDENTITY_SLIDES}
      capabilities={[
        {
          icon: Users,
          title: 'User Management',
          description: 'Create, update, suspend, and deactivate user accounts. Search and filter across organizations with role-based visibility.',
        },
        {
          icon: Shield,
          title: '8 Auth Protocols',
          description: 'Email/password, Google, GitHub, LinkedIn OAuth 2.0, generic OIDC/SSO, SAML 2.0, RADIUS (RFC 2865), and Diameter (RFC 6733).',
        },
        {
          icon: Globe,
          title: 'OAuth 2.0 Provider',
          description: 'Acts as an OAuth 2.0 authorization server, issuing access and refresh tokens for third-party application integrations.',
        },
        {
          icon: Building2,
          title: 'Organization Management',
          description: 'Multi-tenant organization lifecycle -- create, configure, and manage organizations with namespace isolation (O-xxxx).',
        },
        {
          icon: Key,
          title: 'JWT Sessions',
          description: 'Stateless JWT tokens with embedded claims (userId, orgId, roles). Short-lived access tokens with refresh token rotation.',
        },
        {
          icon: Lock,
          title: 'Password Policy',
          description: 'Configurable password complexity, rotation, history checks, and account lockout rules per organization.',
        },
      ]}
      targetUsers={[
        { role: 'Platform Administrators', desc: 'Manage user accounts, organizations, and authentication settings.' },
        { role: 'Security Officers', desc: 'Configure password policies, review authentication logs, manage SSO.' },
        { role: 'End Users', desc: 'Register, log in, manage profile, and link social accounts.' },
        { role: 'Service Integrators', desc: 'Use OAuth 2.0 flows to authenticate third-party applications.' },
      ]}
      lifecycleStages={[
        { label: 'Register', description: 'User creates an account with email/password or social login. Organization is assigned.', color: '#3b82f6' },
        { label: 'Verify', description: 'Email verification sent. Account is pending until verified.', color: '#f59e0b' },
        { label: 'Active', description: 'User can log in and access the platform. JWT tokens issued on authentication.', color: '#10b981' },
        { label: 'Suspended', description: 'Account temporarily disabled by admin. Login blocked, tokens invalidated.', color: '#ef4444' },
        { label: 'Deactivated', description: 'Account permanently disabled. No login possible. Data retained for audit.', color: '#64748b' },
      ]}
      recordings={[]}
      videosBaseUrl="/demos/identity/"
      swaggerUrl="https://zorbit.scalatics.com/api/identity/api-docs"
      faqs={[
        { question: 'How do I add a new OAuth provider?', answer: 'Configure the provider credentials (client ID, client secret, callback URL) in the Identity service environment variables. The service supports Google, GitHub, LinkedIn out of the box, and generic OIDC for any OpenID Connect provider.' },
        { question: 'What happens when a JWT token expires?', answer: 'The client uses the refresh token to obtain a new access token. If the refresh token is also expired, the user must re-authenticate. The frontend automatically handles token refresh via an Axios interceptor.' },
        { question: 'How does multi-org tenancy work?', answer: 'Each user belongs to an organization identified by a short hash (O-xxxx). The org ID is embedded in the JWT token and used by all downstream services to scope data access. Users cannot access data outside their organization.' },
        { question: 'Can I configure password policies per organization?', answer: 'Yes. Password complexity rules, rotation periods, history depth, and lockout thresholds can be configured independently for each organization.' },
      ]}
      resources={[
        { label: 'Identity API (Swagger)', url: 'https://zorbit.scalatics.com/api/identity/api-docs', icon: FileText },
        { label: 'User Management', url: '/users', icon: Users },
        { label: 'Organization Management', url: '/organizations', icon: Building2 },
        { label: 'OAuth Configuration', url: '/settings', icon: Code },
      ]}
    />
  );
};

export default IdentityHubPage;
