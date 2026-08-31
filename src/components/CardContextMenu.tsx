import React, { useEffect, useRef, useState } from 'react';
import {
  JobApplication,
  JobStatus,
} from '../types';
import {
  ALL_STATUSES,
  STATUS_CONFIG,
} from '../utils/formatters';
import {
  ExternalLink,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRightCircle,
  Building,
} from 'lucide-react';

interface CardContextMenuProps {
  job: JobApplication;
  position: { x: number; y: number };
  onClose: () => void;
  onUpdateJobStatus: (id: string, newStatus: JobStatus) => void;
  onSelectJob: (job: JobApplication) => void;
  onOpenAIPrep: (job: JobApplication) => void;
  onDeleteJob: (id: string) => void;
}

export const CardContextMenu: React.FC<CardContextMenuProps> = ({
  job,
  position,
  onClose,
  onUpdateJobStatus,
  onSelectJob,
  onOpenAIPrep,
  onDeleteJob,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [adjustedPos, setAdjustedPos] = useState({ x: position.x, y: position.y });

  // Adjust menu position so it doesn't overflow screen viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      if (newX + rect.width > screenW - 16) {
        newX = Math.max(16, screenW - rect.width - 16);
      }
      if (newY + rect.height > screenH - 16) {
        newY = Math.max(16, screenH - rect.height - 16);
      }

      setAdjustedPos({ x: newX, y: newY });
    }
  }, [position]);

  // Click outside and escape listener
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const handleCopySummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${job.jobTitle} at ${job.companyName}${job.jobLink ? ` - ${job.jobLink}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 900);
  };

  const currentConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG['Applied'];

  return (
    <div
      ref={menuRef}
      id="kanban-card-context-menu"
      style={{
        top: `${adjustedPos.y}px`,
        left: `${adjustedPos.x}px`,
      }}
      className="fixed z-50 w-72 rounded-2xl bg-[#141418] text-slate-200 border border-white/10 shadow-2xl shadow-black/80 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Target Application Header */}
      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-white text-xs truncate">
            {job.companyName}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${currentConfig.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentConfig.dot}`} />
            {job.status}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 truncate">
          {job.jobTitle}
        </p>
      </div>

      {/* Quick Move Status Section */}
      <div className="space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Change Pipeline Status</span>
          <span className="text-[9px] text-indigo-400 font-normal">Click to update</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
          {ALL_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status] || STATUS_CONFIG['Applied'];
            const isCurrent = job.status === status;

            return (
              <button
                key={status}
                id={`context-menu-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateJobStatus(job.id, status);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                  isCurrent
                    ? 'bg-indigo-600/25 text-white font-semibold border border-indigo-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                  <span className="truncate">{status}</span>
                </div>
                {isCurrent && (
                  <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/5 pt-1.5 space-y-1">
        {/* Open Details */}
        <button
          id="context-menu-open-details"
          onClick={(e) => {
            e.stopPropagation();
            onSelectJob(job);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>Open Full Details & Notes</span>
        </button>

        {/* AI Prep & Studio */}
        <button
          id="context-menu-ai-prep"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAIPrep(job);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-indigo-300 hover:text-indigo-200 hover:bg-indigo-600/20 transition-colors font-medium"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Prep & Cover Letter</span>
        </button>

        {/* Copy Info */}
        <button
          id="context-menu-copy-info"
          onClick={handleCopySummary}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Job Info'}</span>
          </div>
          {copied && <Check className="w-3 h-3 text-emerald-400" />}
        </button>

        {/* Delete */}
        <button
          id="context-menu-delete-job"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete application for ${job.companyName}?`)) {
              onDeleteJob(job.id);
            }
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Application</span>
        </button>
      </div>
    </div>
  );
};
