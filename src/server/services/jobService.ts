import { db, DbJobRecord } from '../db';
import {
  checkJobDuplicate,
  normalizeCompanyName,
  normalizeJobTitle,
  normalizeJobUrl,
  normalizeSourcePlatform,
} from './duplicateService';
import { JobApplication, JobAnalysisV2, JobStatus, JobType } from '../../types';

/**
 * Sanitizes and bounds score values between 0 and 100.
 */
export function sanitizeScore(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  if (isNaN(num)) return null;
  return Math.min(100, Math.max(0, Math.round(num)));
}

/**
 * Sanitizes array fields ensuring clean string items.
 */
export function sanitizeStringArray(arr: any): string[] {
  if (!arr) return [];
  if (Array.isArray(arr)) {
    return arr.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof arr === 'string' && arr.trim()) {
    try {
      const parsed = JSON.parse(arr);
      if (Array.isArray(parsed)) return sanitizeStringArray(parsed);
    } catch {}
    return arr.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Maps raw string or input to standardized JobType.
 */
export function normalizeJobType(val?: string): JobType {
  if (!val) return 'Full-Time';
  const lower = val.toLowerCase();
  if (lower.includes('contract')) return 'Contract';
  if (lower.includes('part')) return 'Part-Time';
  if (lower.includes('free')) return 'Freelance';
  if (lower.includes('intern')) return 'Internship';
  if (lower.includes('temp')) return 'Temporary';
  return 'Full-Time';
}

/**
 * Standardizes application status.
 */
export function normalizeJobStatus(val?: string): JobStatus {
  if (!val) return 'Not Started';
  const lower = val.toLowerCase().trim();
  if (lower === 'applied') return 'Applied';
  if (lower === 'preparing') return 'Preparing';
  if (lower === 'screening') return 'Screening';
  if (lower.includes('interview')) return 'Interviewing';
  if (lower.includes('offer')) return 'Offer Received';
  if (lower.includes('reject')) return 'Rejected';
  if (lower.includes('withdrawn')) return 'Withdrawn';
  return 'Not Started';
}

/**
 * Converts a database record into a frontend JobApplication model supporting Job Analysis Data Model v2.
 */
export function dbRecordToJob(record: DbJobRecord): JobApplication {
  const parseJsonSafe = (str: string | null | undefined, fallback: any = []) => {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  const fitScore = record.overall_fit_score !== null && record.overall_fit_score !== undefined
    ? Number(record.overall_fit_score)
    : (record.fit_score !== null && record.fit_score !== undefined ? Number(record.fit_score) : undefined);

  const technicalFit = record.technical_fit !== null && record.technical_fit !== undefined ? Number(record.technical_fit) : undefined;
  const experienceFit = record.experience_fit !== null && record.experience_fit !== undefined ? Number(record.experience_fit) : undefined;
  const industryFit = record.industry_fit !== null && record.industry_fit !== undefined ? Number(record.industry_fit) : undefined;
  const seniorityFit = record.seniority_fit !== null && record.seniority_fit !== undefined ? Number(record.seniority_fit) : undefined;
  const locationEligibilityFit = record.location_eligibility_fit !== null && record.location_eligibility_fit !== undefined ? Number(record.location_eligibility_fit) : undefined;
  const compensationFit = record.compensation_fit !== null && record.compensation_fit !== undefined ? Number(record.compensation_fit) : undefined;
  const isRemote = Boolean(record.is_remote);

  const criticalRequirements = parseJsonSafe(record.critical_requirements);
  const preferredRequirements = parseJsonSafe(record.preferred_requirements);
  const roleResponsibilities = parseJsonSafe(record.role_responsibilities);
  const strongMatches = parseJsonSafe(record.strong_matches);
  const partialMatches = parseJsonSafe(record.partial_matches);
  const gaps = parseJsonSafe(record.gaps);
  const unknowns = parseJsonSafe(record.unknowns);
  const importantNotes = parseJsonSafe(record.important_notes);
  const hardBlockers = parseJsonSafe(record.hard_blockers);
  const applicationRisks = parseJsonSafe(record.application_risks);
  const bestEvidence = parseJsonSafe(record.best_evidence);

  const nestedAnalysis: JobAnalysisV2 = {
    overallFitScore: fitScore,
    fitScore: fitScore,
    technicalFit,
    experienceFit,
    industryFit,
    seniorityFit,
    locationEligibilityFit,
    compensationFit,
    locationFit: locationEligibilityFit,
    suitabilityClassification: record.suitability_classification || undefined,
    eligibility: record.eligibility || undefined,
    criticalRequirements,
    preferredRequirements,
    roleResponsibilities,
    strongMatches,
    partialMatches,
    gaps,
    unknowns,
    importantNotes,
    hardBlockers,
    applicationRisks,
    workAuthorization: record.work_authorization || undefined,
    countryRestrictions: record.country_restrictions || undefined,
    timezoneRequirement: record.timezone_requirement || undefined,
    relocationExpectation: record.relocation_expectation || undefined,
    languageRequirement: record.language_requirement || undefined,
    degreeRequirement: record.degree_requirement || undefined,
    certificationRequirement: record.certification_requirement || undefined,
    recommendation: record.recommendation || undefined,
    bestPositioning: record.best_positioning || undefined,
    bestEvidence,
    mainRisk: record.main_risk || undefined,
    analysisSummary: record.analysis_summary || undefined,
    analyzedAt: record.created_at,
  };

  return {
    id: record.id,
    companyName: record.company_name,
    jobTitle: record.job_title,
    normalizedCompany: record.normalized_company,
    normalizedTitle: record.normalized_title,
    jobLink: record.job_link || undefined,
    normalizedSourceUrl: record.normalized_source_url || undefined,
    jobLinkDomain: record.job_link_domain || undefined,
    sourcePlatform: record.source_platform,
    sourceUrl: record.job_link || undefined,
    sourceUniqueKey: record.source_unique_key || `${record.source_platform}::${record.external_job_id || record.id}`,
    externalJobId: record.external_job_id || undefined,
    companyUrl: record.company_url || undefined,
    location: record.location,
    isRemote,
    jobType: record.job_type as JobType,
    salary: record.salary || 'Competitive',
    salaryNumeric: record.salary_numeric !== null && record.salary_numeric !== undefined ? Number(record.salary_numeric) : undefined,
    salaryMin: record.salary_min !== null && record.salary_min !== undefined ? Number(record.salary_min) : undefined,
    salaryMax: record.salary_max !== null && record.salary_max !== undefined ? Number(record.salary_max) : undefined,
    currency: record.currency || 'USD',
    status: record.status as JobStatus,
    notes: record.notes || undefined,
    tag: record.tag || undefined,
    dateApplied: record.date_applied || undefined,
    deadline: record.deadline || undefined,
    postedAt: record.posted_at || undefined,
    interviewDate: record.interview_date || undefined,
    contactEmailOrLinkedIn: record.contact_email_or_linkedin || undefined,
    firstSeenAt: record.first_seen_at,
    lastSeenAt: record.last_seen_at,

    // Nested Analysis (v2)
    analysis: nestedAnalysis,

    // Top-level conveniences
    overallFitScore: fitScore,
    fitScore: fitScore,
    suitabilityClassification: record.suitability_classification || undefined,
    recommendation: record.recommendation || undefined,
    technicalFit,
    experienceFit,
    industryFit,
    seniorityFit,
    locationEligibilityFit,
    compensationFit,
    locationFit: locationEligibilityFit,
    eligibility: record.eligibility || undefined,

    // Lists
    criticalRequirements,
    preferredRequirements,
    roleResponsibilities,
    strongMatches,
    partialMatches,
    gaps,
    unknowns,
    importantNotes,
    hardBlockers,
    applicationRisks,

    // Restrictions
    workAuthorization: record.work_authorization || undefined,
    countryRestrictions: record.country_restrictions || undefined,
    timezoneRequirement: record.timezone_requirement || undefined,
    relocationExpectation: record.relocation_expectation || undefined,
    languageRequirement: record.language_requirement || undefined,
    degreeRequirement: record.degree_requirement || undefined,
    certificationRequirement: record.certification_requirement || undefined,

    // Strategy
    bestPositioning: record.best_positioning || undefined,
    bestEvidence,
    mainRisk: record.main_risk || undefined,
    analysisSummary: record.analysis_summary || undefined,
    jobDescription: record.job_description || undefined,

    // Metadata
    ingestionSource: record.ingestion_source || undefined,
    analysisVersion: record.analysis_version || 'v2',
    automaticallyDiscovered: Boolean(record.automatically_discovered),

    // Sub-collections
    contacts: parseJsonSafe(record.contacts_json),
    reminders: parseJsonSafe(record.reminders_json),
    statusHistory: parseJsonSafe(record.status_history_json),
    interviewChecklist: parseJsonSafe(record.prep_checklist_json),
    savedCoverLetters: parseJsonSafe(record.cover_letters_json),

    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export interface IngestionResult {
  success: boolean;
  duplicate: boolean;
  job_id: string;
  reason?: string;
  match_type?: string;
  message: string;
  job: JobApplication;
}

/**
 * Service to process and ingest incoming opportunity payloads with priority duplicate prevention.
 */
export async function ingestOrSaveJob(rawBody: any, ingestionSource: string = 'api'): Promise<IngestionResult> {
  const body = rawBody || {};

  // Extract core identifiers supporting both snake_case and camelCase
  const title = (body.title || body.job_title || body.jobTitle || body.role || '').trim();
  const company = (body.company || body.company_name || body.companyName || '').trim();

  if (!title || !company) {
    throw new Error('Validation error: both "title" and "company" are required.');
  }

  const source = body.source || body.source_platform || body.sourcePlatform || 'Remote Job Ingest';
  const sourceUrl = body.source_url || body.job_link || body.jobLink || body.url || '';
  const externalJobId = body.external_job_id ? String(body.external_job_id).trim() : (body.externalJobId ? String(body.externalJobId).trim() : '');
  const location = body.location || (body.remote ? 'Worldwide' : 'Worldwide');
  const isRemote = body.remote !== undefined ? Boolean(body.remote) : (body.isRemote !== undefined ? Boolean(body.isRemote) : true);
  const jobType = normalizeJobType(body.employment_type || body.job_type || body.jobType);

  // Analysis block can be nested under body.analysis or flat
  const analysis = body.analysis && typeof body.analysis === 'object' ? body.analysis : body;

  const normalizedSourceUrl = normalizeJobUrl(sourceUrl);
  const normalizedCompany = normalizeCompanyName(company);
  const normalizedTitle = normalizeJobTitle(title);

  // Perform priority 1-4 duplicate check
  const duplicateCheck = await checkJobDuplicate({
    sourcePlatform: source,
    externalJobId,
    sourceUrl,
    companyName: company,
    jobTitle: title,
    location,
    jobType,
  });

  const now = new Date().toISOString();

  // If duplicate found: Update lastSeenAt, record webhook log, and return clean response
  if (duplicateCheck.exists && duplicateCheck.existingRecord) {
    const existing = duplicateCheck.existingRecord;
    await db.updateJob(existing.id, {
      last_seen_at: now,
      updated_at: now,
    });

    const updatedJob = await db.getJobById(existing.id);
    const mapped = updatedJob ? dbRecordToJob(updatedJob) : dbRecordToJob(existing);

    await db.addWebhookLog({
      method: 'POST',
      endpoint: '/api/jobs',
      source,
      company_name: company,
      job_title: title,
      status: 'duplicate_skipped',
      status_code: 200,
      message: `Duplicate detected via ${duplicateCheck.matchType} (${duplicateCheck.reason}). Updated lastSeenAt.`,
      job_id: existing.id,
      payload_summary: `${company} - ${title} [${duplicateCheck.matchType}]`,
    });

    return {
      success: true,
      duplicate: true,
      job_id: existing.id,
      reason: duplicateCheck.reason || duplicateCheck.matchType,
      match_type: duplicateCheck.matchType,
      message: `Job already exists in tracking system (${duplicateCheck.reason || duplicateCheck.matchType})`,
      job: mapped,
    };
  }

  // Parse Scores & Recommendations
  const overallFitScore = sanitizeScore(
    analysis.overall_fit_score ?? analysis.overallFitScore ?? analysis.fit_score ?? analysis.fitScore ?? body.fit_score ?? body.fitScore
  );
  const technicalFit = sanitizeScore(analysis.technical_fit ?? analysis.technicalFit ?? body.technical_fit);
  const experienceFit = sanitizeScore(analysis.experience_fit ?? analysis.experienceFit ?? body.experience_fit);
  const industryFit = sanitizeScore(analysis.industry_fit ?? analysis.industryFit ?? body.industry_fit);
  const seniorityFit = sanitizeScore(analysis.seniority_fit ?? analysis.seniorityFit ?? body.seniority_fit);
  const locationEligibilityFit = sanitizeScore(
    analysis.location_eligibility_fit ?? analysis.locationEligibilityFit ?? analysis.location_fit ?? analysis.locationFit ?? body.location_fit
  );
  const compensationFit = sanitizeScore(analysis.compensation_fit ?? analysis.compensationFit ?? body.compensation_fit);

  // Determine Recommendation Classification
  let recommendation = analysis.recommendation || body.recommendation || '';
  if (!recommendation && overallFitScore !== null) {
    if (overallFitScore >= 90) recommendation = 'HIGH PRIORITY — APPLY';
    else if (overallFitScore >= 85) recommendation = 'STRONG APPLY';
    else if (overallFitScore >= 75) recommendation = 'APPLY';
    else if (overallFitScore >= 65) recommendation = 'APPLY SELECTIVELY';
    else recommendation = 'LOW PRIORITY';
  }

  const suitabilityClassification = analysis.suitability_classification || analysis.suitabilityClassification || (
    overallFitScore !== null ? (overallFitScore >= 85 ? 'STRONG FIT' : overallFitScore >= 70 ? 'GOOD FIT' : 'SELECTIVE FIT') : undefined
  );

  // Format Salary
  let salaryMin = typeof body.salary_min === 'number' ? body.salary_min : (typeof body.salaryMin === 'number' ? body.salaryMin : null);
  let salaryMax = typeof body.salary_max === 'number' ? body.salary_max : (typeof body.salaryMax === 'number' ? body.salaryMax : null);
  const currency = body.currency || 'USD';
  let salaryString = body.salary || body.salaryCompensation || '';
  if (!salaryString && (salaryMin || salaryMax)) {
    if (salaryMin && salaryMax) {
      salaryString = `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} ${currency}`;
    } else if (salaryMin) {
      salaryString = `From $${salaryMin.toLocaleString()} ${currency}`;
    } else if (salaryMax) {
      salaryString = `Up to $${salaryMax.toLocaleString()} ${currency}`;
    }
  } else if (!salaryString) {
    salaryString = 'Competitive / Market Rate';
  }

  // Domain extraction
  let jobLinkDomain = '';
  if (sourceUrl) {
    try {
      const u = new URL(sourceUrl);
      jobLinkDomain = u.hostname.replace(/^www\./, '');
    } catch {
      jobLinkDomain = source.toLowerCase().replace(/\s+/g, '') + '.com';
    }
  }

  // Status mapping: Ingestion always defaults to 'Not Started'
  const finalStatus: JobStatus = 'Not Started';

  // ID Generation
  const newId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Parse Lists & Structures
  const criticalRequirements = sanitizeStringArray(analysis.critical_requirements || analysis.criticalRequirements || body.criticalRequirements);
  const preferredRequirements = sanitizeStringArray(analysis.preferred_requirements || analysis.preferredRequirements || body.preferredRequirements);
  const roleResponsibilities = sanitizeStringArray(analysis.role_responsibilities || analysis.roleResponsibilities || body.roleResponsibilities);
  const strongMatches = sanitizeStringArray(analysis.strong_matches || analysis.strongMatches || body.matched_skills || body.matchedSkills);
  const partialMatches = sanitizeStringArray(analysis.partial_matches || analysis.partialMatches || body.partialMatches);
  const gaps = sanitizeStringArray(analysis.gaps || body.missing_skills || body.missingSkills);
  const unknowns = sanitizeStringArray(analysis.unknowns || analysis.unknown);
  const importantNotes = sanitizeStringArray(analysis.important_notes || analysis.importantNotes);
  const hardBlockers = sanitizeStringArray(analysis.hard_blockers || analysis.hardBlockers);
  const applicationRisks = sanitizeStringArray(analysis.application_risks || analysis.applicationRisks);
  const bestEvidence = sanitizeStringArray(analysis.best_evidence || analysis.bestEvidence);

  // Initial timeline entry
  const initialHistory = [
    {
      id: `hist-${Date.now()}`,
      fromStatus: null,
      toStatus: finalStatus,
      date: now,
      note: `Discovered & ingested via ${source} (${ingestionSource})`,
      source: 'system' as const,
    },
  ];

  const dbRecord: DbJobRecord = {
    id: newId,
    company_name: company,
    job_title: title,
    normalized_company: normalizedCompany,
    normalized_title: normalizedTitle,
    job_link: sourceUrl || null,
    normalized_source_url: normalizedSourceUrl || null,
    job_link_domain: jobLinkDomain || null,
    source_platform: source,
    external_job_id: externalJobId || null,
    company_url: body.company_url || body.companyUrl || null,
    location,
    is_remote: isRemote ? 1 : 0,
    job_type: jobType,
    salary: salaryString,
    salary_numeric: salaryMin || salaryMax || null,
    salary_min: salaryMin,
    salary_max: salaryMax,
    currency,
    status: finalStatus,
    notes: body.notes || null, // User notes only
    tag: recommendation || (overallFitScore && overallFitScore >= 85 ? 'HIGH PRIORITY' : 'Opportunity'),
    date_applied: null,
    deadline: body.deadline || null,
    posted_at: body.posted_at || body.postedAt || null,
    interview_date: body.interview_date || body.interviewDate || null,
    contact_email_or_linkedin: body.contact_email_or_linkedin || body.contactEmailOrLinkedIn || null,
    first_seen_at: now,
    last_seen_at: now,

    overall_fit_score: overallFitScore,
    fit_score: overallFitScore,
    suitability_classification: suitabilityClassification || null,
    recommendation: recommendation || null,
    technical_fit: technicalFit,
    experience_fit: experienceFit,
    industry_fit: industryFit,
    seniority_fit: seniorityFit,
    location_eligibility_fit: locationEligibilityFit,
    compensation_fit: compensationFit,
    location_fit: locationEligibilityFit,
    eligibility: analysis.eligibility || body.eligibility || 'Worldwide / Remote Eligible',

    critical_requirements: JSON.stringify(criticalRequirements),
    preferred_requirements: JSON.stringify(preferredRequirements),
    role_responsibilities: JSON.stringify(roleResponsibilities),
    strong_matches: JSON.stringify(strongMatches),
    partial_matches: JSON.stringify(partialMatches),
    gaps: JSON.stringify(gaps),
    unknowns: JSON.stringify(unknowns),
    important_notes: JSON.stringify(importantNotes),
    hard_blockers: JSON.stringify(hardBlockers),
    application_risks: JSON.stringify(applicationRisks),
    analysis_json: JSON.stringify(analysis),

    work_authorization: analysis.work_authorization || analysis.workAuthorization || body.work_authorization || null,
    country_restrictions: analysis.country_restrictions || analysis.countryRestrictions || null,
    timezone_requirement: analysis.timezone_requirement || analysis.timezoneRequirement || body.timezone_requirement || null,
    relocation_expectation: analysis.relocation_expectation || analysis.relocationExpectation || null,
    language_requirement: analysis.language_requirement || analysis.languageRequirement || null,
    degree_requirement: analysis.degree_requirement || analysis.degreeRequirement || null,
    certification_requirement: analysis.certification_requirement || analysis.certificationRequirement || null,

    best_positioning: analysis.best_positioning || analysis.bestPositioning || null,
    best_evidence: JSON.stringify(bestEvidence),
    main_risk: analysis.main_risk || analysis.mainRisk || body.main_risk || null,
    analysis_summary: analysis.analysis_summary || analysis.analysisSummary || null,
    job_description: body.job_description || body.jobDescription || body.description || null,

    ingestion_source: ingestionSource || 'api',
    analysis_version: 'v2',
    automatically_discovered: 1,
    source_unique_key: `${source}::${externalJobId || newId}`,

    contacts_json: JSON.stringify([]),
    reminders_json: JSON.stringify([]),
    status_history_json: JSON.stringify(initialHistory),
    prep_checklist_json: JSON.stringify([]),
    cover_letters_json: JSON.stringify([]),

    created_at: now,
    updated_at: now,
  };

  await db.insertJob(dbRecord);

  await db.addWebhookLog({
    method: 'POST',
    endpoint: '/api/jobs',
    source,
    company_name: company,
    job_title: title,
    status: 'success',
    status_code: 201,
    message: `Job opportunity ingested (Fit: ${overallFitScore ?? 'N/A'}%, Recommendation: ${recommendation || 'Opportunity'})`,
    job_id: newId,
    payload_summary: `${company} - ${title}`,
  });

  const createdJob = dbRecordToJob(dbRecord);

  return {
    success: true,
    duplicate: false,
    job_id: newId,
    message: 'Job opportunity successfully ingested into tracking system',
    job: createdJob,
  };
}
