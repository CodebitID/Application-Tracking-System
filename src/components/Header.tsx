import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Calendar,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  User,
  Users,
  ChevronDown,
  Settings,
  Check,
  Sparkles,
  ShieldCheck,
  Lock,
  Sun,
  Moon,
  ShieldAlert,
  Globe,
  Sliders,
  Activity,
} from 'lucide-react';
import { JobApplication, ViewMode, UserAccount } from '../types';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenNewJob: () => void;
  onOpenImportExport: (tab: 'import' | 'export') => void;
  onResetData: () => void;
  totalJobsCount: number;
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
  currentAccount: UserAccount;
  accounts: UserAccount[];
  onSelectAccount: (accountId: string) => void;
  onOpenAccountManager: () => void;
  onOpenAuthModal?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  adminScope?: string;
  onAdminScopeChange?: (scope: string) => void;
  onOpenSystemAdmin?: () => void;
  onOpenActivityFeed?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenNewJob,
  onOpenImportExport,
  onResetData,
  totalJobsCount,
  jobs,
  onSelectJob,
  currentAccount,
  accounts,
  onSelectAccount,
  onOpenAccountManager,
  onOpenAuthModal,
  theme,
  onToggleTheme,
  adminScope = 'all',
  onAdminScopeChange,
  onOpenSystemAdmin,
  onOpenActivityFeed,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isSuperadmin = currentAccount.role === 'superadmin';

  // Close account dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-white/5 bg-[#0F0F12] sticky top-0 z-30 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand, Title, and Profile Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Briefcase className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-tight text-white font-serif italic">
                CareerNode
              </h1>
              {isSuperadmin ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-rose-400" />
                  SUPERADMIN
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                  <FileSpreadsheet className="w-3 h-3" />
                  Job Tracker
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isSuperadmin ? (
                <span>
                  System oversight • <span className="text-slate-300 font-medium">{totalJobsCount}</span> total applications
                </span>
              ) : (
                <span>
                  Tracking {totalJobsCount} applications for <span className="text-slate-300 font-medium">{currentAccount.name}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Superadmin System Scope Switcher (when superadmin is logged in) */}
        {isSuperadmin && onAdminScopeChange && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
            <Globe className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="text-rose-300 font-semibold text-[11px] whitespace-nowrap">Dashboard Scope:</span>
            <select
              id="superadmin-scope-select"
              value={adminScope}
              onChange={(e) => onAdminScopeChange(e.target.value)}
              className="bg-[#141418] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-rose-500 cursor-pointer font-medium"
            >
              <option value="all">🌐 All Applications (Global View)</option>
              <optgroup label="Filter by Candidate:">
                {accounts
                  .filter((a) => a.role !== 'superadmin')
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      👤 {a.name} ({a.targetRole || 'Candidate'})
                    </option>
                  ))}
              </optgroup>
            </select>

            {onOpenSystemAdmin && (
              <button
                id="superadmin-system-console-btn"
                onClick={onOpenSystemAdmin}
                className="ml-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                title="Open Superadmin Management Console"
              >
                <Sliders className="w-3 h-3" />
                <span>Admin Console</span>
              </button>
            )}
          </div>
        )}

        {/* View Switcher & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Mode Toggle Segmented Control */}
          <div className="inline-flex p-1 bg-[#0D0D10] rounded-xl border border-white/5 text-xs font-medium">
            <button
              id="view-mode-board-btn"
              onClick={() => onViewModeChange('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'board'
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>

            <button
              id="view-mode-table-btn"
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Spreadsheet</span>
            </button>

            <button
              id="view-mode-analytics-btn"
              onClick={() => onViewModeChange('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'analytics'
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>

            <button
              id="view-mode-calendar-btn"
              onClick={() => onViewModeChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'calendar'
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          </div>

          {/* GLOBAL THEME TOGGLE (Sophisticated Dark vs Light) */}
          <button
            id="global-theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light Theme' : 'Sophisticated Dark Theme'}`}
            className="p-2 rounded-xl bg-[#141418] hover:bg-[#1A1A20] border border-white/10 text-slate-300 hover:text-white transition-all group flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400 group-hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Activity Feed Button */}
          {onOpenActivityFeed && (
            <button
              id="header-activity-feed-btn"
              onClick={onOpenActivityFeed}
              title="Open Recent Activity Feed"
              className="px-2.5 py-1.5 rounded-xl bg-[#141418] hover:bg-[#1A1A20] border border-white/10 text-slate-300 hover:text-white transition-all group flex items-center gap-1.5 text-xs font-medium"
            >
              <Activity className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline">Activity</span>
            </button>
          )}

          {/* Browser Notification Bell Center */}
          <NotificationCenter jobs={jobs} onSelectJob={onSelectJob} />

          {/* Import / Export & Reset tools */}
          <div className="flex items-center gap-1.5">
            <button
              id="header-import-csv-btn"
              title="Import CSV or spreadsheet data"
              onClick={() => onOpenImportExport('import')}
              className="px-3 py-2 text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              id="header-export-csv-btn"
              title="Export all data to CSV"
              onClick={() => onOpenImportExport('export')}
              className="px-3 py-2 text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              id="header-reset-btn"
              title="Reset to default template dataset"
              onClick={() => {
                if (confirm('Reset this profile to original sample application dataset? Custom changes will be reset.')) {
                  onResetData();
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* USER ACCOUNT SWITCHER DROPDOWN */}
          <div className="relative" ref={accountMenuRef}>
            <button
              id="user-account-menu-btn"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-[#141418] hover:bg-[#1A1A20] border border-white/10 transition-all text-left group"
              title="User profile & authentication menu"
            >
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${
                  currentAccount.avatarColor || 'from-indigo-500 to-purple-600'
                } text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs`}
              >
                {currentAccount.name.charAt(0).toUpperCase()}
              </div>

              <div className="hidden lg:block min-w-0 max-w-[110px]">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {currentAccount.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isSuperadmin ? 'Superadmin' : currentAccount.targetRole?.split(' ')[0] || 'Profile'}
                </p>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isAccountMenuOpen ? 'rotate-180 text-white' : 'group-hover:text-slate-200'
                }`}
              />
            </button>

            {/* Account Switcher Dropdown Menu */}
            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0D0D10] border border-white/10 shadow-2xl z-50 p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Active Profile Header */}
                <div className="p-3 rounded-xl bg-[#16161A] border border-white/5 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                        currentAccount.avatarColor || 'from-indigo-500 to-purple-600'
                      } text-white font-bold text-sm flex items-center justify-center shadow-xs flex-shrink-0`}
                    >
                      {currentAccount.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">
                          {currentAccount.name}
                        </p>
                        {isSuperadmin && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-indigo-400 truncate">
                        {isSuperadmin ? 'System Superadmin' : currentAccount.targetRole || 'Job Candidate'}
                      </p>
                    </div>
                  </div>
                  {currentAccount.email && (
                    <p className="text-[11px] text-slate-400 font-mono truncate pl-0.5 pt-1">
                      {currentAccount.email}
                    </p>
                  )}
                </div>

                {/* If Superadmin: Quick Switch All User Profiles */}
                {isSuperadmin ? (
                  <div className="space-y-1">
                    <p className="px-2 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch User Profile
                    </p>

                    {accounts.map((acc) => {
                      const isSelected = acc.id === currentAccount.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => {
                            onSelectAccount(acc.id);
                            setIsAccountMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs ${
                            isSelected
                              ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                              : 'hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-lg bg-gradient-to-br ${
                                acc.avatarColor || 'from-indigo-500 to-purple-600'
                              } text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0`}
                            >
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-white">
                                {acc.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {acc.role === 'superadmin' ? 'Superadmin' : acc.targetRole || 'Candidate'}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* If regular candidate: only show their current status and security */
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Isolated Candidate Workspace</span>
                    </div>
                    <p className="text-[11px]">
                      Your job applications and cover letters are private to your account.
                    </p>
                  </div>
                )}

                {/* Management Actions */}
                <div className="border-t border-white/5 pt-1.5 space-y-0.5">
                  {isSuperadmin && onOpenSystemAdmin && (
                    <button
                      id="header-open-system-admin-btn"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenSystemAdmin();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-rose-300 hover:text-white hover:bg-rose-600/20 transition-colors font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                      <span>Superadmin System Console</span>
                    </button>
                  )}

                  {onOpenAuthModal && (
                    <button
                      id="header-open-auth-modal-btn"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-indigo-300 hover:text-white hover:bg-indigo-600/20 transition-colors font-semibold"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Sign In / Switch Account</span>
                    </button>
                  )}

                  <button
                    id="header-open-account-manager-btn"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onOpenAccountManager();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Profile Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary CTA - Add Application */}
          <button
            id="add-new-job-btn"
            onClick={onOpenNewJob}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>
    </header>
  );
};
