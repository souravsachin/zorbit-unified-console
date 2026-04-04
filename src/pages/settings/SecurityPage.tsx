import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldOff,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  KeyRound,
  Loader2,
  Download,
  Fingerprint,
  Trash2,
  Plus,
  Lock,
  Monitor,
  Smartphone,
  X,
  History,
} from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { identityService, hashPassword } from '../../services/identity';
import { auditService } from '../../services/audit';
import { useToast } from '../../components/shared/Toast';
import PasswordField, { getPasswordScore } from '../../components/shared/PasswordField';

type MfaState = 'loading' | 'disabled' | 'setup' | 'verify' | 'enabled';

interface PasskeyCredential {
  credentialId: string;
  deviceName?: string;
  createdAt: string;
}

interface SessionInfo {
  hashId: string;
  userHashId: string;
  ipAddress?: string;
  userAgent?: string;
  loginMethod?: string;
  expiresAt: string;
  createdAt: string;
}

interface LoginActivity {
  id: string;
  action: string;
  ipAddress: string | null;
  eventTimestamp: string;
  metadata?: Record<string, unknown> | null;
}

/** Extract userId and orgId from the JWT in localStorage */
function getTokenInfo(): { userId: string; orgId: string } {
  try {
    const token = localStorage.getItem('zorbit_token');
    if (!token) return { userId: '', orgId: '' };
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub || '',
      orgId: payload.org || '',
    };
  } catch {
    return { userId: '', orgId: '' };
  }
}

/** Parse user-agent into a readable device/browser string */
function parseUserAgent(ua?: string): { device: string; icon: 'desktop' | 'mobile' } {
  if (!ua) return { device: 'Unknown device', icon: 'desktop' };
  let browser = 'Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = '';
  if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  const isMobile = ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone');
  return {
    device: os ? `${browser} on ${os}` : browser,
    icon: isMobile ? 'mobile' : 'desktop',
  };
}

const SecurityPage: React.FC = () => {
  const { toast } = useToast();
  const [state, setState] = useState<MfaState>('loading');
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);

  // Setup data
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [backupAcknowledged, setBackupAcknowledged] = useState(false);

  // Verification
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const verifyInputRef = useRef<HTMLInputElement>(null);

  // Passkey state
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(true);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [showPasskeyNameInput, setShowPasskeyNameInput] = useState(false);

  // Change password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changePwMfaCode, setChangePwMfaCode] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  // Login activity state
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [loginActivityLoading, setLoginActivityLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    loadPasskeys();
    loadSessions();
    loadLoginActivity();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await identityService.mfaStatus();
      if (res.data.mfaEnabled) {
        setBackupCodesRemaining(res.data.backupCodesRemaining);
        setState('enabled');
      } else {
        setState('disabled');
      }
    } catch {
      setState('disabled');
    }
  };

  const loadPasskeys = async () => {
    try {
      const res = await identityService.webauthnListCredentials();
      setPasskeys(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPasskeys([]);
    } finally {
      setPasskeysLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const { userId } = getTokenInfo();
      if (!userId) return;
      const res = await identityService.getSessions(userId);
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      const { userId } = getTokenInfo();
      await identityService.revokeSession(userId, sessionId);
      toast('Session revoked', 'success');
      loadSessions();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to revoke session', 'error');
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setRevokingAll(true);
    try {
      const { userId } = getTokenInfo();
      // Sessions are ordered DESC by createdAt — [0] is newest (likely current).
      // The current access token remains valid until expiry even after session revocation.
      const otherSessions = sessions.slice(1);
      for (const s of otherSessions) {
        try {
          await identityService.revokeSession(userId, s.hashId);
        } catch { /* skip individual failures */ }
      }
      toast(`Revoked ${otherSessions.length} other session(s)`, 'success');
      loadSessions();
    } catch (err: any) {
      toast('Failed to revoke sessions', 'error');
    } finally {
      setRevokingAll(false);
    }
  };

  const loadLoginActivity = async () => {
    try {
      const { orgId } = getTokenInfo();
      if (!orgId) return;
      const res = await auditService.getEvents(orgId, {
        eventType: 'identity.session.created',
        limit: 10,
      });
      const events = res.data?.data || res.data || [];
      setLoginActivity(Array.isArray(events) ? events : []);
    } catch {
      setLoginActivity([]);
    } finally {
      setLoginActivityLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setRegisteringPasskey(true);
    try {
      const optionsRes = await identityService.webauthnRegisterOptions();
      const credential = await startRegistration({ optionsJSON: optionsRes.data });
      const deviceName = newPasskeyName.trim() || undefined;
      await identityService.webauthnRegisterVerify(credential, deviceName);
      toast('Passkey registered successfully!', 'success');
      setNewPasskeyName('');
      setShowPasskeyNameInput(false);
      loadPasskeys();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to register passkey';
      if (msg !== 'The operation either timed out or was not allowed.') {
        toast(msg, 'error');
      }
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleRemovePasskey = async (credentialId: string) => {
    try {
      await identityService.webauthnRemoveCredential(credentialId);
      toast('Passkey removed', 'success');
      loadPasskeys();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to remove passkey', 'error');
    }
  };

  const handleSetup = async () => {
    setProcessing(true);
    try {
      const res = await identityService.mfaSetup();
      setQrCodeDataUrl(res.data.qrCodeDataUrl);
      setSecret(res.data.secret);
      setBackupCodes(res.data.backupCodes);
      setState('setup');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to setup MFA', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleProceedToVerify = () => {
    setState('verify');
    setTimeout(() => verifyInputRef.current?.focus(), 100);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await identityService.mfaVerifySetup(verifyCode.trim());
      toast('MFA enabled successfully! Your account is now protected.', 'success');
      setVerifyCode('');
      setBackupCodesRemaining(backupCodes.length);
      setState('enabled');
    } catch {
      toast('Invalid code. Please try again with the current code from your app.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await identityService.mfaDisable(disableCode.trim());
      toast('MFA disabled.', 'success');
      setDisableCode('');
      setShowDisable(false);
      setState('disabled');
    } catch {
      toast('Invalid code. Enter the current code from your authenticator app.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    const text = [
      'Zorbit Platform — MFA Backup Codes',
      `Generated: ${new Date().toISOString()}`,
      '',
      'Each code can only be used once.',
      'Store these in a safe place.',
      '',
      ...backupCodes.map((c, i) => `${String(i + 1).padStart(2, ' ')}. ${c}`),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zorbit-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast('New passwords do not match', 'error');
      return;
    }
    if (getPasswordScore(newPw) < 3) {
      toast('Please choose a stronger new password', 'error');
      return;
    }
    // If MFA enabled, require code
    if (state === 'enabled' && !changePwMfaCode) {
      toast('MFA code is required to change your password', 'error');
      return;
    }
    setChangingPw(true);
    try {
      const hashedCurrent = await hashPassword(currentPw);
      const hashedNew = await hashPassword(newPw);
      await identityService.changePassword(
        hashedCurrent,
        hashedNew,
        state === 'enabled' ? changePwMfaCode.trim() : undefined,
      );
      toast('Password changed successfully!', 'success');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setChangePwMfaCode('');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  // ─── Loading ────────────────��───────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Security Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage two-factor authentication for your account</p>
      </div>

      {/* ─── Change Password ──────────────────────────────────────��─── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Change Password</h2>
            <p className="text-sm text-gray-500 mt-1">
              Update your password. You'll need to enter your current password first.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <PasswordField
            label="Current Password"
            value={currentPw}
            onChange={setCurrentPw}
            required
            minLength={1}
            placeholder="Enter current password"
            showStrengthMeter={false}
            showAutoGenerate={false}
          />
          <PasswordField
            label="New Password"
            value={newPw}
            onChange={setNewPw}
            required
            showStrengthMeter
            showAutoGenerate={false}
          />
          <div>
            <PasswordField
              label="Confirm New Password"
              value={confirmPw}
              onChange={setConfirmPw}
              required
              showStrengthMeter={false}
              showAutoGenerate={false}
            />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* MFA code required if MFA is enabled */}
          {state === 'enabled' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                MFA Code <span className="text-xs text-gray-500">(required)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={changePwMfaCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setChangePwMfaCode(val);
                }}
                className="input-field text-center text-lg tracking-[0.3em] font-mono w-40"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={changingPw || !currentPw || !newPw || newPw !== confirmPw || (state === 'enabled' && changePwMfaCode.length < 6)}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* ─── MFA Disabled ──────────────────────────────────────────── */}
      {state === 'disabled' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldOff className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add an extra layer of security to your account. When enabled, you'll need to enter a code from your
                authenticator app (Google Authenticator, Authy, 1Password, etc.) every time you sign in.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              MFA is not enabled. Your account is protected by password only. We strongly recommend enabling MFA.
            </p>
          </div>

          <button
            onClick={handleSetup}
            disabled={processing}
            className="btn-primary flex items-center gap-2"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Enable Two-Factor Authentication
          </button>
        </div>
      )}

      {/* ─── Setup: QR Code + Backup Codes ──────────────────────── */}
      {state === 'setup' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <QrCode className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Step 1: Scan QR Code</h2>
              <p className="text-sm text-gray-500 mt-1">
                Open your authenticator app and scan this QR code. If you can't scan, enter the secret key manually.
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <img src={qrCodeDataUrl} alt="MFA QR Code" className="w-48 h-48" />
            </div>
          </div>

          {/* Manual secret */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Secret key (manual entry):</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-white dark:bg-gray-700 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 flex-1 select-all break-all">
                {secret}
              </code>
              <button
                onClick={() => copyToClipboard(secret, 'secret')}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                title="Copy secret"
              >
                {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Backup Codes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold">Step 2: Save Your Backup Codes</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              If you lose access to your authenticator app, you can use one of these backup codes to sign in.
              Each code can only be used once. Save them somewhere safe.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code
                  key={i}
                  className="text-sm font-mono bg-white dark:bg-gray-700 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 text-center"
                >
                  {code}
                </code>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {copiedBackup ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedBackup ? 'Copied!' : 'Copy all'}
              </button>
              <button
                onClick={downloadBackupCodes}
                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-3 h-3" />
                Download .txt
              </button>
            </div>
          </div>

          {/* Acknowledgement */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={backupAcknowledged}
              onChange={(e) => setBackupAcknowledged(e.target.checked)}
              className="mt-1 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I have saved my backup codes in a safe place. I understand that if I lose my authenticator device
              and my backup codes, I will lose access to my account.
            </span>
          </label>

          <button
            onClick={handleProceedToVerify}
            disabled={!backupAcknowledged}
            className="btn-primary w-full disabled:opacity-50"
          >
            Continue to Verification
          </button>
        </div>
      )}

      {/* ─── Verify: Enter TOTP code ──────────────────────────────── */}
      {state === 'verify' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Step 3: Verify Setup</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter the 6-digit code currently shown in your authenticator app to confirm it's working.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              ref={verifyInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={verifyCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerifyCode(val);
              }}
              className="input-field text-center text-3xl tracking-[0.5em] font-mono py-4"
              placeholder="000000"
              maxLength={6}
              required
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setState('setup')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={processing || verifyCode.length < 6}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {processing ? 'Verifying...' : 'Enable MFA'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Enabled: Status + Disable ───────────────────────────── */}
      {state === 'enabled' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Enabled
                </span>
                <span className="text-xs text-gray-500">
                  {backupCodesRemaining} backup codes remaining
                </span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Your account is protected with two-factor authentication. You'll need your authenticator app
              code each time you sign in.
            </p>
          </div>

          {backupCodesRemaining <= 3 && backupCodesRemaining > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                You only have {backupCodesRemaining} backup code{backupCodesRemaining !== 1 ? 's' : ''} left.
                Consider regenerating by disabling and re-enabling MFA.
              </p>
            </div>
          )}

          {!showDisable ? (
            <button
              onClick={() => setShowDisable(true)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Disable two-factor authentication
            </button>
          ) : (
            <form onSubmit={handleDisable} className="border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                Enter your current authenticator code to disable MFA:
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={disableCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setDisableCode(val);
                }}
                className="input-field text-center text-xl tracking-[0.5em] font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowDisable(false); setDisableCode(''); }}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || disableCode.length < 6}
                  className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? 'Disabling...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ─── Passkeys Section ─────────────────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Fingerprint className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Passkeys</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in with your fingerprint, face, or device PIN. Passkeys are more secure and convenient than passwords.
            </p>
          </div>
        </div>

        {/* Registered passkeys list */}
        {passkeysLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : passkeys.length > 0 ? (
          <div className="space-y-2">
            {passkeys.map((pk) => (
              <div
                key={pk.credentialId}
                className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">{pk.deviceName || 'Passkey'}</p>
                    <p className="text-xs text-gray-500">
                      Added {new Date(pk.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePasskey(pk.credentialId)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove passkey"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <Fingerprint className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No passkeys registered yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Register a passkey to enable fingerprint or face login
            </p>
          </div>
        )}

        {/* Register new passkey */}
        {showPasskeyNameInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              placeholder="Name this passkey (e.g. MacBook Pro)"
              className="input-field flex-1 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRegisterPasskey();
                if (e.key === 'Escape') { setShowPasskeyNameInput(false); setNewPasskeyName(''); }
              }}
            />
            <button
              onClick={handleRegisterPasskey}
              disabled={registeringPasskey}
              className="btn-primary flex items-center gap-1.5 text-sm px-4"
            >
              {registeringPasskey ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4" />
              )}
              {registeringPasskey ? 'Registering...' : 'Register'}
            </button>
            <button
              onClick={() => { setShowPasskeyNameInput(false); setNewPasskeyName(''); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowPasskeyNameInput(true)}
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Register a new passkey
          </button>
        )}
      </div>

      {/* ─── Active Sessions ──────────────────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Monitor className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Active Sessions</h2>
            <p className="text-sm text-gray-500 mt-1">
              Devices and browsers where you are currently signed in.
            </p>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : sessions.length > 0 ? (
          <>
            <div className="space-y-2">
              {sessions.map((s, idx) => {
                const { device, icon } = parseUserAgent(s.userAgent || undefined);
                const isCurrent = idx === 0; // newest session = most likely current
                return (
                  <div
                    key={s.hashId}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                      isCurrent
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {icon === 'mobile' ? (
                        <Smartphone className="w-5 h-5 text-indigo-500" />
                      ) : (
                        <Monitor className="w-5 h-5 text-indigo-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {device}
                          {isCurrent && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.ipAddress && <span>{s.ipAddress} &middot; </span>}
                          {s.loginMethod && <span className="capitalize">{s.loginMethod} &middot; </span>}
                          Created {new Date(s.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(s.hashId)}
                        disabled={revokingSession === s.hashId}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Revoke session"
                      >
                        {revokingSession === s.hashId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {sessions.length > 1 && (
              <button
                onClick={handleRevokeAllOtherSessions}
                disabled={revokingAll}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5"
              >
                {revokingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Revoke all other sessions
              </button>
            )}
          </>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <Monitor className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No active sessions found</p>
          </div>
        )}
      </div>

      {/* ─── Recent Login Activity ────────────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <History className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Recent Login Activity</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your recent sign-in events from the audit log.
            </p>
          </div>
        </div>

        {loginActivityLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : loginActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="pb-2 font-medium text-gray-500 text-xs">Date/Time</th>
                  <th className="pb-2 font-medium text-gray-500 text-xs">IP Address</th>
                  <th className="pb-2 font-medium text-gray-500 text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loginActivity.map((evt) => (
                  <tr key={evt.id || evt.eventTimestamp}>
                    <td className="py-2 text-xs text-gray-700 dark:text-gray-300">
                      {new Date(evt.eventTimestamp).toLocaleString()}
                    </td>
                    <td className="py-2 text-xs text-gray-500 font-mono">
                      {evt.ipAddress || '-'}
                    </td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <Check className="w-2.5 h-2.5" /> Success
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent login activity found</p>
          </div>
        )}
      </div>

      {/* ─── Security Compliance Badges ───────────────────────────── */}
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Security Compliance</h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://pages.nist.gov/800-63-3/sp800-63b.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <ShieldCheck size={12} /> NIST SP 800-63B Compliant
          </a>
          <a
            href="https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <ShieldCheck size={12} /> OWASP Authentication Guidelines
          </a>
          <a
            href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
          >
            <ShieldCheck size={12} /> OWASP Password Storage
          </a>
        </div>
        <p className="text-xs text-gray-500">
          Passwords are SHA-256 hashed client-side and bcrypt (12 rounds) server-side. MFA via TOTP (RFC 6238). WebAuthn via FIDO2/W3C standard.
        </p>
      </div>
    </div>
  );
};

export default SecurityPage;
