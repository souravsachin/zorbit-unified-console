import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { identityService, hashPassword } from '../../services/identity';
import { useToast } from '../../components/shared/Toast';
import PasswordField, { getPasswordScore } from '../../components/shared/PasswordField';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    organizationId: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (getPasswordScore(form.password) < 3) {
      toast('Please choose a stronger password', 'error');
      return;
    }
    setLoading(true);
    try {
      const hashed = await hashPassword(form.password);
      await identityService.register({ ...form, password: hashed });
      toast('Account created. Please sign in.', 'success');
      navigate('/login');
    } catch {
      toast('Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-500 mt-1">Register for the Zorbit platform</p>
        </div>
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="input-field"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input-field"
              placeholder="john@example.com"
              required
            />
          </div>
          <PasswordField
            label="Password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            required
            showStrengthMeter
            showAutoGenerate
          />
          <div>
            <label className="block text-sm font-medium mb-1">Organization ID (optional)</label>
            <input
              name="organizationId"
              value={form.organizationId}
              onChange={handleChange}
              className="input-field"
              placeholder="O-92AF"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Register'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
