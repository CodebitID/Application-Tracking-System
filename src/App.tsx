/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { BoardView } from './components/BoardView';
import { TableView } from './components/TableView';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { JobModal } from './components/JobModal';
import { JobDetailDrawer } from './components/JobDetailDrawer';
import { ImportExportModal } from './components/ImportExportModal';
import { UpcomingInterviewBanner } from './components/NotificationCenter';
import { ActivityFeed } from './components/ActivityFeed';
import { WebhookApiModal } from './components/WebhookApiModal';
import {
  JobApplication,
  JobStatus,
  ViewMode,
  FilterState,
  StatusHistoryEntry,
  ApplicationReminder,
  ApplicationContact,
  UserProfile,
  PrepChecklistItem,
  CoverLetterRecord,
} from './types';
import { INITIAL_JOBS } from './data/initialJobs';
import { exportToCSV } from './utils/csvHelper';

const STORAGE_KEY = 'job_tracker_applications_v2';
const THEME_STORAGE_KEY = 'job_tracker_theme_pref';

function loadInitialJobs(): JobApplication[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading jobs from localStorage:', e);
  }

  // Check legacy storage keys for smooth backward compatibility
  try {
    const legacy =
      localStorage.getItem('beamjobs_tracker_apps_user_acc-alex-morgan') ||
      localStorage.getItem('beamjobs_tracker_applications_v2');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return INITIAL_JOBS;
}

export default function App() {
  // Global Theme State ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Single User Profile for AI Cover Letters and Personalized Context
  const userProfile = useMemo<UserProfile>(() => ({
    name: 'My Workspace',
    email: 'codebit.id@gmail.com',
    targetRole: 'Senior Full-Stack & WordPress Engineer',
    targetLocation: 'Remote (Worldwide / Indonesia)',
    resumeHighlights:
      '• 8+ years developing web applications, WordPress systems, and high-scale APIs\n• Strong background in TypeScript, React, PHP, and REST/Webhook integrations\n• Experienced working asynchronously with distributed international remote teams',
  }), []);

  // Primary Job Applications State
  const [jobs, setJobs] = useState<JobApplication[]>(loadInitialJobs);

  // Persist jobs to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.error('Failed to save jobs to localStorage:', e);
    }
  }, [jobs]);

  // Synchronize server-side ingested jobs from REST API / Webhook endpoint as source of truth
  useEffect(() => {
    const fetchWebhookJobs = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.jobs)) {
            if (data.jobs.length > 0) {
              setJobs((prevJobs) => {
                // If local jobs were loaded from initial seed or storage, merge server jobs seamlessly
                const serverMap = new Map(data.jobs.map((j: JobApplication) => [j.id, j]));
                const merged = data.jobs.slice();
                prevJobs.forEach((localJob) => {
                  if (!serverMap.has(localJob.id)) {
                    merged.push(localJob);
                  }
                });
                return merged;
              });
            }
          }
        }
      } catch (err) {
        console.error('Error syncing webhook jobs from server:', err);
      }
    };

    fetchWebhookJobs();
    const interval = setInterval(fetchWebhookJobs, 8000);
    return () => clearInterval(interval);
  }, []);

  // Active View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('board');

  // Filter & Search State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    locationSearch: '',
    statuses: [],
    jobTypes: [],
    locationFilter: 'all',
    tagFilter: '',
    sortBy: 'dateApplied',
    sortOrder: 'desc',
  });

  // Modal & Drawer States
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobApplication | null>(null);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<JobStatus>('Applied');

  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [importExportTab, setImportExportTab] = useState<'import' | 'export'>('export');

  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
  const [showDashboardFeed, setShowDashboardFeed] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    jobs.forEach((j) => {
      if (j.tag && j.tag.trim()) {
        tagsSet.add(j.tag.trim());
      }
    });
    return Array.from(tagsSet);
  }, [jobs]);

  // Filtered & Sorted jobs calculation
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // 1. Keyword Search Query
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      result = result.filter(
        (j) =>
          j.companyName.toLowerCase().includes(query) ||
          j.jobTitle.toLowerCase().includes(query) ||
          (j.location && j.location.toLowerCase().includes(query)) ||
          (j.notes && j.notes.toLowerCase().includes(query)) ||
          (j.contactEmailOrLinkedIn && j.contactEmailOrLinkedIn.toLowerCase().includes(query)) ||
          (j.tag && j.tag.toLowerCase().includes(query)) ||
          (j.salary && j.salary.toLowerCase().includes(query)) ||
          (j.sourcePlatform && j.sourcePlatform.toLowerCase().includes(query)) ||
          (j.jobLinkDomain && j.jobLinkDomain.toLowerCase().includes(query)) ||
          (j.contacts &&
            j.contacts.some(
              (c) =>
                c.name.toLowerCase().includes(query) ||
                (c.role && c.role.toLowerCase().includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query)) ||
                (c.notes && c.notes.toLowerCase().includes(query))
            ))
      );
    }

    // 2. Specific Location Search
    if (filters.locationSearch && filters.locationSearch.trim()) {
      const locQuery = filters.locationSearch.toLowerCase().trim();
      result = result.filter(
        (j) =>
          (j.location && j.location.toLowerCase().includes(locQuery)) ||
          (locQuery === 'remote' && j.isRemote)
      );
    }

    // 3. Status Filters
    if (filters.statuses.length > 0) {
      result = result.filter((j) => filters.statuses.includes(j.status));
    }

    // 4. Job Type Filters
    if (filters.jobTypes.length > 0) {
      result = result.filter((j) => filters.jobTypes.includes(j.jobType));
    }

    // 5. Quick Location Filter
    if (filters.locationFilter === 'remote') {
      result = result.filter((j) => j.isRemote);
    } else if (filters.locationFilter === 'onsite') {
      result = result.filter((j) => !j.isRemote);
    }

    // 6. Tag Filter
    if (filters.tagFilter) {
      result = result.filter((j) => j.tag === filters.tagFilter);
    }

    // 7. Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'company') {
        comparison = a.companyName.localeCompare(b.companyName);
      } else if (filters.sortBy === 'salary') {
        const salA = a.salaryNumeric || 0;
        const salB = b.salaryNumeric || 0;
        comparison = salA - salB;
      } else if (filters.sortBy === 'deadline') {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
        comparison = dateA - dateB;
      } else if (filters.sortBy === 'dateApplied') {
        const dateA = a.dateApplied ? new Date(a.dateApplied).getTime() : 0;
        const dateB = b.dateApplied ? new Date(b.dateApplied).getTime() : 0;
        comparison = dateA - dateB;
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [jobs, filters]);

  // Helper for background syncing mutations to server
  const syncJobToServer = async (id: string, updates: Partial<JobApplication>) => {
    try {
      await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn('Failed to sync job update to server:', err);
    }
  };

  const deleteJobFromServer = async (id: string) => {
    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to delete job from server:', err);
    }
  };

  const bulkDeleteJobsFromServer = async (ids: string[]) => {
    try {
      await fetch('/api/jobs/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.warn('Failed to bulk delete jobs from server:', err);
    }
  };

  // Action handlers
  const handleOpenNewJob = (defaultStatus?: JobStatus) => {
    setJobToEdit(null);
    setModalDefaultStatus(defaultStatus || 'Applied');
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job: JobApplication) => {
    setJobToEdit(job);
    setIsJobModalOpen(true);
  };

  const handleSelectJob = (job: JobApplication) => {
    setSelectedJob(job);
    setIsDetailDrawerOpen(true);
  };

  const handleOpenAIPrep = (job: JobApplication) => {
    setSelectedJob(job);
    setIsDetailDrawerOpen(true);
  };

  const handleSaveJob = (
    jobData: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();

    if (jobToEdit) {
      const updatedJob: JobApplication = {
        ...jobToEdit,
        ...jobData,
        updatedAt: now,
      };

      setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
      if (selectedJob?.id === updatedJob.id) {
        setSelectedJob(updatedJob);
      }
      syncJobToServer(updatedJob.id, updatedJob);
    } else {
      const newJob: JobApplication = {
        ...jobData,
        id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
        statusHistory: [
          {
            id: `hist-${Date.now()}`,
            fromStatus: null,
            toStatus: jobData.status,
            date: now,
            notes: 'Initial application logged',
          },
        ],
      };

      setJobs((prev) => [newJob, ...prev]);
      // Persist to server database
      fetch('/api/jobs/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      }).catch((err) => console.warn('Failed to create job on server:', err));
    }
    setIsJobModalOpen(false);
    setJobToEdit(null);
  };

  const handleUpdateStatus = (id: string, newStatus: JobStatus) => {
    const targetJob = jobs.find((j) => j.id === id);
    if (!targetJob || targetJob.status === newStatus) return;

    const now = new Date().toISOString();
    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      fromStatus: targetJob.status,
      toStatus: newStatus,
      date: now,
      notes: `Status updated to ${newStatus}`,
    };

    const updatedJob: JobApplication = {
      ...targetJob,
      status: newStatus,
      updatedAt: now,
      statusHistory: [...(targetJob.statusHistory || []), historyEntry],
    };

    setJobs((prev) => prev.map((j) => (j.id === id ? updatedJob : j)));
    if (selectedJob?.id === id) {
      setSelectedJob(updatedJob);
    }
    syncJobToServer(id, { status: newStatus, statusHistory: updatedJob.statusHistory });
  };

  const handleDeleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (selectedJob?.id === id) {
      setIsDetailDrawerOpen(false);
      setSelectedJob(null);
    }
    deleteJobFromServer(id);
  };

  const handleDeleteMultiple = (ids: string[]) => {
    const idSet = new Set(ids);
    setJobs((prev) => prev.filter((j) => !idSet.has(j.id)));
    if (selectedJob && idSet.has(selectedJob.id)) {
      setIsDetailDrawerOpen(false);
      setSelectedJob(null);
    }
    bulkDeleteJobsFromServer(ids);
  };

  const handleAddTimelineEntry = (_jobId: string, entry: StatusHistoryEntry) => {
    if (!selectedJob) return;
    const now = new Date().toISOString();
    const newEntry: StatusHistoryEntry = {
      ...entry,
      id: entry.id || `hist-${Date.now()}`,
      date: entry.date || now,
    };

    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: now,
      statusHistory: [...(selectedJob.statusHistory || []), newEntry],
    };

    setJobs((prev) => prev.map((j) => (j.id === selectedJob.id ? updatedJob : j)));
    setSelectedJob(updatedJob);
    syncJobToServer(selectedJob.id, { statusHistory: updatedJob.statusHistory });
  };

  const handleAddReminder = (_jobId: string, reminder: Omit<ApplicationReminder, 'id' | 'jobId' | 'createdAt'>) => {
    if (!selectedJob) return;
    const now = new Date().toISOString();
    const newReminder: ApplicationReminder = {
      ...reminder,
      id: `rem-${Date.now()}`,
      jobId: selectedJob.id,
      createdAt: now,
    };

    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: now,
      reminders: [...(selectedJob.reminders || []), newReminder],
    };

    setJobs((prev) => prev.map((j) => (j.id === selectedJob.id ? updatedJob : j)));
    setSelectedJob(updatedJob);
    syncJobToServer(selectedJob.id, { reminders: updatedJob.reminders });
  };

  const handleToggleReminder = (jobId: string, reminderId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const updatedReminders = (j.reminders || []).map((r) =>
          r.id === reminderId ? { ...r, isCompleted: !r.isCompleted } : r
        );
        const updated = {
          ...j,
          updatedAt: new Date().toISOString(),
          reminders: updatedReminders,
        };
        if (selectedJob?.id === jobId) setSelectedJob(updated);
        syncJobToServer(jobId, { reminders: updatedReminders });
        return updated;
      })
    );
  };

  const handleDeleteReminder = (jobId: string, reminderId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const updatedReminders = (j.reminders || []).filter((r) => r.id !== reminderId);
        const updated = {
          ...j,
          updatedAt: new Date().toISOString(),
          reminders: updatedReminders,
        };
        if (selectedJob?.id === jobId) setSelectedJob(updated);
        syncJobToServer(jobId, { reminders: updatedReminders });
        return updated;
      })
    );
  };

  const handleAddContact = (_jobId: string, contact: Omit<ApplicationContact, 'id' | 'createdAt'>) => {
    if (!selectedJob) return;
    const newContact: ApplicationContact = {
      ...contact,
      id: `cont-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedContacts = [...(selectedJob.contacts || []), newContact];
    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: new Date().toISOString(),
      contacts: updatedContacts,
    };

    setJobs((prev) => prev.map((j) => (j.id === selectedJob.id ? updatedJob : j)));
    setSelectedJob(updatedJob);
    syncJobToServer(selectedJob.id, { contacts: updatedContacts });
  };

  const handleUpdateContact = (_jobId: string, contact: ApplicationContact) => {
    if (!selectedJob) return;
    const updatedContacts = (selectedJob.contacts || []).map((c) =>
      c.id === contact.id ? contact : c
    );
    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: new Date().toISOString(),
      contacts: updatedContacts,
    };

    setJobs((prev) => prev.map((j) => (j.id === selectedJob.id ? updatedJob : j)));
    setSelectedJob(updatedJob);
    syncJobToServer(selectedJob.id, { contacts: updatedContacts });
  };

  const handleDeleteContact = (_jobId: string, contactId: string) => {
    if (!selectedJob) return;
    const updatedContacts = (selectedJob.contacts || []).filter((c) => c.id !== contactId);
    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: new Date().toISOString(),
      contacts: updatedContacts,
    };

    setJobs((prev) => prev.map((j) => (j.id === selectedJob.id ? updatedJob : j)));
    setSelectedJob(updatedJob);
    syncJobToServer(selectedJob.id, { contacts: updatedContacts });
  };

  const handleUpdateChecklist = (jobId: string, checklist: PrepChecklistItem[]) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const updated = {
          ...j,
          updatedAt: new Date().toISOString(),
          interviewChecklist: checklist,
        };
        if (selectedJob?.id === jobId) setSelectedJob(updated);
        syncJobToServer(jobId, { interviewChecklist: checklist });
        return updated;
      })
    );
  };

  const handleSaveCoverLetter = (jobId: string, coverLetter: CoverLetterRecord) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const updatedLetters = [...(j.savedCoverLetters || []), coverLetter];
        const updated = {
          ...j,
          updatedAt: new Date().toISOString(),
          savedCoverLetters: updatedLetters,
        };
        if (selectedJob?.id === jobId) setSelectedJob(updated);
        syncJobToServer(jobId, { savedCoverLetters: updatedLetters });
        return updated;
      })
    );
  };

  const handleAppendToJobNotes = (jobId: string, textToAppend: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const currentNotes = j.notes || '';
        const newNotes = currentNotes ? `${currentNotes}\n\n${textToAppend}` : textToAppend;
        const updated = {
          ...j,
          notes: newNotes,
          updatedAt: new Date().toISOString(),
        };
        if (selectedJob?.id === jobId) setSelectedJob(updated);
        syncJobToServer(jobId, { notes: newNotes });
        return updated;
      })
    );
  };


  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setJobs(INITIAL_JOBS);
    setSelectedJob(null);
    setIsDetailDrawerOpen(false);
  };

  const handleImportJobs = (importedJobs: JobApplication[]) => {
    setJobs((prev) => [...importedJobs, ...prev]);
  };

  const handleExportSelected = (selectedJobs: JobApplication[]) => {
    exportToCSV(selectedJobs, `job-tracker-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleOpenImportExport = (tab: 'import' | 'export') => {
    setImportExportTab(tab);
    setIsImportExportOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-200 flex flex-col font-sans transition-colors">
      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewJob={() => handleOpenNewJob()}
        onOpenImportExport={handleOpenImportExport}
        onResetData={handleResetData}
        totalJobsCount={jobs.length}
        jobs={jobs}
        onSelectJob={handleSelectJob}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenActivityFeed={() => setIsActivityFeedOpen(true)}
        onOpenWebhookApi={() => setIsWebhookModalOpen(true)}
      />

      {/* Upcoming Interview Alert Banner (<24h) */}
      <UpcomingInterviewBanner jobs={jobs} onSelectJob={handleSelectJob} />

      {/* Main KPI Stats Bar */}
      <StatsBar
        jobs={jobs}
        onSelectStatusFilter={(status) => {
          if (status === 'all') {
            setFilters({ ...filters, statuses: [] });
          } else {
            setFilters({ ...filters, statuses: [status as JobStatus] });
          }
        }}
      />

      {/* Global Filter and Search Toolbar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        availableTags={availableTags}
        totalResultsCount={filteredJobs.length}
        totalJobsCount={jobs.length}
      />

      {/* Activity Feed Dashboard Bar & Collapsible Widget */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-1 pb-3 flex items-center justify-between">
        <button
          id="dashboard-activity-feed-toggle-btn"
          onClick={() => setShowDashboardFeed(!showDashboardFeed)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-xs group cursor-pointer ${
            showDashboardFeed
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-[#141418] hover:bg-[#1A1A20] border-white/10 text-slate-300 hover:text-white'
          }`}
          title="Toggle Recent Activity Feed on Dashboard"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>{showDashboardFeed ? 'Hide Activity Feed' : 'View Activity Feed'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Live Stream
          </span>
        </button>

        <span className="text-[11px] text-slate-400 hidden md:inline">
          Live stream of status changes, webhook arrivals, reminders, and contacts
        </span>
      </div>

      {/* Collapsible Activity Feed directly on Dashboard layout */}
      {showDashboardFeed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <ActivityFeed
            jobs={jobs}
            onSelectJob={handleSelectJob}
            isEmbedded={true}
            onClose={() => setShowDashboardFeed(false)}
          />
        </div>
      )}

      {/* Viewport content area */}
      <main className="flex-1 pb-16">
        {viewMode === 'board' && (
          <BoardView
            jobs={filteredJobs}
            onSelectJob={handleSelectJob}
            onUpdateJobStatus={handleUpdateStatus}
            onOpenNewJobWithStatus={handleOpenNewJob}
            onDeleteJob={handleDeleteJob}
            onOpenAIPrep={handleOpenAIPrep}
          />
        )}

        {viewMode === 'table' && (
          <TableView
            jobs={filteredJobs}
            onSelectJob={handleSelectJob}
            onEditJob={handleOpenEditJob}
            onUpdateJobStatus={handleUpdateStatus}
            onDeleteJob={handleDeleteJob}
            onDeleteMultipleJobs={handleDeleteMultiple}
            onOpenAIPrep={handleOpenAIPrep}
            onExportSelected={handleExportSelected}
          />
        )}

        {viewMode === 'analytics' && <AnalyticsView jobs={jobs} />}

        {viewMode === 'calendar' && (
          <CalendarView
            jobs={jobs}
            onSelectJob={handleSelectJob}
            onOpenAIPrep={handleOpenAIPrep}
            onToggleReminder={handleToggleReminder}
          />
        )}
      </main>

      {/* Add / Edit Job Modal */}
      <JobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSave={handleSaveJob}
        jobToEdit={jobToEdit}
        defaultStatus={modalDefaultStatus}
      />

      {/* Job Details Drawer */}
      <JobDetailDrawer
        job={selectedJob}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onEdit={(job) => {
          setIsDetailDrawerOpen(false);
          handleOpenEditJob(job);
        }}
        onDelete={handleDeleteJob}
        onUpdateStatus={handleUpdateStatus}
        onAddTimelineEntry={handleAddTimelineEntry}
        onAddReminder={handleAddReminder}
        onToggleReminder={handleToggleReminder}
        onDeleteReminder={handleDeleteReminder}
        onAddContact={handleAddContact}
        onUpdateContact={handleUpdateContact}
        onDeleteContact={handleDeleteContact}
        currentAccount={userProfile}
        onUpdateChecklist={handleUpdateChecklist}
        onSaveCoverLetter={handleSaveCoverLetter}
        onAppendToJobNotes={handleAppendToJobNotes}
      />

      {/* CSV Import & Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        initialTab={importExportTab}
        onClose={() => setIsImportExportOpen(false)}
        jobs={jobs}
        onImportJobs={handleImportJobs}
      />

      {/* Activity Feed Modal / Drawer */}
      <ActivityFeed
        jobs={jobs}
        onSelectJob={handleSelectJob}
        isOpen={isActivityFeedOpen}
        onClose={() => setIsActivityFeedOpen(false)}
      />

      {/* REST API & Webhook Ingestion Hub Modal */}
      <WebhookApiModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        onJobImported={(newJob) => {
          setJobs((prev) => {
            const exists = prev.some(
              (j) =>
                j.id === newJob.id ||
                (j.sourceUniqueKey && j.sourceUniqueKey === newJob.sourceUniqueKey)
            );
            if (exists) return prev;
            return [newJob, ...prev];
          });
        }}
      />
    </div>
  );
}
