import React, { useState } from 'react';
import {
  X,
  User,
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  Briefcase,
  MapPin,
  Mail,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount } from '../types';

export const AVATAR_GRADIENTS = [
  { name: 'Indigo Purple', value: 'from-indigo-500 to-purple-600' },
  { name: 'Emerald Teal', value: 'from-emerald-500 to-teal-600' },
  { name: 'Amber Rose', value: 'from-amber-500 to-rose-600' },
  { name: 'Blue Cyan', value: 'from-blue-600 to-cyan-500' },
  { name: 'Violet Pink', value: 'from-violet-600 to-fuchsia-500' },
  { name: 'Orange Amber', value: 'from-orange-500 to-amber-500' },
];

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  currentAccountId: string;
  onSelectAccount: (accountId: string) => void;
  onCreateAccount: (account: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  onUpdateAccount: (account: UserAccount) => void;
  onDeleteAccount: (accountId: string) => void;
  jobCountByAccount: { [accountId: string]: number };
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentAccountId,
  onSelectAccount,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  jobCountByAccount,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetLocation, setTargetLocation] = useState('Remote & Hybrid');
  const [avatarColor, setAvatarColor] = useState(AVATAR_GRADIENTS[0].value);
  const [bio, setBio] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingAccountId(null);
    setName('');
    setEmail('');
    setTargetRole('');
    setTargetLocation('Remote & Hybrid');
    setAvatarColor(AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)].value);
    setBio('');
    setIsEditing(true);
  };

  const handleStartEdit = (account: UserAccount) => {
    setEditingAccountId(account.id);
    setName(account.name);
    setEmail(account.email || '');
    setTargetRole(account.targetRole || '');
    setTargetLocation(account.targetLocation || 'Remote');
    setAvatarColor(account.avatarColor || AVATAR_GRADIENTS[0].value);
    setBio(account.bio || '');
    setIsEditing(true);
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
          email: email.trim() || undefined,
          targetRole: targetRole.trim() || undefined,
          targetLocation: targetLocation.trim() || undefined,
          avatarColor,
          bio: bio.trim() || undefined,
        });
      }
    } else {
      onCreateAccount({
        name: name.trim(),
        email: email.trim() || undefined,
        targetRole: targetRole.trim() || 'Software Engineer',
        targetLocation: targetLocation.trim() || 'Remote',
        avatarColor,
        bio: bio.trim() || undefined,
      });
    }

    setIsEditing(false);
    setEditingAccountId(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-[#0D0D10] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#0F0F12] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Manage User Profiles & Accounts
              </h2>
              <p className="text-xs text-slate-400">
                Switch profiles to manage separate job pipelines and target roles
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isEditing ? (
            /* Create / Edit Form */
            <form onSubmit={handleSave} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  {editingAccountId ? 'Edit Profile Information' : 'Create New User Account'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Avatar Gradient Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Avatar Theme & Color
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarColor} text-white font-bold text-lg flex items-center justify-center shadow-md flex-shrink-0`}
                  >
                    {name.trim() ? name.trim().charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {AVATAR_GRADIENTS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setAvatarColor(g.value)}
                        className={`w-7 h-7 rounded-xl bg-gradient-to-br ${g.value} transition-all relative ${
                          avatarColor === g.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0D0D10] scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={g.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Candidate Full Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Reed"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="candidate@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Role / Focus
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Location / Preference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Remote (US) or San Francisco, CA"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Candidate Bio & Summary (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Short summary of background, target industries, or job search focus..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20"
                >
                  {editingAccountId ? 'Save Profile Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          ) : (
            /* Accounts List */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Configured User Accounts ({accounts.length})
                </p>
                <button
                  id="modal-create-account-btn"
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Account</span>
                </button>
              </div>

              <div className="space-y-3">
                {accounts.map((acc) => {
                  const isActive = acc.id === currentAccountId;
                  const jobCount = jobCountByAccount[acc.id] ?? 0;

                  return (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-[#16161A] border-indigo-500/50 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                          : 'bg-[#121215] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${
                              acc.avatarColor || 'from-indigo-500 to-purple-600'
                            } text-white font-bold text-base flex items-center justify-center flex-shrink-0 shadow-md`}
                          >
                            {acc.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {acc.name}
                              </h3>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <Check className="w-3 h-3" />
                                  Active Profile
                                </span>
                              )}
                              {acc.isDefault && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 border border-white/5">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-indigo-300 font-medium truncate mt-0.5">
                              {acc.targetRole || 'Job Seeker'}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                              {acc.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-500" />
                                  {acc.email}
                                </span>
                              )}
                              {acc.targetLocation && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  {acc.targetLocation}
                                </span>
                              )}
                              <span className="flex items-center gap-1 font-semibold text-slate-300">
                                <Briefcase className="w-3 h-3 text-indigo-400" />
                                {jobCount} applications tracked
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                          {!isActive ? (
                            <button
                              onClick={() => {
                                onSelectAccount(acc.id);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors"
                            >
                              Switch to this
                            </button>
                          ) : (
                            <div className="px-3 py-1.5 text-xs text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Current
                            </div>
                          )}

                          <button
                            onClick={() => handleStartEdit(acc)}
                            title="Edit user profile"
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/5 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {accounts.length > 1 && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete profile "${acc.name}"? Their tracked applications will be removed from your browser.`
                                  )
                                ) {
                                  onDeleteAccount(acc.id);
                                }
                              }}
                              title="Delete profile"
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {acc.bio && (
                        <p className="text-xs text-slate-400 bg-black/30 p-2.5 rounded-xl mt-3 border border-white/5 leading-relaxed">
                          {acc.bio}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-[#0F0F12] flex items-center justify-between text-xs text-slate-400">
          <span>All profiles & applications are stored locally in your browser.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
