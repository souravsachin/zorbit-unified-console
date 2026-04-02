import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Shield,
  Settings,
} from 'lucide-react';

interface AdminCard {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  status: 'available' | 'coming_soon';
}

const ADMIN_CARDS: AdminCard[] = [
  {
    icon: BookOpen,
    title: 'Taxonomy Management',
    description:
      'Manage encounter types, benefit categories, exclusion rules, and classification hierarchies used across all configurations.',
    color: 'text-emerald-600',
    status: 'coming_soon',
  },
  {
    icon: Users,
    title: 'PCG4 User Roles',
    description:
      'Assign Drafter, Reviewer, Approver, and Publisher roles to control the configuration workflow.',
    color: 'text-blue-600',
    status: 'coming_soon',
  },
  {
    icon: Shield,
    title: 'Approval Workflows',
    description:
      'Configure multi-step approval chains, auto-approvals, and escalation rules for product configurations.',
    color: 'text-purple-600',
    status: 'coming_soon',
  },
  {
    icon: Settings,
    title: 'Global Defaults',
    description:
      'Set default values for copay, coinsurance, deductibles, and other plan parameters applied to new configurations.',
    color: 'text-amber-600',
    status: 'coming_soon',
  },
];

const PCG4AdminPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/app/pcg4/configurations')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">PCG4 Administration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage taxonomy, roles, and global settings for the Product Configurator
          </p>
        </div>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {ADMIN_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="card p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${card.color}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold">{card.title}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <div className="mt-4">
                {card.status === 'coming_soon' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    Coming Soon
                  </span>
                ) : (
                  <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Manage
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Definitions Reference */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold">PCG4 Role Definitions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 font-medium">Drafter</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  Create, edit, delete draft configurations
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  Product analysts who build initial configurations
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Reviewer</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  View drafts, submit review comments, request changes
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  Clinical or actuarial reviewers who validate configurations
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Approver</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  Approve or reject reviewed configurations
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  Senior managers who authorize product configurations
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Publisher</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  Publish approved configurations to production
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  Operations team who release configurations to live systems
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PCG4AdminPage;
