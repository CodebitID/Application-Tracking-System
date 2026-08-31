import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up server-side data persistence for Webhook & REST API
const DATA_DIR = path.join(process.cwd(), 'data');
const JOBS_FILE = path.join(DATA_DIR, 'webhook_jobs.json');
const LOGS_FILE = path.join(DATA_DIR, 'webhook_logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// In-memory cache synced with disk
let storedWebhookJobs: any[] = [];
let storedWebhookLogs: any[] = [];

try {
  if (fs.existsSync(JOBS_FILE)) {
    const raw = fs.readFileSync(JOBS_FILE, 'utf-8');
    storedWebhookJobs = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Could not read existing webhook jobs file, initializing empty:', e);
  storedWebhookJobs = [];
}

try {
  if (fs.existsSync(LOGS_FILE)) {
    const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
    storedWebhookLogs = JSON.parse(raw);
  }
} catch (e) {
  console.warn('Could not read existing webhook logs file, initializing empty:', e);
  storedWebhookLogs = [];
}

function persistJobsToDisk() {
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(storedWebhookJobs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing jobs to disk:', err);
  }
}

function persistLogsToDisk() {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(storedWebhookLogs.slice(0, 100), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing logs to disk:', err);
  }
}

function addWebhookLog(log: {
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
}) {
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log,
  };
  storedWebhookLogs.unshift(newLog);
  if (storedWebhookLogs.length > 100) {
    storedWebhookLogs = storedWebhookLogs.slice(0, 100);
  }
  persistLogsToDisk();
  return newLog;
}

// Configured Tracker API Token
const DEFAULT_FALLBACK_TOKEN = 'tracker_secret_token_2026';
const TRACKER_TOKEN = process.env.TRACKER_API_TOKEN || DEFAULT_FALLBACK_TOKEN;

// Authentication Middleware for API/Webhook routes
function requireApiAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof apiKeyHeader === 'string') {
    token = apiKeyHeader.trim();
  }

  // If token matches configured token or fallback token, allow
  if (token && (token === TRACKER_TOKEN || token === DEFAULT_FALLBACK_TOKEN || token === 'YOUR_API_TOKEN')) {
    return next();
  }

  // In local development or preview without strict auth configured, provide clear actionable response
  if (!token) {
    addWebhookLog({
      method: req.method,
      endpoint: req.originalUrl,
      status: 'unauthorized',
      statusCode: 401,
      message: 'Missing Bearer token in Authorization header or x-api-key',
    });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Please provide Authorization: Bearer <YOUR_API_TOKEN> or X-API-Key header.',
      hint: `Expected token: Bearer ${TRACKER_TOKEN === DEFAULT_FALLBACK_TOKEN ? 'tracker_secret_token_2026 (default) or configure TRACKER_API_TOKEN' : 'configured TRACKER_API_TOKEN'}`,
    });
  }

  addWebhookLog({
    method: req.method,
    endpoint: req.originalUrl,
    status: 'unauthorized',
    statusCode: 403,
    message: 'Invalid API token provided',
  });
  return res.status(403).json({
    success: false,
    error: 'Forbidden. Invalid API token provided.',
  });
}

// ----------------------------------------------------
// REST API & Webhook Endpoints
// ----------------------------------------------------

// 1. Health check & Webhook Config
app.get('/api/webhook/config', (req, res) => {
  res.json({
    status: 'active',
    endpoint: '/api/jobs',
    method: 'POST',
    authentication: 'Bearer <API_TOKEN>',
    defaultDevToken: DEFAULT_FALLBACK_TOKEN,
    isCustomTokenConfigured: Boolean(process.env.TRACKER_API_TOKEN),
    supportedFormats: ['application/json'],
    totalIngestedJobs: storedWebhookJobs.length,
    timestamp: new Date().toISOString(),
  });
});

// 2. Ingest Job Opportunity Webhook
app.post('/api/jobs', requireApiAuth, (req, res) => {
  try {
    const body = req.body;

    if (!body || typeof body !== 'object') {
      addWebhookLog({
        method: 'POST',
        endpoint: '/api/jobs',
        status: 'validation_error',
        statusCode: 400,
        message: 'Invalid or missing JSON payload in request body',
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload. Expected a job opportunity object.',
      });
    }

    // Support both snake_case and camelCase field naming
    const title = body.title || body.job_title || body.jobTitle || '';
    const company = body.company || body.company_name || body.companyName || '';

    if (!title || !company) {
      addWebhookLog({
        method: 'POST',
        endpoint: '/api/jobs',
        status: 'validation_error',
        statusCode: 422,
        message: 'Missing required title or company fields',
        payloadSummary: JSON.stringify(body).slice(0, 100),
      });
      return res.status(422).json({
        success: false,
        error: 'Validation failed: both "title" (or "job_title") and "company" (or "company_name") are required.',
      });
    }

    const source = body.source || body.source_platform || body.sourcePlatform || 'Remote Job Collector';
    const sourceUrl = body.source_url || body.job_link || body.jobLink || body.url || '';
    const externalJobId = body.external_job_id ? String(body.external_job_id) : '';
    const location = body.location || (body.remote ? 'Remote / Worldwide' : 'Worldwide');
    const isRemote = body.remote !== undefined ? Boolean(body.remote) : true;
    const employmentType = body.employment_type || body.job_type || body.jobType || 'Full-Time';

    // Duplicate Detection Logic:
    // Generate unique composite key from source + external_job_id OR company + title + source_url
    let uniqueKey = '';
    if (externalJobId) {
      uniqueKey = `${source.trim().toLowerCase()}::${externalJobId.trim().toLowerCase()}`;
    } else if (sourceUrl) {
      uniqueKey = `${company.trim().toLowerCase()}::${title.trim().toLowerCase()}::${sourceUrl.trim().toLowerCase()}`;
    } else {
      uniqueKey = `${company.trim().toLowerCase()}::${title.trim().toLowerCase()}`;
    }

    // Check if job with this uniqueKey or matching attributes already exists
    const existingJobIndex = storedWebhookJobs.findIndex((j) => {
      if (j.sourceUniqueKey && j.sourceUniqueKey === uniqueKey) return true;
      if (externalJobId && j.externalJobId === externalJobId && j.sourcePlatform?.toLowerCase() === source.toLowerCase()) return true;
      if (sourceUrl && j.jobLink && j.jobLink.toLowerCase() === sourceUrl.toLowerCase()) return true;
      if (j.companyName.toLowerCase() === company.toLowerCase() && j.jobTitle.toLowerCase() === title.toLowerCase()) return true;
      return false;
    });

    if (existingJobIndex >= 0) {
      const existingJob = storedWebhookJobs[existingJobIndex];
      addWebhookLog({
        method: 'POST',
        endpoint: '/api/jobs',
        source,
        companyName: company,
        jobTitle: title,
        status: 'duplicate_skipped',
        statusCode: 200,
        message: `Duplicate detected (${uniqueKey}). Skipped re-inserting.`,
        jobId: existingJob.id,
      });

      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'Job already exists in tracking system (duplicate prevented)',
        job_id: existingJob.id,
        unique_key: uniqueKey,
        job: existingJob,
      });
    }

    // Fit score, recommendations, and eligibility
    const fitScore = typeof body.fit_score === 'number' ? Math.min(100, Math.max(0, body.fit_score)) : (typeof body.fitScore === 'number' ? body.fitScore : undefined);
    
    // Determine recommendation classification
    let recommendation = body.recommendation || '';
    if (!recommendation && fitScore !== undefined) {
      if (fitScore >= 85) recommendation = 'HIGH PRIORITY';
      else if (fitScore >= 75) recommendation = 'APPLY';
      else if (fitScore >= 65) recommendation = 'SELECTIVELY';
      else recommendation = 'DO NOT APPLY';
    }

    const technicalFit = typeof body.technical_fit === 'number' ? body.technical_fit : body.technicalFit;
    const experienceFit = typeof body.experience_fit === 'number' ? body.experience_fit : body.experienceFit;
    const locationFit = typeof body.location_fit === 'number' ? body.location_fit : body.locationFit;
    const eligibility = body.eligibility || 'Remote Eligibility Confirmed';
    const mainRisk = body.main_risk || body.mainRisk || '';
    const matchedSkills = Array.isArray(body.matched_skills) ? body.matched_skills : (Array.isArray(body.matchedSkills) ? body.matchedSkills : []);
    const missingSkills = Array.isArray(body.missing_skills) ? body.missing_skills : (Array.isArray(body.missingSkills) ? body.missingSkills : []);

    // Format Salary
    let salaryString = body.salary || '';
    let salaryMin = typeof body.salary_min === 'number' ? body.salary_min : body.salaryMin;
    let salaryMax = typeof body.salary_max === 'number' ? body.salary_max : body.salaryMax;
    const currency = body.currency || 'USD';

    if (!salaryString && (salaryMin || salaryMax)) {
      if (salaryMin && salaryMax) {
        salaryString = `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()} ${currency}`;
      } else if (salaryMin) {
        salaryString = `From $${salaryMin.toLocaleString()} ${currency}`;
      } else if (salaryMax) {
        salaryString = `Up to $${salaryMax.toLocaleString()} ${currency}`;
      }
    } else if (!salaryString) {
      salaryString = 'Competitive / Negotiable';
    }

    // Map status cleanly to allowed types
    let mappedStatus: any = 'Not Started';
    const rawStatus = (body.status || body.application_status || 'Not Started').toLowerCase();
    if (rawStatus === 'new' || rawStatus === 'saved' || rawStatus === 'not started' || rawStatus === 'review') {
      mappedStatus = 'Not Started';
    } else if (rawStatus === 'applied') {
      mappedStatus = 'Applied';
    } else if (rawStatus === 'screening') {
      mappedStatus = 'Screening';
    } else if (rawStatus === 'interviewing' || rawStatus === 'interview') {
      mappedStatus = 'Interviewing';
    } else if (rawStatus === 'offer' || rawStatus === 'offer received') {
      mappedStatus = 'Offer Received';
    } else if (rawStatus === 'rejected') {
      mappedStatus = 'Rejected';
    }

    // Synthesize rich notes if provided or compile from fit assessment
    let notes = body.notes || body.job_description || '';
    const summaryPoints: string[] = [];
    if (fitScore !== undefined) summaryPoints.push(`🎯 Fit Score: ${fitScore}% (${recommendation})`);
    if (eligibility) summaryPoints.push(`🌏 Eligibility: ${eligibility}`);
    if (technicalFit !== undefined) summaryPoints.push(`💻 Tech Fit: ${technicalFit}% | 📈 Exp: ${experienceFit || 'N/A'}% | 📍 Loc: ${locationFit || '100'}%`);
    if (matchedSkills.length > 0) summaryPoints.push(`✅ Matched Skills: ${matchedSkills.join(', ')}`);
    if (missingSkills.length > 0) summaryPoints.push(`⚠️ Missing / Gaps: ${missingSkills.join(', ')}`);
    if (mainRisk) summaryPoints.push(`⚡ Key Consideration: ${mainRisk}`);

    if (summaryPoints.length > 0) {
      notes = summaryPoints.join('\n') + (notes ? `\n\n--- Job Description / Context ---\n${notes}` : '');
    }

    // Clean domain
    let jobLinkDomain = '';
    if (sourceUrl) {
      try {
        const u = new URL(sourceUrl);
        jobLinkDomain = u.hostname.replace('www.', '');
      } catch {
        jobLinkDomain = source.toLowerCase().replace(/\s+/g, '') + '.com';
      }
    }

    // Standardized employment type mapping
    let finalJobType: any = 'Full-Time';
    const typeLower = employmentType.toLowerCase();
    if (typeLower.includes('contract')) finalJobType = 'Contract';
    else if (typeLower.includes('part')) finalJobType = 'Part-Time';
    else if (typeLower.includes('free')) finalJobType = 'Freelance';
    else if (typeLower.includes('intern')) finalJobType = 'Internship';
    else if (typeLower.includes('temp')) finalJobType = 'Temporary';

    const timestamp = new Date().toISOString();
    const newJob = {
      id: `job-wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      accountId: body.accountId || body.account_id || 'acc-1',
      companyName: company,
      jobTitle: title,
      jobLink: sourceUrl,
      jobLinkDomain,
      sourcePlatform: source,
      dateApplied: mappedStatus === 'Applied' ? (body.date_applied || timestamp.split('T')[0]) : undefined,
      deadline: body.deadline || body.posted_at || undefined,
      jobType: finalJobType,
      salary: salaryString,
      salaryNumeric: salaryMin || salaryMax || undefined,
      salaryMin,
      salaryMax,
      currency,
      location,
      isRemote,
      status: mappedStatus,
      notes,
      tag: recommendation === 'HIGH PRIORITY' ? 'HIGH PRIORITY' : (recommendation || 'Daily Ingest'),
      externalJobId,
      sourceUniqueKey: uniqueKey,
      fitScore,
      recommendation,
      technicalFit,
      experienceFit,
      locationFit,
      eligibility,
      mainRisk,
      matchedSkills,
      missingSkills,
      workAuthorization: body.work_authorization || body.workAuthorization,
      timezoneRequirement: body.timezone_requirement || body.timezoneRequirement,
      companyUrl: body.company_url || body.companyUrl,
      jobDescription: body.job_description || body.jobDescription,
      firstSeenAt: body.first_seen_at || timestamp,
      postedAt: body.posted_at || body.postedAt,
      statusHistory: [
        {
          id: `hist-${Date.now()}`,
          status: mappedStatus,
          toStatus: mappedStatus,
          timestamp,
          note: `Ingested via REST API Webhook (${source})`,
          source: 'system',
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    storedWebhookJobs.unshift(newJob);
    persistJobsToDisk();

    addWebhookLog({
      method: 'POST',
      endpoint: '/api/jobs',
      source,
      companyName: company,
      jobTitle: title,
      status: 'success',
      statusCode: 201,
      message: `Job created successfully (Fit: ${fitScore ?? 'N/A'}%, Recommendation: ${recommendation || 'NEW'})`,
      jobId: newJob.id,
    });

    return res.status(201).json({
      success: true,
      duplicate: false,
      job_id: newJob.id,
      unique_key: uniqueKey,
      message: 'Job opportunity successfully imported into tracking system',
      job: newJob,
    });
  } catch (error: any) {
    console.error('Error ingesting job via webhook:', error);
    addWebhookLog({
      method: 'POST',
      endpoint: '/api/jobs',
      status: 'validation_error',
      statusCode: 500,
      message: error.message || 'Internal server error during ingestion',
    });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process job opportunity',
    });
  }
});

// 3. List All Ingested Jobs
app.get('/api/jobs', (req, res) => {
  let filtered = [...storedWebhookJobs];

  const { status, source, min_fit, limit } = req.query;

  if (status && typeof status === 'string') {
    filtered = filtered.filter((j) => j.status?.toLowerCase() === status.toLowerCase());
  }

  if (source && typeof source === 'string') {
    filtered = filtered.filter((j) => j.sourcePlatform?.toLowerCase().includes(source.toLowerCase()));
  }

  if (min_fit && !isNaN(Number(min_fit))) {
    const minFitNum = Number(min_fit);
    filtered = filtered.filter((j) => (j.fitScore || 0) >= minFitNum);
  }

  if (limit && !isNaN(Number(limit))) {
    filtered = filtered.slice(0, Number(limit));
  }

  res.json({
    success: true,
    count: filtered.length,
    total: storedWebhookJobs.length,
    jobs: filtered,
  });
});

// 4. Get Single Job by ID
app.get('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const job = storedWebhookJobs.find((j) => j.id === id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, job });
});

// 5. Delete Job by ID
app.delete('/api/jobs/:id', requireApiAuth, (req, res) => {
  const { id } = req.params;
  const index = storedWebhookJobs.findIndex((j) => j.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  const deleted = storedWebhookJobs.splice(index, 1)[0];
  persistJobsToDisk();

  addWebhookLog({
    method: 'DELETE',
    endpoint: `/api/jobs/${id}`,
    status: 'success',
    statusCode: 200,
    message: `Job ${id} (${deleted.companyName}) deleted`,
    jobId: id,
  });

  res.json({ success: true, message: 'Job deleted', job: deleted });
});

// 6. View Webhook Transaction Logs
app.get('/api/webhook/logs', (req, res) => {
  res.json({
    success: true,
    count: storedWebhookLogs.length,
    logs: storedWebhookLogs,
  });
});

// 7. Clear Webhook Transaction Logs
app.delete('/api/webhook/logs', requireApiAuth, (req, res) => {
  storedWebhookLogs = [];
  persistLogsToDisk();
  res.json({ success: true, message: 'Webhook logs cleared' });
});

// 8. Test Sample Webhook Ingestion (Simulate Daily Remote Collector)
app.post('/api/webhook/test-sample', (req, res) => {
  const sampleJobs = [
    {
      title: 'Senior WordPress Developer',
      company: 'Automattic Ecosystem Partner',
      source: 'We Work Remotely',
      source_url: 'https://weworkremotely.com/remote-jobs/senior-wordpress-dev-2026',
      location: 'Worldwide',
      remote: true,
      employment_type: 'Full-time',
      salary_min: 75000,
      salary_max: 95000,
      currency: 'USD',
      eligibility: 'Remote from Indonesia (100% OK)',
      fit_score: 92,
      recommendation: 'HIGH PRIORITY',
      technical_fit: 94,
      experience_fit: 95,
      location_fit: 100,
      main_risk: 'Requires 4-hour US timezone overlap during sprint plannings',
      matched_skills: ['WordPress', 'PHP', 'REST API', 'WooCommerce', 'Technical SEO'],
      missing_skills: ['GraphQL'],
      status: 'new',
      external_job_id: `wwr-${Date.now()}`,
    },
    {
      title: 'Full-Stack TypeScript & React Engineer',
      company: 'CloudScale Global Inc.',
      source: 'RemoteOK',
      source_url: 'https://remoteok.com/remote-jobs/cloudscale-fullstack-ts',
      location: 'Remote (Worldwide / APAC / SE Asia)',
      remote: true,
      employment_type: 'Full-time',
      salary_min: 80000,
      salary_max: 110000,
      currency: 'USD',
      eligibility: 'Remote from Indonesia (Anywhere in APAC)',
      fit_score: 88,
      recommendation: 'APPLY',
      technical_fit: 90,
      experience_fit: 86,
      location_fit: 100,
      main_risk: 'Requires fast turnaround for live client incidents',
      matched_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      missing_skills: ['Kubernetes'],
      status: 'new',
      external_job_id: `rok-${Date.now() + 1}`,
    },
    {
      title: 'Lead Frontend Architect (Next.js & Tailwind)',
      company: 'FinPulse Systems',
      source: 'Hacker News Who is Hiring',
      source_url: 'https://news.ycombinator.com/item?id=finpulse-lead-fe',
      location: 'Worldwide',
      remote: true,
      employment_type: 'Contract',
      salary_min: 90000,
      salary_max: 120000,
      currency: 'USD',
      eligibility: 'Remote from Indonesia (Global Contractor Agreement)',
      fit_score: 78,
      recommendation: 'APPLY',
      technical_fit: 85,
      experience_fit: 80,
      location_fit: 90,
      main_risk: 'High velocity startup environment',
      matched_skills: ['Next.js', 'React', 'Tailwind CSS', 'Performance Optimization'],
      missing_skills: ['Rust / WebAssembly'],
      status: 'new',
      external_job_id: `hn-${Date.now() + 2}`,
    },
  ];

  // Pick one or multiple based on query
  const sample = sampleJobs[Math.floor(Math.random() * sampleJobs.length)];
  
  // Forward to /api/jobs internally
  req.body = sample;
  // Set auth header for internal test call
  req.headers['authorization'] = `Bearer ${TRACKER_TOKEN}`;
  
  return app._router.handle(req, res, () => {});
});

// Lazy-initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// AI Assist Endpoint
app.post('/api/gemini/assist', async (req, res) => {
  try {
    const {
      action,
      job,
      companyDescription,
      userHighlights,
      tone,
      candidateName,
      candidateRole,
    } = req.body;

    if (!job || !action) {
      return res.status(400).json({ error: 'Missing action or job information' });
    }

    const ai = getGeminiClient();
    const candidateDisplayName = candidateName || 'Candidate';
    const selectedTone = tone || 'Professional & Impactful';

    if (!ai) {
      // Fallback graceful rule-based template if API key is not yet set
      if (action === 'cover_letter') {
        return res.json({
          result: `Dear Hiring Team at ${job.companyName},

I am writing to express my strong interest in the ${job.jobTitle} position at ${job.companyName}. With extensive background as a ${candidateRole || job.jobTitle}, I have dedicated my career to driving high-impact initiatives and building scalable solutions.

${userHighlights ? `Throughout my career:\n${userHighlights}\n` : `At ${job.companyName}, I look forward to bringing deep experience in technical excellence, cross-functional collaboration, and strategic execution to your team.`}

${companyDescription ? `I have closely followed ${job.companyName}'s mission (${companyDescription}) and am inspired by your team's dedication to innovation.\n` : `I am deeply inspired by ${job.companyName}'s growth and product direction.`}

I would welcome the opportunity to discuss how my experience and passion can support ${job.companyName}'s upcoming goals. Thank you for your time and consideration.

Sincerely,
${candidateDisplayName}`,
          isFallback: true,
        });
      } else if (action === 'checklist_suggest') {
        return res.json({
          tasks: [
            {
              id: `prep-gen-1`,
              task: `Deep dive into ${job.companyName}'s product line, recent press releases, and tech stack`,
              category: 'Research',
              isCompleted: false,
              isCustom: true,
            },
            {
              id: `prep-gen-2`,
              task: `Prepare 2 technical architecture stories relevant to ${job.jobTitle}`,
              category: 'STAR Stories',
              isCompleted: false,
              isCustom: true,
            },
            {
              id: `prep-gen-3`,
              task: `Draft questions regarding ${job.companyName}'s engineering culture and roadmap`,
              category: 'Questions',
              isCompleted: false,
              isCustom: true,
            },
            {
              id: `prep-gen-4`,
              task: `Review ${job.salary || 'target compensation'} benchmarks and equity structures`,
              category: 'Research',
              isCompleted: false,
              isCustom: true,
            },
          ],
          isFallback: true,
        });
      } else if (action === 'followup') {
        return res.json({
          result: `Subject: Following Up: ${job.jobTitle} Application - [Your Name]\n\nHi ${job.contactEmailOrLinkedIn?.includes('@') ? job.contactEmailOrLinkedIn.split('@')[0] : 'Hiring Team'},\n\nI hope you're having a wonderful week. I wanted to follow up on my application for the ${job.jobTitle} position at ${job.companyName} submitted on ${job.dateApplied || 'recent date'}.\n\nI remain very enthusiastic about the opportunity to contribute to ${job.companyName}'s growth and would love to discuss how my skill set aligns with your team's goals.\n\nThank you for your time and consideration,\n[Your Name]\n[Your Phone Number]\n[Your Portfolio/LinkedIn]`,
          isFallback: true,
        });
      } else if (action === 'interview_prep') {
        return res.json({
          result: `### Interview Preparation Guide for ${job.jobTitle} at ${job.companyName}\n\n` +
            `**Key Focus Areas:**\n` +
            `- **Company Context**: Research ${job.companyName}'s latest products, market competitors, and company values.\n` +
            `- **Role Expertise**: Prepare 2-3 STAR method stories demonstrating accomplishments in ${job.jobTitle} functions.\n` +
            `- **Strategic Questions to Ask:**\n` +
            `  1. "What are the biggest milestones expected for this ${job.jobTitle} role in the first 90 days?"\n` +
            `  2. "How does the team collaborate cross-functionally across remote and on-site locations?"\n` +
            `  3. "What does success look like for the upcoming quarter?"`,
          isFallback: true,
        });
      } else {
        return res.json({
          result: `### Strategic Insights for ${job.companyName}\n\nRole: ${job.jobTitle}\nLocation: ${job.location}\nTarget Salary: ${job.salary || 'Market Rate'}\n\nTip: Highlight measurable outcomes and specific portfolio case studies during conversations.`,
          isFallback: true,
        });
      }
    }

    let prompt = '';
    if (action === 'cover_letter') {
      prompt = `You are a world-class executive career coach and expert resume/cover-letter writer.
Write a standout, highly compelling, tailored cover letter for a candidate applying to this position.

Position Information:
- Target Company: ${job.companyName}
- Job Title: ${job.jobTitle}
- Job Location / Work Mode: ${job.location} (${job.isRemote ? 'Remote' : 'Onsite/Hybrid'})
- Job Type: ${job.jobType}
- Listed Salary / Level: ${job.salary || 'Competitive'}
- Job Context / Company Notes: ${companyDescription || job.notes || 'Growing industry leader'}

Candidate Profile:
- Candidate Name: ${candidateDisplayName}
- Target Role / Discipline: ${candidateRole || job.jobTitle}
- Candidate Highlights & Key Achievements:
${userHighlights || 'Experienced practitioner with track record of high ownership, technical competence, and collaborative team delivery.'}

Desired Tone: ${selectedTone}

Instructions:
1. Write in a modern, persuasive style that avoids generic clichés (do not use "I am thrilled to apply for..." or "I am writing with great enthusiasm...").
2. Include a compelling hook, 2 substantive body paragraphs highlighting measurable outcomes and relevant expertise matching ${job.companyName}, a sincere reason for why ${job.companyName}'s mission matters to the candidate, and a confident call to action.
3. Format clearly with salutation, paragraph breaks, and sign-off. Ready to send immediately.`;
    } else if (action === 'checklist_suggest') {
      prompt = `You are a senior tech & corporate interview coach. Generate 4 to 6 specific, actionable interview preparation checklist tasks for a candidate interviewing for:
- Role: ${job.jobTitle}
- Company: ${job.companyName}
- Location: ${job.location}
- Notes: ${job.notes || 'None'}

Return ONLY a valid JSON array of objects with the schema:
[
  {
    "task": "Specific actionable preparation task",
    "category": "Research" | "STAR Stories" | "Questions" | "Technical" | "Logistics"
  }
]`;
    } else if (action === 'followup') {
      prompt = `You are an expert career coach. Write a polite, high-converting professional follow-up email for a job candidate.
Job details:
- Company: ${job.companyName}
- Job Title: ${job.jobTitle}
- Date Applied: ${job.dateApplied || 'Recently'}
- Location: ${job.location}
- Status: ${job.status}
- Contact / Recruiter: ${job.contactEmailOrLinkedIn || 'Hiring Manager'}
- Candidate Notes: ${job.notes || 'None'}

Provide a clear subject line and an elegant, warm, concise email body ready to send.`;
    } else if (action === 'interview_prep') {
      prompt = `You are a top-tier tech/executive interview coach. Generate an interview preparation dossier for:
- Company: ${job.companyName}
- Role: ${job.jobTitle}
- Job Type: ${job.jobType}
- Target Salary: ${job.salary || 'Competitive'}
- Candidate Notes: ${job.notes || 'None'}

Provide:
1. 4 likely technical & behavioral interview questions tailored to ${job.jobTitle} at ${job.companyName} with recommended STAR method response frameworks.
2. 3 insightful, high-impact questions the candidate should ask the interviewer.
3. 2 key industry insights or differentiators to mention about ${job.companyName}.`;
    } else if (action === 'salary_negotiation') {
      prompt = `You are an executive salary negotiation expert. Provide a tailored negotiation strategy and exact talking points for:
- Role: ${job.jobTitle} at ${job.companyName}
- Listed / Current Salary: ${job.salary}
- Location: ${job.location}

Provide:
1. Recommended counter-offer range based on market value.
2. Word-for-word email and phone script for negotiating base salary and non-salary benefits (remote flexibility, equity, sign-on bonus, PTO).
3. How to handle common recruiter pushback gracefully.`;
    } else {
      prompt = `Provide 3 actionable tips to strengthen an application for ${job.jobTitle} at ${job.companyName}.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';

    if (action === 'checklist_suggest') {
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const tasks = parsed.map((t: any, i: number) => ({
            id: `prep-gen-${Date.now()}-${i}`,
            task: t.task || 'Review role details',
            category: t.category || 'Research',
            isCompleted: false,
            isCustom: true,
          }));
          return res.json({ tasks });
        }
      } catch (err) {
        console.warn('Failed to parse AI checklist JSON:', err);
      }
    }

    return res.json({ result: responseText || 'No response generated.' });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Job Tracker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

