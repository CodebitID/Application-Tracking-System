import { Router } from 'express';
import { requireApiAuth } from '../auth';
import { ingestOrSaveJob } from '../services/jobService';
import { db } from '../db';

export const integrationRouter = Router();

/**
 * Phase 7: ChatGPT Bridge / Custom GPT Action Endpoint
 * POST /api/integrations/chatgpt/jobs
 */
integrationRouter.post('/api/integrations/chatgpt/jobs', requireApiAuth, async (req, res) => {
  try {
    const rawBody = req.body || {};

    // Transform ChatGPT bridge payload into standard job ingestion payload if necessary
    const payload = {
      title: rawBody.role || rawBody.jobTitle || rawBody.title,
      company: rawBody.company || rawBody.companyName,
      source: rawBody.sourcePlatform || rawBody.source || 'ChatGPT Job Discovery',
      source_url: rawBody.sourceUrl || rawBody.source_url || rawBody.jobLink,
      external_job_id: rawBody.externalJobId || rawBody.external_job_id,
      location: rawBody.location || 'Worldwide',
      remote: rawBody.isRemote !== undefined ? rawBody.isRemote : true,
      employment_type: rawBody.employmentType || rawBody.jobType || 'Full-Time',
      salary: rawBody.salaryCompensation || rawBody.salary,
      salary_min: rawBody.salaryMin,
      salary_max: rawBody.salaryMax,
      currency: rawBody.currency || 'USD',
      analysis: rawBody.analysis || {
        overall_fit_score: rawBody.overallFitScore || rawBody.fitScore,
        recommendation: rawBody.recommendation,
        suitability_classification: rawBody.suitabilityClassification,
        technical_fit: rawBody.technicalFit,
        experience_fit: rawBody.experienceFit,
        industry_fit: rawBody.industryFit,
        seniority_fit: rawBody.seniorityFit,
        location_eligibility_fit: rawBody.locationEligibilityFit || rawBody.locationFit,
        compensation_fit: rawBody.compensationFit,
        critical_requirements: rawBody.criticalRequirements,
        preferred_requirements: rawBody.preferredRequirements,
        role_responsibilities: rawBody.roleResponsibilities,
        strong_matches: rawBody.strongMatches || rawBody.matchedSkills,
        partial_matches: rawBody.partialMatches,
        gaps: rawBody.gaps || rawBody.missingSkills,
        unknowns: rawBody.unknowns,
        important_notes: rawBody.importantNotes,
        hard_blockers: rawBody.hardBlockers,
        application_risks: rawBody.applicationRisks,
        main_risk: rawBody.mainRisk,
        best_positioning: rawBody.bestPositioning,
        best_evidence: rawBody.bestEvidence,
        analysis_summary: rawBody.analysisSummary,
        eligibility: rawBody.eligibility,
      },
      notes: rawBody.notes,
      tag: rawBody.tag,
    };

    const result = await ingestOrSaveJob(payload, 'chatgpt-bridge');
    const statusCode = result.duplicate ? 200 : 201;

    return res.status(statusCode).json({
      success: true,
      duplicate: result.duplicate,
      job_id: result.job_id,
      match_type: result.match_type,
      message: result.duplicate
        ? `Opportunity already present in your Career Tracker (${result.reason}). Updated lastSeen timestamp.`
        : `Opportunity successfully saved to Career Tracker for review.`,
      job_summary: {
        id: result.job.id,
        role: result.job.jobTitle,
        company: result.job.companyName,
        status: result.job.status,
        overallFitScore: result.job.overallFitScore ?? result.job.fitScore,
        recommendation: result.job.recommendation,
        suitabilityClassification: result.job.suitabilityClassification,
        sourcePlatform: result.job.sourcePlatform,
      },
    });
  } catch (error: any) {
    console.error('Error in ChatGPT bridge integration endpoint:', error);
    await db.addWebhookLog({
      method: 'POST',
      endpoint: '/api/integrations/chatgpt/jobs',
      status: 'validation_error',
      status_code: 422,
      message: error.message || 'Error processing ChatGPT bridge payload',
      payload_summary: JSON.stringify(req.body || {}).slice(0, 100),
    });

    return res.status(422).json({
      success: false,
      error: error.message || 'Failed to process ChatGPT opportunity submission',
    });
  }
});
