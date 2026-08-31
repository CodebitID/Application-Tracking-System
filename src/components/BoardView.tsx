import React, { useState } from 'react';
import {
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  MoreVertical,
  Plus,
  ArrowRight,
  MessageSquare,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Building,
  User,
  Mail,
  Bell,
  History,
  MousePointerClick,
} from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import {
  ALL_STATUSES,
  STATUS_CONFIG,
  formatDate,
  formatShortDate,
  getDaysRemaining,
  getCompanyColor,
} from '../utils/formatters';
import { CardContextMenu } from './CardContextMenu';

interface BoardViewProps {
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
  onUpdateJobStatus: (id: string, newStatus: JobStatus) => void;
  onOpenNewJobWithStatus: (status: JobStatus) => void;
  onDeleteJob: (id: string) => void;
  onOpenAIPrep: (job: JobApplication) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  jobs,
  onSelectJob,
  onUpdateJobStatus,
  onOpenNewJobWithStatus,
  onDeleteJob,
  onOpenAIPrep,
}) => {
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<JobStatus | null>(null);
  const [contextMenuState, setContextMenuState] = useState<{
    job: JobApplication;
    position: { x: number; y: number };
  } | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedJobId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: JobStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: JobStatus) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;
    if (jobId) {
      onUpdateJobStatus(jobId, targetStatus);
    }
    setDraggedJobId(null);
    setDragOverColumn(null);
  };

  const handleCardContextMenu = (e: React.MouseEvent, job: JobApplication) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuState({
      job,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleMenuButtonClick = (e: React.MouseEvent, job: JobApplication) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuState({
      job,
      position: { x: rect.right - 240, y: rect.bottom + 6 },
    });
  };

  // Group columns
  const columns: { status: JobStatus; title: string; jobs: JobApplication[] }[] = ALL_STATUSES.map(
    (status) => ({
      status,
      title: status,
      jobs: jobs.filter((j) => j.status === status),
    })
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
      {/* Helper notice for context menu */}
      <div className="flex items-center justify-between pb-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <MousePointerClick className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tip: <strong>Right-click</strong> any card or click <strong>•••</strong> for quick status changes without opening drawer</span>
        </span>
        <span>Drag & drop cards across stages</span>
      </div>

      {/* Horizontal scrolling board columns */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
        {columns.map((column) => {
          const config = STATUS_CONFIG[column.status] || STATUS_CONFIG['Applied'];
          const isOver = dragOverColumn === column.status;

          return (
            <div
              key={column.status}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
              className={`flex-shrink-0 w-80 rounded-2xl flex flex-col max-h-[calc(100vh-230px)] transition-all ${
                isOver
                  ? 'bg-indigo-950/30 ring-2 ring-indigo-500 ring-dashed border border-indigo-500/40'
                  : 'bg-[#0D0D10] border border-white/5'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-white/5 bg-[#0F0F12] rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                  <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                    {column.title}
                  </h3>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white/5 text-slate-400 border border-white/5">
                    {column.jobs.length}
                  </span>
                </div>

                <button
                  id={`board-add-${column.status.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => onOpenNewJobWithStatus(column.status)}
                  title={`Add application in ${column.status}`}
                  className="p-1 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Cards List */}
              <div className="p-2.5 overflow-y-auto flex-1 space-y-2.5">
                {column.jobs.length === 0 ? (
                  <div className="py-8 px-4 text-center border border-dashed border-white/5 rounded-xl">
                    <p className="text-xs text-slate-500">No applications</p>
                    <button
                      onClick={() => onOpenNewJobWithStatus(column.status)}
                      className="mt-2 text-xs text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add one
                    </button>
                  </div>
                ) : (
                  column.jobs.map((job) => {
                    const deadlineInfo = getDaysRemaining(job.deadline);
                    const reminders = job.reminders || [];
                    const activeReminders = reminders.filter((r) => !r.isCompleted);
                    const historyCount = job.statusHistory?.length || 0;

                    return (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        onContextMenu={(e) => handleCardContextMenu(e, job)}
                        className={`group relative p-3.5 bg-[#16161A] rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                          draggedJobId === job.id ? 'opacity-40' : 'opacity-100'
                        }`}
                        onClick={() => onSelectJob(job)}
                      >
                        {/* Company & Title Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            {/* Company Avatar */}
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCompanyColor(
                                job.companyName
                              )} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs`}
                            >
                              {job.companyName.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm text-white leading-tight truncate">
                                {job.companyName}
                              </h4>
                              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                                {job.jobTitle}
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions / Context Menu Trigger */}
                          <div
                            className="relative flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              id={`card-menu-btn-${job.id}`}
                              onClick={(e) => handleMenuButtonClick(e, job)}
                              title="Right-click or click for status menu"
                              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* If in Multi-user Superadmin view: show owner badge */}
                        {job.accountName && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium">
                            <User className="w-2.5 h-2.5" />
                            <span>Candidate: {job.accountName}</span>
                          </div>
                        )}

                        {/* Badges: Salary, Location, Job Type */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
                          {job.salary && job.salary !== 'N/A' && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              <DollarSign className="w-3 h-3 stroke-[2.5]" />
                              {job.salary}
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              job.isRemote
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-white/5 text-slate-300 border border-white/5'
                            }`}
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            {job.location}
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5">
                            {job.jobType}
                          </span>
                        </div>

                        {/* Interview Date Alert */}
                        {job.interviewDate && (
                          <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-medium text-amber-400 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Interview: {formatShortDate(job.interviewDate)}
                            </span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                              Scheduled
                            </span>
                          </div>
                        )}

                        {/* Reminders / Timeline Indicators */}
                        {(activeReminders.length > 0 || historyCount > 0) && (
                          <div className="flex items-center gap-2 mt-2 text-[10px]">
                            {activeReminders.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                <Bell className="w-2.5 h-2.5" />
                                {activeReminders.length} reminder{activeReminders.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {historyCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                                <History className="w-2.5 h-2.5 text-slate-500" />
                                {historyCount} milestone{historyCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Deadline indicator if no interview */}
                        {job.deadline && !job.interviewDate && deadlineInfo && (
                          <div
                            className={`mt-2 px-2 py-0.5 rounded text-[11px] flex items-center justify-between ${
                              deadlineInfo.isPast
                                ? 'text-slate-500'
                                : deadlineInfo.days <= 3
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold'
                                : 'text-slate-400'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              Deadline: {formatShortDate(job.deadline)}
                            </span>
                            <span className="text-[10px] font-medium">
                              {deadlineInfo.label}
                            </span>
                          </div>
                        )}

                        {/* Notes snippet if present */}
                        {job.notes && (
                          <p className="mt-2 text-[11px] text-slate-400 line-clamp-2 italic bg-[#0D0D10] p-1.5 rounded-md border border-white/5">
                            "{job.notes}"
                          </p>
                        )}

                        {/* Footer tags and links */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5">
                            {job.tag && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-[10px]">
                                #{job.tag}
                              </span>
                            )}
                            {job.dateApplied && (
                              <span>Applied {formatShortDate(job.dateApplied)}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {job.contactEmailOrLinkedIn && (
                              <span
                                title={`Contact: ${job.contactEmailOrLinkedIn}`}
                                className="p-1 hover:text-indigo-400 text-slate-500 transition-colors"
                              >
                                {job.contactEmailOrLinkedIn.includes('@') ? (
                                  <Mail className="w-3 h-3" />
                                ) : (
                                  <User className="w-3 h-3" />
                                )}
                              </span>
                            )}
                            {job.jobLink && (
                              <a
                                href={job.jobLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Open Job Listing"
                                className="p-1 hover:text-indigo-400 text-slate-500 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Context Menu */}
      {contextMenuState && (
        <CardContextMenu
          job={contextMenuState.job}
          position={contextMenuState.position}
          onClose={() => setContextMenuState(null)}
          onUpdateJobStatus={onUpdateJobStatus}
          onSelectJob={onSelectJob}
          onOpenAIPrep={onOpenAIPrep}
          onDeleteJob={onDeleteJob}
        />
      )}
    </div>
  );
};

