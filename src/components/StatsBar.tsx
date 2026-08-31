import React from 'react';
import { Briefcase, CalendarCheck2, Trophy, DollarSign, Clock, Users, CheckCircle2 } from 'lucide-react';
import { JobApplication, JobStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

interface StatsBarProps {
  jobs: JobApplication[];
  onSelectStatusFilter?: (status: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ jobs, onSelectStatusFilter }) => {
  const total = jobs.length;
  const appliedCount = jobs.filter((j) => j.status === 'Applied').length;
  const screeningCount = jobs.filter((j) => j.status === 'Screening').length;
  const interviewCount = jobs.filter(
    (j) => j.status === 'Interviewing' || j.status === 'Interview Scheduled' || j.status === 'Interviewed'
  ).length;
  const offersCount = jobs.filter(
    (j) => j.status === 'Offer Extended' || j.status === 'Offer Received'
  ).length;

  const validSalaries = jobs
    .map((j) => j.salaryNumeric)
    .filter((s): s is number => typeof s === 'number' && !isNaN(s) && s > 0);

  const avgSalary =
    validSalaries.length > 0
      ? Math.round(validSalaries.reduce((a, b) => a + b, 0) / validSalaries.length)
      : 0;

  const interviewRate =
    total > 0
      ? Math.round(
          ((interviewCount + offersCount) /
            Math.max(1, total - jobs.filter((j) => j.status === 'Not Started').length)) *
            100
        )
      : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 max-w-7xl mx-auto px-4 sm:px-8 pt-5">
      {/* Metric 1: Total Applications */}
      <div
        id="stat-card-total"
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('all')}
        className="cursor-pointer group p-4 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1.5">
          <span>Total Tracked</span>
          <Briefcase className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
        </div>
        <div className="text-2xl font-serif italic text-white tracking-tight">
          {total}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Across all stages
        </div>
        <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full w-full" />
        </div>
      </div>

      {/* Metric 2: Active Applied */}
      <div
        id="stat-card-applied"
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('Applied')}
        className="cursor-pointer group p-4 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1.5">
          <span className="text-indigo-400">Applied</span>
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="text-2xl font-serif italic text-white tracking-tight">
          {appliedCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Submissions active
        </div>
        <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full"
            style={{ width: `${total > 0 ? Math.max(8, Math.round((appliedCount / total) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Screening */}
      <div
        id="stat-card-screening"
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('Screening')}
        className="cursor-pointer group p-4 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1.5">
          <span className="text-cyan-400">Screening</span>
          <Users className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="text-2xl font-serif italic text-white tracking-tight">
          {screeningCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Recruiter calls
        </div>
        <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 rounded-full"
            style={{ width: `${total > 0 ? Math.max(8, Math.round((screeningCount / total) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* Metric 4: Interviewing */}
      <div
        id="stat-card-interviews"
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('Interviewing')}
        className="cursor-pointer group p-4 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1.5">
          <span className="text-amber-400">Interviewing</span>
          <CalendarCheck2 className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-2xl font-serif italic text-white tracking-tight">
          {interviewCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {interviewRate}% advancement
        </div>
        <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full"
            style={{ width: `${total > 0 ? Math.max(8, Math.round((interviewCount / total) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* Metric 5: Offers Extended */}
      <div
        id="stat-card-offers"
        onClick={() => onSelectStatusFilter && onSelectStatusFilter('Offer Extended')}
        className="cursor-pointer group p-4 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1.5">
          <span className="text-emerald-400">Offer Extended</span>
          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-2xl font-serif italic text-white tracking-tight">
          {offersCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Decision stage
        </div>
        <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: `${total > 0 ? Math.max(8, Math.round((offersCount / total) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* Metric 6: Average Salary */}
      <div
        id="stat-card-salary"
        className="p-4 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1.5">
          <span>Avg. Salary</span>
          <DollarSign className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="text-2xl font-serif italic text-white tracking-tight">
          {avgSalary > 0 ? formatCurrency(avgSalary) : 'N/A'}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {validSalaries.length} listed roles
        </div>
        <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-400 rounded-full"
            style={{ width: `${Math.min(100, Math.round((avgSalary / 200000) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
