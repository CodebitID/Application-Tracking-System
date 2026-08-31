import React, { useState, useEffect } from 'react';
import { X, Building, Briefcase, Link as LinkIcon, DollarSign, Calendar, MapPin, Mail, Tag, AlignLeft, Sparkles, Globe, Compass, CheckCircle2 } from 'lucide-react';
import { JobApplication, JobStatus, JobType } from '../types';
import { ALL_STATUSES, JOB_TYPES } from '../utils/formatters';
import { parseSalaryToNumeric } from '../data/initialJobs';
import { extractDomainAndPlatform, detectSourcePlatformFromUrl } from '../utils/domainHelper';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: JobApplication) => void;
  jobToEdit?: JobApplication | null;
  defaultStatus?: JobStatus;
}

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  onClose,
  onSave,
  jobToEdit,
  defaultStatus = 'Applied',
}) => {
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [status, setStatus] = useState<JobStatus>(defaultStatus);
  const [dateApplied, setDateApplied] = useState('');
  const [deadline, setDeadline] = useState('');
  const [jobType, setJobType] = useState<JobType>('Full-Time');
  const [salary, setSalary] = useState('');
  const [contactEmailOrLinkedIn, setContactEmailOrLinkedIn] = useState('');
  const [location, setLocation] = useState('Remote');
  const [interviewDate, setInterviewDate] = useState('');
  const [notes, setNotes] = useState('');
  const [tag, setTag] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (jobToEdit) {
      setCompanyName(jobToEdit.companyName || '');
      setJobTitle(jobToEdit.jobTitle || '');
      setJobLink(jobToEdit.jobLink || '');
      setSourcePlatform(jobToEdit.sourcePlatform || '');
      setIsAutoDetected(false);
      setStatus(jobToEdit.status || defaultStatus);
      setDateApplied(jobToEdit.dateApplied || '');
      setDeadline(jobToEdit.deadline || '');
      setJobType(jobToEdit.jobType || 'Full-Time');
      setSalary(jobToEdit.salary || '');
      setContactEmailOrLinkedIn(jobToEdit.contactEmailOrLinkedIn || '');
      setLocation(jobToEdit.location || 'Remote');
      setInterviewDate(jobToEdit.interviewDate || '');
      setNotes(jobToEdit.notes || '');
      setTag(jobToEdit.tag || '');
    } else {
      // Reset form
      setCompanyName('');
      setJobTitle('');
      setJobLink('');
      setSourcePlatform('');
      setIsAutoDetected(false);
      setStatus(defaultStatus);
      setDateApplied(new Date().toISOString().split('T')[0]);
      setDeadline('');
      setJobType('Full-Time');
      setSalary('');
      setContactEmailOrLinkedIn('');
      setLocation('Remote');
      setInterviewDate('');
      setNotes('');
      setTag('');
    }
    setErrors({});
  }, [jobToEdit, defaultStatus, isOpen]);

  // Handle URL changes with automatic source platform detection & pre-population
  const handleJobLinkChange = (urlValue: string) => {
    setJobLink(urlValue);
    if (!urlValue.trim()) {
      if (isAutoDetected) {
        setSourcePlatform('');
        setIsAutoDetected(false);
      }
      return;
    }

    const detected = detectSourcePlatformFromUrl(urlValue);
    if (detected) {
      setSourcePlatform(detected);
      setIsAutoDetected(true);
    }
  };

  const handleJobLinkPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      const detected = detectSourcePlatformFromUrl(pastedText);
      if (detected) {
        setSourcePlatform(detected);
        setIsAutoDetected(true);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let cleanSalary = salary.trim();
    if (cleanSalary && !cleanSalary.startsWith('$') && cleanSalary.toUpperCase() !== 'N/A' && !isNaN(Number(cleanSalary))) {
      cleanSalary = `$${Number(cleanSalary).toLocaleString()}`;
    }

    // Manage status history
    let updatedHistory = jobToEdit?.statusHistory ? [...jobToEdit.statusHistory] : [];
    if (!jobToEdit) {
      updatedHistory = [
        {
          id: `hist-${Date.now()}`,
          status,
          toStatus: status,
          fromStatus: null,
          timestamp: new Date().toISOString(),
          note: `Application created with status: ${status}`,
          source: 'user',
        },
      ];
    } else if (jobToEdit.status !== status) {
      updatedHistory.push({
        id: `hist-${Date.now()}`,
        status,
        toStatus: status,
        fromStatus: jobToEdit.status,
        timestamp: new Date().toISOString(),
        note: `Status changed from ${jobToEdit.status} to ${status}`,
        source: 'user',
      });
    }

    const platformInfo = extractDomainAndPlatform(jobLink);
    const finalSourcePlatform = sourcePlatform.trim() || platformInfo?.platformName || undefined;

    const jobData: JobApplication = {
      id: jobToEdit ? jobToEdit.id : `job-${Date.now()}`,
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      jobLink: jobLink.trim() || undefined,
      jobLinkDomain: platformInfo ? platformInfo.domain : undefined,
      sourcePlatform: finalSourcePlatform,
      status,
      dateApplied: dateApplied || undefined,
      deadline: deadline || undefined,
      jobType,
      salary: cleanSalary || 'N/A',
      salaryNumeric: parseSalaryToNumeric(cleanSalary),
      contactEmailOrLinkedIn: contactEmailOrLinkedIn.trim() || undefined,
      location: location.trim() || 'Remote',
      isRemote: location.toLowerCase().includes('remote'),
      interviewDate: interviewDate || undefined,
      notes: notes.trim() || undefined,
      tag: tag.trim() || undefined,
      statusHistory: updatedHistory,
      reminders: jobToEdit?.reminders || [],
      contacts: jobToEdit?.contacts || [],
      createdAt: jobToEdit ? jobToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(jobData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#16161A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0D0D10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {jobToEdit ? 'Edit Job Application' : 'Add New Application'}
              </h2>
              <p className="text-xs text-slate-500">
                {jobToEdit ? `Updating ${jobToEdit.companyName}` : 'Record a new position in your tracker'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Row 1: Company Name & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="job-company-input"
                  type="text"
                  placeholder="e.g. Starbucks, Google, Stripe"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (errors.companyName) setErrors({ ...errors, companyName: '' });
                  }}
                  className={`w-full pl-9 pr-3 py-2 bg-white/5 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
                    errors.companyName ? 'border-rose-500/80' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.companyName && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Job Title <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="job-title-input"
                  type="text"
                  placeholder="e.g. Marketing Manager, Software Engineer"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (errors.jobTitle) setErrors({ ...errors, jobTitle: '' });
                  }}
                  className={`w-full pl-9 pr-3 py-2 bg-white/5 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
                    errors.jobTitle ? 'border-rose-500/80' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.jobTitle && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.jobTitle}</p>
              )}
            </div>
          </div>

          {/* Row 2: Status & Job Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Application Status
              </label>
              <select
                id="job-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="w-full px-3 py-2 bg-[#16161A] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-[#16161A] text-slate-200">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Job Type
              </label>
              <select
                id="job-type-select"
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full px-3 py-2 bg-[#16161A] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              >
                {JOB_TYPES.map((jt) => (
                  <option key={jt} value={jt} className="bg-[#16161A] text-slate-200">
                    {jt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Salary & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Annual Salary / Comp
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. $88,000 or N/A"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Location
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setLocation('Remote')}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      location.toLowerCase() === 'remote'
                        ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Remote
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocation('Hybrid')}
                    className="text-[10px] text-slate-500 hover:text-slate-300 px-1"
                  >
                    Hybrid
                  </button>
                </div>
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Remote, San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Dates (Applied, Deadline, Interview) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date Applied
              </label>
              <input
                type="date"
                value={dateApplied}
                onChange={(e) => setDateApplied(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Interview Date
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Row 5: Job Link & Source Platform (with auto-detection) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Job Posting URL
                </label>
                {jobLink && (() => {
                  const detected = extractDomainAndPlatform(jobLink);
                  if (!detected) return null;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${detected.badgeStyle.bg} ${detected.badgeStyle.text} border ${detected.badgeStyle.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${detected.badgeStyle.dot}`} />
                      {detected.platformName}
                    </span>
                  );
                })()}
              </div>
              <div className="relative">
                <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="job-link-input"
                  type="url"
                  placeholder="Paste URL (e.g. LinkedIn, Indeed, Glassdoor, Greenhouse...)"
                  value={jobLink}
                  onChange={(e) => handleJobLinkChange(e.target.value)}
                  onPaste={handleJobLinkPaste}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Source Platform
                </label>
                {isAutoDetected && sourcePlatform && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Auto-detected
                  </span>
                )}
              </div>
              <div className="relative">
                <Compass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="job-source-platform-input"
                  type="text"
                  placeholder="e.g. LinkedIn, Indeed, Glassdoor, Referral"
                  value={sourcePlatform}
                  onChange={(e) => {
                    setSourcePlatform(e.target.value);
                    setIsAutoDetected(false);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>
              {/* Quick Platform Chips */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['LinkedIn', 'Indeed', 'Glassdoor', 'Greenhouse', 'Lever', 'Company Site'].map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => {
                      setSourcePlatform(plat);
                      setIsAutoDetected(false);
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                      sourcePlatform.toLowerCase() === plat.toLowerCase()
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold'
                        : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 6: Contact Email or LinkedIn */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contact Email or Recruiter LinkedIn
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="recruiter@company.com or https://linkedin.com/in/..."
                value={contactEmailOrLinkedIn}
                onChange={(e) => setContactEmailOrLinkedIn(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Row 7: Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tag / Category
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Follow up, Priority, Dream Company"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                />
              </div>
              <div className="flex gap-1 text-xs">
                {['Follow up', 'Priority', 'Hot Lead'].map((quickTag) => (
                  <button
                    key={quickTag}
                    type="button"
                    onClick={() => setTag(quickTag)}
                    className="px-2 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-medium border border-white/5"
                  >
                    +{quickTag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 8: Notes & Context */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Application Notes & Context
            </label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Key takeaways, referral contacts, interview questions, resume version used..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="job-modal-save-btn"
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl shadow-xs shadow-indigo-600/30 transition-all"
            >
              {jobToEdit ? 'Save Changes' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

