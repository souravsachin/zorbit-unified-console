import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { identityService, User } from '../../services/identity';
import DepartmentTree, { HierarchyNode } from '../../components/DepartmentTree/DepartmentTree';

/* ---------- Types ---------- */

interface OrgChartUser {
  hashId: string;
  displayName: string;
  title: string | null;
  department: string | null;
  role: string | null;
  reportsTo: string | null;
  avatarUrl: string | null;
  children: OrgChartUser[];
}

/* ---------- Color hash for departments ---------- */

const DEPT_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-700', avatar: 'from-blue-500 to-blue-600', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-700', avatar: 'from-emerald-500 to-emerald-600', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', avatar: 'from-purple-500 to-purple-600', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', avatar: 'from-amber-500 to-amber-600', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-300 dark:border-pink-700', avatar: 'from-pink-500 to-pink-600', text: 'text-pink-700 dark:text-pink-300' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-300 dark:border-cyan-700', avatar: 'from-cyan-500 to-cyan-600', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', avatar: 'from-orange-500 to-orange-600', text: 'text-orange-700 dark:text-orange-300' },
  { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-300 dark:border-indigo-700', avatar: 'from-indigo-500 to-indigo-600', text: 'text-indigo-700 dark:text-indigo-300' },
];

function deptColorIndex(dept: string | null): number {
  if (!dept) return 0;
  let hash = 0;
  for (let i = 0; i < dept.length; i++) {
    hash = ((hash << 5) - hash + dept.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % DEPT_COLORS.length;
}

/* ---------- User Card ---------- */

interface UserCardProps {
  user: OrgChartUser;
  isUnconfirmed?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, isUnconfirmed }) => {
  const colors = DEPT_COLORS[deptColorIndex(user.department)];
  return (
    <div className={`relative w-48 rounded-xl border-2 ${colors.border} ${colors.bg} p-3 shadow-sm`}>
      {isUnconfirmed && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-[10px] font-bold shadow">
          ?
        </span>
      )}
      <div className="flex items-center space-x-2 mb-1.5">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors.avatar} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
          {(user.displayName || '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate leading-tight">{user.displayName}</div>
          <div className="text-[10px] text-gray-500 truncate">{user.title || 'No title'}</div>
        </div>
      </div>
      {user.department && (
        <div className={`text-[10px] ${colors.text} font-medium truncate`}>
          {user.department}
        </div>
      )}
      {user.role && (
        <div className="text-[10px] text-gray-400 truncate">{user.role}</div>
      )}
    </div>
  );
};

/* ---------- Recursive tree rendering ---------- */

interface OrgTreeNodeProps {
  user: OrgChartUser;
  unconfirmedSet: Set<string>;
}

const OrgTreeNode: React.FC<OrgTreeNodeProps> = ({ user, unconfirmedSet }) => {
  const isUnconfirmed = unconfirmedSet.has(user.hashId);
  const children = user.children || [];

  return (
    <div className="flex flex-col items-center">
      <UserCard user={user} isUnconfirmed={isUnconfirmed} />

      {children.length > 0 && (
        <>
          {/* Vertical line down from parent */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Horizontal connector bar */}
          {children.length > 1 && (
            <div className="flex items-start">
              <div
                className="border-t-2 border-gray-300 dark:border-gray-600"
                style={{ width: `${(children.length - 1) * 220}px` }}
              />
            </div>
          )}

          {/* Children row */}
          <div className="flex items-start gap-5">
            {children.map((child) => (
              <div key={child.hashId} className="flex flex-col items-center">
                {/* Vertical line down to child */}
                <div
                  className={`w-px h-6 ${
                    unconfirmedSet.has(child.hashId)
                      ? 'border-l-2 border-dashed border-yellow-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                <OrgTreeNode user={child} unconfirmedSet={unconfirmedSet} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ---------- Build tree from flat users ---------- */

function buildTreeFromUsers(users: User[]): { roots: OrgChartUser[]; unassigned: OrgChartUser[]; unconfirmedSet: Set<string> } {
  const userMap = new Map<string, OrgChartUser>();
  const unconfirmedSet = new Set<string>();

  // Create OrgChartUser entries
  for (const u of users) {
    userMap.set(u.hashId, {
      hashId: u.hashId,
      displayName: u.displayName || u.email,
      title: u.title || null,
      department: u.department || null,
      role: u.role || null,
      reportsTo: (u as any).reportsTo || null,
      avatarUrl: null,
      children: [],
    });

    // Check notes for unconfirmed
    if ((u as any).notes && typeof (u as any).notes === 'string' && (u as any).notes.toLowerCase().includes('unconfirmed')) {
      unconfirmedSet.add(u.hashId);
    }
  }

  const roots: OrgChartUser[] = [];
  const unassigned: OrgChartUser[] = [];

  for (const cu of userMap.values()) {
    if (cu.reportsTo && userMap.has(cu.reportsTo)) {
      userMap.get(cu.reportsTo)!.children.push(cu);
    } else if (cu.reportsTo) {
      // reportsTo points to unknown user — treat as root
      roots.push(cu);
    } else {
      unassigned.push(cu);
    }
  }

  // If we have no explicit roots from reportsTo chains, pull top-level managers
  // (those who have children but no reportsTo)
  if (roots.length === 0) {
    const hasReports = new Set<string>();
    for (const cu of userMap.values()) {
      if (cu.reportsTo && userMap.has(cu.reportsTo)) {
        hasReports.add(cu.reportsTo);
      }
    }
    // Move users with reports from unassigned to roots
    const newUnassigned: OrgChartUser[] = [];
    for (const cu of unassigned) {
      if (hasReports.has(cu.hashId)) {
        roots.push(cu);
      } else {
        newUnassigned.push(cu);
      }
    }
    return { roots, unassigned: newUnassigned, unconfirmedSet };
  }

  return { roots, unassigned, unconfirmedSet };
}

/* ---------- Main Page ---------- */

const OrgChartPage: React.FC = () => {
  const { orgId: urlOrgId } = useParams<{ orgId: string }>();
  const { orgId: authOrgId } = useAuth();
  const orgId = urlOrgId || authOrgId;
  const { toast } = useToast();

  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [orgChartData, setOrgChartData] = useState<OrgChartUser[] | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [hierRes, usersRes] = await Promise.all([
          identityService.getOrgHierarchy(orgId),
          identityService.getUsers(orgId),
        ]);
        setHierarchy(hierRes.data);
        setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : []);

        // Try the org-chart endpoint; fall back to building from users
        try {
          const chartRes = await identityService.getOrgChart(orgId);
          if (Array.isArray(chartRes.data) && chartRes.data.length > 0) {
            setOrgChartData(chartRes.data);
          }
        } catch {
          // org-chart endpoint not available — will build from users
        }
      } catch {
        toast('Failed to load org chart data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId]);

  // Build the chart tree
  const { roots, unassigned, unconfirmedSet } = useMemo(() => {
    if (orgChartData && orgChartData.length > 0) {
      // org-chart endpoint returned tree data — use it directly
      const uc = new Set<string>();
      return { roots: orgChartData, unassigned: [] as OrgChartUser[], unconfirmedSet: uc };
    }
    // Fall back to building from flat user list
    return buildTreeFromUsers(allUsers);
  }, [orgChartData, allUsers]);

  // Group unassigned by department
  const unassignedByDept = useMemo(() => {
    const map = new Map<string, OrgChartUser[]>();
    for (const u of unassigned) {
      const dept = u.department || 'No Department';
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(u);
    }
    return map;
  }, [unassigned]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to={`/organizations/${orgId}/departments`}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Org Chart</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Organization: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">{orgId}</code>
            </p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center">
            <span className="w-6 h-0.5 bg-gray-300 mr-1.5" /> Confirmed
          </span>
          <span className="flex items-center">
            <span className="w-6 h-0.5 border-t-2 border-dashed border-yellow-400 mr-1.5" />
            <span className="w-4 h-4 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center text-[9px] font-bold mr-1">?</span>
            Unconfirmed
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Left: Department tree (30%) */}
        <div className="w-[30%] min-w-[260px] max-w-[380px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 overflow-y-auto">
          <DepartmentTree
            hierarchy={hierarchy}
            loading={loading}
            selectedId={selectedDeptId}
            onSelect={(node) => setSelectedDeptId(
              selectedDeptId === node.org.hashId ? null : node.org.hashId
            )}
          />
        </div>

        {/* Right: Org chart visualization (70%) */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mr-3" />
              Loading org chart...
            </div>
          ) : roots.length === 0 && unassigned.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">No reporting relationships found.</p>
              <p className="text-sm mt-1">
                Users need <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">reportsTo</code> set to build the chart.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Reporting tree */}
              {roots.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Reporting Structure
                  </h3>
                  <div className="flex flex-wrap gap-10 justify-center">
                    {roots.map((root) => (
                      <OrgTreeNode
                        key={root.hashId}
                        user={root}
                        unconfirmedSet={unconfirmedSet}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Unassigned cluster */}
              {unassignedByDept.size > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                    <Users size={14} className="mr-1.5" />
                    Unassigned ({unassigned.length})
                  </h3>
                  <div className="space-y-4">
                    {Array.from(unassignedByDept.entries()).map(([dept, deptUsers]) => (
                      <div key={dept}>
                        <div className="text-xs font-medium text-gray-400 mb-2 flex items-center">
                          <Building2 size={12} className="mr-1" />
                          {dept}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {deptUsers.map((u) => (
                            <UserCard
                              key={u.hashId}
                              user={u}
                              isUnconfirmed={unconfirmedSet.has(u.hashId)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrgChartPage;
