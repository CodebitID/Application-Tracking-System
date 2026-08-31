export type JobType = 'Full-Time' | 'Part-Time' | 'Contract' | 'Freelance' | 'Internship' | 'Temporary' | 'Other';

export type JobStatus = 
  | 'Not Started'
  | 'Preparing'
  | 'Applied'
  | 'Screening'
  | 'Interviewing'
  | 'Offer Received'
  | 'Rejected'
  | 'Withdrawn'
  | 'Offer Extended'
  | 'Interview Scheduled'
  | 'Interviewed'
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

export interface UserProfile {
  name: string;
  email: string;
  targetRole: string;
  targetLocation?: string;
  phone?: string;
  resumeHighlights?: string; // Background highlights used for AI Cover Letter generation
}

export type UserAccount = UserProfile;

/**
 * Job Analysis Data Model v2 - Nested Analysis Structure
 */
export interface JobAnalysisV2 {
  // Fit Assessment (0 - 100)
  overallFitScore?: number;
  fitScore?: number;
  technicalFit?: number;
  experienceFit?: number;
  industryFit?: number;
  seniorityFit?: number;
  locationEligibilityFit?: number;
  compensationFit?: number;
  locationFit?: number;
  suitabilityClassification?: string; // "STRONG FIT" | "GOOD FIT" | "SELECTIVE FIT" | "LOW FIT"
  eligibility?: string;

  // What They Actually Need
  criticalRequirements?: string[];
  preferredRequirements?: string[];
  roleResponsibilities?: string[];

  // Candidate Match Breakdown
  strongMatches?: string[];
  partialMatches?: string[];
  gaps?: string[];
  unknowns?: string[];

  // Important Notes, Blockers & Risks
  importantNotes?: string[];
  hardBlockers?: string[];
  applicationRisks?: string[];

  // Restrictions & Requirements
  workAuthorization?: string;
  countryRestrictions?: string;
  timezoneRequirement?: string;
  relocationExpectation?: string;
  languageRequirement?: string;
  degreeRequirement?: string;
  certificationRequirement?: string;

  // Strategy & Recommendation
  recommendation?: string; // "HIGH PRIORITY — APPLY" | "STRONG APPLY" | "APPLY" | "APPLY SELECTIVELY" | "LOW PRIORITY" | "SKIP" | "DO NOT APPLY"
  bestPositioning?: string;
  bestEvidence?: string[];
  mainRisk?: string;
  analysisSummary?: string;
  analyzedAt?: string;
}

/**
 * Job Analysis Data Model v2
 */
export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  normalizedCompany?: string;
  normalizedTitle?: string;
  jobLink?: string;
  normalizedSourceUrl?: string;
  jobLinkDomain?: string; // Clean extracted domain, e.g. "weworkremotely.com"
  sourcePlatform?: string; // e.g. "We Work Remotely", "RemoteOK", "LinkedIn"
  sourceUrl?: string;
  sourceUniqueKey?: string;
  externalJobId?: string;
  companyUrl?: string;
  location: string;
  isRemote: boolean;
  jobType: JobType;
  salary: string;
  salaryNumeric?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  status: JobStatus;
  notes?: string; // Strictly for user-authored notes
  tag?: string;

  // Snapshot details
  seniority?: string;
  industry?: string;

  // Nested Analysis Object (v2)
  analysis?: JobAnalysisV2;

  // Top-level conveniences / What They Actually Need
  criticalRequirements?: string[];
  preferredRequirements?: string[];
  roleResponsibilities?: string[];

  // My Match
  strongMatches?: string[];
  partialMatches?: string[];
  gaps?: string[];
  unknowns?: string[];

  // Important Notes & Restrictions
  importantNotes?: string[];
  hardBlockers?: string[];
  applicationRisks?: string[];
  workAuthorization?: string;
  countryRestrictions?: string;
  timezoneRequirement?: string;
  relocationExpectation?: string;
  languageRequirement?: string;
  degreeRequirement?: string;
  certificationRequirement?: string;

  // Fit Assessment (0 - 100)
  overallFitScore?: number;
  fitScore?: number; // legacy alias for overallFitScore
  technicalFit?: number;
  experienceFit?: number;
  industryFit?: number;
  seniorityFit?: number;
  locationEligibilityFit?: number;
  compensationFit?: number;
  locationFit?: number; // legacy alias for locationEligibilityFit
  suitabilityClassification?: string; // e.g. "STRONG FIT", "GOOD FIT", "SELECTIVE FIT", "LOW FIT"
  eligibility?: string;

  // Decision & Strategy
  recommendation?: string; // "HIGH PRIORITY — APPLY" | "HIGH PRIORITY" | "APPLY" | "APPLY SELECTIVELY" | "LOW PRIORITY" | "SKIP" | "DO NOT APPLY"
  bestPositioning?: string;
  bestEvidence?: string[];
  mainRisk?: string;
  analysisSummary?: string;
  jobDescription?: string;

  // Ingestion Source Metadata
  ingestionSource?: string; // e.g. "scheduled-job-monitor", "manual", "webhook", "chatgpt-bridge"
  analysisVersion?: string; // "v2"
  automaticallyDiscovered?: boolean;
  firstSeenAt?: string;
  lastSeenAt?: string;
  postedAt?: string;
  dateApplied?: string;
  deadline?: string;
  interviewDate?: string;
  contactEmailOrLinkedIn?: string;

  // Application Management sub-items
  contacts?: ApplicationContact[];
  reminders?: ApplicationReminder[];
  statusHistory?: StatusHistoryEntry[];
  interviewChecklist?: PrepChecklistItem[];
  savedCoverLetters?: CoverLetterRecord[];

  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  created_at?: string;
  timestamp?: string;
  method: string;
  endpoint: string;
  source?: string;
  companyName?: string;
  company_name?: string;
  jobTitle?: string;
  job_title?: string;
  status: string;
  statusCode?: number;
  status_code?: number;
  message: string;
  jobId?: string;
  job_id?: string;
  payloadSummary?: string;
  payload_summary?: string;
}

export type ViewMode = 'board' | 'table' | 'analytics' | 'calendar';

export interface FilterState {
  search: string;
  locationSearch: string;
  statuses: JobStatus[];
  jobTypes: JobType[];
  locationFilter: 'all' | 'remote' | 'onsite';
  tagFilter: string;
  salaryMin?: number;
  salaryMax?: number;
  sortBy: 'dateApplied' | 'deadline' | 'company' | 'salary' | 'status' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}
