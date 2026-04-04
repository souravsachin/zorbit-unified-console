import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2, AlertTriangle } from 'lucide-react';
import { identityService, hashPassword } from '../../services/identity';
import { useToast } from '../../components/shared/Toast';
import PasswordField, { getPasswordScore } from '../../components/shared/PasswordField';

const ForceChangePasswordPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tempToken = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (getPasswordScore(newPassword) < 3) {
      toast('Please choose a stronger password', 'error');
      return;
    }
    if (!tempToken) {
      toast('Invalid session. Please log in again.', 'error');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const hashed = await hashPassword(newPassword);
      await identityService.forceChangePassword(tempToken, hashed);
      toast('Password changed successfully! Please sign in with your new password.', 'success');
      navigate('/login');
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to change password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!tempToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Session</h1>
          <p className="text-sm text-gray-500 mb-4">
            This page requires a valid session token. Please sign in again.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Change Your Password</h1>
          <p className="text-gray-500 mt-1">
            Your administrator requires you to change your password before continuing.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              You must set a new password before you can access the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              required
              showStrengthMeter
              showAutoGenerate
              autoFocus
            />
            <div>
              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                showStrengthMeter={false}
                showAutoGenerate={false}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {loading ? 'Changing...' : 'Set New Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePasswordPage;
