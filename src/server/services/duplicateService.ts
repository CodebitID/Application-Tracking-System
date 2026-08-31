import { db, DbJobRecord } from '../db';
import {
  normalizeCompanyName,
  normalizeJobTitle,
  normalizeJobUrl,
  normalizeSourcePlatform,
} from './normalizationService';

export {
  normalizeCompanyName,
  normalizeJobTitle,
  normalizeJobUrl,
  normalizeSourcePlatform,
};

export interface DuplicateCheckResult {
  exists: boolean;
  jobId?: string;
  matchType?: 'external_job_id' | 'source_url' | 'composite_match' | 'fallback_match';
  existingRecord?: DbJobRecord;
  reason?: string;
}

export interface DuplicateCheckInput {
  sourcePlatform?: string;
  externalJobId?: string;
  sourceUrl?: string;
  companyName?: string;
  jobTitle?: string;
  location?: string;
  jobType?: string;
}

/**
 * Checks for existing job in the database using strict 4-tier priority duplicate detection:
 * 1. Priority 1: sourcePlatform + externalJobId (exact match on unique job ID from the source)
 * 2. Priority 2: Normalized Source URL (exact match on canonical URL stripped of tracking params)
 * 3. Priority 3: Normalized Company + Normalized Title + Location + JobType
 * 4. Priority 4: Normalized Company + Normalized Title (composite fallback)
 */
export async function checkJobDuplicate(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
  const { sourcePlatform, externalJobId, sourceUrl, companyName, jobTitle, location, jobType } = input;

  const normalizedSource = normalizeSourcePlatform(sourcePlatform || '');
  const cleanExternalId = (externalJobId || '').trim();

  // Priority 1: sourcePlatform + externalJobId
  if (normalizedSource && cleanExternalId) {
    const record = await db.findDuplicateByExternalId(sourcePlatform || '', cleanExternalId);
    if (record) {
      return {
        exists: true,
        jobId: record.id,
        matchType: 'external_job_id',
        existingRecord: record,
        reason: `Matched external job ID "${cleanExternalId}" from platform "${sourcePlatform}"`,
      };
    }
  }

  // Priority 2: Normalized Source URL
  const normalizedUrl = normalizeJobUrl(sourceUrl || '');
  if (normalizedUrl) {
    const record = await db.findDuplicateByNormalizedUrl(normalizedUrl);
    if (record) {
      return {
        exists: true,
        jobId: record.id,
        matchType: 'source_url',
        existingRecord: record,
        reason: `Matched canonical URL "${normalizedUrl}"`,
      };
    }
  }

  // Priority 3 & 4: Normalized Company + Title (+ Location & Employment Type)
  const normCompany = normalizeCompanyName(companyName || '');
  const normTitle = normalizeJobTitle(jobTitle || '');

  if (normCompany && normTitle) {
    const record = await db.findDuplicateByComposite(normCompany, normTitle, location, jobType);
    if (record) {
      const matchType = (location && jobType) ? 'composite_match' : 'fallback_match';
      return {
        exists: true,
        jobId: record.id,
        matchType,
        existingRecord: record,
        reason: `Matched normalized company "${normCompany}" and title "${normTitle}"`,
      };
    }
  }

  return { exists: false };
}
