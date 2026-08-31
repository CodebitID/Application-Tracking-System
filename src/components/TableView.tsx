import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Trash2,
  Download,
  MapPin,
  DollarSign,
  Globe,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import {
  ALL_STATUSES,
  STATUS_CONFIG,
  formatDate,
  formatShortDate,
  getCompanyColor,
} from '../utils/formatters';

interface TableViewProps {
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
  onEditJob?: (job: JobApplication) => void;
  onUpdateJobStatus: (id: string, newStatus: JobStatus) => void;
  onDeleteJob: (id: string) => void;
  onDeleteMultipleJobs: (ids: string[]) => void;
  onOpenAIPrep: (job: JobApplication) => void;
  onExportSelected: (jobs: JobApplication[]) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  jobs,
  onSelectJob,
  onUpdateJobStatus,
  onDeleteJob,
  onDeleteMultipleJobs,
  onOpenAIPrep,
  onExportSelected,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === jobs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(jobs.map((j) => j.id));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected job opportunities?`)) {
      onDeleteMultipleJobs(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkStatusChange = (status: JobStatus) => {
    selectedIds.forEach((id) => onUpdateJobStatus(id, status));
  };

  const getScoreBadgeClass = (score?: number) => {
    if (score === undefined || score === null) return 'bg-slate-800/60 text-slate-400 border-slate-700/50';
    if (score >= 85) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (score >= 70) return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    if (score >= 50) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  };

  const getRecBadgeClass = (rec?: string) => {
    if (!rec) return 'bg-white/5 text-slate-300 border-white/10';
    const lower = rec.toLowerCase();
    if (lower.includes('high') || lower.includes('priority')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold';
    }
    if (lower.includes('apply') && !lower.includes('select')) {
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-medium';
    }
    if (lower.includes('select')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium';
    }
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-3">
      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl shadow-lg animate-fadeIn backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md font-mono">
              {selectedIds.length}
            </span>
            <span>opportunities selected</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-300">Set status:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as JobStatus);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="text-xs bg-[#16161A] border border-white/10 rounded-lg px-2.5 py-1.5 font-medium text-slate-200 cursor-pointer"
              >
                <option value="" disabled className="bg-[#16161A]">
                  Choose status...
                </option>
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-[#16161A] text-slate-200">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const selectedJobs = jobs.filter((j) => selectedIds.includes(j.id));
                onExportSelected(selectedJobs);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-medium text-rose-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Opportunity Decision Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121216] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#17171E] text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={jobs.length > 0 && selectedIds.length === jobs.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 bg-black/40 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5 min-w-[140px]">Fit & Decision</th>
                <th className="px-4 py-3.5 min-w-[220px]">Role & Company</th>
                <th className="px-4 py-3.5 min-w-[160px]">Location & Work Mode</th>
                <th className="px-4 py-3.5 min-w-[150px]">Compensation</th>
                <th className="px-4 py-3.5 min-w-[200px]">Top Skills & Analysis</th>
                <th className="px-4 py-3.5 min-w-[140px]">Source & Ingest</th>
                <th className="px-4 py-3.5 min-w-[150px] text-right">Status & Review</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-400 space-y-3">
                    <Layers className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                    <p className="text-sm font-medium text-slate-300">No job opportunities match current filters</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Use the Webhook / REST API to ingest opportunities from your automated job monitors, or adjust your active search and status filters.
                    </p>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const isSelected = selectedIds.includes(job.id);
                  const statusConf = STATUS_CONFIG[job.status] || STATUS_CONFIG['Not Started'];
                  const fitScore = job.overallFitScore ?? job.fitScore;
                  const skills = job.strongMatches || job.criticalRequirements || [];

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className={`group cursor-pointer transition-colors duration-150 hover:bg-white/[0.03] ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectRow(job.id, e as any)}
                          className="w-4 h-4 rounded border-slate-700 bg-black/40 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* 1. Fit & Recommendation */}
                      <td className="px-4 py-3.5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          {fitScore !== undefined && fitScore !== null ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-mono border ${getScoreBadgeClass(
                                fitScore
                              )}`}
                            >
                              {fitScore}%
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">—</span>
                          )}

                          {job.recommendation && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider border ${getRecBadgeClass(
                                job.recommendation
                              )}`}
                            >
                              {job.recommendation}
                            </span>
                          )}
                        </div>

                        {job.suitabilityClassification && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            {job.suitabilityClassification}
                          </div>
                        )}
                      </td>

                      {/* 2. Role & Company */}
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center gap-1.5 text-sm">
                          <span>{job.jobTitle}</span>
                          {job.jobLink && (
                            <a
                              href={job.jobLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-white transition-colors"
                              title="Open original job posting"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-300">{job.companyName}</span>
                          {job.jobLinkDomain && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                              {job.jobLinkDomain}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Location & Work Mode */}
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          {job.isRemote ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              <Globe className="w-3 h-3" />
                              Remote
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-white/5">
                              <MapPin className="w-3 h-3" />
                              On-site
                            </span>
                          )}
                          <span className="truncate max-w-[110px] text-xs text-slate-300" title={job.location}>
                            {job.location}
                          </span>
                        </div>

                        {job.eligibility && (
                          <div className="text-[10px] text-indigo-300/80 font-medium truncate max-w-[150px]" title={job.eligibility}>
                            {job.eligibility}
                          </div>
                        )}
                      </td>

                      {/* 4. Compensation */}
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="font-medium text-slate-200 text-xs">
                          {job.salary || 'Competitive / Market Rate'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {job.jobType || 'Full-Time'}
                        </div>
                      </td>

                      {/* 5. Top Skills & Highlights */}
                      <td className="px-4 py-3.5 space-y-1.5">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-300 font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-mono">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>

                        {job.mainRisk && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-300/90 truncate max-w-[200px]" title={job.mainRisk}>
                            <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0 text-amber-400" />
                            <span className="truncate">{job.mainRisk}</span>
                          </div>
                        )}
                      </td>

                      {/* 6. Source & Ingest */}
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#1C1C24] border border-white/10 text-slate-300">
                          {job.sourcePlatform || 'Direct Ingest'}
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{job.firstSeenAt ? formatShortDate(job.firstSeenAt) : formatShortDate(job.createdAt)}</span>
                        </div>
                      </td>

                      {/* 7. Status & Actions */}
                      <td className="px-4 py-3.5 text-right space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            value={job.status}
                            onChange={(e) => onUpdateJobStatus(job.id, e.target.value as JobStatus)}
                            className={`text-xs font-semibold rounded-lg px-2 py-1 border cursor-pointer ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}
                          >
                            {ALL_STATUSES.map((st) => (
                              <option key={st} value={st} className="bg-[#181820] text-slate-200">
                                {st}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => onSelectJob(job)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
                            title="Review Opportunity & Strategy"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete ${job.companyName} - ${job.jobTitle}?`)) {
                                onDeleteJob(job.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Delete Opportunity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
