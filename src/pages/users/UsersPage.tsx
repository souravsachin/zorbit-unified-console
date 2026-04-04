import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Shield, KeyRound, AlertTriangle, Eye } from 'lucide-react';
import DataTable, { Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/shared/Toast';
import { identityService, User } from '../../services/identity';
import api from '../../services/api';
import { API_CONFIG } from '../../config';
import PasswordField, { getPasswordScore } from '../../components/shared/PasswordField';

interface Role {
  hashId: string;
  name: string;
  description?: string;
}

const UsersPage: React.FC = () => {
  const { orgId, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<User | null>(null);
  const [showNonAdminWarning, setShowNonAdminWarning] = useState(false);
  const [organizations, setOrganizations] = useState<Array<{hashId: string; name: string}>>([]);
  const [form, setForm] = useState({ email: '', displayName: '', password: '', role: '', organizationId: '' });
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedSubDept, setSelectedSubDept] = useState<string>('');
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forceChange, setForceChange] = useState(false);
  const [sendEmailNotif, setSendEmailNotif] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await identityService.getUsers(orgId);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await api.get(`${API_CONFIG.AUTHORIZATION_URL}/api/v1/O/${orgId}/roles`);
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Roles service may not be available
    }
  };

  const loadOrganizations = async () => {
    try {
      const res = await identityService.getOrganizations();
      setOrganizations(Array.isArray(res.data) ? res.data : []);
    } catch {}
  };

  useEffect(() => { loadUsers(); loadRoles(); loadOrganizations(); }, [orgId]);

  // Cascading org dropdown: top-level orgs only
  const topLevelOrgs = organizations.filter((o: any) => o.orgType !== 'department');

  // Fetch hierarchy when top-level org changes
  useEffect(() => {
    if (!selectedOrg) {
      setHierarchy(null);
      return;
    }
    let cancelled = false;
    const fetchHierarchy = async () => {
      setLoadingHierarchy(true);
      try {
        const res = await identityService.getOrgHierarchy(selectedOrg);
        if (!cancelled) setHierarchy(res.data);
      } catch {
        if (!cancelled) setHierarchy(null);
      } finally {
        if (!cancelled) setLoadingHierarchy(false);
      }
    };
    fetchHierarchy();
    return () => { cancelled = true; };
  }, [selectedOrg]);

  // Derived: departments under selected org
  const departments = hierarchy?.children?.map((c: any) => c.org) || [];

  // Derived: sub-departments under selected department
  const subDepartments = selectedDept && hierarchy?.children
    ? (hierarchy.children.find((c: any) => c.org?.hashId === selectedDept)?.children?.map((sc: any) => sc.org) || [])
    : [];

  // Effective org ID for user creation = deepest selected level
  const effectiveOrgId = selectedSubDept || selectedDept || selectedOrg || orgId;

  // Sync effectiveOrgId into form
  useEffect(() => {
    setForm(prev => ({ ...prev, organizationId: effectiveOrgId }));
  }, [effectiveOrgId]);

  // Check if selected role is org-admin
  const isOrgAdminRole = (roleHashId: string) => {
    const role = roles.find(r => r.hashId === roleHashId);
    return role?.name?.toLowerCase().includes('org-admin') || role?.name?.toLowerCase().includes('org admin');
  };

  const handleRoleChange = (roleHashId: string) => {
    setForm({ ...form, role: roleHashId });
    // If super admin selects a non-org-admin role, show soft warning
    if (roleHashId && !isOrgAdminRole(roleHashId)) {
      setShowNonAdminWarning(true);
    } else {
      setShowNonAdminWarning(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (getPasswordScore(form.password) < 3) {
      toast('Please choose a stronger password', 'error');
      return;
    }
    setCreating(true);
    try {
      // Hash password client-side (sha256)
      const crypto = window.crypto || (window as any).msCrypto;
      const encoder = new TextEncoder();
      const data = encoder.encode(form.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashedPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      const targetOrgId = form.organizationId || orgId;
      const res = await identityService.createUser(targetOrgId, {
        email: form.email,
        displayName: form.displayName,
        password: hashedPassword,
        organizationId: targetOrgId,
      });

      // If a role was selected, assign it
      if (form.role && res.data) {
        const userId = res.data.hashId || res.data.id;
        try {
          await api.post(
            `${API_CONFIG.AUTHORIZATION_URL}/api/v1/U/${userId}/roles`,
            { roleHashId: form.role }
          );
        } catch {
          toast('User created but role assignment failed. Assign role manually.', 'warning');
        }
      }

      toast('User created successfully', 'success');
      setShowCreate(false);
      setForm({ email: '', displayName: '', password: '', role: '', organizationId: '' });
      setSelectedOrg('');
      setSelectedDept('');
      setSelectedSubDept('');
      setHierarchy(null);
      setShowNonAdminWarning(false);
      loadUsers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleAssignRole = async () => {
    if (!showAssignRole || !selectedRole) return;
    setAssigning(true);
    const userId = showAssignRole.hashId || showAssignRole.id;
    try {
      await api.post(
        `${API_CONFIG.AUTHORIZATION_URL}/api/v1/U/${userId}/roles`,
        { roleHashId: selectedRole }
      );
      toast(`Role assigned to ${showAssignRole.displayName}`, 'success');
      setShowAssignRole(null);
      setSelectedRole('');
      loadUsers();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to assign role', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleResetPassword = async () => {
    if (!showResetPassword || !newPassword) return;
    setResetting(true);
    const userId = showResetPassword.hashId || showResetPassword.id;
    try {
      // Hash the new password with SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(newPassword);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashedPassword = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      await identityService.adminResetPassword(userId, hashedPassword, forceChange, sendEmailNotif);
      toast(`Password reset for ${showResetPassword.displayName}${forceChange ? ' (force change on next login)' : ''}`, 'success');
      setShowResetPassword(null);
      setNewPassword('');
      setForceChange(false);
      setSendEmailNotif(false);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleImpersonate = async (user: User) => {
    const userId = user.hashId || user.id;
    if (!confirm(`Impersonate "${user.displayName}" (${userId})? You will see the platform as this user.`)) return;
    setImpersonating(userId);
    try {
      const res = await identityService.impersonate(userId);
      const data = res.data;
      if (data?.accessToken) {
        localStorage.setItem('zorbit_token', data.accessToken);
        const domain = window.location.hostname.split('.').slice(-2).join('.');
        document.cookie = `zorbit_token=${data.accessToken}; domain=.${domain}; path=/; max-age=3600; SameSite=Lax; Secure`;
        try {
          const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
          localStorage.setItem('zorbit_user', JSON.stringify({
            id: payload.sub,
            email: payload.email,
            displayName: payload.displayName || payload.email,
            organizationId: payload.org,
          }));
        } catch { /* ignore */ }
        window.location.href = '/';
      }
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to impersonate user', 'error');
    } finally {
      setImpersonating(null);
    }
  };

  const handleDelete = async (user: User) => {
    const userId = user.hashId || user.id;
    if (!confirm(`Delete user "${user.displayName}" (${userId})?`)) return;
    try {
      await identityService.deleteUser(orgId, userId);
      toast('User deleted', 'success');
      loadUsers();
    } catch {
      toast('Failed to delete user', 'error');
    }
  };

  const columns: Column<User>[] = [
    { key: 'hashId', header: 'Hash ID', render: (u) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{u.hashId || u.id}</code> },
    { key: 'displayName', header: 'Display Name' },
    { key: 'email', header: 'Email', render: (u) => <span className="text-sm text-gray-600 dark:text-gray-400">{u.email || u.emailToken || '-'}</span> },
    { key: 'organizationHashId', header: 'Org', render: (u) => <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{u.organizationHashId || u.organizationId || '-'}</code> },
    { key: 'role', header: 'Role', render: (u) => u.role ? <StatusBadge label={u.role} /> : <span className="text-xs text-gray-400">No role</span> },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge label={u.status || 'active'} /> },
    { key: 'createdAt', header: 'Created', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    {
      key: 'actions' as keyof User,
      header: 'Actions',
      render: (u) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleImpersonate(u); }}
            className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded disabled:opacity-50"
            title="View as this user"
            disabled={impersonating === (u.hashId || u.id) || (u.hashId || u.id) === currentUser?.id}
          >
            <Eye size={14} className="text-purple-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowAssignRole(u); }}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
            title="Assign role"
          >
            <Shield size={14} className="text-blue-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowResetPassword(u); }}
            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
            title="Reset password"
          >
            <KeyRound size={14} className="text-amber-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(u); }}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
            title="Delete user"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Create User</span>
        </button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />

      {/* Create User Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setShowNonAdminWarning(false); setSelectedOrg(''); setSelectedDept(''); setSelectedSubDept(''); setHierarchy(null); }} title="Create User">
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Recommended approach banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Recommended:</strong> As a Super Admin, create an <strong>Org Admin</strong> for each organization.
              The Org Admin will then create and manage regular users within their organization.
            </p>
          </div>

          {/* Organization — cascading drill-down: Org > Department > Sub-Department */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Organization <span className="text-red-500">*</span></label>
              {topLevelOrgs.length > 1 ? (
                <select
                  value={selectedOrg}
                  onChange={(e) => {
                    setSelectedOrg(e.target.value);
                    setSelectedDept('');
                    setSelectedSubDept('');
                  }}
                  className="input-field"
                >
                  <option value="">-- Select organization --</option>
                  {topLevelOrgs.map((o: any) => (
                    <option key={o.hashId} value={o.hashId}>
                      {o.name || o.hashId}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2">{organizations.find((o: any) => o.hashId === orgId)?.name || orgId}</p>
              )}
            </div>

            {/* Department dropdown — only if org selected and has children */}
            {selectedOrg && departments.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Department <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedSubDept('');
                  }}
                  className="input-field"
                >
                  <option value="">-- None (use organization) --</option>
                  {departments.map((d: any) => (
                    <option key={d.hashId} value={d.hashId}>
                      {d.name || d.hashId}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-department dropdown — only if dept selected and has children */}
            {selectedDept && subDepartments.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Sub-Department <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                <select
                  value={selectedSubDept}
                  onChange={(e) => setSelectedSubDept(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- None (use department) --</option>
                  {subDepartments.map((sd: any) => (
                    <option key={sd.hashId} value={sd.hashId}>
                      {sd.name || sd.hashId}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Loading indicator for hierarchy fetch */}
            {loadingHierarchy && (
              <p className="text-xs text-gray-400">Loading departments...</p>
            )}

            {/* Show effective selection */}
            {selectedOrg && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Creating user in: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{effectiveOrgId}</code>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Display Name <span className="text-red-500">*</span></label>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
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
            <label className="block text-sm font-medium mb-1">Role <span className="text-red-500">*</span></label>
            <select
              value={form.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="input-field"
              required
            >
              <option value="">— Select a role —</option>
              {roles.map((r) => (
                <option key={r.hashId} value={r.hashId}>
                  {r.name}{r.description ? ` — ${r.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Warning when super admin creates non-org-admin user */}
          {showNonAdminWarning && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Are you sure you want to create a regular user directly?
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                  The recommended approach is to create an <strong>Org Admin</strong> first, who will then manage all other users within their organization.
                  Creating regular users directly bypasses the organizational hierarchy.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { setShowCreate(false); setShowNonAdminWarning(false); setSelectedOrg(''); setSelectedDept(''); setSelectedSubDept(''); setHierarchy(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      {/* Assign Role Modal */}
      <Modal isOpen={!!showAssignRole} onClose={() => { setShowAssignRole(null); setSelectedRole(''); }} title={`Assign Role — ${showAssignRole?.displayName || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a role to assign to <strong>{showAssignRole?.displayName}</strong> ({showAssignRole?.hashId || showAssignRole?.id}).
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
            >
              <option value="">— Select a role —</option>
              {roles.map((r) => (
                <option key={r.hashId} value={r.hashId}>
                  {r.name}{r.description ? ` — ${r.description}` : ''}
                </option>
              ))}
            </select>
          </div>
          {roles.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              No roles found. Create roles first on the Roles page.
            </p>
          )}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { setShowAssignRole(null); setSelectedRole(''); }} className="btn-secondary">Cancel</button>
            <button
              onClick={handleAssignRole}
              disabled={!selectedRole || assigning}
              className="btn-primary"
            >
              {assigning ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={!!showResetPassword} onClose={() => { setShowResetPassword(null); setNewPassword(''); setForceChange(false); setSendEmailNotif(false); }} title={`Reset Password — ${showResetPassword?.displayName || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set a new password for <strong>{showResetPassword?.displayName}</strong> ({showResetPassword?.email || showResetPassword?.emailToken || showResetPassword?.hashId}).
          </p>
          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={6}
            showStrengthMeter
            showAutoGenerate
            allowWeak
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={forceChange}
              onChange={(e) => setForceChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Force password change on next login</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmailNotif}
              onChange={(e) => setSendEmailNotif(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Send email notification to user</span>
          </label>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => { setShowResetPassword(null); setNewPassword(''); setForceChange(false); setSendEmailNotif(false); }} className="btn-secondary">Cancel</button>
            <button
              onClick={handleResetPassword}
              disabled={!newPassword || newPassword.length < 6 || resetting}
              className="btn-primary"
            >
              {resetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
