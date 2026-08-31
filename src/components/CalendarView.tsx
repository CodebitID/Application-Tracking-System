import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  Mail,
  User,
  Bell,
  Check,
} from 'lucide-react';
import { JobApplication, ApplicationReminder } from '../types';
import {
  formatDate,
  formatShortDate,
  formatDateTime,
  getDaysRemaining,
  getCompanyColor,
} from '../utils/formatters';

interface CalendarViewProps {
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
  onOpenAIPrep: (job: JobApplication) => void;
  onToggleReminder?: (jobId: string, reminderId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  jobs,
  onSelectJob,
  onOpenAIPrep,
  onToggleReminder,
}) => {
  // Jobs with scheduled interviews
  const interviewJobs = jobs
    .filter((j) => Boolean(j.interviewDate))
    .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime());

  // Aggregate all application reminders across all jobs
  const allReminders: { reminder: ApplicationReminder; job: JobApplication }[] = [];
  jobs.forEach((job) => {
    if (job.reminders && Array.isArray(job.reminders)) {
      job.reminders.forEach((rem) => {
        allReminders.push({ reminder: rem, job });
      });
    }
  });

  allReminders.sort(
    (a, b) =>
      new Date(a.reminder.dateTime).getTime() - new Date(b.reminder.dateTime).getTime()
  );

  // Jobs with active deadlines
  const deadlineJobs = jobs
    .filter((j) => Boolean(j.deadline) && j.status !== 'Rejected' && j.status !== 'Withdrawn')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  const generateGoogleCalendarUrl = (title: string, details: string, dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '#';
      const formattedDate = d.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 8);
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title
      )}&details=${encodeURIComponent(details)}&dates=${formattedDate}/${formattedDate}`;
    } catch {
      return '#';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-8">
      {/* 1. Scheduled Interviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              Scheduled Interviews ({interviewJobs.length})
            </h2>
            <p className="text-xs text-slate-500">
              Upcoming screens, hiring manager chats, and technical panels
            </p>
          </div>
        </div>

        {interviewJobs.length === 0 ? (
          <div className="p-8 text-center bg-[#16161A] rounded-2xl border border-white/5">
            <CalendarIcon className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">
              No upcoming interviews scheduled yet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add interview dates on job cards or table view to track them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interviewJobs.map((job) => {
              const daysInfo = getDaysRemaining(job.interviewDate);
              const gcalUrl = generateGoogleCalendarUrl(
                `Interview with ${job.companyName} (${job.jobTitle})`,
                `Role: ${job.jobTitle}\nContact: ${job.contactEmailOrLinkedIn || 'N/A'}\nNotes: ${job.notes || ''}`,
                job.interviewDate!
              );

              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className="p-5 rounded-2xl bg-[#16161A] border border-indigo-500/20 shadow-xs hover:shadow-md hover:border-indigo-500/40 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getCompanyColor(
                          job.companyName
                        )} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs`}
                      >
                        {job.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">
                          {job.companyName}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {job.jobTitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                        daysInfo?.isWithin24Hours
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}
                    >
                      {daysInfo ? daysInfo.label : formatShortDate(job.interviewDate)}
                    </span>
                  </div>

                  {/* Interview Date & Location */}
                  <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-indigo-300">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{formatDate(job.interviewDate)}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{job.location}</span>
                  </div>

                  {/* Notes if available */}
                  {job.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic bg-[#0D0D10] p-2 rounded-lg border border-white/5">
                      "{job.notes}"
                    </p>
                  )}

                  {/* Quick Action Footer */}
                  <div
                    className="flex items-center justify-between pt-2 border-t border-white/5 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:underline font-medium"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Add to Google Calendar</span>
                    </a>

                    <button
                      onClick={() => onOpenAIPrep(job)}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Prep</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Scheduled Application Reminders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Scheduled Reminders & Follow-Ups ({allReminders.length})
            </h2>
            <p className="text-xs text-slate-500">
              Timely alerts for thank-you notes, recruiter check-ins, and portal deadlines
            </p>
          </div>
        </div>

        {allReminders.length === 0 ? (
          <div className="p-8 text-center bg-[#16161A] rounded-2xl border border-white/5">
            <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">
              No application reminders scheduled
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Open any job application and click "Set Reminder" to schedule follow-up alerts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allReminders.map(({ reminder, job }) => {
              const daysInfo = getDaysRemaining(reminder.dateTime);

              return (
                <div
                  key={reminder.id}
                  onClick={() => onSelectJob(job)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    reminder.isCompleted
                      ? 'bg-[#16161A]/50 border-white/5 opacity-60'
                      : daysInfo?.isWithin24Hours
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-[#16161A] border-white/5 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getCompanyColor(
                          job.companyName
                        )} text-white font-bold text-xs flex items-center justify-center flex-shrink-0`}
                      >
                        {job.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">
                          {job.companyName}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {job.jobTitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap ${
                        reminder.isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : daysInfo?.isWithin24Hours
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/5'
                      }`}
                    >
                      {reminder.isCompleted ? 'Completed' : daysInfo?.label || 'Scheduled'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-medium bg-[#0D0D10] p-2 rounded-lg border border-white/5">
                    {reminder.note}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(reminder.dateTime)}</span>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          onToggleReminder && onToggleReminder(job.id, reminder.id)
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 ${
                          reminder.isCompleted
                            ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{reminder.isCompleted ? 'Done' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Application Deadlines */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Upcoming Application Deadlines ({deadlineJobs.length})
          </h2>
          <p className="text-xs text-slate-500">
            Keep track of application submission closing dates
          </p>
        </div>

        {deadlineJobs.length === 0 ? (
          <div className="p-8 text-center bg-[#16161A] rounded-2xl border border-white/5">
            <p className="text-sm text-slate-400">No closing deadlines recorded</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deadlineJobs.map((job) => {
              const daysInfo = getDaysRemaining(job.deadline);

              return (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className="p-4 rounded-2xl bg-[#16161A] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getCompanyColor(
                        job.companyName
                      )} text-white font-bold text-xs flex items-center justify-center flex-shrink-0`}
                    >
                      {job.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        {job.companyName}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        {job.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Due: {formatDate(job.deadline)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      daysInfo && daysInfo.days <= 3 && !daysInfo.isPast
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-white/5 text-slate-400 border border-white/5'
                    }`}
                  >
                    {daysInfo ? daysInfo.label : formatShortDate(job.deadline)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
