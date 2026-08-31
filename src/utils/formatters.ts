import { JobStatus, JobType } from '../types';

export const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; bg: string; text: string; border: string; dot: string; lightBg: string }
> = {
  'Not Started': {
    label: 'Not Started',
    bg: 'bg-white/5',
    text: 'text-slate-400',
    border: 'border-white/10',
    dot: 'bg-slate-500',
    lightBg: 'bg-white/[0.02]',
  },
  'Preparing': {
    label: 'Preparing',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
    lightBg: 'bg-blue-500/5',
  },
  'Applied': {
    label: 'Applied',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-500',
    lightBg: 'bg-indigo-500/5',
  },
  'Screening': {
    label: 'Screening',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-500',
    lightBg: 'bg-cyan-500/5',
  },
  'Interviewing': {
    label: 'Interviewing',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    lightBg: 'bg-amber-500/5',
  },
  'Offer Extended': {
    label: 'Offer Extended',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    lightBg: 'bg-emerald-500/5',
  },
  'Rejected': {
    label: 'Rejected',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
    lightBg: 'bg-rose-500/5',
  },
  'Withdrawn': {
    label: 'Withdrawn',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/30',
    dot: 'bg-zinc-400',
    lightBg: 'bg-zinc-500/5',
  },
  // Backward compatibility mappings
  'Interview Scheduled': {
    label: 'Interviewing',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    lightBg: 'bg-amber-500/5',
  },
  'Interviewed': {
    label: 'Interviewing',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    dot: 'bg-purple-500',
    lightBg: 'bg-purple-500/5',
  },
  'Offer Received': {
    label: 'Offer Extended',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    lightBg: 'bg-emerald-500/5',
  },
  'No Reply': {
    label: 'Applied',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    lightBg: 'bg-orange-500/5',
  },
};

export const JOB_TYPES: JobType[] = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Freelance',
  'Internship',
  'Temporary',
  'Other',
];

export const ALL_STATUSES: JobStatus[] = [
  'Not Started',
  'Applied',
  'Screening',
  'Interviewing',
  'Offer Extended',
  'Rejected',
  'Withdrawn',
];

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return dateString;
    }
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateTimeString?: string): string {
  if (!dateTimeString) return '-';
  try {
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateTimeString;
  }
}

export interface DaysRemainingResult {
  days: number;
  label: string;
  text: string;
  isPast: boolean;
  isUpcoming: boolean;
  isUrgent: boolean;
  isWithin24Hours: boolean;
}

export function getDaysRemaining(dateString?: string): DaysRemainingResult | null {
  if (!dateString) return null;
  try {
    const target = new Date(dateString);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    
    // Difference in milliseconds
    const diffMs = target.getTime() - now.getTime();
    const isWithin24Hours = diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;

    // Normalize both to start of day for day count
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((targetDay - nowDay) / (1000 * 60 * 60 * 24));

    const isPast = diffDays < 0;
    const isUpcoming = diffDays >= 0;
    const isUrgent = diffDays >= 0 && diffDays <= 2;

    let label = '';
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Tomorrow';
    else if (diffDays === -1) label = 'Yesterday';
    else if (diffDays > 0) label = `In ${diffDays}d`;
    else label = `${Math.abs(diffDays)}d ago`;

    return {
      days: diffDays,
      label,
      text: label,
      isPast,
      isUpcoming,
      isUrgent,
      isWithin24Hours,
    };
  } catch {
    return null;
  }
}

export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCompanyColor(companyName: string): string {
  const colors = [
    'from-emerald-500 to-teal-700',
    'from-blue-500 to-indigo-700',
    'from-purple-500 to-violet-700',
    'from-amber-500 to-orange-700',
    'from-rose-500 to-pink-700',
    'from-cyan-500 to-blue-700',
  ];
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
