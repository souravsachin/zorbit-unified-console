import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Shield, ShieldCheck, KeyRound, Fingerprint, QrCode, Smartphone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import { useAuth } from '../../hooks/useAuth';
import { identityService, hashPassword } from '../../services/identity';
import { useToast } from '../../components/shared/Toast';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import PasswordField from '../../components/shared/PasswordField';

interface AuthProvider {
  id: string;
  name: string;
  enabled: boolean;
  label?: string;
  type?: string; // 'redirect' (default) or 'credentials'
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<AuthProvider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const mfaInputRef = useRef<HTMLInputElement>(null);

  // Passkey login state
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // QR login state
  const [showQrLogin, setShowQrLogin] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrSessionId, setQrSessionId] = useState('');
  const [qrStatus, setQrStatus] = useState<'loading' | 'pending' | 'expired'>('loading');
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Passwordless login state
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [passwordlessMode, setPasswordlessMode] = useState<'none' | 'magic-link' | 'email-otp'>('none');
  const [passwordlessEmail, setPasswordlessEmail] = useState('');
  const [passwordlessSending, setPasswordlessSending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await api.get(
          `${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/providers`,
        );
        const data = res.data?.providers || res.data || [];
        const enabled = (Array.isArray(data) ? data : [])
          .filter((p: any) => p.enabled)
          .map((p: any) => ({ ...p, id: p.id || p.name }));
        setProviders(enabled);
      } catch {
        setProviders([]);
      } finally {
        setProvidersLoaded(true);
      }
    };
    fetchProviders();
  }, []);

  // Focus MFA input when MFA step appears
  useEffect(() => {
    if (mfaRequired && mfaInputRef.current) {
      mfaInputRef.current.focus();
    }
  }, [mfaRequired, useBackupCode]);

  const completeLogin = (token: string, user?: any) => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (returnTo) {
      localStorage.setItem('zorbit_token', token);
      const domain = window.location.hostname.split('.').slice(-2).join('.');
      document.cookie = `zorbit_token=${token}; domain=.${domain}; path=/; max-age=3600; SameSite=Lax; Secure`;
      if (user) localStorage.setItem('zorbit_user', JSON.stringify(user));
      if (returnTo.startsWith('http')) {
        if (returnTo.includes('/auth/oauth/authorize')) {
          const separator = returnTo.includes('?') ? '&' : '?';
          window.location.href = `${returnTo}${separator}token=${encodeURIComponent(token)}`;
        } else {
          window.location.href = returnTo;
        }
      } else {
        window.location.href = returnTo;
      }
      return;
    }
    login(token, user);
    toast('Logged in successfully', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hashed = await hashPassword(password);
      const res = await identityService.login({ email, password: hashed });
      if (res.data.requiresMfa) {
        setTempToken(res.data.tempToken);
        setMfaRequired(true);
        setLoading(false);
        return;
      }
      if (res.data.requirePasswordChange) {
        navigate(`/auth/change-password-required?token=${encodeURIComponent(res.data.tempToken)}`);
        return;
      }
      const token = res.data.accessToken || res.data.token;
      completeLogin(token, res.data.user);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (useBackupCode) {
        res = await identityService.mfaBackupVerify(tempToken, backupCode.trim());
      } else {
        res = await identityService.mfaValidateLogin(tempToken, mfaCode.trim());
      }
      const token = res.data.accessToken || res.data.token;
      completeLogin(token, res.data.user);
    } catch {
      toast(useBackupCode ? 'Invalid backup code' : 'Invalid verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Passkey Login ─────────────────────────────────────────────
  const handlePasskeyLogin = async () => {
    if (!email) {
      toast('Please enter your email first', 'error');
      return;
    }
    setPasskeyLoading(true);
    try {
      const optionsRes = await identityService.webauthnLoginOptions(email);
      const { userHashId, ...options } = optionsRes.data;
      const credential = await startAuthentication({ optionsJSON: options });
      const verifyRes = await identityService.webauthnLoginVerify(email, credential);
      if (verifyRes.data.requiresMfa) {
        setTempToken(verifyRes.data.tempToken);
        setMfaRequired(true);
        return;
      }
      const token = verifyRes.data.accessToken || verifyRes.data.token;
      completeLogin(token, verifyRes.data.user);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Passkey login failed';
      if (msg !== 'The operation either timed out or was not allowed.') {
        toast(msg, 'error');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // ─── QR Code Login ──────────────────────────────────────────────
  const startQrLogin = useCallback(async () => {
    setQrStatus('loading');
    try {
      const res = await identityService.qrGenerate();
      setQrCodeDataUrl(res.data.qrCodeDataUrl);
      setQrSessionId(res.data.sessionId);
      setQrStatus('pending');
    } catch {
      toast('Failed to generate QR code', 'error');
      setShowQrLogin(false);
    }
  }, [toast]);

  // Poll QR status
  useEffect(() => {
    if (!showQrLogin || !qrSessionId || qrStatus !== 'pending') return;

    qrPollRef.current = setInterval(async () => {
      try {
        const res = await identityService.qrStatus(qrSessionId);
        if (res.data.status === 'confirmed' && res.data.tokens) {
          if (qrPollRef.current) clearInterval(qrPollRef.current);
          const token = res.data.tokens.accessToken;
          completeLogin(token);
        } else if (res.data.status === 'expired') {
          if (qrPollRef.current) clearInterval(qrPollRef.current);
          setQrStatus('expired');
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);

    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, [showQrLogin, qrSessionId, qrStatus]);

  const handleOAuthClick = (providerId: string) => {
    const url = `${API_CONFIG.IDENTITY_URL}/api/v1/G/auth/${providerId}`;
    window.location.href = url;
  };

  // ─── Magic Link ────────────────────────────────────────────────
  const handleMagicLinkSend = async () => {
    if (!passwordlessEmail) {
      toast('Please enter your email', 'error');
      return;
    }
    setPasswordlessSending(true);
    try {
      await identityService.magicLinkSend(passwordlessEmail);
      setMagicLinkSent(true);
      toast('Magic link sent! Check your email.', 'success');
    } catch {
      toast('Failed to send magic link', 'error');
    } finally {
      setPasswordlessSending(false);
    }
  };

  // ─── Email OTP ─────────────────────────────────────────────────
  const handleEmailOtpSend = async () => {
    if (!passwordlessEmail) {
      toast('Please enter your email', 'error');
      return;
    }
    setPasswordlessSending(true);
    try {
      await identityService.emailOtpSend(passwordlessEmail);
      setOtpSent(true);
      toast('OTP sent! Check your email.', 'success');
    } catch {
      toast('Failed to send OTP', 'error');
    } finally {
      setPasswordlessSending(false);
    }
  };

  const handleEmailOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast('Please enter the 6-digit code', 'error');
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await identityService.emailOtpVerify(passwordlessEmail, otpCode);
      const token = res.data.accessToken || res.data.token;
      completeLogin(token, res.data.user);
    } catch {
      toast('Invalid or expired OTP', 'error');
    } finally {
      setOtpVerifying(false);
    }
  };

  const resetPasswordlessState = () => {
    setPasswordlessMode('none');
    setPasswordlessEmail('');
    setPasswordlessSending(false);
    setMagicLinkSent(false);
    setOtpSent(false);
    setOtpCode('');
    setOtpVerifying(false);
  };

  const providerButton = (provider: AuthProvider) => {
    const id = provider.id.toLowerCase();

    if (id === 'google') {
      return (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuthClick(id)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      );
    }

    if (id === 'github') {
      return (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuthClick(id)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-950 hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors text-sm font-medium text-white"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Sign in with GitHub
        </button>
      );
    }

    if (id === 'linkedin') {
      return (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuthClick(id)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium text-white"
          style={{ backgroundColor: '#0A66C2' }}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Sign in with LinkedIn
        </button>
      );
    }

    if (id === 'saml') {
      const label = provider.label || 'Sign in with SAML SSO';
      return (
        <button
          key={id}
          type="button"
          onClick={() => handleOAuthClick(id)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors text-sm font-medium text-white"
        >
          <Shield className="w-5 h-5" />
          {label}
        </button>
      );
    }

    // Skip credentials-based and passwordless providers — they have dedicated UI
    if (provider.type === 'credentials' || provider.type === 'passwordless') {
      return null;
    }

    // SSO / generic provider
    const label = provider.label || `Sign in with ${provider.name || 'SSO'}`;
    return (
      <button
        key={id}
        type="button"
        onClick={() => handleOAuthClick(id)}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm font-medium text-white"
      >
        <Lock className="w-5 h-5" />
        {label}
      </button>
    );
  };

  // Derive context from returnTo URL for user-friendly messaging
  const returnToParam = new URLSearchParams(window.location.search).get('returnTo') || '';
  const contextMap: Record<string, { title: string; subtitle: string }> = {
    'hi-quotation': { title: 'Health Insurance', subtitle: 'Sign in to access the quotation system' },
    'mi-quotation': { title: 'Motor Insurance', subtitle: 'Sign in to access motor quotations' },
    'uw-workflow': { title: 'Underwriting Workflow', subtitle: 'Sign in to access underwriting queues' },
    'hi-decisioning': { title: 'UW Decisioning', subtitle: 'Sign in to access underwriting rules' },
    'form-builder': { title: 'Form Builder', subtitle: 'Sign in to manage forms' },
    'directory': { title: 'Team Directory', subtitle: 'Sign in to connect with your team' },
    'support-center': { title: 'Support Center', subtitle: 'Sign in to access help & tutorials' },
    'pii-showcase': { title: 'PII Showcase', subtitle: 'Sign in to explore PII protection' },
    'claims': { title: 'Claims Management', subtitle: 'Sign in to manage claims' },
    'fee-management': { title: 'Fee Management', subtitle: 'Sign in to manage fees & invoices' },
    'admin': { title: 'Platform Administration', subtitle: 'Sign in to manage the platform' },
    'livestream': { title: 'Live Streaming', subtitle: 'Sign in to access streaming admin' },
  };
  const matchedContext = Object.entries(contextMap).find(([key]) => returnToParam.includes(key));
  const pageTitle = matchedContext ? matchedContext[1].title : 'Zorbit Platform';
  const pageSubtitle = matchedContext ? matchedContext[1].subtitle : 'Sign in to your account';

  // ─── QR Code Login Screen ───────────────────────────────────────
  if (showQrLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Scan to Sign In</h1>
            <p className="text-gray-500 mt-1">
              Scan this QR code with your phone to sign in
            </p>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex justify-center">
              {qrStatus === 'loading' ? (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                </div>
              ) : qrStatus === 'expired' ? (
                <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl gap-3">
                  <p className="text-sm text-gray-500">QR code expired</p>
                  <button
                    onClick={startQrLogin}
                    className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Generate New Code
                  </button>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <img src={qrCodeDataUrl} alt="QR Login Code" className="w-56 h-56" />
                </div>
              )}
            </div>

            {qrStatus === 'pending' && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Smartphone className="w-4 h-4" />
                <span>Waiting for confirmation from your phone...</span>
                <div className="animate-pulse w-2 h-2 rounded-full bg-violet-500" />
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium">How it works:</p>
              <ol className="text-xs text-gray-500 list-decimal list-inside space-y-0.5">
                <li>Open Zorbit on your phone (where you're already signed in)</li>
                <li>Go to Settings &gt; Scan QR Code</li>
                <li>Point your camera at this QR code</li>
                <li>Confirm the sign-in on your phone</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQrLogin(false);
                if (qrPollRef.current) clearInterval(qrPollRef.current);
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MFA Verification Screen ────────────────────────────────────
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
            <p className="text-gray-500 mt-1">
              {useBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          <form onSubmit={handleMfaSubmit} className="card p-6 space-y-4">
            {!useBackupCode ? (
              <div>
                <label className="block text-sm font-medium mb-1">Verification Code</label>
                <input
                  ref={mfaInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setMfaCode(val);
                  }}
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Open Google Authenticator (or your TOTP app) and enter the code shown for Zorbit.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Backup Code</label>
                <input
                  ref={mfaInputRef}
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  className="input-field text-center text-lg tracking-widest font-mono"
                  placeholder="XXXXXXXXXX"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter one of the 10 backup codes you saved during MFA setup.
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setMfaCode('');
                  setBackupCode('');
                }}
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <KeyRound size={14} />
                {useBackupCode ? 'Use authenticator code' : 'Use a backup code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMfaRequired(false);
                  setTempToken('');
                  setMfaCode('');
                  setBackupCode('');
                  setUseBackupCode(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── Normal Login Screen ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-gray-500 mt-1">{pageSubtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@zorbit.io"
              required
            />
          </div>
          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            required
            minLength={1}
            placeholder="Enter password"
            showStrengthMeter={false}
            showAutoGenerate={false}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Forgot Password?
            </Link>
          </div>

          {/* Passkey + QR Login buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading || !email}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50"
              title={!email ? 'Enter your email first' : 'Sign in with your fingerprint or face'}
            >
              <Fingerprint className="w-5 h-5 text-emerald-600" />
              {passkeyLoading ? 'Verifying...' : 'Passkey'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQrLogin(true);
                startQrLogin();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <QrCode className="w-5 h-5 text-violet-600" />
              QR Code
            </button>
          </div>

          {providersLoaded && providers.length > 0 && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-800 text-gray-500">
                    or continue with
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {providers.map((p) => providerButton(p))}
              </div>
            </>
          )}

          {/* ─── More Sign-in Options (Magic Link + Email OTP) ──────── */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowMoreOptions(!showMoreOptions);
                if (showMoreOptions) resetPasswordlessState();
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {showMoreOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showMoreOptions ? 'Fewer sign-in options' : 'More sign-in options'}
            </button>

            {showMoreOptions && (
              <div className="mt-3 space-y-3">
                {passwordlessMode === 'none' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPasswordlessMode('magic-link')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      Magic Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordlessMode('email-otp')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      Email OTP
                    </button>
                  </div>
                )}

                {/* Magic Link Flow */}
                {passwordlessMode === 'magic-link' && !magicLinkSent && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email for Magic Link</label>
                      <input
                        type="email"
                        value={passwordlessEmail}
                        onChange={(e) => setPasswordlessEmail(e.target.value)}
                        className="input-field"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleMagicLinkSend}
                        disabled={passwordlessSending || !passwordlessEmail}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-medium text-white disabled:opacity-50"
                      >
                        <Mail className="w-4 h-4" />
                        {passwordlessSending ? 'Sending...' : 'Send Magic Link'}
                      </button>
                      <button
                        type="button"
                        onClick={resetPasswordlessState}
                        className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {passwordlessMode === 'magic-link' && magicLinkSent && (
                  <div className="text-center space-y-3 py-2">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Check your email</p>
                      <p className="text-xs text-gray-500 mt-1">
                        We sent a magic link to <strong>{passwordlessEmail}</strong>.
                        Click the link in the email to sign in.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMagicLinkSent(false); handleMagicLinkSend(); }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Resend link
                    </button>
                    <div>
                      <button
                        type="button"
                        onClick={resetPasswordlessState}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {/* Email OTP Flow */}
                {passwordlessMode === 'email-otp' && !otpSent && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email for OTP</label>
                      <input
                        type="email"
                        value={passwordlessEmail}
                        onChange={(e) => setPasswordlessEmail(e.target.value)}
                        className="input-field"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleEmailOtpSend}
                        disabled={passwordlessSending || !passwordlessEmail}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors text-sm font-medium text-white disabled:opacity-50"
                      >
                        <KeyRound className="w-4 h-4" />
                        {passwordlessSending ? 'Sending...' : 'Send OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={resetPasswordlessState}
                        className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {passwordlessMode === 'email-otp' && otpSent && (
                  <form onSubmit={handleEmailOtpVerify} className="space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Enter the 6-digit code sent to <strong>{passwordlessEmail}</strong>
                      </p>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtpCode(val);
                      }}
                      className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={otpVerifying || otpCode.length !== 6}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors text-sm font-medium text-white disabled:opacity-50"
                      >
                        {otpVerifying ? 'Verifying...' : 'Verify & Sign In'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); handleEmailOtpSend(); }}
                        className="px-4 py-2.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Resend
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={resetPasswordlessState}
                      className="w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-center"
                    >
                      Back
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
