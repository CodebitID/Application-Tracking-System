import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Building,
  Briefcase,
  ExternalLink,
  DollarSign,
  MapPin,
  Calendar,
  Clock,
  Mail,
  User,
  Users,
  Phone,
  Tag,
  Copy,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  MessageSquare,
  FileText,
  TrendingUp,
  Loader2,
  Bell,
  Plus,
  History,
  CheckCircle2,
  AlertCircle,
  CalendarPlus,
  Send,
  Globe,
  Link as LinkIcon,
  Wand2,
  CheckSquare,
} from 'lucide-react';
import {
  JobApplication,
  JobStatus,
  StatusHistoryEntry,
  ApplicationReminder,
  ApplicationContact,
  PrepChecklistItem,
  CoverLetterRecord,
  UserAccount,
} from '../types';
import {
  ALL_STATUSES,
  STATUS_CONFIG,
  formatDate,
  formatDateTime,
  getDaysRemaining,
  getCompanyColor,
} from '../utils/formatters';
import { extractDomainAndPlatform } from '../utils/domainHelper';
import { CoverLetterModal } from './CoverLetterModal';
import { InterviewChecklist } from './InterviewChecklist';

interface JobDetailDrawerProps {
  job: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (job: JobApplication) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: JobStatus, note?: string) => void;
  onAddTimelineEntry?: (jobId: string, entry: StatusHistoryEntry) => void;
  onAddReminder?: (
    jobId: string,
    reminder: Omit<ApplicationReminder, 'id' | 'jobId' | 'createdAt'>
  ) => void;
  onToggleReminder?: (jobId: string, reminderId: string) => void;
  onDeleteReminder?: (jobId: string, reminderId: string) => void;
  onAddContact?: (
    jobId: string,
    contact: Omit<ApplicationContact, 'id' | 'createdAt'>
  ) => void;
  onUpdateContact?: (jobId: string, contact: ApplicationContact) => void;
  onDeleteContact?: (jobId: string, contactId: string) => void;
  currentAccount?: UserAccount;
  onUpdateChecklist?: (jobId: string, checklist: PrepChecklistItem[]) => void;
  onSaveCoverLetter?: (jobId: string, record: CoverLetterRecord) => void;
  onAppendToJobNotes?: (jobId: string, text: string) => void;
}

export const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({
  job,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onAddTimelineEntry,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  currentAccount,
  onUpdateChecklist,
  onSaveCoverLetter,
  onAppendToJobNotes,
}) => {
  const [activeAITab, setActiveAITab] = useState<
    'followup' | 'interview_prep' | 'salary_negotiation'
  >('followup');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cover Letter Modal State
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);

  // Timeline entry creation state
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [timelineStatus, setTimelineStatus] = useState<JobStatus>('Applied');
  const [timelineNote, setTimelineNote] = useState('');

  // Reminder creation state
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderNote, setReminderNote] = useState('');

  // Contacts sub-section state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Recruiter');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLinkedIn, setContactLinkedIn] = useState('');
  const [contactNotes, setContactNotes] = useState('');

  if (!isOpen || !job) return null;

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG['Applied'];
  const deadlineInfo = getDaysRemaining(job.deadline);
  const interviewInfo = getDaysRemaining(job.interviewDate);

  // Extract domain & platform badge for the job link
  const platformInfo = extractDomainAndPlatform(job.jobLink);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStatusChange = (newStatus: JobStatus) => {
    onUpdateStatus(job.id, newStatus, `Status updated to ${newStatus}`);
    if (newStatus === 'Offer Extended') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleAddTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineNote.trim()) return;

    const newEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      status: timelineStatus,
      timestamp: new Date().toISOString(),
      note: timelineNote.trim(),
      source: 'user',
    };

    if (onAddTimelineEntry) {
      onAddTimelineEntry(job.id, newEntry);
    }
    setTimelineNote('');
    setIsAddingTimeline(false);
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderDate) return;

    const fullDateTime = `${reminderDate}T${reminderTime || '09:00'}`;
    if (onAddReminder) {
      onAddReminder(job.id, {
        dateTime: fullDateTime,
        note: reminderNote.trim() || `Follow up with ${job.companyName}`,
        isCompleted: false,
      });
    }

    setReminderDate('');
    setReminderTime('09:00');
    setReminderNote('');
    setIsAddingReminder(false);
  };

  const setQuickReminderPreset = (daysFromNow: number, timeStr: string, noteText: string) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const datePart = target.toISOString().split('T')[0];
    setReminderDate(datePart);
    setReminderTime(timeStr);
    setReminderNote(noteText);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;

    if (editingContactId && onUpdateContact) {
      onUpdateContact(job.id, {
        id: editingContactId,
        name: contactName.trim(),
        role: contactRole.trim() || undefined,
        email: contactEmail.trim() || undefined,
        phone: contactPhone.trim() || undefined,
        linkedInOrUrl: contactLinkedIn.trim() || undefined,
        notes: contactNotes.trim() || undefined,
      });
    } else if (onAddContact) {
      onAddContact(job.id, {
        name: contactName.trim(),
        role: contactRole.trim() || undefined,
        email: contactEmail.trim() || undefined,
        phone: contactPhone.trim() || undefined,
        linkedInOrUrl: contactLinkedIn.trim() || undefined,
        notes: contactNotes.trim() || undefined,
      });
    }

    resetContactForm();
  };

  const startEditContact = (c: ApplicationContact) => {
    setEditingContactId(c.id);
    setContactName(c.name);
    setContactRole(c.role || 'Recruiter');
    setContactEmail(c.email || '');
    setContactPhone(c.phone || '');
    setContactLinkedIn(c.linkedInOrUrl || '');
    setContactNotes(c.notes || '');
    setIsAddingContact(true);
  };

  const resetContactForm = () => {
    setIsAddingContact(false);
    setEditingContactId(null);
    setContactName('');
    setContactRole('Recruiter');
    setContactEmail('');
    setContactPhone('');
    setContactLinkedIn('');
    setContactNotes('');
  };

  const generateAIAssist = async (
    action: 'followup' | 'interview_prep' | 'salary_negotiation'
  ) => {
    setActiveAITab(action);
    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, job }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate AI assist');
      }

      const data = await res.json();
      setAiResult(data.result || 'No output received.');
    } catch (err: any) {
      console.error(err);
      setAiResult(
        `Recommendation for ${job.companyName} (${job.jobTitle}):\n\n` +
          `• Reiterate enthusiasm for the ${job.jobTitle} position.\n` +
          `• Highlight strong technical alignment and quantifiable impact.\n` +
          `• Primary Contact: ${job.contactEmailOrLinkedIn || 'Hiring Manager'}\n` +
          `• Target compensation range: ${job.salary || 'Competitive market rate'}.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  // Build timeline history
  const historyEntries: StatusHistoryEntry[] =
    job.statusHistory && job.statusHistory.length > 0
      ? [...job.statusHistory].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      : [
          {
            id: 'default-entry-1',
            status: job.status,
            timestamp: job.updatedAt || job.createdAt || new Date().toISOString(),
            note: `Initial status recorded as ${job.status}`,
          },
          ...(job.dateApplied
            ? [
                {
                  id: 'default-entry-0',
                  status: 'Applied' as JobStatus,
                  timestamp: `${job.dateApplied}T10:00:00.000Z`,
                  note: 'Application submitted',
                },
              ]
            : []),
        ];

  const reminders = job.reminders || [];
  const contacts = job.contacts || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#0D0D10] h-full shadow-2xl border-l border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-6 border-b border-white/5 bg-[#0F0F12] flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getCompanyColor(
                job.companyName
              )} text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-md`}
            >
              {job.companyName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-white truncate">
                  {job.companyName}
                </h2>

                {/* SOURCE PLATFORM BADGE */}
                {platformInfo && (
                  <span
                    id="job-source-platform-badge"
                    title={`Source: ${platformInfo.platformName} (${platformInfo.domain})`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${platformInfo.badgeStyle.bg} ${platformInfo.badgeStyle.text} border ${platformInfo.badgeStyle.border}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${platformInfo.badgeStyle.dot}`}
                    />
                    <span>{platformInfo.platformName}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({platformInfo.domain})
                    </span>
                  </span>
                )}

                {job.jobLink && (
                  <a
                    href={job.jobLink}
                    target="_blank"
                    rel="noreferrer"
                    title="Open original job posting"
                    className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-sm font-medium text-slate-400 mt-0.5">
                {job.jobTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* AI Cover Letter Generator Trigger */}
            <button
              id="open-ai-cover-letter-btn"
              onClick={() => setIsCoverLetterModalOpen(true)}
              title="Generate AI Cover Letter with Gemini"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 transition-all font-semibold text-xs shadow-xs"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">AI Cover Letter</span>
            </button>

            <button
              onClick={() => onEdit(job)}
              title="Edit application details"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/10"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete the application for ${job.jobTitle} at ${job.companyName}?`
                  )
                ) {
                  onDelete(job.id);
                }
              }}
              title="Delete application"
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Current Status Banner & Selector */}
          <div className="p-4 rounded-2xl bg-[#121215] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Application Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                {job.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {ALL_STATUSES.map((st) => {
                const conf = STATUS_CONFIG[st];
                const isCurrent = job.status === st;

                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                      isCurrent
                        ? `${conf.bg} ${conf.text} ${conf.border} font-bold ring-1 ring-white/10 shadow-xs`
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{st}</span>
                    {isCurrent && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Application Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Salary */}
            <div className="p-3.5 rounded-xl bg-[#121215] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compensation</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">
                {job.salary || 'Not specified'}
              </p>
            </div>

            {/* Location */}
            <div className="p-3.5 rounded-xl bg-[#121215] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Location</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm font-semibold text-white truncate">
                  {job.location || 'Remote'}
                </span>
                {job.isRemote && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/20">
                    Remote
                  </span>
                )}
              </div>
            </div>

            {/* Job Type */}
            <div className="p-3.5 rounded-xl bg-[#121215] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Employment</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">
                {job.jobType || 'Full-Time'}
              </p>
            </div>

            {/* Applied Date */}
            <div className="p-3.5 rounded-xl bg-[#121215] border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Applied On</span>
              </div>
              <p className="text-sm font-medium text-slate-200">
                {job.dateApplied ? formatDate(job.dateApplied) : 'Not recorded'}
              </p>
            </div>

            {/* Interview Date */}
            <div
              className={`p-3.5 rounded-xl border space-y-1 ${
                interviewInfo?.isUpcoming
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-[#121215] border-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Interview</span>
                </div>
                {interviewInfo?.isUpcoming && (
                  <span className="text-[10px] font-bold text-purple-300">
                    {interviewInfo.text}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">
                {job.interviewDate ? formatDate(job.interviewDate) : 'None scheduled'}
              </p>
            </div>

            {/* Deadline */}
            <div
              className={`p-3.5 rounded-xl border space-y-1 ${
                deadlineInfo?.isUrgent
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-[#121215] border-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Deadline</span>
                </div>
                {deadlineInfo?.isUpcoming && (
                  <span
                    className={`text-[10px] font-bold ${
                      deadlineInfo.isUrgent ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {deadlineInfo.text}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">
                {job.deadline ? formatDate(job.deadline) : 'Rolling / Open'}
              </p>
            </div>
          </div>

          {/* INTERVIEW PREPARATION CHECKLIST FEATURE */}
          <InterviewChecklist
            job={job}
            onUpdateChecklist={onUpdateChecklist || (() => {})}
          />

          {/* KEY CONTACTS & INTERVIEWERS SUB-SECTION */}
          <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Key Contacts & Interviewers ({contacts.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recruiters, hiring managers, and referral contacts for this application
                  </p>
                </div>
              </div>

              <button
                id="add-contact-btn"
                onClick={() => {
                  if (isAddingContact) {
                    resetContactForm();
                  } else {
                    setIsAddingContact(true);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 rounded-lg border border-teal-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingContact ? 'Cancel' : 'Add Contact'}</span>
              </button>
            </div>

            {/* Add / Edit Contact Form */}
            {isAddingContact && (
              <form
                onSubmit={handleSaveContact}
                className="p-4 rounded-xl bg-[#0D0D10] border border-white/10 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <span className="text-xs font-semibold text-teal-300">
                    {editingContactId ? 'Edit Contact Info' : 'New Contact Entry'}
                  </span>
                  <button
                    type="button"
                    onClick={resetContactForm}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name <span className="text-teal-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Role / Position Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Technical Recruiter"
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    LinkedIn URL / Profile Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={contactLinkedIn}
                    onChange={(e) => setContactLinkedIn(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notes & Discussion Context
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Conducted 30-min screening, mentioned focus on distributed caching..."
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetContactForm}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    {editingContactId ? 'Save Contact Updates' : 'Add Contact'}
                  </button>
                </div>
              </form>
            )}

            {/* Contacts List */}
            {contacts.length === 0 ? (
              <div className="p-4 bg-[#0A0A0C]/60 rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-xs text-slate-500">
                  No interviewers or recruiting contacts added yet. Click "Add Contact" above to store recruiter emails, phone numbers, and interview notes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-[#0A0A0C] border border-white/5 hover:border-white/15 transition-all space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {c.name}
                          </h4>
                          <p className="text-[11px] text-teal-400 truncate">
                            {c.role || 'Recruiting Contact'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditContact(c)}
                          title="Edit contact"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() =>
                            onDeleteContact && onDeleteContact(job.id, c.id)
                          }
                          title="Delete contact"
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Email & Phone pills */}
                    <div className="space-y-1 text-[11px] text-slate-300">
                      {c.email && (
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/5">
                          <a
                            href={`mailto:${c.email}`}
                            className="flex items-center gap-1.5 text-slate-300 hover:text-white truncate"
                          >
                            <Mail className="w-3 h-3 text-teal-400 flex-shrink-0" />
                            <span className="truncate font-mono">{c.email}</span>
                          </a>
                          <button
                            onClick={() => copyText(c.email!, `email-${c.id}`)}
                            title="Copy email"
                            className="text-slate-400 hover:text-white flex-shrink-0"
                          >
                            {copiedKey === `email-${c.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {c.phone && (
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/5">
                          <a
                            href={`tel:${c.phone}`}
                            className="flex items-center gap-1.5 text-slate-300 hover:text-white truncate"
                          >
                            <Phone className="w-3 h-3 text-teal-400 flex-shrink-0" />
                            <span className="truncate font-mono">{c.phone}</span>
                          </a>
                          <button
                            onClick={() => copyText(c.phone!, `phone-${c.id}`)}
                            title="Copy phone"
                            className="text-slate-400 hover:text-white flex-shrink-0"
                          >
                            {copiedKey === `phone-${c.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {c.linkedInOrUrl && (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 truncate">
                          <Globe className="w-3 h-3 text-teal-400 flex-shrink-0" />
                          <a
                            href={c.linkedInOrUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-400 hover:text-teal-300 truncate underline text-[11px]"
                          >
                            {c.linkedInOrUrl.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>

                    {c.notes && (
                      <p className="text-[11px] text-slate-400 bg-white/5 p-2 rounded-lg leading-relaxed">
                        {c.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VISUAL APPLICATION TIMELINE SECTION */}
          <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Application Timeline ({historyEntries.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chronological audit log of status milestones and progress
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddingTimeline(!isAddingTimeline)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg border border-indigo-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingTimeline ? 'Cancel' : 'Add Milestone'}</span>
              </button>
            </div>

            {/* Add Timeline Entry Form */}
            {isAddingTimeline && (
              <form
                onSubmit={handleAddTimeline}
                className="p-3.5 rounded-xl bg-[#0D0D10] border border-white/10 space-y-3 animate-in fade-in"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Milestone Status
                    </label>
                    <select
                      value={timelineStatus}
                      onChange={(e) =>
                        setTimelineStatus(e.target.value as JobStatus)
                      }
                      className="w-full px-2.5 py-1.5 bg-[#16161A] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option
                          key={st}
                          value={st}
                          className="bg-[#16161A] text-slate-200"
                        >
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Event / Activity Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Completed technical loop"
                      value={timelineNote}
                      onChange={(e) => setTimelineNote(e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTimeline(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Save Milestone
                  </button>
                </div>
              </form>
            )}

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
              {historyEntries.map((entry, index) => {
                const config =
                  STATUS_CONFIG[entry.status] || STATUS_CONFIG['Applied'];
                const isLatest = index === 0;

                return (
                  <div key={entry.id || index} className="relative group">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-[#16161A] ${
                        isLatest
                          ? `${config.dot} ring-2 ring-indigo-500/50`
                          : config.dot
                      }`}
                    />

                    {/* Timeline Card */}
                    <div className="p-3 rounded-xl bg-[#0A0A0C] border border-white/5 hover:border-white/15 transition-all space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${config.bg} ${config.text} border ${config.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                          />
                          {entry.status}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      </div>

                      {entry.note && (
                        <p className="text-xs text-slate-300 leading-relaxed pl-0.5">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* APPLICATION REMINDERS SECTION */}
          <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Application Reminders ({reminders.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Schedule follow-up alerts and preparation notifications
                  </p>
                </div>
              </div>

              <button
                id="add-reminder-btn"
                onClick={() => setIsAddingReminder(!isAddingReminder)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingReminder ? 'Cancel' : 'Set Reminder'}</span>
              </button>
            </div>

            {/* Add Reminder Form */}
            {isAddingReminder && (
              <form
                onSubmit={handleCreateReminder}
                className="p-4 rounded-xl bg-[#0D0D10] border border-white/10 space-y-3 animate-in fade-in"
              >
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <span className="text-[11px] text-slate-400 self-center mr-1">
                    Quick:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickReminderPreset(
                        1,
                        '09:00',
                        `Follow up with ${job.companyName} recruiting team`
                      )
                    }
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10"
                  >
                    Tomorrow 9 AM
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickReminderPreset(
                        3,
                        '10:00',
                        `Check status on ${job.jobTitle} application`
                      )
                    }
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickReminderPreset(
                        7,
                        '11:00',
                        `Send check-in email to hiring team`
                      )
                    }
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/10"
                  >
                    In 1 Week
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reminder Date <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Context / Reminder Note
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Send thank-you note to hiring manager, check portal for assessment link..."
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingReminder(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            )}

            {/* Reminders List */}
            {reminders.length === 0 ? (
              <div className="p-4 bg-[#0A0A0C]/60 rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-xs text-slate-500">
                  No reminders set for this job application. Click "Set Reminder" above to schedule an alert.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reminders.map((rem) => {
                  const isDueSoon = getDaysRemaining(rem.dateTime)?.isWithin24Hours;

                  return (
                    <div
                      key={rem.id}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        rem.isCompleted
                          ? 'bg-[#0A0A0C]/40 border-white/5 opacity-60'
                          : isDueSoon
                          ? 'bg-amber-500/10 border-amber-500/30 shadow-xs'
                          : 'bg-[#0A0A0C] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          onClick={() =>
                            onToggleReminder && onToggleReminder(job.id, rem.id)
                          }
                          className={`mt-0.5 p-0.5 rounded border transition-colors ${
                            rem.isCompleted
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-white/20 hover:border-white/40 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-mono font-medium ${
                                rem.isCompleted
                                  ? 'line-through text-slate-500'
                                  : 'text-amber-300'
                              }`}
                            >
                              {formatDateTime(rem.dateTime)}
                            </span>
                            {isDueSoon && !rem.isCompleted && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Due Soon
                              </span>
                            )}
                          </div>

                          <p
                            className={`text-xs mt-0.5 leading-relaxed ${
                              rem.isCompleted
                                ? 'line-through text-slate-500'
                                : 'text-slate-200'
                            }`}
                          >
                            {rem.note}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onDeleteReminder && onDeleteReminder(job.id, rem.id)
                        }
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes Section */}
          {job.notes && (
            <div className="p-4 rounded-2xl bg-[#121215] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Notes & Context
                </span>
                <button
                  onClick={() => copyText(job.notes || '', 'notes')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedKey === 'notes' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {job.notes}
              </p>
            </div>
          )}

          {/* GEMINI AI CAREER ASSISTANT SECTION */}
          <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    AI Career Assistant
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generate tailored preparation materials powered by Gemini
                  </p>
                </div>
              </div>
            </div>

            {/* AI Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => generateAIAssist('followup')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeAITab === 'followup'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Follow-up Email Draft
              </button>

              <button
                onClick={() => generateAIAssist('interview_prep')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeAITab === 'interview_prep'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Interview Prep Dossier
              </button>

              <button
                onClick={() => generateAIAssist('salary_negotiation')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeAITab === 'salary_negotiation'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Salary Strategy
              </button>

              <button
                onClick={() => setIsCoverLetterModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all ml-auto"
              >
                <Wand2 className="w-3.5 h-3.5" />
                AI Cover Letter Studio
              </button>
            </div>

            {/* AI Output Area */}
            {aiLoading ? (
              <div className="p-8 text-center bg-[#0A0A0C] rounded-xl border border-indigo-500/20">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                <p className="text-xs font-medium text-slate-300">
                  Generating custom intelligence for {job.jobTitle} at{' '}
                  {job.companyName}...
                </p>
              </div>
            ) : aiResult ? (
              <div className="relative p-4 bg-[#0A0A0C] rounded-xl border border-white/10 shadow-xs">
                <button
                  onClick={() => copyText(aiResult, 'ai-result')}
                  className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 text-xs"
                >
                  {copiedKey === 'ai-result' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed pr-14 font-mono">
                  {aiResult}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#0A0A0C]/50 rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-xs text-slate-500">
                  Click any button above to generate a follow-up email, interview dossier, or negotiation script for {job.companyName}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Cover Letter Generator Modal */}
      <CoverLetterModal
        isOpen={isCoverLetterModalOpen}
        onClose={() => setIsCoverLetterModalOpen(false)}
        job={job}
        currentAccount={currentAccount}
        onSaveCoverLetter={onSaveCoverLetter}
        onAppendToJobNotes={onAppendToJobNotes}
      />
    </div>
  );
};
