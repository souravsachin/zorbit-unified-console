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
      moduleDescription="Enterprise-grade identity, authentication & access management — NIST SP 800-63B and OWASP compliant"
      moduleIntro="The Identity Service is the central authentication authority for the Zorbit platform. It supports 13 authentication methods — from passwords with SHA-256 client-side hashing to biometric WebAuthn passkeys and QR code cross-device login. Every session is protected by configurable MFA, password policies follow NIST SP 800-63B guidelines, and all actions are audit-logged. The service manages users, organizations, roles, and sessions with multi-tenant namespace isolation, geo-restriction, IP whitelisting, and account lockout policies."
      icon={Fingerprint}
      slides={IDENTITY_SLIDES}
      capabilities={[
        {
          icon: Shield,
          title: '13 Authentication Methods',
          description: 'Password (SHA-256 + bcrypt), TOTP MFA, WebAuthn/Passkeys (fingerprint/Face ID), QR code cross-device login, Magic Link, Email OTP, Google/GitHub/LinkedIn OAuth 2.0, SAML 2.0, RADIUS (RFC 2865), Diameter (RFC 6733), and Generic OIDC/SSO. Per-user auth method controls.',
        },
        {
          icon: Lock,
          title: 'Password Security (NIST SP 800-63B)',
          description: 'SHA-256 client-side hashing, bcrypt (12 rounds) server-side. Password strength meter, auto-generate strong passwords, configurable rotation policies per org, password history prevention, and account lockout after failed attempts. Compliant with NIST SP 800-63B and OWASP Password Storage guidelines.',
        },
        {
          icon: Users,
          title: 'User & Role Management',
          description: 'Super Admin → Org Admin → Users hierarchy. Create users with role assignment, reset passwords with force-change-on-next-login, admin impersonation with full audit trail (sudo mode). Self-service password change with MFA verification.',
        },
        {
          icon: Building2,
          title: 'Multi-Tenant Organizations',
          description: 'Organization types (Insurer, Cedent, Broker, TPA, Regulator, Healthcare Provider). Customer flags, password policies, geo-restriction, and IP whitelisting per organization. Complete namespace isolation.',
        },
        {
          icon: Globe,
          title: 'Geo-Restriction & IP Whitelisting',
          description: 'Restrict login by country/geography per organization. Whitelist specific IP address ranges for exceptions. GeoIP-based country detection. Configurable block messages.',
        },
        {
          icon: Key,
          title: 'Session Management & Security',
          description: 'View and revoke active sessions across devices. Login history with IP, device, method, and status. Account lockout after configurable failed attempts (default: 5 attempts, 15-min cooldown). Concurrent session limits.',
        },
        {
          icon: Clock,
          title: 'Forgot Password & Recovery',
          description: 'Magic link password recovery via email. Force password change on next login (admin-triggered). Email notification on password reset. Self-service with MFA gating.',
        },
        {
          icon: Globe,
          title: 'OAuth 2.0 Authorization Server',
          description: 'Zorbit Identity acts as an OAuth 2.0 provider — third-party apps (Rocket.Chat, Grafana, etc.) authenticate users via Zorbit using Authorization Code flow.',
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
        { question: 'What authentication methods are supported?', answer: '13 methods: Email/Password (SHA-256 + bcrypt), TOTP MFA (Google Authenticator), WebAuthn/Passkeys (fingerprint/Face ID), QR code cross-device login, Magic Link, Email OTP, Google OAuth, GitHub OAuth, LinkedIn OAuth, SAML 2.0, RADIUS (RFC 2865), Diameter (RFC 6733), and Generic OIDC/SSO. Each method can be enabled/disabled per user by the Org Admin.' },
        { question: 'How are passwords stored?', answer: 'Passwords are SHA-256 hashed on the client side before transmission (never sent in plaintext). The server then applies bcrypt with 12 salt rounds. This dual-hashing follows OWASP Password Storage Cheat Sheet guidelines. Passwords are never logged or stored in plaintext anywhere in the system.' },
        { question: 'What is the password rotation policy?', answer: 'Each organization can configure: rotation period (e.g., every 90 days), minimum password length, complexity requirements (uppercase, lowercase, numbers, special characters), strength score threshold, and password history (prevent reusing last N passwords). Users are forced to change their password on next login when the policy triggers.' },
        { question: 'How does account lockout work?', answer: 'After a configurable number of failed login attempts (default: 5), the account is locked for a configurable cooldown period (default: 15 minutes). This is per-organization policy. Super admins can unlock accounts manually.' },
        { question: 'Can I restrict logins by geography?', answer: 'Yes. Organizations can enable geo-restriction to allow logins only from specific countries (e.g., UAE only for a Dubai insurer). Additional IP address ranges can be whitelisted for exceptions (e.g., VPN addresses, partner offices).' },
        { question: 'How does admin impersonation (sudo) work?', answer: 'Org Admins can impersonate any user within their organization to debug issues or provide support. Super Admins can impersonate anyone. All actions during impersonation are audit-logged with both the real user and the effective (impersonated) user identities.' },
        { question: 'What security standards does this follow?', answer: 'NIST SP 800-63B (Digital Identity Guidelines), OWASP Authentication Cheat Sheet, OWASP Password Storage Cheat Sheet, RFC 6238 (TOTP), W3C WebAuthn (FIDO2), and OAuth 2.0 (RFC 6749). Compliance badges with links to the standard documents are displayed on the Security Settings page.' },
        { question: 'How does the OrgAdmin → User hierarchy work?', answer: 'Super Admin creates organizations and Org Admins. Org Admins create and manage users within their organization — assigning roles, resetting passwords, and configuring auth methods. Regular users can only change their own password and manage their own MFA/passkeys.' },
      ]}
      resources={[
        { label: 'Identity API (Swagger)', url: 'https://zorbit.scalatics.com/api/identity/api-docs', icon: FileText },
        { label: 'User Management', url: '/users', icon: Users },
        { label: 'Organization Management', url: '/organizations', icon: Building2 },
        { label: 'Security Settings (MFA + Passkeys)', url: '/settings/security', icon: Lock },
        { label: 'NIST SP 800-63B (external)', url: 'https://pages.nist.gov/800-63-3/sp800-63b.html', icon: Shield },
        { label: 'OWASP Auth Cheat Sheet (external)', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html', icon: Shield },
      ]}
    />
  );
};

export default IdentityHubPage;
