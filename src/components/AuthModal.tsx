import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  FileText,
  KeyRound,
} from 'lucide-react';
import { UserAccount } from '../types';
import { AVATAR_GRADIENTS } from './AccountManagerModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: UserAccount[];
  currentAccountId: string;
  onLogin: (accountId: string) => void;
  onRegister: (accountData: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  initialMode?: 'signin' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentAccountId,
  onLogin,
  onRegister,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  
  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regTargetRole, setRegTargetRole] = useState('');
  const [regTargetLocation, setRegTargetLocation] = useState('Remote');
  const [regResumeHighlights, setRegResumeHighlights] = useState('');
  const [regAvatarColor, setRegAvatarColor] = useState(AVATAR_GRADIENTS[0].value);
  const [regError, setRegError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailTrimmed = loginEmail.trim().toLowerCase();
    const account = accounts.find((a) => a.email.toLowerCase() === emailTrimmed);

    if (!account) {
      setLoginError('No account found with this email address. Please check spelling or register.');
      return;
    }

    // If account has a password, verify it (or allow demo default 'password123')
    if (account.password && loginPassword.trim() && account.password !== loginPassword.trim()) {
      setLoginError('Invalid password. Demo password is "password123" or use 1-click login below.');
      return;
    }

    onLogin(account.id);
    onClose();
  };

  const handleQuickDemoLogin = (accountId: string) => {
    onLogin(accountId);
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (accounts.some((a) => a.email.toLowerCase() === regEmail.trim().toLowerCase())) {
      setRegError('An account with this email address already exists. Please sign in instead.');
      return;
    }

    onRegister({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim() || 'password123',
      targetRole: regTargetRole.trim() || 'Software Engineer',
      targetLocation: regTargetLocation.trim() || 'Remote',
      resumeHighlights: regResumeHighlights.trim() || undefined,
      avatarColor: regAvatarColor,
      bio: `Job search dashboard for ${regName.trim()}`,
      lastLoginAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-[#0D0D10] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#0F0F12] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'signin' ? 'User Authentication & Sign In' : 'Create New Candidate Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'signin'
                  ? 'Access your private job tracking dashboard and application pipeline'
                  : 'Set up an isolated candidate profile with tailored AI assistants'}
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

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-white/5 bg-[#0D0D10] flex gap-4">
          <button
            onClick={() => {
              setMode('signin');
              setLoginError(null);
            }}
            className={`pb-2.5 text-xs sm:text-sm font-semibold transition-colors relative ${
              mode === 'signin'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In to Existing Account
          </button>

          <button
            onClick={() => {
              setMode('register');
              setRegError(null);
            }}
            className={`pb-2.5 text-xs sm:text-sm font-semibold transition-colors relative ${
              mode === 'register'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register New Account
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {mode === 'signin' ? (
            <div className="space-y-6">
              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex.morgan@careerpath.io"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password / Passcode
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Demo: <span className="font-mono text-indigo-400">password123</span>
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate & Open Dashboard</span>
                </button>
              </form>

              {/* 1-Click Fast Switch Demo Cards */}
              <div className="pt-2 space-y-2.5 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick 1-Click Demo Profiles
                  </span>
                  <span className="text-[10px] text-indigo-400 font-medium">Instant Login</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {accounts.map((acc) => {
                    const isCurrent = acc.id === currentAccountId;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleQuickDemoLogin(acc.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all ${
                          isCurrent
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-200'
                            : 'bg-white/5 border-white/5 hover:border-white/15 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                              acc.avatarColor || 'from-indigo-500 to-purple-600'
                            } text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs`}
                          >
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-white truncate">
                                {acc.name}
                              </p>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {acc.targetRole} • <span className="font-mono">{acc.email}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium flex-shrink-0 pl-2">
                          <span>Log In</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Avatar Theme Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Profile Avatar Palette
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${regAvatarColor} text-white font-bold text-sm flex items-center justify-center shadow-md flex-shrink-0`}
                  >
                    {regName.trim() ? regName.trim().charAt(0).toUpperCase() : 'N'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_GRADIENTS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setRegAvatarColor(g.value)}
                        className={`w-6 h-6 rounded-lg bg-gradient-to-br ${g.value} transition-all ${
                          regAvatarColor === g.value
                            ? 'ring-2 ring-white scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={g.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Candidate Full Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Taylor Vance"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="taylor.vance@tech.co"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password / PIN
                  </label>
                  <input
                    type="password"
                    placeholder="password123"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Role / Discipline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Staff Full Stack Engineer"
                    value={regTargetRole}
                    onChange={(e) => setRegTargetRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location Preference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote (US/EU) or New York, NY"
                  value={regTargetLocation}
                  onChange={(e) => setRegTargetLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Resume Highlights (Used by AI Cover Letter Generator)</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Key achievements, years of experience, or core tech stack to automatically inject into AI cover letters..."
                  value={regResumeHighlights}
                  onChange={(e) => setRegResumeHighlights(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Account & Initialize Dashboard</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#0F0F12] flex items-center justify-between text-xs text-slate-400">
          <span>Private isolated user dashboard & local storage</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
