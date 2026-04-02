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
} from 'lucide-react';
import { identityService } from '../../services/identity';
import { useToast } from '../../components/shared/Toast';

type MfaState = 'loading' | 'disabled' | 'setup' | 'verify' | 'enabled';

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

  useEffect(() => {
    loadStatus();
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

  // ─── Loading ────────────────────────────────────────────────────
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
    </div>
  );
};

export default SecurityPage;
