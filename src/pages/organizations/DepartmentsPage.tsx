import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Users, GitBranch } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { identityService, User } from '../../services/identity';
import DepartmentTree, { HierarchyNode, countNodes } from '../../components/DepartmentTree/DepartmentTree';

const DepartmentsPage: React.FC = () => {
  const { orgId: urlOrgId } = useParams<{ orgId: string }>();
  const { orgId: authOrgId } = useAuth();
  const orgId = urlOrgId || authOrgId;
  const { toast } = useToast();

  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hierRes, usersRes] = await Promise.all([
        identityService.getOrgHierarchy(orgId),
        identityService.getUsers(orgId),
      ]);
      setHierarchy(hierRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch {
      toast('Failed to load department data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [orgId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    setCreating(true);
    try {
      await identityService.createDepartment(orgId, { name: deptName.trim() });
      toast('Department created', 'success');
      setShowCreate(false);
      setDeptName('');
      loadData();
    } catch {
      toast('Failed to create department', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Filter users by selected department
  const filteredUsers = selectedNode
    ? users.filter((u) => u.department === selectedNode.org.name || u.organizationId === selectedNode.org.id)
    : users;

  const totalDepts = countNodes(hierarchy);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to={`/organizations`}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              Departments
              <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                {totalDepts}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Organization: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">{orgId}</code>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/organizations/${orgId}/org-chart`}
            className="btn-secondary flex items-center space-x-2"
          >
            <GitBranch size={16} />
            <span>Org Chart</span>
          </Link>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
            <Plus size={18} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Left: Department tree */}
        <div className="w-[340px] flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 overflow-y-auto">
          <DepartmentTree
            hierarchy={hierarchy}
            loading={loading}
            selectedId={selectedNode?.org.hashId}
            onSelect={(node) => setSelectedNode(
              selectedNode?.org.hashId === node.org.hashId ? null : node
            )}
          />
        </div>

        {/* Right: User list for selected department */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Users size={18} className="mr-2 text-gray-400" />
              {selectedNode ? `${selectedNode.org.name} - Users` : 'All Users'}
              <span className="ml-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
                {filteredUsers.length}
              </span>
            </h2>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs text-blue-600 hover:underline"
              >
                Show all
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2" />
              Loading...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No users in this department.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <div key={user.hashId || user.id} className="flex items-center py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user.displayName || user.email}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {user.title || 'No title'} {user.department ? `- ${user.department}` : ''}
                    </div>
                  </div>
                  <code className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    {user.hashId}
                  </code>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Department Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Department">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Department Name <span className="text-red-500">*</span></label>
            <input
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="input-field"
              placeholder="e.g. Engineering, Sales, Operations"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;
