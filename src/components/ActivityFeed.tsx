import React, { useState, useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Layers,
  PlusCircle,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  Briefcase,
  Calendar,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import { STATUS_CONFIG } from '../utils/formatters';

export interface ActivityFeedItem {
  id: string;
  jobId: string;
  companyName: string;
  jobTitle: string;
  type: 'status_change' | 'reminder_added' | 'reminder_completed' | 'contact_added' | 'job_created' | 'cover_letter' | 'note_added';
  title: string;
  description?: string;
  timestamp: string;
  fromStatus?: JobStatus | null;
  toStatus?: JobStatus;
  job: JobApplication;
}

interface ActivityFeedProps {
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 45) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.max(1, Math.floor(diffInSeconds / 60))}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  jobs,
  onSelectJob,
  isOpen = true,
  onClose,
  isEmbedded = false,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregate all activity updates chronologically across all jobs
  const activities: ActivityFeedItem[] = useMemo(() => {
    const items: ActivityFeedItem[] = [];

    jobs.forEach((job) => {
      // 1. Status History entries
      if (job.statusHistory && job.statusHistory.length > 0) {
        job.statusHistory.forEach((hist) => {
          const ts = hist.timestamp || hist.date || job.updatedAt || job.createdAt;
          const toSt = hist.toStatus || hist.status || job.status;
          const fromSt = hist.fromStatus;

          const isCreation = hist.note?.toLowerCase().includes('created') || !fromSt;

          items.push({
            id: `act-hist-${hist.id || Math.random()}`,
            jobId: job.id,
            companyName: job.companyName,
            jobTitle: job.jobTitle,
            type: isCreation ? 'job_created' : 'status_change',
            title: isCreation
              ? `Application created for ${job.companyName}`
              : `Status updated for ${job.companyName}`,
            description: hist.note || (fromSt ? `${fromSt} ➔ ${toSt}` : `Status: ${toSt}`),
            timestamp: ts,
            fromStatus: fromSt,
            toStatus: toSt,
            job,
          });
        });
      } else {
        // Fallback: Job Created event
        items.push({
          id: `act-created-${job.id}`,
          jobId: job.id,
          companyName: job.companyName,
          jobTitle: job.jobTitle,
          type: 'job_created',
          title: `Application created for ${job.companyName}`,
          description: `${job.jobTitle} • Status: ${job.status}`,
          timestamp: job.createdAt || job.dateApplied || new Date().toISOString(),
          toStatus: job.status,
          job,
        });
      }

      // 2. Reminders
      if (job.reminders && job.reminders.length > 0) {
        job.reminders.forEach((rem) => {
          items.push({
            id: `act-rem-${rem.id}`,
            jobId: job.id,
            companyName: job.companyName,
            jobTitle: job.jobTitle,
            type: rem.isCompleted ? 'reminder_completed' : 'reminder_added',
            title: rem.isCompleted
              ? `Reminder completed for ${job.companyName}`
              : `Reminder added for ${job.companyName}`,
            description: `"${rem.note}"${rem.dateTime ? ` • Due: ${rem.dateTime.replace('T', ' ')}` : ''}`,
            timestamp: rem.createdAt || job.updatedAt || new Date().toISOString(),
            job,
          });
        });
      }

      // 3. Contacts
      if (job.contacts && job.contacts.length > 0) {
        job.contacts.forEach((contact) => {
          items.push({
            id: `act-cont-${contact.id}`,
            jobId: job.id,
            companyName: job.companyName,
            jobTitle: job.jobTitle,
            type: 'contact_added',
            title: `Contact added for ${job.companyName}`,
            description: `${contact.name}${contact.role ? ` (${contact.role})` : ''}${contact.email ? ` • ${contact.email}` : ''}`,
            timestamp: contact.createdAt || job.updatedAt || new Date().toISOString(),
            job,
          });
        });
      }

      // 4. Saved Cover Letters
      if (job.coverLetters && job.coverLetters.length > 0) {
        job.coverLetters.forEach((cl) => {
          items.push({
            id: `act-cl-${cl.id}`,
            jobId: job.id,
            companyName: job.companyName,
            jobTitle: job.jobTitle,
            type: 'cover_letter',
            title: `AI Cover Letter tailored for ${job.companyName}`,
            description: cl.title || 'Customized application materials',
            timestamp: cl.createdAt || job.updatedAt || new Date().toISOString(),
            job,
          });
        });
      }
    });

    // Sort descending by timestamp (newest first)
    return items.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });
  }, [jobs]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'status' && act.type !== 'status_change') return false;
        if (filterType === 'reminders' && act.type !== 'reminder_added' && act.type !== 'reminder_completed') return false;
        if (filterType === 'contacts' && act.type !== 'contact_added') return false;
        if (filterType === 'applications' && act.type !== 'job_created') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.companyName.toLowerCase().includes(q) ||
          act.jobTitle.toLowerCase().includes(q) ||
          act.title.toLowerCase().includes(q) ||
          (act.description && act.description.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [activities, filterType, searchQuery]);

  // Stats counts
  const counts = useMemo(() => {
    return {
      all: activities.length,
      status: activities.filter((a) => a.type === 'status_change').length,
      reminders: activities.filter((a) => a.type === 'reminder_added' || a.type === 'reminder_completed').length,
      contacts: activities.filter((a) => a.type === 'contact_added').length,
      applications: activities.filter((a) => a.type === 'job_created').length,
    };
  }, [activities]);

  const renderIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'status_change':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        );
      case 'reminder_added':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Bell className="w-4 h-4" />
          </div>
        );
      case 'reminder_completed':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'contact_added':
        return (
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <UserCheck className="w-4 h-4" />
          </div>
        );
      case 'cover_letter':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        );
      case 'job_created':
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <PlusCircle className="w-4 h-4" />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  const content = (
    <div className="flex flex-col h-full bg-[#121216] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-[#0D0D10] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Activity Feed</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activities.length} updates
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live chronological timeline across all job applications
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Close Activity Feed"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-white/5 bg-[#141418] space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter updates by company, title, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'status', label: 'Status', count: counts.status },
            { id: 'reminders', label: 'Reminders', count: counts.reminders },
            { id: 'contacts', label: 'Contacts', count: counts.contacts },
            { id: 'applications', label: 'Created', count: counts.applications },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                filterType === tab.id ? 'bg-indigo-700 text-white' : 'bg-white/10 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity List Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[500px]">
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
            <p className="text-xs font-medium">No activity records match your filter</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Changes to statuses, reminders, and contacts will automatically populate here.
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const relTime = formatRelativeTime(act.timestamp);
            return (
              <div
                key={act.id}
                onClick={() => onSelectJob(act.job)}
                className="group p-3 rounded-xl bg-[#16161C] hover:bg-[#1C1C24] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer flex items-start gap-3 shadow-xs"
              >
                {/* Icon */}
                {renderIcon(act.type)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {act.title}
                    </p>
                    <span
                      title={new Date(act.timestamp).toLocaleString()}
                      className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 flex-shrink-0"
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {relTime}
                    </span>
                  </div>

                  {/* Company & Role subheader */}
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                    <span className="font-medium text-slate-300">{act.companyName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 truncate">{act.jobTitle}</span>
                  </p>

                  {/* Description / Status Transition Badge */}
                  {act.type === 'status_change' && act.toStatus ? (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {act.fromStatus && STATUS_CONFIG[act.fromStatus] && (
                        <>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              STATUS_CONFIG[act.fromStatus].bg
                            } ${STATUS_CONFIG[act.fromStatus].text} ${
                              STATUS_CONFIG[act.fromStatus].border
                            } opacity-75`}
                          >
                            {act.fromStatus}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </>
                      )}
                      {STATUS_CONFIG[act.toStatus] ? (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                            STATUS_CONFIG[act.toStatus].bg
                          } ${STATUS_CONFIG[act.toStatus].text} ${
                            STATUS_CONFIG[act.toStatus].border
                          }`}
                        >
                          {act.toStatus}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-white border border-white/10">
                          {act.toStatus}
                        </span>
                      )}
                    </div>
                  ) : act.description ? (
                    <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
                      {act.description}
                    </p>
                  ) : null}
                </div>

                {/* Arrow hint on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center text-slate-400 group-hover:text-indigo-400">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/5 bg-[#0D0D10] text-[11px] text-slate-400 flex items-center justify-between">
        <span>Click any update to open details</span>
        <span className="text-indigo-400 font-medium">Real-time sync</span>
      </div>
    </div>
  );

  // If embedded directly inside dashboard layout
  if (isEmbedded) {
    return <div className="w-full">{content}</div>;
  }

  // Floating Slide-over / Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl my-8">
        {content}
      </div>
    </div>
  );
};
