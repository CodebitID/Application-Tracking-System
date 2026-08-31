import { Router } from 'express';
import { requireApiAuth } from '../auth';
import { db, DbJobRecord } from '../db';
import { checkJobDuplicate } from '../services/duplicateService';
import { ingestOrSaveJob, dbRecordToJob, normalizeJobStatus, normalizeJobType } from '../services/jobService';

export const jobRouter = Router();

/**
 * Phase 6: Lightweight Duplicate Check Endpoint
 * POST /api/jobs/check-duplicate
 */
jobRouter.post('/api/jobs/check-duplicate', requireApiAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const source = body.source || body.source_platform || body.sourcePlatform || '';
    const externalJobId = body.external_job_id || body.externalJobId || '';
    const sourceUrl = body.source_url || body.job_link || body.jobLink || body.url || '';
    const company = body.company || body.company_name || body.companyName || '';
    const title = body.title || body.job_title || body.jobTitle || '';
    const location = body.location || '';
    const employmentType = body.employment_type || body.job_type || body.jobType || '';

    const result = await checkJobDuplicate({
      sourcePlatform: source,
      externalJobId: externalJobId ? String(externalJobId) : undefined,
      sourceUrl,
      companyName: company,
      jobTitle: title,
      location,
      jobType: employmentType,
    });

    if (result.exists && result.existingRecord) {
      const rec = result.existingRecord;
      return res.status(200).json({
        success: true,
        exists: true,
        job_id: rec.id,
        match_type: result.matchType,
        job: {
          id: rec.id,
          companyName: rec.company_name,
          jobTitle: rec.job_title,
          status: rec.status,
          fitScore: rec.fit_score !== null ? Number(rec.fit_score) : null,
          recommendation: rec.recommendation,
          eligibility: rec.eligibility,
          sourcePlatform: rec.source_platform,
        },
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
    });
  } catch (error: any) {
    console.error('Error during duplicate check:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error checking duplicate',
    });
  }
});

/**
 * Phase 12: Ingest Job Opportunity
 * POST /api/jobs
 */
jobRouter.post('/api/jobs', requireApiAuth, async (req, res) => {
  try {
    const result = await ingestOrSaveJob(req.body, 'api');
    const statusCode = result.duplicate ? 200 : 201;
    return res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('Error in POST /api/jobs:', error);
    await db.addWebhookLog({
      method: 'POST',
      endpoint: '/api/jobs',
      status: 'validation_error',
      status_code: 422,
      message: error.message || 'Validation error during job ingestion',
      payload_summary: JSON.stringify(req.body || {}).slice(0, 100),
    });
    return res.status(422).json({
      success: false,
      error: error.message || 'Failed to process job opportunity payload',
    });
  }
});

/**
 * Manual Job Creation Endpoint (from UI client)
 * POST /api/jobs/manual
 */
jobRouter.post('/api/jobs/manual', async (req, res) => {
  try {
    const body = req.body || {};
    const company = (body.companyName || body.company || '').trim();
    const title = (body.jobTitle || body.title || '').trim();

    if (!company || !title) {
      return res.status(400).json({
        success: false,
        error: 'Company name and job title are required.',
      });
    }

    const now = new Date().toISOString();
    const newId = body.id || `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const status = normalizeJobStatus(body.status);
    const jobType = normalizeJobType(body.jobType);

    const initialHistory = Array.isArray(body.statusHistory) && body.statusHistory.length > 0
      ? body.statusHistory
      : [
          {
            id: `hist-${Date.now()}`,
            fromStatus: null,
            toStatus: status,
            date: now,
            note: 'Manually logged in tracker',
            source: 'user',
          },
        ];

    const dbRecord: DbJobRecord = {
      id: newId,
      company_name: company,
      job_title: title,
      normalized_company: company.toLowerCase().trim(),
      normalized_title: title.toLowerCase().trim(),
      job_link: body.jobLink || body.sourceUrl || null,
      normalized_source_url: body.jobLink || body.sourceUrl || null,
      job_link_domain: body.jobLinkDomain || null,
      source_platform: body.sourcePlatform || 'Manual Entry',
      external_job_id: body.externalJobId || null,
      company_url: body.companyUrl || null,
      location: body.location || 'Remote',
      is_remote: body.isRemote !== undefined ? (body.isRemote ? 1 : 0) : 1,
      job_type: jobType,
      salary: body.salary || 'Competitive',
      salary_numeric: body.salaryNumeric || null,
      salary_min: body.salaryMin || null,
      salary_max: body.salaryMax || null,
      currency: body.currency || 'USD',
      status,
      notes: body.notes || null,
      tag: body.tag || 'Manual Entry',
      date_applied: body.dateApplied || (status === 'Applied' ? now.split('T')[0] : null),
      deadline: body.deadline || null,
      posted_at: body.postedAt || null,
      interview_date: body.interviewDate || null,
      contact_email_or_linkedin: body.contactEmailOrLinkedIn || null,
      first_seen_at: now,
      last_seen_at: now,

      overall_fit_score: body.overallFitScore ?? body.fitScore ?? null,
      fit_score: body.fitScore ?? body.overallFitScore ?? null,
      suitability_classification: body.suitabilityClassification || null,
      recommendation: body.recommendation || null,
      technical_fit: body.technicalFit || null,
      experience_fit: body.experienceFit || null,
      industry_fit: body.industryFit || null,
      seniority_fit: body.seniorityFit || null,
      location_eligibility_fit: body.locationEligibilityFit || null,
      compensation_fit: body.compensationFit || null,
      location_fit: body.locationFit || null,
      eligibility: body.eligibility || 'Eligible',

      critical_requirements: JSON.stringify(body.criticalRequirements || []),
      preferred_requirements: JSON.stringify(body.preferredRequirements || []),
      role_responsibilities: JSON.stringify(body.roleResponsibilities || []),
      strong_matches: JSON.stringify(body.strongMatches || []),
      partial_matches: JSON.stringify(body.partialMatches || []),
      gaps: JSON.stringify(body.gaps || []),
      unknowns: JSON.stringify(body.unknowns || []),
      important_notes: JSON.stringify(body.importantNotes || []),
      hard_blockers: JSON.stringify(body.hardBlockers || []),
      application_risks: JSON.stringify(body.applicationRisks || []),
      analysis_json: JSON.stringify(body.analysis || {}),

      work_authorization: body.workAuthorization || null,
      country_restrictions: body.countryRestrictions || null,
      timezone_requirement: body.timezoneRequirement || null,
      relocation_expectation: body.relocationExpectation || null,
      language_requirement: body.languageRequirement || null,
      degree_requirement: body.degreeRequirement || null,
      certification_requirement: body.certificationRequirement || null,

      best_positioning: body.bestPositioning || null,
      best_evidence: JSON.stringify(body.bestEvidence || []),
      main_risk: body.mainRisk || null,
      analysis_summary: body.analysisSummary || null,
      job_description: body.jobDescription || null,

      ingestion_source: 'manual',
      analysis_version: 'v2',
      automatically_discovered: 0,
      source_unique_key: `manual::${newId}`,

      contacts_json: JSON.stringify(body.contacts || []),
      reminders_json: JSON.stringify(body.reminders || []),
      status_history_json: JSON.stringify(initialHistory),
      prep_checklist_json: JSON.stringify(body.interviewChecklist || []),
      cover_letters_json: JSON.stringify(body.savedCoverLetters || []),

      created_at: now,
      updated_at: now,
    };

    await db.insertJob(dbRecord);
    const created = await db.getJobById(newId);

    return res.status(201).json({
      success: true,
      job: created ? dbRecordToJob(created) : dbRecordToJob(dbRecord),
    });
  } catch (error: any) {
    console.error('Error creating manual job:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create job',
    });
  }
});

/**
 * Phase 13: List All Ingested Jobs (Read from Database)
 * GET /api/jobs
 */
jobRouter.get('/api/jobs', async (req, res) => {
  try {
    const rawRecords = await db.getAllJobs();
    let jobs = rawRecords.map(dbRecordToJob);

    const { status, source, min_fit, recommendation, limit } = req.query;

    if (status && typeof status === 'string') {
      jobs = jobs.filter((j) => j.status.toLowerCase() === status.toLowerCase());
    }

    if (source && typeof source === 'string') {
      jobs = jobs.filter((j) => j.sourcePlatform?.toLowerCase().includes(source.toLowerCase()));
    }

    if (min_fit && !isNaN(Number(min_fit))) {
      const minFitNum = Number(min_fit);
      jobs = jobs.filter((j) => (j.overallFitScore || j.fitScore || 0) >= minFitNum);
    }

    if (recommendation && typeof recommendation === 'string') {
      jobs = jobs.filter((j) => j.recommendation?.toLowerCase().includes(recommendation.toLowerCase()));
    }

    if (limit && !isNaN(Number(limit))) {
      jobs = jobs.slice(0, Number(limit));
    }

    return res.json({
      success: true,
      count: jobs.length,
      total: rawRecords.length,
      jobs,
    });
  } catch (error: any) {
    console.error('Error reading jobs from database:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs from database',
    });
  }
});

/**
 * Phase 13: Get Single Job by ID
 * GET /api/jobs/:id
 */
jobRouter.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await db.getJobById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    return res.json({
      success: true,
      job: dbRecordToJob(record),
    });
  } catch (error: any) {
    console.error(`Error reading job ${req.params.id}:`, error);
    return res.status(500).json({ success: false, error: 'Failed to fetch job' });
  }
});

/**
 * Phase 13: Update Job by ID (Server-side CRUD)
 * PATCH /api/jobs/:id
 */
jobRouter.patch('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getJobById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const updates: Partial<DbJobRecord> = {};
    const body = req.body || {};
    const now = new Date().toISOString();

    if (body.status !== undefined) updates.status = normalizeJobStatus(body.status);
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.tag !== undefined) updates.tag = body.tag;
    if (body.companyName !== undefined) updates.company_name = body.companyName;
    if (body.jobTitle !== undefined) updates.job_title = body.jobTitle;
    if (body.location !== undefined) updates.location = body.location;
    if (body.isRemote !== undefined) updates.is_remote = body.isRemote ? 1 : 0;
    if (body.jobType !== undefined) updates.job_type = normalizeJobType(body.jobType);
    if (body.salary !== undefined) updates.salary = body.salary;
    if (body.dateApplied !== undefined) updates.date_applied = body.dateApplied;
    if (body.deadline !== undefined) updates.deadline = body.deadline;

    // Sub-collections update
    if (body.contacts !== undefined) updates.contacts_json = JSON.stringify(body.contacts);
    if (body.reminders !== undefined) updates.reminders_json = JSON.stringify(body.reminders);
    if (body.statusHistory !== undefined) updates.status_history_json = JSON.stringify(body.statusHistory);
    if (body.interviewChecklist !== undefined) updates.prep_checklist_json = JSON.stringify(body.interviewChecklist);
    if (body.savedCoverLetters !== undefined) updates.cover_letters_json = JSON.stringify(body.savedCoverLetters);

    updates.updated_at = now;

    await db.updateJob(id, updates);
    const updatedRecord = await db.getJobById(id);

    return res.json({
      success: true,
      job: updatedRecord ? dbRecordToJob(updatedRecord) : null,
    });
  } catch (error: any) {
    console.error(`Error updating job ${req.params.id}:`, error);
    return res.status(500).json({ success: false, error: 'Failed to update job' });
  }
});

/**
 * Phase 13: Delete Job by ID
 * DELETE /api/jobs/:id
 */
jobRouter.delete('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getJobById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await db.deleteJob(id);

    await db.addWebhookLog({
      method: 'DELETE',
      endpoint: `/api/jobs/${id}`,
      status: 'success',
      status_code: 200,
      message: `Job ${id} (${existing.company_name}) deleted`,
      job_id: id,
    });

    return res.json({
      success: true,
      message: 'Job successfully deleted',
      job_id: id,
    });
  } catch (error: any) {
    console.error(`Error deleting job ${req.params.id}:`, error);
    return res.status(500).json({ success: false, error: 'Failed to delete job' });
  }
});

/**
 * Phase 13: Bulk Delete Jobs
 * POST /api/jobs/bulk-delete
 */
jobRouter.post('/api/jobs/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Expected array of job IDs' });
    }

    for (const id of ids) {
      await db.deleteJob(id);
    }

    return res.json({
      success: true,
      deletedCount: ids.length,
      message: `Successfully deleted ${ids.length} jobs`,
    });
  } catch (error: any) {
    console.error('Error during bulk delete:', error);
    return res.status(500).json({ success: false, error: 'Failed to bulk delete jobs' });
  }
});

