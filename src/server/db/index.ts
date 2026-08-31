import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { DATABASE_URL } from '../config';
import { INITIAL_JOBS } from '../../data/initialJobs';

export interface DbJobRecord {
  id: string;
  company_name: string;
  job_title: string;
  normalized_company: string;
  normalized_title: string;
  job_link?: string | null;
  normalized_source_url?: string | null;
  job_link_domain?: string | null;
  source_platform: string;
  external_job_id?: string | null;
  company_url?: string | null;
  location: string;
  is_remote: boolean | number;
  job_type: string;
  salary?: string | null;
  salary_numeric?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  status: string;
  notes?: string | null;
  tag?: string | null;
  date_applied?: string | null;
  deadline?: string | null;
  posted_at?: string | null;
  interview_date?: string | null;
  contact_email_or_linkedin?: string | null;
  first_seen_at: string;
  last_seen_at: string;

  // Analysis V2 Fields
  overall_fit_score?: number | null;
  fit_score?: number | null;
  suitability_classification?: string | null;
  recommendation?: string | null;
  technical_fit?: number | null;
  experience_fit?: number | null;
  industry_fit?: number | null;
  seniority_fit?: number | null;
  location_eligibility_fit?: number | null;
  compensation_fit?: number | null;
  location_fit?: number | null;
  eligibility?: string | null;

  // Structured Lists (JSON strings)
  critical_requirements?: string | null;
  preferred_requirements?: string | null;
  role_responsibilities?: string | null;
  strong_matches?: string | null;
  partial_matches?: string | null;
  gaps?: string | null;
  unknowns?: string | null;
  important_notes?: string | null;
  hard_blockers?: string | null;
  application_risks?: string | null;
  analysis_json?: string | null;

  // Requirements & Restrictions
  work_authorization?: string | null;
  country_restrictions?: string | null;
  timezone_requirement?: string | null;
  relocation_expectation?: string | null;
  language_requirement?: string | null;
  degree_requirement?: string | null;
  certification_requirement?: string | null;

  // Decision & Strategy
  best_positioning?: string | null;
  best_evidence?: string | null;
  main_risk?: string | null;
  analysis_summary?: string | null;
  job_description?: string | null;

  // Ingestion Metadata
  ingestion_source?: string | null;
  analysis_version?: string | null;
  automatically_discovered?: boolean | number;
  source_unique_key?: string | null;

  // Relational sub-collections (JSON strings)
  contacts_json?: string | null;
  reminders_json?: string | null;
  status_history_json?: string | null;
  prep_checklist_json?: string | null;
  cover_letters_json?: string | null;

  created_at: string;
  updated_at: string;
}

export interface DbWebhookLogRecord {
  id: string;
  method: string;
  endpoint: string;
  source?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  status: string;
  status_code: number;
  message: string;
  job_id?: string | null;
  payload_summary?: string | null;
  created_at: string;
}

class DatabaseManager {
  private prisma: PrismaClient | null = null;
  private sqliteDb: SqlJsDatabase | null = null;
  private sqliteFilePath: string = '';
  private isPrismaPg: boolean = false;
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    // Check if PostgreSQL DATABASE_URL is configured
    if (DATABASE_URL && (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://'))) {
      try {
        console.log('Connecting to PostgreSQL database with Prisma ORM...');
        this.prisma = new PrismaClient({
          datasources: {
            db: {
              url: DATABASE_URL,
            },
          },
        });
        await this.prisma.$connect();
        this.isPrismaPg = true;
        console.log('✅ Connected to PostgreSQL database via Prisma ORM.');
        this.initialized = true;
        return;
      } catch (err) {
        console.warn('⚠️ Could not connect via Prisma PostgreSQL, falling back to embedded SQLite database:', err);
        if (this.prisma) {
          await this.prisma.$disconnect().catch(() => {});
          this.prisma = null;
        }
        this.isPrismaPg = false;
      }
    }

    // Embedded SQLite fallback
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.sqliteFilePath = path.join(dataDir, 'career_tracker.sqlite');

    const SQL = await initSqlJs();
    if (fs.existsSync(this.sqliteFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(this.sqliteFilePath);
        this.sqliteDb = new SQL.Database(fileBuffer);
      } catch (e) {
        console.warn('Failed reading existing sqlite file, creating fresh database:', e);
        this.sqliteDb = new SQL.Database();
      }
    } else {
      this.sqliteDb = new SQL.Database();
    }

    this.createSqliteTables();
    this.persistSqliteToDisk();
    console.log(`✅ Embedded relational SQLite database initialized at ${this.sqliteFilePath}`);
    this.initialized = true;
  }

  public getPrismaClient(): PrismaClient | null {
    return this.prisma;
  }

  public isConnected(): boolean {
    return this.initialized && (this.isPrismaPg ? this.prisma !== null : this.sqliteDb !== null);
  }

  public getEngine(): 'prisma-postgres' | 'sqlite' {
    return this.isPrismaPg ? 'prisma-postgres' : 'sqlite';
  }

  private persistSqliteToDisk(): void {
    if (this.sqliteDb && this.sqliteFilePath) {
      try {
        const data = this.sqliteDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.sqliteFilePath, buffer);
      } catch (err) {
        console.error('Failed writing SQLite database to disk:', err);
      }
    }
  }

  private createSqliteTables(): void {
    if (!this.sqliteDb) return;
    const sql = `
      CREATE TABLE IF NOT EXISTS job_applications (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        job_title TEXT NOT NULL,
        normalized_company TEXT NOT NULL,
        normalized_title TEXT NOT NULL,
        job_link TEXT,
        normalized_source_url TEXT,
        job_link_domain TEXT,
        source_platform TEXT NOT NULL,
        external_job_id TEXT,
        company_url TEXT,
        location TEXT NOT NULL,
        is_remote INTEGER DEFAULT 1,
        job_type TEXT DEFAULT 'Full-Time',
        salary TEXT,
        salary_numeric REAL,
        salary_min REAL,
        salary_max REAL,
        currency TEXT DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'Not Started',
        notes TEXT,
        tag TEXT,
        date_applied TEXT,
        deadline TEXT,
        posted_at TEXT,
        interview_date TEXT,
        contact_email_or_linkedin TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,

        overall_fit_score REAL,
        fit_score REAL,
        suitability_classification TEXT,
        recommendation TEXT,
        technical_fit REAL,
        experience_fit REAL,
        industry_fit REAL,
        seniority_fit REAL,
        location_eligibility_fit REAL,
        compensation_fit REAL,
        location_fit REAL,
        eligibility TEXT,

        critical_requirements TEXT,
        preferred_requirements TEXT,
        role_responsibilities TEXT,
        strong_matches TEXT,
        partial_matches TEXT,
        gaps TEXT,
        unknowns TEXT,
        important_notes TEXT,
        hard_blockers TEXT,
        application_risks TEXT,
        analysis_json TEXT,

        work_authorization TEXT,
        country_restrictions TEXT,
        timezone_requirement TEXT,
        relocation_expectation TEXT,
        language_requirement TEXT,
        degree_requirement TEXT,
        certification_requirement TEXT,

        best_positioning TEXT,
        best_evidence TEXT,
        main_risk TEXT,
        analysis_summary TEXT,
        job_description TEXT,

        ingestion_source TEXT DEFAULT 'manual',
        analysis_version TEXT DEFAULT 'v2',
        automatically_discovered INTEGER DEFAULT 0,
        source_unique_key TEXT,

        contacts_json TEXT,
        reminders_json TEXT,
        status_history_json TEXT,
        prep_checklist_json TEXT,
        cover_letters_json TEXT,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_source_ext ON job_applications (source_platform, external_job_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_norm_url ON job_applications (normalized_source_url);
      CREATE INDEX IF NOT EXISTS idx_jobs_comp_title ON job_applications (normalized_company, normalized_title);
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_applications (status);
      CREATE INDEX IF NOT EXISTS idx_jobs_fit_score ON job_applications (overall_fit_score);
      CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON job_applications (created_at);

      CREATE TABLE IF NOT EXISTS webhook_logs (
        id TEXT PRIMARY KEY,
        method TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        source TEXT,
        company_name TEXT,
        job_title TEXT,
        status TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        message TEXT NOT NULL,
        job_id TEXT,
        payload_summary TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_logs_created_at ON webhook_logs (created_at);
    `;
    this.sqliteDb.run(sql);

    // Dynamic Column Migration for SQLite if table previously existed with fewer columns
    try {
      const existingCols = new Set<string>();
      const stmt = this.sqliteDb.prepare('PRAGMA table_info(job_applications)');
      while (stmt.step()) {
        const row = stmt.getAsObject();
        if (row.name) existingCols.add(String(row.name));
      }
      stmt.free();

      const expectedColumns: Record<string, string> = {
        normalized_company: 'TEXT DEFAULT ""',
        normalized_title: 'TEXT DEFAULT ""',
        normalized_source_url: 'TEXT',
        job_link_domain: 'TEXT',
        external_job_id: 'TEXT',
        company_url: 'TEXT',
        salary_numeric: 'REAL',
        salary_min: 'REAL',
        salary_max: 'REAL',
        currency: 'TEXT DEFAULT "USD"',
        date_applied: 'TEXT',
        deadline: 'TEXT',
        posted_at: 'TEXT',
        interview_date: 'TEXT',
        contact_email_or_linkedin: 'TEXT',
        overall_fit_score: 'REAL',
        fit_score: 'REAL',
        suitability_classification: 'TEXT',
        recommendation: 'TEXT',
        technical_fit: 'REAL',
        experience_fit: 'REAL',
        industry_fit: 'REAL',
        seniority_fit: 'REAL',
        location_eligibility_fit: 'REAL',
        compensation_fit: 'REAL',
        location_fit: 'REAL',
        eligibility: 'TEXT',
        critical_requirements: 'TEXT',
        preferred_requirements: 'TEXT',
        role_responsibilities: 'TEXT',
        strong_matches: 'TEXT',
        partial_matches: 'TEXT',
        gaps: 'TEXT',
        unknowns: 'TEXT',
        important_notes: 'TEXT',
        hard_blockers: 'TEXT',
        application_risks: 'TEXT',
        analysis_json: 'TEXT',
        work_authorization: 'TEXT',
        country_restrictions: 'TEXT',
        timezone_requirement: 'TEXT',
        relocation_expectation: 'TEXT',
        language_requirement: 'TEXT',
        degree_requirement: 'TEXT',
        certification_requirement: 'TEXT',
        best_positioning: 'TEXT',
        best_evidence: 'TEXT',
        main_risk: 'TEXT',
        analysis_summary: 'TEXT',
        job_description: 'TEXT',
        ingestion_source: 'TEXT DEFAULT "manual"',
        analysis_version: 'TEXT DEFAULT "v2"',
        automatically_discovered: 'INTEGER DEFAULT 0',
        source_unique_key: 'TEXT',
        contacts_json: 'TEXT',
        reminders_json: 'TEXT',
        status_history_json: 'TEXT',
        prep_checklist_json: 'TEXT',
        cover_letters_json: 'TEXT',
      };

      for (const [colName, colType] of Object.entries(expectedColumns)) {
        if (!existingCols.has(colName)) {
          this.sqliteDb.run(`ALTER TABLE job_applications ADD COLUMN ${colName} ${colType}`);
        }
      }
    } catch (e) {
      console.warn('Column check completed:', e);
    }
  }

  // --- MAP HELPER: Prisma Model <-> DbJobRecord ---
  private prismaToDbJob(p: any): DbJobRecord {
    return {
      id: p.id,
      company_name: p.companyName,
      job_title: p.jobTitle,
      normalized_company: p.normalizedCompany,
      normalized_title: p.normalizedTitle,
      job_link: p.jobLink,
      normalized_source_url: p.normalizedSourceUrl,
      job_link_domain: p.jobLinkDomain,
      source_platform: p.sourcePlatform,
      external_job_id: p.externalJobId,
      company_url: p.companyUrl,
      location: p.location,
      is_remote: p.isRemote ? 1 : 0,
      job_type: p.jobType,
      salary: p.salary,
      salary_numeric: p.salaryNumeric,
      salary_min: p.salaryMin,
      salary_max: p.salaryMax,
      currency: p.currency,
      status: p.status,
      notes: p.notes,
      tag: p.tag,
      date_applied: p.dateApplied,
      deadline: p.deadline,
      posted_at: p.postedAt,
      interview_date: p.interviewDate,
      contact_email_or_linkedin: p.contactEmailOrLinkedIn,
      first_seen_at: p.firstSeenAt,
      last_seen_at: p.lastSeenAt,

      overall_fit_score: p.overallFitScore,
      fit_score: p.fitScore ?? p.overallFitScore,
      suitability_classification: p.suitabilityClassification,
      recommendation: p.recommendation,
      technical_fit: p.technicalFit,
      experience_fit: p.experienceFit,
      industry_fit: p.industryFit,
      seniority_fit: p.seniorityFit,
      location_eligibility_fit: p.locationEligibilityFit,
      compensation_fit: p.compensationFit,
      location_fit: p.locationFit ?? p.locationEligibilityFit,
      eligibility: p.eligibility,

      critical_requirements: p.criticalRequirements,
      preferred_requirements: p.preferredRequirements,
      role_responsibilities: p.roleResponsibilities,
      strong_matches: p.strongMatches,
      partial_matches: p.partialMatches,
      gaps: p.gaps,
      unknowns: p.unknowns,
      important_notes: p.importantNotes,
      hard_blockers: p.hardBlockers,
      application_risks: p.applicationRisks,
      analysis_json: p.analysisJson,

      work_authorization: p.workAuthorization,
      country_restrictions: p.countryRestrictions,
      timezone_requirement: p.timezoneRequirement,
      relocation_expectation: p.relocationExpectation,
      language_requirement: p.languageRequirement,
      degree_requirement: p.degreeRequirement,
      certification_requirement: p.certificationRequirement,

      best_positioning: p.bestPositioning,
      best_evidence: p.bestEvidence,
      main_risk: p.mainRisk,
      analysis_summary: p.analysisSummary,
      job_description: p.jobDescription,

      ingestion_source: p.ingestionSource,
      analysis_version: p.analysisVersion,
      automatically_discovered: p.automaticallyDiscovered ? 1 : 0,
      source_unique_key: p.sourceUniqueKey,

      contacts_json: p.contactsJson,
      reminders_json: p.remindersJson,
      status_history_json: p.statusHistoryJson,
      prep_checklist_json: p.prepChecklistJson,
      cover_letters_json: p.coverLettersJson,

      created_at: p.createdAt,
      updated_at: p.updatedAt,
    };
  }

  private dbJobToPrisma(job: DbJobRecord): any {
    return {
      id: job.id,
      companyName: job.company_name,
      jobTitle: job.job_title,
      normalizedCompany: job.normalized_company,
      normalizedTitle: job.normalized_title,
      jobLink: job.job_link || null,
      normalizedSourceUrl: job.normalized_source_url || null,
      jobLinkDomain: job.job_link_domain || null,
      sourcePlatform: job.source_platform,
      externalJobId: job.external_job_id || null,
      companyUrl: job.company_url || null,
      location: job.location,
      isRemote: Boolean(job.is_remote),
      jobType: job.job_type || 'Full-Time',
      salary: job.salary || null,
      salaryNumeric: job.salary_numeric || null,
      salaryMin: job.salary_min || null,
      salaryMax: job.salary_max || null,
      currency: job.currency || 'USD',
      status: job.status || 'Not Started',
      notes: job.notes || null,
      tag: job.tag || null,
      dateApplied: job.date_applied || null,
      deadline: job.deadline || null,
      postedAt: job.posted_at || null,
      interviewDate: job.interview_date || null,
      contactEmailOrLinkedIn: job.contact_email_or_linkedin || null,
      firstSeenAt: job.first_seen_at,
      lastSeenAt: job.last_seen_at,

      overallFitScore: job.overall_fit_score ?? job.fit_score ?? null,
      fitScore: job.fit_score ?? job.overall_fit_score ?? null,
      suitabilityClassification: job.suitability_classification || null,
      recommendation: job.recommendation || null,
      technicalFit: job.technical_fit || null,
      experienceFit: job.experience_fit || null,
      industryFit: job.industry_fit || null,
      seniorityFit: job.seniority_fit || null,
      locationEligibilityFit: job.location_eligibility_fit || null,
      compensationFit: job.compensation_fit || null,
      locationFit: job.location_fit || job.location_eligibility_fit || null,
      eligibility: job.eligibility || null,

      criticalRequirements: job.critical_requirements || null,
      preferredRequirements: job.preferred_requirements || null,
      roleResponsibilities: job.role_responsibilities || null,
      strongMatches: job.strong_matches || null,
      partialMatches: job.partial_matches || null,
      gaps: job.gaps || null,
      unknowns: job.unknowns || null,
      importantNotes: job.important_notes || null,
      hardBlockers: job.hard_blockers || null,
      applicationRisks: job.application_risks || null,
      analysisJson: job.analysis_json || null,

      workAuthorization: job.work_authorization || null,
      countryRestrictions: job.country_restrictions || null,
      timezoneRequirement: job.timezone_requirement || null,
      relocationExpectation: job.relocation_expectation || null,
      languageRequirement: job.language_requirement || null,
      degreeRequirement: job.degree_requirement || null,
      certificationRequirement: job.certification_requirement || null,

      bestPositioning: job.best_positioning || null,
      bestEvidence: job.best_evidence || null,
      mainRisk: job.main_risk || null,
      analysisSummary: job.analysis_summary || null,
      jobDescription: job.job_description || null,

      ingestionSource: job.ingestion_source || 'api',
      analysisVersion: job.analysis_version || 'v2',
      automaticallyDiscovered: Boolean(job.automatically_discovered),
      sourceUniqueKey: job.source_unique_key || null,

      contactsJson: job.contacts_json || null,
      remindersJson: job.reminders_json || null,
      statusHistoryJson: job.status_history_json || null,
      prepChecklistJson: job.prep_checklist_json || null,
      coverLettersJson: job.cover_letters_json || null,

      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  }

  // --- JOB QUERIES ---
  async getAllJobs(): Promise<DbJobRecord[]> {
    await this.init();
    if (this.isPrismaPg && this.prisma) {
      const records = await this.prisma.jobApplication.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return records.map((r) => this.prismaToDbJob(r));
    }
    if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('SELECT * FROM job_applications ORDER BY created_at DESC');
      const rows: DbJobRecord[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as DbJobRecord);
      }
      stmt.free();
      return rows;
    }
    return [];
  }

  async getJobById(id: string): Promise<DbJobRecord | null> {
    await this.init();
    if (this.isPrismaPg && this.prisma) {
      const r = await this.prisma.jobApplication.findUnique({
        where: { id },
      });
      return r ? this.prismaToDbJob(r) : null;
    }
    if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('SELECT * FROM job_applications WHERE id = :id LIMIT 1');
      stmt.bind({ ':id': id });
      let result: DbJobRecord | null = null;
      if (stmt.step()) {
        result = stmt.getAsObject() as unknown as DbJobRecord;
      }
      stmt.free();
      return result;
    }
    return null;
  }

  async insertJob(job: Partial<DbJobRecord> & { id: string }): Promise<void> {
    await this.init();
    const now = new Date().toISOString();
    const preparedJob: DbJobRecord = {
      id: job.id,
      company_name: job.company_name || 'Untitled Company',
      job_title: job.job_title || 'Untitled Role',
      normalized_company: job.normalized_company || (job.company_name ? job.company_name.toLowerCase().trim() : 'untitled company'),
      normalized_title: job.normalized_title || (job.job_title ? job.job_title.toLowerCase().trim() : 'untitled role'),
      source_platform: job.source_platform || 'Manual Entry',
      location: job.location || 'Remote',
      is_remote: job.is_remote !== undefined ? (job.is_remote ? 1 : 0) : 1,
      job_type: job.job_type || 'Full-Time',
      status: job.status || 'Not Started',
      first_seen_at: job.first_seen_at || now,
      last_seen_at: job.last_seen_at || now,
      created_at: job.created_at || now,
      updated_at: job.updated_at || now,
      ...job,
    };

    if (this.isPrismaPg && this.prisma) {
      const data = this.dbJobToPrisma(preparedJob);
      await this.prisma.jobApplication.upsert({
        where: { id: preparedJob.id },
        update: data,
        create: data,
      });
      return;
    }
    if (this.sqliteDb) {
      const columns = Object.keys(preparedJob);
      const placeholders = columns.map((c) => `:${c}`).join(', ');
      const query = `INSERT OR REPLACE INTO job_applications (${columns.join(', ')}) VALUES (${placeholders})`;
      const params: Record<string, any> = {};
      for (const [k, v] of Object.entries(preparedJob)) {
        params[`:${k}`] = typeof v === 'boolean' ? (v ? 1 : 0) : (v === undefined ? null : v);
      }
      this.sqliteDb.run(query, params);
      this.persistSqliteToDisk();
    }
  }

  async updateJob(id: string, updates: Partial<DbJobRecord>): Promise<void> {
    await this.init();
    if (Object.keys(updates).length === 0) return;

    if (this.isPrismaPg && this.prisma) {
      const existing = await this.prisma.jobApplication.findUnique({ where: { id } });
      if (!existing) return;

      const prismaData: any = {};
      for (const [key, val] of Object.entries(updates)) {
        const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        if (camelKey === 'isRemote') {
          prismaData[camelKey] = Boolean(val);
        } else if (camelKey === 'automaticallyDiscovered') {
          prismaData[camelKey] = Boolean(val);
        } else {
          prismaData[camelKey] = val === undefined ? null : val;
        }
      }

      await this.prisma.jobApplication.update({
        where: { id },
        data: prismaData,
      });
      return;
    }

    if (this.sqliteDb) {
      const setClause = Object.keys(updates).map((key) => `${key} = :${key}`).join(', ');
      const query = `UPDATE job_applications SET ${setClause} WHERE id = :id`;
      const params: Record<string, any> = { ':id': id };
      for (const [k, v] of Object.entries(updates)) {
        params[`:${k}`] = typeof v === 'boolean' ? (v ? 1 : 0) : (v === undefined ? null : v);
      }
      this.sqliteDb.run(query, params);
      this.persistSqliteToDisk();
    }
  }

  async deleteJob(id: string): Promise<boolean> {
    await this.init();
    if (this.isPrismaPg && this.prisma) {
      try {
        await this.prisma.jobApplication.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    }
    if (this.sqliteDb) {
      this.sqliteDb.run('DELETE FROM job_applications WHERE id = :id', { ':id': id });
      this.persistSqliteToDisk();
      return true;
    }
    return false;
  }

  // --- DUPLICATE LOOKUP QUERIES ---
  async findDuplicateByExternalId(sourcePlatform: string, externalJobId: string): Promise<DbJobRecord | null> {
    await this.init();
    if (!externalJobId) return null;

    if (this.isPrismaPg && this.prisma) {
      const r = await this.prisma.jobApplication.findFirst({
        where: {
          sourcePlatform: { equals: sourcePlatform, mode: 'insensitive' },
          externalJobId: { equals: externalJobId, mode: 'insensitive' },
        },
      });
      return r ? this.prismaToDbJob(r) : null;
    }

    if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(
        'SELECT * FROM job_applications WHERE LOWER(source_platform) = LOWER(:source) AND LOWER(external_job_id) = LOWER(:extId) LIMIT 1'
      );
      stmt.bind({ ':source': sourcePlatform, ':extId': externalJobId });
      let result: DbJobRecord | null = null;
      if (stmt.step()) {
        result = stmt.getAsObject() as unknown as DbJobRecord;
      }
      stmt.free();
      return result;
    }
    return null;
  }

  async findDuplicateByNormalizedUrl(normalizedUrl: string): Promise<DbJobRecord | null> {
    await this.init();
    if (!normalizedUrl) return null;

    if (this.isPrismaPg && this.prisma) {
      const r = await this.prisma.jobApplication.findFirst({
        where: {
          normalizedSourceUrl: normalizedUrl,
        },
      });
      return r ? this.prismaToDbJob(r) : null;
    }

    if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(
        'SELECT * FROM job_applications WHERE normalized_source_url = :url LIMIT 1'
      );
      stmt.bind({ ':url': normalizedUrl });
      let result: DbJobRecord | null = null;
      if (stmt.step()) {
        result = stmt.getAsObject() as unknown as DbJobRecord;
      }
      stmt.free();
      return result;
    }
    return null;
  }

  async findDuplicateByComposite(
    normalizedCompany: string,
    normalizedTitle: string,
    location?: string,
    employmentType?: string
  ): Promise<DbJobRecord | null> {
    await this.init();
    if (!normalizedCompany || !normalizedTitle) return null;

    if (this.isPrismaPg && this.prisma) {
      if (location && employmentType) {
        const strictMatch = await this.prisma.jobApplication.findFirst({
          where: {
            normalizedCompany: { equals: normalizedCompany, mode: 'insensitive' },
            normalizedTitle: { equals: normalizedTitle, mode: 'insensitive' },
            location: { equals: location, mode: 'insensitive' },
            jobType: { equals: employmentType, mode: 'insensitive' },
          },
        });
        if (strictMatch) return this.prismaToDbJob(strictMatch);
      }

      const compositeMatch = await this.prisma.jobApplication.findFirst({
        where: {
          normalizedCompany: { equals: normalizedCompany, mode: 'insensitive' },
          normalizedTitle: { equals: normalizedTitle, mode: 'insensitive' },
        },
      });
      return compositeMatch ? this.prismaToDbJob(compositeMatch) : null;
    }

    if (this.sqliteDb) {
      if (location && employmentType) {
        const stmt = this.sqliteDb.prepare(
          `SELECT * FROM job_applications 
           WHERE normalized_company = :comp AND normalized_title = :title 
           AND LOWER(location) = LOWER(:loc) AND LOWER(job_type) = LOWER(:type) 
           LIMIT 1`
        );
        stmt.bind({ ':comp': normalizedCompany, ':title': normalizedTitle, ':loc': location, ':type': employmentType });
        let result: DbJobRecord | null = null;
        if (stmt.step()) {
          result = stmt.getAsObject() as unknown as DbJobRecord;
        }
        stmt.free();
        if (result) return result;
      }

      const stmtFallback = this.sqliteDb.prepare(
        'SELECT * FROM job_applications WHERE normalized_company = :comp AND normalized_title = :title LIMIT 1'
      );
      stmtFallback.bind({ ':comp': normalizedCompany, ':title': normalizedTitle });
      let result: DbJobRecord | null = null;
      if (stmtFallback.step()) {
        result = stmtFallback.getAsObject() as unknown as DbJobRecord;
      }
      stmtFallback.free();
      return result;
    }

    return null;
  }

  // --- WEBHOOK LOGS ---
  async addWebhookLog(log: Omit<DbWebhookLogRecord, 'id' | 'created_at'>): Promise<DbWebhookLogRecord> {
    await this.init();
    const newLog: DbWebhookLogRecord = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      ...log,
    };

    if (this.isPrismaPg && this.prisma) {
      await this.prisma.webhookLog.create({
        data: {
          id: newLog.id,
          method: newLog.method,
          endpoint: newLog.endpoint,
          source: newLog.source || null,
          companyName: newLog.company_name || null,
          jobTitle: newLog.job_title || null,
          status: newLog.status,
          statusCode: newLog.status_code,
          message: newLog.message,
          jobId: newLog.job_id || null,
          payloadSummary: newLog.payload_summary || null,
          createdAt: newLog.created_at,
        },
      });
      return newLog;
    }

    if (this.sqliteDb) {
      this.sqliteDb.run(
        `INSERT INTO webhook_logs (id, method, endpoint, source, company_name, job_title, status, status_code, message, job_id, payload_summary, created_at)
         VALUES (:id, :method, :endpoint, :source, :company_name, :job_title, :status, :status_code, :message, :job_id, :payload_summary, :created_at)`,
        {
          ':id': newLog.id,
          ':method': newLog.method,
          ':endpoint': newLog.endpoint,
          ':source': newLog.source || null,
          ':company_name': newLog.company_name || null,
          ':job_title': newLog.job_title || null,
          ':status': newLog.status,
          ':status_code': newLog.status_code,
          ':message': newLog.message,
          ':job_id': newLog.job_id || null,
          ':payload_summary': newLog.payload_summary || null,
          ':created_at': newLog.created_at,
        }
      );
      this.persistSqliteToDisk();
    }
    return newLog;
  }

  async getWebhookLogs(limit: number = 100): Promise<DbWebhookLogRecord[]> {
    await this.init();
    if (this.isPrismaPg && this.prisma) {
      const records = await this.prisma.webhookLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return records.map((l) => ({
        id: l.id,
        method: l.method,
        endpoint: l.endpoint,
        source: l.source,
        company_name: l.companyName,
        job_title: l.jobTitle,
        status: l.status,
        status_code: l.statusCode,
        message: l.message,
        job_id: l.jobId,
        payload_summary: l.payloadSummary,
        created_at: l.createdAt,
      }));
    }

    if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare('SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT :limit');
      stmt.bind({ ':limit': limit });
      const rows: DbWebhookLogRecord[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as DbWebhookLogRecord);
      }
      stmt.free();
      return rows;
    }
    return [];
  }

  async clearWebhookLogs(): Promise<void> {
    await this.init();
    if (this.isPrismaPg && this.prisma) {
      await this.prisma.webhookLog.deleteMany({});
      return;
    }
    if (this.sqliteDb) {
      this.sqliteDb.run('DELETE FROM webhook_logs');
      this.persistSqliteToDisk();
    }
  }
}

export const db = new DatabaseManager();
