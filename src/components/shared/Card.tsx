import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

const Card: React.FC<CardProps> = ({ icon: Icon, label, value, trend, color = 'text-primary-600' }) => {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold mt-1">{typeof value === 'object' ? JSON.stringify(value) : value}</p>
          {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default Card;
