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
  sourcePlatform?: string; // Friendly platform name, e.g. "LinkedIn", "Greenhouse", "We Work Remotely"
  dateApplied?: string; // ISO or YYYY-MM-DD
  deadline?: string;
  jobType: JobType;
  salary: string; // e.g. "$88,000" or "$70,000 - $90,000 USD"
  salaryNumeric?: number; // parsed annual number, e.g. 88000
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  contactEmailOrLinkedIn?: string;
  location: string; // e.g. "Remote", "Worldwide", "Jakarta, Indonesia"
  isRemote?: boolean;
  status: JobStatus;
  interviewDate?: string;
  notes?: string;
  tag?: string; // e.g. "Follow up", "Priority", "HIGH PRIORITY"
  
  // REST API & Webhook Ingestion Metadata
  externalJobId?: string; // Unique external ID from job source
  sourceUniqueKey?: string; // Unique hash/key to prevent duplicate ingestion
  fitScore?: number; // 0 - 100 overall compatibility rating
  recommendation?: 'HIGH PRIORITY' | 'APPLY' | 'SELECTIVELY' | 'DO NOT APPLY' | string;
  technicalFit?: number; // 0 - 100
  experienceFit?: number; // 0 - 100
  locationFit?: number; // 0 - 100
  eligibility?: string; // e.g. "Remote from Indonesia", "Worldwide Allowed"
  mainRisk?: string; // e.g. "Requires 4-hour US timezone overlap"
  matchedSkills?: string[]; // e.g. ["WordPress", "PHP", "REST API", "WooCommerce"]
  missingSkills?: string[]; // e.g. ["GraphQL"]
  workAuthorization?: string;
  timezoneRequirement?: string;
  companyUrl?: string;
  jobDescription?: string;
  firstSeenAt?: string;
  postedAt?: string;

  statusHistory?: StatusHistoryEntry[];
  reminders?: ApplicationReminder[];
  contacts?: ApplicationContact[];
  prepChecklist?: PrepChecklistItem[];
  coverLetters?: CoverLetterRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  source?: string;
  companyName?: string;
  jobTitle?: string;
  status: 'success' | 'duplicate_skipped' | 'unauthorized' | 'validation_error';
  statusCode: number;
  message: string;
  jobId?: string;
  payloadSummary?: string;
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
