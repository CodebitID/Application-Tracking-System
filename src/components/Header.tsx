import React from 'react';
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
  Sun,
  Moon,
  Activity,
  Webhook,
} from 'lucide-react';
import { JobApplication, ViewMode } from '../types';
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
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenActivityFeed?: () => void;
  onOpenWebhookApi?: () => void;
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
  theme,
  onToggleTheme,
  onOpenActivityFeed,
  onOpenWebhookApi,
}) => {
  return (
    <header className="border-b border-white/5 bg-[#0F0F12] sticky top-0 z-30 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Stats Overview */}
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Briefcase className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-tight text-white font-serif italic">
                CareerNode
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                <FileSpreadsheet className="w-3 h-3" />
                Job Tracker
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tracking <span className="text-slate-300 font-medium">{totalJobsCount}</span> job applications & opportunities
            </p>
          </div>
        </div>

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
            className="p-2 rounded-xl bg-[#141418] hover:bg-[#1A1A20] border border-white/10 text-slate-300 hover:text-white transition-all group flex items-center justify-center cursor-pointer"
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
              className="px-2.5 py-1.5 rounded-xl bg-[#141418] hover:bg-[#1A1A20] border border-white/10 text-slate-300 hover:text-white transition-all group flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Activity className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline">Activity</span>
            </button>
          )}

          {/* Webhook & REST API Hub Button (Live Pulse) */}
          {onOpenWebhookApi && (
            <button
              id="header-webhook-api-btn"
              onClick={onOpenWebhookApi}
              title="Open REST API & Webhook Ingestion Hub (POST /api/jobs)"
              className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white transition-all group flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Webhook className="w-4 h-4 text-indigo-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden lg:inline">REST API</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
              className="px-3 py-2 text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              id="header-export-csv-btn"
              title="Export all data to CSV"
              onClick={() => onOpenImportExport('export')}
              className="px-3 py-2 text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              id="header-reset-btn"
              title="Reset to default template dataset"
              onClick={() => {
                if (confirm('Reset to original sample application dataset? Custom changes will be reset.')) {
                  onResetData();
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary CTA - Add Application */}
          <button
            id="add-new-job-btn"
            onClick={onOpenNewJob}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>
    </header>
  );
};
