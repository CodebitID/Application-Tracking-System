import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  KeyRound,
  Eye,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { UserAccount, UserRole, JobApplication } from '../types';
import { AVATAR_GRADIENTS } from './AccountManagerModal';

interface SystemAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  currentAccountId: string;
  onSelectAccount: (accountId: string) => void;
  onCreateAccount: (account: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  onUpdateAccount: (account: UserAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  jobCountByAccount: { [accountId: string]: number };
  allSystemJobsCount: number;
}

export const SystemAdminModal: React.FC<SystemAdminModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentAccountId,
  onSelectAccount,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  jobCountByAccount,
  allSystemJobsCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('candidate');
  const [targetRole, setTargetRole] = useState('');
  const [targetLocation, setTargetLocation] = useState('Remote & Hybrid');
  const [avatarColor, setAvatarColor] = useState(AVATAR_GRADIENTS[0].value);
  const [bio, setBio] = useState('');
  const [resumeHighlights, setResumeHighlights] = useState('');

  if (!isOpen) return null;

  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase();
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      (acc.targetRole && acc.targetRole.toLowerCase().includes(q)) ||
      (acc.role && acc.role.toLowerCase().includes(q))
    );
  });

  const handleStartCreate = () => {
    setEditingAccountId(null);
    setName('');
    setEmail('');
    setPassword('password123');
    setRole('candidate');
    setTargetRole('Software Engineer');
    setTargetLocation('Remote & Hybrid');
    setAvatarColor(AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)].value);
    setBio('');
    setResumeHighlights('');
    setIsEditing(true);
  };

  const handleStartEdit = (account: UserAccount) => {
    setEditingAccountId(account.id);
    setName(account.name);
    setEmail(account.email || '');
    setPassword(account.password || 'password123');
    setRole(account.role || 'candidate');
    setTargetRole(account.targetRole || '');
    setTargetLocation(account.targetLocation || 'Remote');
    setAvatarColor(account.avatarColor || AVATAR_GRADIENTS[0].value);
    setBio(account.bio || '');
    setResumeHighlights(account.resumeHighlights || '');
    setIsEditing(true);
  };

  const handleToggleRole = (account: UserAccount) => {
    const newRole: UserRole = account.role === 'superadmin' ? 'candidate' : 'superadmin';
    onUpdateAccount({
      ...account,
      role: newRole,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAccountId) {
      const existing = accounts.find((a) => a.id === editingAccountId);
      if (existing) {
        onUpdateAccount({
          ...existing,
          name: name.trim(),
          email: email.trim() || existing.email,
          password: password.trim() || existing.password,
          role,
          targetRole: targetRole.trim() || 'Job Seeker',
          targetLocation: targetLocation.trim() || 'Remote',
          avatarColor,
          bio: bio.trim() || undefined,
          resumeHighlights: resumeHighlights.trim() || undefined,
        });
      }
    } else {
      onCreateAccount({
        name: name.trim(),
        email: email.trim() || `user-${Date.now()}@careerpath.io`,
        password: password.trim() || 'password123',
        role,
        targetRole: targetRole.trim() || 'Software Engineer',
        targetLocation: targetLocation.trim() || 'Remote',
        avatarColor,
        bio: bio.trim() || `Candidate account for ${name.trim()}`,
        resumeHighlights: resumeHighlights.trim() || undefined,
        lastLoginAt: new Date().toISOString(),
      });
    }

    setIsEditing(false);
    setEditingAccountId(null);
  };

  const totalCandidates = accounts.filter((a) => a.role !== 'superadmin').length;
  const totalAdmins = accounts.filter((a) => a.role === 'superadmin').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-[#0D0D10] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#0F0F12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-600/10">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Superadmin System Management Console
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Global Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage all registered candidate profiles, permissions, and system-wide application pipelines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Overview KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4 border-b border-white/5 bg-[#141418]">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Total User Profiles
            </p>
            <p className="text-xl font-bold text-white">{accounts.length}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Candidates
            </p>
            <p className="text-xl font-bold text-white">{totalCandidates}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Superadmins
            </p>
            <p className="text-xl font-bold text-white">{totalAdmins}</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              System Applications
            </p>
            <p className="text-xl font-bold text-white">{allSystemJobsCount}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isEditing ? (
            /* Create / Edit Form */
            <form onSubmit={handleSave} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">
                  {editingAccountId ? 'Edit User Profile & Permissions' : 'Create New User Account'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rachel Adams"
                    className="w-full px-3 py-2 rounded-xl bg-[#16161A] border border-white/10 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rachel@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-[#16161A] border border-white/10 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password / Passcode
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full px-3 py-2 rounded-xl bg-[#16161A] border border-white/10 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Role & Permission
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#16161A] border border-white/10 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="candidate">Candidate (Isolated Personal Pipeline)</option>
                    <option value="superadmin">Superadmin (Global System Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Job Role / Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Machine Learning Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-[#16161A] border border-white/10 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location Preference
                  </label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Remote"
                    className="w-full px-3 py-2 rounded-xl bg-[#16161A] border border-white/10 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Avatar Gradient Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Avatar Theme Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_GRADIENTS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setAvatarColor(g.value)}
                      className={`h-7 w-12 rounded-lg bg-gradient-to-r ${g.value} transition-transform ${
                        avatarColor === g.value ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={g.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resume & Experience Highlights (For AI Cover Letters)
                </label>
                <textarea
                  rows={3}
                  value={resumeHighlights}
                  onChange={(e) => setResumeHighlights(e.target.value)}
                  placeholder="• 5+ years experience building cloud applications&#10;• Led team of 6 engineers..."
                  className="w-full px-3 py-2 rounded-xl bg-[#16161A] border border-white/10 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20"
                >
                  {editingAccountId ? 'Save Profile Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          ) : (
            /* User Accounts Table & Actions */
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name, email, or role..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#16161A] border border-white/10 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <button
                  id="admin-create-user-btn"
                  onClick={handleStartCreate}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New User</span>
                </button>
              </div>

              {/* Accounts Registry Table */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#16161A]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#0F0F12] text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">User Account</th>
                        <th className="py-3 px-4">Role & Access</th>
                        <th className="py-3 px-4">Target Job Role</th>
                        <th className="py-3 px-4 text-center">Applications</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAccounts.map((acc) => {
                        const isCurrent = acc.id === currentAccountId;
                        const isSuperadmin = acc.role === 'superadmin';
                        const jobCount = jobCountByAccount[acc.id] || 0;

                        return (
                          <tr
                            key={acc.id}
                            className={`hover:bg-white/5 transition-colors ${
                              isCurrent ? 'bg-indigo-600/10' : ''
                            }`}
                          >
                            {/* User & Email */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                                    acc.avatarColor || 'from-indigo-500 to-purple-600'
                                  } text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0`}
                                >
                                  {acc.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-white truncate flex items-center gap-1.5">
                                    {acc.name}
                                    {isCurrent && (
                                      <span className="text-[10px] text-indigo-400 font-normal">
                                        (Active)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-slate-400 truncate font-mono">
                                    {acc.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge & Toggle */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isSuperadmin
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {isSuperadmin ? (
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                  ) : (
                                    <UserCheck className="w-2.5 h-2.5" />
                                  )}
                                  {isSuperadmin ? 'Superadmin' : 'Candidate'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleToggleRole(acc)}
                                  title={`Switch role to ${isSuperadmin ? 'Candidate' : 'Superadmin'}`}
                                  className="text-[10px] text-slate-400 hover:text-white underline"
                                >
                                  Change
                                </button>
                              </div>
                            </td>

                            {/* Target Role */}
                            <td className="py-3 px-4 text-slate-300 truncate max-w-[180px]">
                              {acc.targetRole || 'General Candidate'}
                            </td>

                            {/* Job Count */}
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 font-bold text-indigo-300">
                                {jobCount}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    onSelectAccount(acc.id);
                                    onClose();
                                  }}
                                  title="Switch view to this user's dashboard"
                                  className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 hover:text-white transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleStartEdit(acc)}
                                  title="Edit user details"
                                  className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {accounts.length > 1 && (
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Delete user ${acc.name}? Their private applications will be removed.`
                                        )
                                      ) {
                                        onDeleteAccount(acc.id);
                                      }
                                    }}
                                    title="Delete user account"
                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
