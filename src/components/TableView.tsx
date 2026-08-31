import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Calendar,
  MoreVertical,
  ChevronDown,
  Sparkles,
  Edit2,
  Trash2,
  Download,
  Filter,
  ArrowUpDown,
  Mail,
  User,
  MapPin,
  DollarSign,
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
  onEditJob: (job: JobApplication) => void;
  onUpdateJobStatus: (id: string, newStatus: JobStatus) => void;
  onDeleteJob: (id: string) => void;
  onDeleteMultipleJobs: (ids: string[]) => void;
  onOpenAIPrep: (job: JobApplication) => void;
  onExportSelected: (jobs: JobApplication[]) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  jobs,
  onSelectJob,
  onEditJob,
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
    if (confirm(`Delete ${selectedIds.length} selected job applications?`)) {
      onDeleteMultipleJobs(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkStatusChange = (status: JobStatus) => {
    selectedIds.forEach((id) => onUpdateJobStatus(id, status));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-3">
      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md">
              {selectedIds.length}
            </span>
            <span>selected</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk status update */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">Set status:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as JobStatus);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="text-xs bg-[#16161A] border border-white/10 rounded-lg px-2 py-1 font-medium text-slate-200 cursor-pointer"
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

            {/* Export selected */}
            <button
              onClick={() => {
                const selectedJobs = jobs.filter((j) => selectedIds.includes(j.id));
                onExportSelected(selectedJobs);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white/5 border border-white/10 rounded-lg text-slate-200 hover:bg-white/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected</span>
            </button>

            {/* Bulk delete */}
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-500 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Spreadsheet Table Container */}
      <div className="bg-[#16161A] border border-white/5 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0D0D10] border-b border-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <th className="py-3 px-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === jobs.length && jobs.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 min-w-[180px]">Company</th>
                <th className="py-3 px-3 min-w-[180px]">Job Title</th>
                <th className="py-3 px-3 min-w-[150px]">Status</th>
                <th className="py-3 px-3 min-w-[110px]">Applied</th>
                <th className="py-3 px-3 min-w-[110px]">Deadline</th>
                <th className="py-3 px-3 min-w-[100px]">Type</th>
                <th className="py-3 px-3 min-w-[100px]">Salary</th>
                <th className="py-3 px-3 min-w-[140px]">Location</th>
                <th className="py-3 px-3 min-w-[150px]">Contact</th>
                <th className="py-3 px-3 min-w-[110px]">Interview</th>
                <th className="py-3 px-3 min-w-[120px]">Tag / Notes</th>
                <th className="py-3 px-3 text-right min-w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500">
                    No job applications match your filters.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const isSelected = selectedIds.includes(job.id);
                  const statusConfig = STATUS_CONFIG[job.status];

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className={`hover:bg-white/[0.02] cursor-pointer transition-colors group ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Select checkbox */}
                      <td className="py-3 px-3.5 text-center" onClick={(e) => toggleSelectRow(job.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Company Name */}
                      <td className="py-3 px-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-md bg-gradient-to-br ${getCompanyColor(
                              job.companyName
                            )} text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0`}
                          >
                            {job.companyName.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{job.companyName}</span>
                        </div>
                      </td>

                      {/* Job Title & Link */}
                      <td className="py-3 px-3 text-slate-200 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{job.jobTitle}</span>
                          {job.jobLink && (
                            <a
                              href={job.jobLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Open original job posting"
                              className="text-slate-500 hover:text-indigo-400 transition-colors flex-shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Interactive Status Dropdown */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <select
                            value={job.status}
                            onChange={(e) =>
                              onUpdateJobStatus(job.id, e.target.value as JobStatus)
                            }
                            className={`appearance-none text-xs font-semibold py-1 pl-2.5 pr-6 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            {ALL_STATUSES.map((st) => (
                              <option
                                key={st}
                                value={st}
                                className="bg-[#16161A] text-slate-200 py-1"
                              >
                                {st}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* Date Applied */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {job.dateApplied ? formatDate(job.dateApplied) : '-'}
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {job.deadline ? (
                          <span className="font-medium text-slate-300">{formatDate(job.deadline)}</span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Type of Job */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/5 text-slate-300 border border-white/5">
                          {job.jobType}
                        </span>
                      </td>

                      {/* Salary (Annual) */}
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                        {job.salary && job.salary !== 'N/A' ? (
                          <span className="text-emerald-400">
                            {job.salary}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">N/A</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span>{job.location}</span>
                        </div>
                      </td>

                      {/* Contact Email/LinkedIn */}
                      <td className="py-3 px-3 text-slate-400" onClick={(e) => e.stopPropagation()}>
                        {job.contactEmailOrLinkedIn ? (
                          <div className="flex items-center gap-1.5 max-w-[180px]">
                            {job.contactEmailOrLinkedIn.startsWith('http') ? (
                              <a
                                href={job.contactEmailOrLinkedIn}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:underline truncate inline-flex items-center gap-1 text-[11px]"
                              >
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">LinkedIn</span>
                              </a>
                            ) : (
                              <a
                                href={`mailto:${job.contactEmailOrLinkedIn}`}
                                className="text-indigo-400 hover:underline truncate inline-flex items-center gap-1 text-[11px]"
                              >
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{job.contactEmailOrLinkedIn}</span>
                              </a>
                            )}
                            <button
                              onClick={(e) =>
                                copyToClipboard(
                                  job.contactEmailOrLinkedIn!,
                                  `contact-${job.id}`,
                                  e
                                )
                              }
                              title="Copy contact"
                              className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                            >
                              {copiedId === `contact-${job.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Interview Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {job.interviewDate ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold text-[11px]">
                            {formatDate(job.interviewDate)}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Tag / Notes */}
                      <td className="py-3 px-3 text-slate-400 max-w-[160px]">
                        <div className="flex flex-col gap-0.5">
                          {job.tag && (
                            <span className="self-start px-1.5 py-0.2 text-[10px] font-semibold rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              #{job.tag}
                            </span>
                          )}
                          {job.notes && (
                            <span className="text-[11px] text-slate-400 truncate" title={job.notes}>
                              {job.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenAIPrep(job)}
                            title="AI Prep & Follow Up"
                            className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditJob(job)}
                            title="Edit Job"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete application for ${job.companyName}?`)) {
                                onDeleteJob(job.id);
                              }
                            }}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
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

        {/* Table footer with counts */}
        <div className="p-3 bg-[#0D0D10] border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {jobs.length} applications</span>
          <span className="text-slate-500">Click any row to open full details & AI prep</span>
        </div>
      </div>
    </div>
  );
};
