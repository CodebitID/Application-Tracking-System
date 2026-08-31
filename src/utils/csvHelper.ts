import { JobApplication, JobStatus, JobType } from '../types';
import { parseSalaryToNumeric } from '../data/initialJobs';

export function exportToCSV(jobs: JobApplication[], filename?: string): string {
  const headers = [
    'Company Name',
    'Job Link',
    'Job Title',
    'Date Applied',
    'Deadline',
    'Type of Job',
    'Salary (Annual)',
    'Contact Email/LinkedIn',
    'Location',
    'Application Status',
    'Interview Date',
    'Notes',
    'Tag',
  ];

  const escapeCSV = (field: string | undefined | null) => {
    if (!field) return '""';
    const text = String(field).replace(/"/g, '""');
    return `"${text}"`;
  };

  const rows = jobs.map((job) => [
    escapeCSV(job.companyName),
    escapeCSV(job.jobLink || ''),
    escapeCSV(job.jobTitle),
    escapeCSV(job.dateApplied || ''),
    escapeCSV(job.deadline || ''),
    escapeCSV(job.jobType),
    escapeCSV(job.salary || 'N/A'),
    escapeCSV(job.contactEmailOrLinkedIn || ''),
    escapeCSV(job.location || ''),
    escapeCSV(job.status),
    escapeCSV(job.interviewDate || ''),
    escapeCSV(job.notes || ''),
    escapeCSV(job.tag || ''),
  ]);

  const csvContent = ['Job Tracker by BeamJobs,,,,,,,,,,,,', headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  if (filename && typeof window !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return csvContent;
}

export function parseCSV(text: string): Partial<JobApplication>[] {
  const lines = text.split(/\r\n|\n|\r/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Parse CSV line respecting quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  let startIndex = 0;
  // Check if first line is title header like "Job Tracker by BeamJobs"
  if (lines[0].toLowerCase().includes('job tracker')) {
    startIndex = 1;
  }

  if (startIndex >= lines.length) return [];
  const headerLine = parseLine(lines[startIndex]);
  const headers = headerLine.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const parsedJobs: Partial<JobApplication>[] = [];

  for (let i = startIndex + 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length < 2 || cells.every((c) => !c)) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] || '';
    });

    const company = row['companyname'] || row['company'] || cells[0] || 'Unknown Company';
    const title = row['jobtitle'] || row['title'] || row['position'] || cells[2] || 'Position';
    const link = row['joblink'] || row['link'] || row['url'] || cells[1] || '';
    const dateApplied = row['dateapplied'] || row['applieddate'] || row['applied'] || cells[3] || '';
    const deadline = row['deadline'] || row['datedeadline'] || cells[4] || '';
    const jobTypeRaw = row['typeofjob'] || row['jobtype'] || row['type'] || cells[5] || 'Full-Time';
    const salary = row['salaryannual'] || row['salary'] || row['compensation'] || cells[6] || 'N/A';
    const contact = row['contactemaillinkedin'] || row['contact'] || row['email'] || cells[7] || '';
    const location = row['location'] || cells[8] || 'Remote';
    const statusRaw = row['applicationstatus'] || row['status'] || cells[9] || 'Applied';
    const interviewDate = row['interviewdate'] || row['interview'] || cells[10] || '';
    const notes = row['notes'] || row['note'] || cells[11] || '';
    const tag = row['tag'] || row['tags'] || cells[12] || '';

    // Normalize job type
    let jobType: JobType = 'Full-Time';
    const jtLower = jobTypeRaw.toLowerCase();
    if (jtLower.includes('part')) jobType = 'Part-Time';
    else if (jtLower.includes('contract')) jobType = 'Contract';
    else if (jtLower.includes('freelance')) jobType = 'Freelance';
    else if (jtLower.includes('intern')) jobType = 'Internship';
    else if (jtLower.includes('temp')) jobType = 'Temporary';

    // Normalize status
    let status: JobStatus = 'Applied';
    const stLower = statusRaw.toLowerCase();
    if (stLower.includes('not started') || stLower.includes('wishlist') || stLower.includes('draft')) status = 'Not Started';
    else if (stLower.includes('scheduled')) status = 'Interview Scheduled';
    else if (stLower.includes('interviewed') || stLower.includes('interviewing')) status = 'Interviewed';
    else if (stLower.includes('offer') || stLower.includes('hired') || stLower.includes('accepted')) status = 'Offer Received';
    else if (stLower.includes('no reply') || stLower.includes('ghosted') || stLower.includes('waiting')) status = 'No Reply';
    else if (stLower.includes('reject') || stLower.includes('declined') || stLower.includes('closed')) status = 'Rejected';
    else if (stLower.includes('applied') || stLower.includes('submitted')) status = 'Applied';

    parsedJobs.push({
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      companyName: company,
      jobTitle: title,
      jobLink: link,
      dateApplied,
      deadline,
      jobType,
      salary,
      salaryNumeric: parseSalaryToNumeric(salary),
      contactEmailOrLinkedIn: contact,
      location,
      isRemote: location.toLowerCase().includes('remote'),
      status,
      interviewDate,
      notes,
      tag,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return parsedJobs;
}
