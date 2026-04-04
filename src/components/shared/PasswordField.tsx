import React, { useState } from 'react';
import { Eye, EyeOff, Dices, Copy, Check } from 'lucide-react';

export interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  showStrengthMeter?: boolean;
  showAutoGenerate?: boolean;
  allowWeak?: boolean;
  autoFocus?: boolean;
}

function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const nums = '23456789';
  const special = '!@#$%&*?';
  const all = upper + lower + nums + special;
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += nums[Math.floor(Math.random() * nums.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 16; i++) pwd += all[Math.floor(Math.random() * all.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

export function getPasswordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[!@#$%^&*?_\-+=~`|\\:;"'<>,./(){}[\]]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return score;
}

export function getPasswordStrength(score: number): { label: string; color: string; barColor: string } {
  if (score <= 1) return { label: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' };
  if (score === 2) return { label: 'Fair', color: 'text-orange-500', barColor: 'bg-orange-500' };
  if (score === 3) return { label: 'Good', color: 'text-yellow-500', barColor: 'bg-yellow-500' };
  if (score === 4) return { label: 'Strong', color: 'text-green-500', barColor: 'bg-green-500' };
  return { label: 'Very Strong', color: 'text-emerald-500', barColor: 'bg-emerald-500' };
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  value,
  onChange,
  label,
  required,
  minLength = 8,
  placeholder,
  showStrengthMeter = true,
  showAutoGenerate = true,
  allowWeak = false,
  autoFocus,
}) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wasGenerated, setWasGenerated] = useState(false);

  const score = getPasswordScore(value);
  const strength = getPasswordStrength(score);

  const handleGenerate = () => {
    const pwd = generateStrongPassword();
    onChange(pwd);
    setVisible(true);
    setWasGenerated(true);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => { onChange(e.target.value); setWasGenerated(false); setCopied(false); }}
          className={`input-field ${showAutoGenerate ? 'pr-20' : 'pr-10'} flex-1`}
          placeholder={placeholder || `Minimum ${minLength} characters`}
          required={required}
          minLength={minLength}
          autoFocus={autoFocus}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {showAutoGenerate && wasGenerated && value && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              tabIndex={-1}
              title="Copy password"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
          )}
          {showAutoGenerate && (
            <button
              type="button"
              onClick={handleGenerate}
              className="p-1 rounded text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              tabIndex={-1}
              title="Generate strong password"
            >
              <Dices size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {showStrengthMeter && value && (
        <div className="mt-1.5">
          <div className="flex gap-1 h-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  i <= Math.min(score, 5) ? strength.barColor : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center mt-0.5">
            <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
            {!allowWeak && score < 3 && value.length > 0 && (
              <span className="text-xs text-red-500">Password too weak</span>
            )}
            {allowWeak && score < 3 && value.length > 0 && (
              <span className="text-xs text-amber-500">Weak (admin override)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordField;
