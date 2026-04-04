import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { identityService, hashPassword } from '../../services/identity';
import { useToast } from '../../components/shared/Toast';
import PasswordField, { getPasswordScore } from '../../components/shared/PasswordField';

const ResetPasswordPage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }
    identityService.validateResetToken(token)
      .then((res) => {
        setTokenValid(res.data.valid === true);
      })
      .catch(() => {
        setTokenValid(false);
      })
      .finally(() => {
        setValidating(false);
      });
  }, [token]);

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
    setLoading(true);
    try {
      const hashed = await hashPassword(newPassword);
      await identityService.resetPassword(token, hashed);
      setSuccess(true);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${success ? 'bg-emerald-600' : tokenValid ? 'bg-blue-600' : 'bg-red-600'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            {success ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : tokenValid ? (
              <KeyRound className="w-8 h-8 text-white" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {success ? 'Password Reset' : tokenValid ? 'Set New Password' : 'Invalid Link'}
          </h1>
        </div>

        <div className="card p-6 space-y-4">
          {success ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn-primary inline-block">
                Sign In
              </Link>
            </div>
          ) : !token || !tokenValid ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This password reset link is invalid or has expired.
                Please request a new one.
              </p>
              <Link to="/forgot-password" className="btn-primary inline-block">
                Request New Link
              </Link>
            </div>
          ) : (
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
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
