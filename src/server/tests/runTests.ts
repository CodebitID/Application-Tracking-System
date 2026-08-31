import assert from 'assert';
import {
  normalizeCompanyName,
  normalizeJobTitle,
  normalizeJobUrl,
  normalizeSourcePlatform,
} from '../services/normalizationService';
import { requireApiAuth } from '../auth';
import { db } from '../db';
import { checkJobDuplicate } from '../services/duplicateService';
import { ingestOrSaveJob, sanitizeScore, sanitizeStringArray } from '../services/jobService';

async function runTests() {
  console.log('🧪 Starting test suite for Normalization, Auth, and Ingestion...');

  // --- 1. Normalization Tests ---
  console.log('Testing Normalization Service...');

  // Company normalization
  assert.strictEqual(normalizeCompanyName('Google, Inc.'), 'google');
  assert.strictEqual(normalizeCompanyName('Stripe LLC'), 'stripe');
  assert.strictEqual(normalizeCompanyName('Acme Corporation'), 'acme');
  assert.strictEqual(normalizeCompanyName('Vercel Ltd.'), 'vercel');
  assert.strictEqual(normalizeCompanyName('  Meta Platforms, Inc.  '), 'meta platforms');
  console.log('  ✅ Company name normalization passed.');

  // Job title normalization
  assert.strictEqual(normalizeJobTitle('Sr. Software Engineer'), 'senior software engineer');
  assert.strictEqual(normalizeJobTitle('Jr. Dev'), 'junior developer');
  assert.strictEqual(normalizeJobTitle('Full-Stack SWE'), 'full stack software engineer');
  assert.strictEqual(normalizeJobTitle('Frontend Eng'), 'front end engineer');
  assert.strictEqual(normalizeJobTitle('Engineering Mgr.'), 'engineering manager');
  console.log('  ✅ Job title normalization passed.');

  // URL normalization
  const dirtyUrl = 'https://weworkremotely.com/jobs/12345-senior-dev?utm_source=newsletter&utm_medium=email&ref=hacker_news#overview';
  const cleanUrl = normalizeJobUrl(dirtyUrl);
  assert.strictEqual(cleanUrl, 'https://weworkremotely.com/jobs/12345-senior-dev');

  const dirtyUrl2 = 'https://boards.greenhouse.io/company/jobs/998877?gh_jid=998877&utm_campaign=spring2026';
  const cleanUrl2 = normalizeJobUrl(dirtyUrl2);
  assert.strictEqual(cleanUrl2, 'https://boards.greenhouse.io/company/jobs/998877?gh_jid=998877');
  console.log('  ✅ URL normalization & tracking stripping passed.');

  // Source platform normalization
  assert.strictEqual(normalizeSourcePlatform('We Work Remotely'), 'weworkremotely');
  assert.strictEqual(normalizeSourcePlatform('RemoteOK!'), 'remoteok');
  console.log('  ✅ Source platform normalization passed.');

  // --- 2. Auth Middleware Tests ---
  console.log('Testing Authentication Middleware...');
  process.env.TRACKER_API_TOKEN = 'test-secret-token-12345';

  // Test Missing token -> 401
  let statusCode = 0;
  let responseBody: any = null;
  const mockReqNoToken: any = { headers: {} };
  const mockResNoToken: any = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (body: any) => {
          responseBody = body;
        },
      };
    },
  };
  let nextCalled = false;
  requireApiAuth(mockReqNoToken, mockResNoToken, () => {
    nextCalled = true;
  });
  assert.strictEqual(statusCode, 401);
  assert.strictEqual(responseBody?.success, false);
  assert.strictEqual(nextCalled, false);
  console.log('  ✅ Missing token returns 401 Unauthorized.');

  // Test Invalid token -> 403
  statusCode = 0;
  const mockReqWrongToken: any = {
    headers: { authorization: 'Bearer wrong-secret' },
  };
  const mockResWrongToken: any = {
    status: (code: number) => {
      statusCode = code;
      return {
        json: (body: any) => {
          responseBody = body;
        },
      };
    },
  };
  nextCalled = false;
  requireApiAuth(mockReqWrongToken, mockResWrongToken, () => {
    nextCalled = true;
  });
  assert.strictEqual(statusCode, 403);
  assert.strictEqual(responseBody?.success, false);
  assert.strictEqual(nextCalled, false);
  console.log('  ✅ Invalid token returns 403 Forbidden.');

  // Test Valid token (Bearer) -> 200 / next()
  statusCode = 0;
  const mockReqValidToken: any = {
    headers: { authorization: 'Bearer test-secret-token-12345' },
  };
  nextCalled = false;
  requireApiAuth(mockReqValidToken, {} as any, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
  console.log('  ✅ Valid Bearer token passes authentication.');

  // Test Valid token (X-API-Key) -> 200 / next()
  const mockReqApiKey: any = {
    headers: { 'x-api-key': 'test-secret-token-12345' },
  };
  nextCalled = false;
  requireApiAuth(mockReqApiKey, {} as any, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true);
  console.log('  ✅ Valid X-API-Key token passes authentication.');

  // --- 3. Ingestion & Duplicate Detection Tests ---
  console.log('Testing Ingestion & Duplicate Detection...');
  await db.init();

  const testJobPayload = {
    title: 'Senior TypeScript Architect',
    company: 'TestCorp Technologies Inc.',
    source: 'We Work Remotely',
    source_url: 'https://weworkremotely.com/jobs/8888-architect?utm_source=test',
    external_job_id: 'EXT-8888',
    location: 'Remote, Worldwide',
    remote: true,
    employment_type: 'Full-Time',
    salary_min: 150000,
    salary_max: 180000,
    currency: 'USD',
    analysis: {
      overall_fit_score: 95,
      recommendation: 'HIGH PRIORITY — APPLY',
      suitability_classification: 'STRONG FIT',
      technical_fit: 98,
      experience_fit: 94,
      critical_requirements: ['TypeScript', 'Express', 'Prisma ORM'],
      strong_matches: ['Full Stack Architecture', 'Node.js'],
      gaps: [],
      hard_blockers: [],
    },
  };

  const res1 = await ingestOrSaveJob(testJobPayload, 'test-suite');
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.duplicate, false);
  assert.ok(res1.job_id);
  assert.strictEqual(res1.job.overallFitScore, 95);
  assert.strictEqual(res1.job.analysis?.technicalFit, 98);
  console.log('  ✅ Initial job ingestion created new record successfully.');

  // Ingest exact duplicate with same external_job_id
  const resDuplicate1 = await ingestOrSaveJob(testJobPayload, 'test-suite');
  assert.strictEqual(resDuplicate1.success, true);
  assert.strictEqual(resDuplicate1.duplicate, true);
  assert.strictEqual(resDuplicate1.job_id, res1.job_id);
  assert.strictEqual(resDuplicate1.match_type, 'external_job_id');
  console.log('  ✅ Priority 1 (external_job_id) duplicate detection passed.');

  // Ingest duplicate with same canonical URL but different external ID
  const urlDuplicatePayload = {
    ...testJobPayload,
    external_job_id: 'DIFFERENT-EXT-ID',
    source_url: 'https://weworkremotely.com/jobs/8888-architect?utm_medium=ad&ref=reddit',
  };
  const resDuplicate2 = await ingestOrSaveJob(urlDuplicatePayload, 'test-suite');
  assert.strictEqual(resDuplicate2.success, true);
  assert.strictEqual(resDuplicate2.duplicate, true);
  assert.strictEqual(resDuplicate2.job_id, res1.job_id);
  assert.strictEqual(resDuplicate2.match_type, 'source_url');
  console.log('  ✅ Priority 2 (source_url) duplicate detection passed.');

  // Ingest composite match (Normalized company + normalized title)
  const compositeDuplicatePayload = {
    title: 'Sr. TypeScript Architect',
    company: 'TestCorp Technologies LLC',
    source: 'LinkedIn',
    source_url: 'https://linkedin.com/jobs/view/99999',
    location: 'Remote, Worldwide',
    employment_type: 'Full-Time',
  };
  const resDuplicate3 = await ingestOrSaveJob(compositeDuplicatePayload, 'test-suite');
  assert.strictEqual(resDuplicate3.success, true);
  assert.strictEqual(resDuplicate3.duplicate, true);
  assert.strictEqual(resDuplicate3.job_id, res1.job_id);
  console.log('  ✅ Priority 3/4 (composite normalized match) duplicate detection passed.');

  // Cleanup test job
  await db.deleteJob(res1.job_id);
  console.log('  ✅ Database cleanup completed.');

  // --- 4. Comprehensive Full CRUD Lifecycle Verification ---
  console.log('\nTesting Full CRUD Lifecycle on System Entities...');

  // 4.1 CREATE (Manual Job)
  const manualJobId = `job-test-manual-${Date.now()}`;
  const now = new Date().toISOString();
  await db.insertJob({
    id: manualJobId,
    company_name: 'Acme Cloud Systems',
    job_title: 'Staff Full-Stack Engineer',
    normalized_company: 'acme cloud systems',
    normalized_title: 'staff full stack engineer',
    location: 'Remote (Worldwide)',
    is_remote: 1,
    job_type: 'Full-Time',
    salary: '$160,000 - $190,000',
    salary_numeric: 175000,
    salary_min: 160000,
    salary_max: 190000,
    currency: 'USD',
    status: 'Applied',
    tag: 'Tier 1 Target',
    notes: 'Referred by senior engineering director',
    date_applied: now.split('T')[0],
    source_platform: 'Manual Entry',
    ingestion_source: 'manual',
    analysis_version: 'v2',
    automatically_discovered: 0,
    source_unique_key: `manual::${manualJobId}`,
    contacts_json: JSON.stringify([
      {
        id: 'cont-1',
        name: 'Sarah Connor',
        role: 'Recruiting Lead',
        email: 'sarah@acmecloud.io',
        createdAt: now,
      },
    ]),
    reminders_json: JSON.stringify([
      {
        id: 'rem-1',
        jobId: manualJobId,
        title: 'Follow up on application',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        isCompleted: false,
        createdAt: now,
      },
    ]),
    status_history_json: JSON.stringify([
      {
        id: 'hist-1',
        fromStatus: null,
        toStatus: 'Applied',
        date: now,
        notes: 'Initial application logged',
      },
    ]),
    prep_checklist_json: JSON.stringify([
      {
        id: 'chk-1',
        label: 'Review distributed systems architecture',
        isCompleted: false,
        category: 'technical',
      },
    ]),
    cover_letters_json: JSON.stringify([
      {
        id: 'cov-1',
        title: 'Tailored Cloud Cover Letter',
        content: 'Dear Hiring Team...',
        createdAt: now,
      },
    ]),
    created_at: now,
    updated_at: now,
  });
  console.log('  ✅ [CREATE] Manual Job inserted successfully with sub-entities.');

  // 4.2 READ (Single Job & List All Jobs)
  const fetchedManual = await db.getJobById(manualJobId);
  assert.ok(fetchedManual, 'Job record must be retrieved by ID');
  assert.strictEqual(fetchedManual.company_name, 'Acme Cloud Systems');
  assert.strictEqual(fetchedManual.status, 'Applied');

  // Verify sub-entities parsed correctly
  const contacts = JSON.parse(fetchedManual.contacts_json || '[]');
  assert.strictEqual(contacts.length, 1);
  assert.strictEqual(contacts[0].name, 'Sarah Connor');

  const reminders = JSON.parse(fetchedManual.reminders_json || '[]');
  assert.strictEqual(reminders.length, 1);
  assert.strictEqual(reminders[0].title, 'Follow up on application');

  const allJobs = await db.getAllJobs();
  assert.ok(allJobs.length >= 1, 'Database must contain at least 1 job');
  const foundInAll = allJobs.find((j) => j.id === manualJobId);
  assert.ok(foundInAll, 'Job must be present in getAllJobs() list');
  console.log('  ✅ [READ] Job by ID and getAllJobs() read successfully.');

  // 4.3 UPDATE (Field updates & Sub-entity updates)
  const updatedTime = new Date().toISOString();
  await db.updateJob(manualJobId, {
    status: 'Interviewing',
    notes: 'First round technical screen scheduled for Thursday',
    salary: '$170,000 - $200,000',
    contacts_json: JSON.stringify([
      ...contacts,
      {
        id: 'cont-2',
        name: 'Alex Vance',
        role: 'VP of Engineering',
        email: 'alex@acmecloud.io',
        createdAt: updatedTime,
      },
    ]),
    reminders_json: JSON.stringify([
      { ...reminders[0], isCompleted: true },
      {
        id: 'rem-2',
        jobId: manualJobId,
        title: 'System Design Interview Screen',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        isCompleted: false,
        createdAt: updatedTime,
      },
    ]),
    status_history_json: JSON.stringify([
      {
        id: 'hist-1',
        fromStatus: null,
        toStatus: 'Applied',
        date: now,
        notes: 'Initial application logged',
      },
      {
        id: 'hist-2',
        fromStatus: 'Applied',
        toStatus: 'Interviewing',
        date: updatedTime,
        notes: 'Recruiter reached out for screen',
      },
    ]),
    updated_at: updatedTime,
  });

  const reFetched = await db.getJobById(manualJobId);
  assert.ok(reFetched);
  assert.strictEqual(reFetched.status, 'Interviewing');
  assert.strictEqual(reFetched.notes, 'First round technical screen scheduled for Thursday');
  assert.strictEqual(reFetched.salary, '$170,000 - $200,000');

  const updatedContacts = JSON.parse(reFetched.contacts_json || '[]');
  assert.strictEqual(updatedContacts.length, 2);
  assert.strictEqual(updatedContacts[1].name, 'Alex Vance');

  const updatedReminders = JSON.parse(reFetched.reminders_json || '[]');
  assert.strictEqual(updatedReminders.length, 2);
  assert.strictEqual(updatedReminders[0].isCompleted, true);

  const updatedHistory = JSON.parse(reFetched.status_history_json || '[]');
  assert.strictEqual(updatedHistory.length, 2);
  assert.strictEqual(updatedHistory[1].toStatus, 'Interviewing');
  console.log('  ✅ [UPDATE] Job details, status history, contacts, and reminders updated successfully.');

  // 4.4 DELETE (Single Job)
  await db.deleteJob(manualJobId);
  const deletedCheck = await db.getJobById(manualJobId);
  assert.strictEqual(deletedCheck, null, 'Job must be null after deletion');
  console.log('  ✅ [DELETE] Single Job deleted successfully.');

  // 4.5 BULK OPERATIONS (Create 3, Bulk Read, Bulk Delete)
  const bulkId1 = `job-bulk-1-${Date.now()}`;
  const bulkId2 = `job-bulk-2-${Date.now()}`;
  const bulkId3 = `job-bulk-3-${Date.now()}`;

  await db.insertJob({
    id: bulkId1,
    company_name: 'Bulk Alpha Inc',
    job_title: 'Senior Frontend Dev',
    normalized_company: 'bulk alpha',
    normalized_title: 'senior front end developer',
    status: 'Applied',
    created_at: now,
    updated_at: now,
  });

  await db.insertJob({
    id: bulkId2,
    company_name: 'Bulk Beta Corp',
    job_title: 'Senior Backend Dev',
    normalized_company: 'bulk beta',
    normalized_title: 'senior back end developer',
    status: 'Interviewing',
    created_at: now,
    updated_at: now,
  });

  await db.insertJob({
    id: bulkId3,
    company_name: 'Bulk Gamma LLC',
    job_title: 'DevOps Lead',
    normalized_company: 'bulk gamma',
    normalized_title: 'devops lead',
    status: 'Offer',
    created_at: now,
    updated_at: now,
  });

  const bulkJobs = await db.getAllJobs();
  assert.ok(bulkJobs.some((j) => j.id === bulkId1));
  assert.ok(bulkJobs.some((j) => j.id === bulkId2));
  assert.ok(bulkJobs.some((j) => j.id === bulkId3));
  console.log('  ✅ [BULK CREATE/READ] Multiple jobs inserted and retrieved.');

  // Delete them via bulk list
  for (const id of [bulkId1, bulkId2, bulkId3]) {
    await db.deleteJob(id);
  }

  const afterBulkDelete = await db.getAllJobs();
  assert.ok(!afterBulkDelete.some((j) => j.id === bulkId1));
  assert.ok(!afterBulkDelete.some((j) => j.id === bulkId2));
  assert.ok(!afterBulkDelete.some((j) => j.id === bulkId3));
  console.log('  ✅ [BULK DELETE] Bulk deletion verified cleanly.');

  // 4.6 Webhook Audit Log CRUD
  await db.addWebhookLog({
    method: 'POST',
    endpoint: '/api/jobs',
    status: 'success',
    status_code: 201,
    message: 'Test webhook log entry',
    job_id: 'test-job-audit-1',
    company_name: 'Audit Corp',
    job_title: 'Audit Engineer',
    payload_summary: '{"test": true}',
  });

  const logs = await db.getWebhookLogs(10);
  assert.ok(logs.length >= 1, 'At least 1 webhook log should be found');
  const latestLog = logs[0];
  assert.strictEqual(latestLog.endpoint, '/api/jobs');
  assert.strictEqual(latestLog.status, 'success');
  console.log('  ✅ [LOGS/AUDIT] Webhook logging and retrieval verified.');

  console.log('\n🎉 ALL TESTS AND FULL CRUD LIFECYCLE PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failure:', err);
  process.exit(1);
});
