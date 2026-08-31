export type JobType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Freelance' | 'Internship' | 'Temporary' | 'Other';

export type JobStatus = 
  | 'Not Started'
  | 'Applied'
  | 'Screening'
  | 'Interviewing'
  | 'Offer Extended'
  | 'Rejected'
  | 'Withdrawn'
  | 'Interview Scheduled'
  | 'Interviewed'
  | 'Offer Received'
  | 'No Reply';

export interface StatusHistoryEntry {
  id: string;
  status?: JobStatus;
  fromStatus?: JobStatus | null;
  toStatus?: JobStatus;
  timestamp?: string; // ISO string
  date?: string;
  note?: string;
  notes?: string;
  source?: 'user' | 'system';
}

export interface ApplicationReminder {
  id: string;
  jobId: string;
  dateTime: string; // ISO string or YYYY-MM-DDTHH:mm
  note: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface ApplicationContact {
  id: string;
  name: string;
  role?: string; // e.g. "Recruiter", "Hiring Manager", "Interviewer", "Referral", "Team Lead"
  email?: string;
  phone?: string;
  linkedInOrUrl?: string;
  notes?: string;
  createdAt?: string;
}

export interface PrepChecklistItem {
  id: string;
  task: string;
  category?: 'Research' | 'STAR Stories' | 'Questions' | 'Technical' | 'Logistics' | 'Custom';
  isCompleted: boolean;
  isCustom?: boolean;
}

export interface CoverLetterRecord {
  id: string;
  title: string;
  body: string;
  tone?: string;
  userHighlights?: string;
  createdAt: string;
}

export type UserRole = 'candidate' | 'superadmin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role?: UserRole; // 'candidate' | 'superadmin' (defaults to 'candidate')
  password?: string; // For authentication system
  avatarColor: string; // Gradient class e.g. "from-indigo-500 to-purple-600"
  targetRole: string;
  targetLocation?: string;
  phone?: string;
  resumeHighlights?: string; // Background highlights used for AI Cover Letter generation
  createdAt: string;
  isDefault?: boolean;
  bio?: string;
  lastLoginAt?: string;
}

export interface JobApplication {
  id: string;
  accountId?: string; // Owner account ID
  accountName?: string; // Owner account display name (for Superadmin aggregated view)
  companyName: string;
  jobTitle: string;
  jobLink?: string;
  jobLinkDomain?: string; // Clean extracted domain, e.g. "linkedin.com", "greenhouse.io"
  sourcePlatform?: string; // Friendly platform name, e.g. "LinkedIn", "Greenhouse", "Lever"
  dateApplied?: string; // ISO or YYYY-MM-DD
  deadline?: string;
  jobType: JobType;
  salary: string; // e.g. "$88,000" or "N/A"
  salaryNumeric?: number; // parsed annual number, e.g. 88000
  contactEmailOrLinkedIn?: string;
  location: string; // e.g. "Remote", "Chicago, IL"
  isRemote?: boolean;
  status: JobStatus;
  interviewDate?: string;
  notes?: string;
  tag?: string; // e.g. "Follow up", "Priority"
  statusHistory?: StatusHistoryEntry[];
  reminders?: ApplicationReminder[];
  contacts?: ApplicationContact[];
  prepChecklist?: PrepChecklistItem[];
  coverLetters?: CoverLetterRecord[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'board' | 'table' | 'analytics' | 'calendar';

export interface FilterState {
  search: string; // keyword search across company, title, notes, etc.
  locationSearch: string; // specific city, state, or location query
  statuses: JobStatus[];
  jobTypes: JobType[];
  locationFilter: 'all' | 'remote' | 'onsite';
  tagFilter: string;
  salaryMin?: number;
  salaryMax?: number;
  sortBy: 'dateApplied' | 'deadline' | 'company' | 'salary' | 'status' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}
