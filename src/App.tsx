/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { AccountManagerModal } from './components/AccountManagerModal';
import { AuthModal } from './components/AuthModal';
import { SystemAdminModal } from './components/SystemAdminModal';
import { UpcomingInterviewBanner } from './components/NotificationCenter';
import { ActivityFeed } from './components/ActivityFeed';
import {
  JobApplication,
  JobStatus,
  ViewMode,
  FilterState,
  StatusHistoryEntry,
  ApplicationReminder,
  ApplicationContact,
  UserAccount,
  PrepChecklistItem,
  CoverLetterRecord,
} from './types';
import { INITIAL_JOBS } from './data/initialJobs';
import {
  INITIAL_ACCOUNTS,
  SARAH_CHEN_JOBS,
  JORDAN_REED_JOBS,
} from './data/initialAccounts';
import { exportToCSV } from './utils/csvHelper';

const ACCOUNTS_STORAGE_KEY = 'beamjobs_tracker_user_accounts_v2';
const ACTIVE_ACCOUNT_KEY = 'beamjobs_tracker_active_account_id_v2';
const THEME_STORAGE_KEY = 'beamjobs_tracker_theme_pref';
const USER_JOBS_PREFIX = 'beamjobs_tracker_apps_user_';

function getInitialJobsForUser(userId: string): JobApplication[] {
  try {
    const saved = localStorage.getItem(`${USER_JOBS_PREFIX}${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Error reading storage for user ${userId}:`, e);
  }

  // Fallback defaults per seeded user profile
  if (userId === 'acc-alex-morgan') {
    // Check legacy storage key
    try {
      const legacy = localStorage.getItem('beamjobs_tracker_applications_v2');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_JOBS;
  }
  if (userId === 'acc-sarah-chen') return SARAH_CHEN_JOBS;
  if (userId === 'acc-jordan-reed') return JORDAN_REED_JOBS;
  return [];
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

  // User Accounts State
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading accounts from localStorage:', e);
    }
    return INITIAL_ACCOUNTS;
  });

  // Current Active User Account ID
  const [currentAccountId, setCurrentAccountId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
      if (saved) {
        return saved;
      }
    } catch (e) {
      console.error('Error reading active account from localStorage:', e);
    }
    return INITIAL_ACCOUNTS[0].id;
  });

  // Superadmin Scope State ('all' or specific accountId)
  const [adminScope, setAdminScope] = useState<string>('all');

  // Load initial jobs for active user
  const [jobs, setJobs] = useState<JobApplication[]>(() => {
    const initialAccountId = (() => {
      try {
        return localStorage.getItem(ACTIVE_ACCOUNT_KEY) || INITIAL_ACCOUNTS[0].id;
      } catch {
        return INITIAL_ACCOUNTS[0].id;
      }
    })();
    return getInitialJobsForUser(initialAccountId);
  });

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

  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSystemAdminOpen, setIsSystemAdminOpen] = useState(false);
  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
  const [showDashboardFeed, setShowDashboardFeed] = useState(false);

  // Active Account Object
  const currentAccount = useMemo(() => {
    return (
      accounts.find((a) => a.id === currentAccountId) ||
      accounts[0] ||
      INITIAL_ACCOUNTS[0]
    );
  }, [accounts, currentAccountId]);

  const isSuperadmin = currentAccount.role === 'superadmin';

  // Persist accounts list
  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save accounts to localStorage:', e);
    }
  }, [accounts]);

  // Persist active account ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, currentAccountId);
    } catch (e) {
      console.error('Failed to save active account ID to localStorage:', e);
    }
  }, [currentAccountId]);

  // Persist active user's jobs (if not in superadmin aggregate view)
  useEffect(() => {
    if (!isSuperadmin || adminScope === currentAccountId) {
      try {
        localStorage.setItem(
          `${USER_JOBS_PREFIX}${currentAccountId}`,
          JSON.stringify(jobs)
        );
      } catch (e) {
        console.error('Failed to save user jobs to localStorage:', e);
      }
    }
  }, [jobs, currentAccountId, isSuperadmin, adminScope]);

  // Helper to gather all jobs across all registered candidates for Superadmin
  const getAllSystemJobs = useCallback((): JobApplication[] => {
    const allJobs: JobApplication[] = [];
    accounts.forEach((acc) => {
      let accJobs: JobApplication[] = [];
      if (acc.id === currentAccountId && !isSuperadmin) {
        accJobs = jobs;
      } else {
        accJobs = getInitialJobsForUser(acc.id);
      }

      accJobs.forEach((j) => {
        allJobs.push({
          ...j,
          accountId: acc.id,
          accountName: acc.name,
        });
      });
    });
    return allJobs;
  }, [accounts, currentAccountId, isSuperadmin, jobs]);

  // Compute displayed jobs respecting candidate data isolation & superadmin scope
  const activeDisplayJobs = useMemo(() => {
    if (isSuperadmin) {
      if (adminScope === 'all') {
        return getAllSystemJobs();
      } else {
        // Specific candidate selected by superadmin
        const candidate = accounts.find((a) => a.id === adminScope);
        const candidateJobs = getInitialJobsForUser(adminScope);
        return candidateJobs.map((j) => ({
          ...j,
          accountId: adminScope,
          accountName: candidate?.name || 'Candidate',
        }));
      }
    }
    // Regular candidate: Strict data isolation
    return jobs.map((j) => ({
      ...j,
      accountId: currentAccountId,
      accountName: currentAccount.name,
    }));
  }, [isSuperadmin, adminScope, getAllSystemJobs, accounts, jobs, currentAccountId, currentAccount]);

  // Calculate job counts for all accounts
  const jobCountByAccount = useMemo(() => {
    const counts: { [id: string]: number } = {};
    accounts.forEach((acc) => {
      if (acc.id === currentAccountId && !isSuperadmin) {
        counts[acc.id] = jobs.length;
      } else {
        const accJobs = getInitialJobsForUser(acc.id);
        counts[acc.id] = accJobs.length;
      }
    });
    return counts;
  }, [accounts, currentAccountId, isSuperadmin, jobs]);

  // Handle Switching User Account
  const handleSelectAccount = (newAccountId: string) => {
    if (newAccountId === currentAccountId) return;
    
    // Save current candidate's jobs first
    if (!isSuperadmin) {
      try {
        localStorage.setItem(
          `${USER_JOBS_PREFIX}${currentAccountId}`,
          JSON.stringify(jobs)
        );
      } catch {}
    }

    setCurrentAccountId(newAccountId);
    setAdminScope('all');
    const newJobs = getInitialJobsForUser(newAccountId);
    setJobs(newJobs);
    setSelectedJob(null);
    setIsDetailDrawerOpen(false);
  };

  // Handle Account Management CRUD
  const handleCreateAccount = (
    accountData: Omit<UserAccount, 'id' | 'createdAt'>
  ) => {
    const newId = `acc-${Date.now()}`;
    const newAccount: UserAccount = {
      ...accountData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [...prev, newAccount]);
    handleSelectAccount(newId);
  };

  const handleUpdateAccount = (updatedAccount: UserAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === updatedAccount.id ? updatedAccount : a))
    );
  };

  const handleDeleteAccount = (accountId: string) => {
    if (accounts.length <= 1) return;
    const remaining = accounts.filter((a) => a.id !== accountId);
    setAccounts(remaining);

    try {
      localStorage.removeItem(`${USER_JOBS_PREFIX}${accountId}`);
    } catch {}

    if (currentAccountId === accountId) {
      handleSelectAccount(remaining[0].id);
    }
  };

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    activeDisplayJobs.forEach((j) => {
      if (j.tag && j.tag.trim()) {
        tagsSet.add(j.tag.trim());
      }
    });
    return Array.from(tagsSet);
  }, [activeDisplayJobs]);

  // Filtered & Sorted jobs calculation
  const filteredJobs = useMemo(() => {
    let result = [...activeDisplayJobs];

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
          (j.accountName && j.accountName.toLowerCase().includes(query)) ||
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
  }, [activeDisplayJobs, filters]);

  // Helper to persist changes to a target job whether in local or superadmin global mode
  const updateJobInStorage = useCallback((updatedJob: JobApplication) => {
    const targetAccountId = updatedJob.accountId || currentAccountId;
    const currentList = getInitialJobsForUser(targetAccountId);
    const updatedList = currentList.map((j) => (j.id === updatedJob.id ? updatedJob : j));
    try {
      localStorage.setItem(`${USER_JOBS_PREFIX}${targetAccountId}`, JSON.stringify(updatedList));
    } catch {}

    if (targetAccountId === currentAccountId) {
      setJobs(updatedList);
    }
  }, [currentAccountId]);

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

      updateJobInStorage(updatedJob);
      if (selectedJob?.id === updatedJob.id) {
        setSelectedJob(updatedJob);
      }
    } else {
      const targetAccountId = isSuperadmin && adminScope !== 'all' ? adminScope : currentAccountId;
      const targetAcc = accounts.find((a) => a.id === targetAccountId) || currentAccount;

      const newJob: JobApplication = {
        ...jobData,
        id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        accountId: targetAccountId,
        accountName: targetAcc.name,
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

      const currentList = getInitialJobsForUser(targetAccountId);
      const updatedList = [newJob, ...currentList];
      try {
        localStorage.setItem(`${USER_JOBS_PREFIX}${targetAccountId}`, JSON.stringify(updatedList));
      } catch {}

      if (targetAccountId === currentAccountId) {
        setJobs(updatedList);
      }
    }
    setIsJobModalOpen(false);
    setJobToEdit(null);
  };

  const handleUpdateStatus = (id: string, newStatus: JobStatus) => {
    const targetJob = activeDisplayJobs.find((j) => j.id === id);
    if (!targetJob) return;

    if (targetJob.status === newStatus) return;

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

    updateJobInStorage(updatedJob);
    if (selectedJob?.id === id) {
      setSelectedJob(updatedJob);
    }
  };

  const handleDeleteJob = (id: string) => {
    const targetJob = activeDisplayJobs.find((j) => j.id === id);
    const targetAccountId = targetJob?.accountId || currentAccountId;

    const currentList = getInitialJobsForUser(targetAccountId);
    const updatedList = currentList.filter((j) => j.id !== id);
    try {
      localStorage.setItem(`${USER_JOBS_PREFIX}${targetAccountId}`, JSON.stringify(updatedList));
    } catch {}

    if (targetAccountId === currentAccountId) {
      setJobs(updatedList);
    }

    if (selectedJob?.id === id) {
      setIsDetailDrawerOpen(false);
      setSelectedJob(null);
    }
  };

  const handleDeleteMultiple = (ids: string[]) => {
    ids.forEach((id) => {
      handleDeleteJob(id);
    });
  };

  const handleAddTimelineEntry = (entry: Omit<StatusHistoryEntry, 'id'>) => {
    if (!selectedJob) return;
    const now = new Date().toISOString();
    const newEntry: StatusHistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}`,
    };

    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: now,
      statusHistory: [...(selectedJob.statusHistory || []), newEntry],
    };

    updateJobInStorage(updatedJob);
    setSelectedJob(updatedJob);
  };

  const handleAddReminder = (reminder: Omit<ApplicationReminder, 'id' | 'isCompleted' | 'createdAt'>) => {
    if (!selectedJob) return;
    const now = new Date().toISOString();
    const newReminder: ApplicationReminder = {
      ...reminder,
      id: `rem-${Date.now()}`,
      isCompleted: false,
      createdAt: now,
    };

    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: now,
      reminders: [...(selectedJob.reminders || []), newReminder],
    };

    updateJobInStorage(updatedJob);
    setSelectedJob(updatedJob);
  };

  const handleToggleReminder = (jobId: string, reminderId: string) => {
    const targetJob = activeDisplayJobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const updatedJob: JobApplication = {
      ...targetJob,
      updatedAt: new Date().toISOString(),
      reminders: (targetJob.reminders || []).map((r) =>
        r.id === reminderId ? { ...r, isCompleted: !r.isCompleted } : r
      ),
    };

    updateJobInStorage(updatedJob);
    if (selectedJob?.id === jobId) {
      setSelectedJob(updatedJob);
    }
  };

  const handleDeleteReminder = (jobId: string, reminderId: string) => {
    const targetJob = activeDisplayJobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const updatedJob: JobApplication = {
      ...targetJob,
      updatedAt: new Date().toISOString(),
      reminders: (targetJob.reminders || []).filter((r) => r.id !== reminderId),
    };

    updateJobInStorage(updatedJob);
    if (selectedJob?.id === jobId) {
      setSelectedJob(updatedJob);
    }
  };

  const handleAddContact = (contact: Omit<ApplicationContact, 'id'>) => {
    if (!selectedJob) return;
    const newContact: ApplicationContact = {
      ...contact,
      id: `cont-${Date.now()}`,
    };

    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: new Date().toISOString(),
      contacts: [...(selectedJob.contacts || []), newContact],
    };

    updateJobInStorage(updatedJob);
    setSelectedJob(updatedJob);
  };

  const handleUpdateContact = (contact: ApplicationContact) => {
    if (!selectedJob) return;
    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: new Date().toISOString(),
      contacts: (selectedJob.contacts || []).map((c) =>
        c.id === contact.id ? contact : c
      ),
    };

    updateJobInStorage(updatedJob);
    setSelectedJob(updatedJob);
  };

  const handleDeleteContact = (contactId: string) => {
    if (!selectedJob) return;
    const updatedJob: JobApplication = {
      ...selectedJob,
      updatedAt: new Date().toISOString(),
      contacts: (selectedJob.contacts || []).filter((c) => c.id !== contactId),
    };

    updateJobInStorage(updatedJob);
    setSelectedJob(updatedJob);
  };

  const handleUpdateChecklist = (jobId: string, checklist: PrepChecklistItem[]) => {
    const targetJob = activeDisplayJobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const updatedJob: JobApplication = {
      ...targetJob,
      updatedAt: new Date().toISOString(),
      interviewChecklist: checklist,
    };

    updateJobInStorage(updatedJob);
    if (selectedJob?.id === jobId) {
      setSelectedJob(updatedJob);
    }
  };

  const handleSaveCoverLetter = (jobId: string, coverLetter: CoverLetterRecord) => {
    const targetJob = activeDisplayJobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const updatedJob: JobApplication = {
      ...targetJob,
      updatedAt: new Date().toISOString(),
      savedCoverLetters: [...(targetJob.savedCoverLetters || []), coverLetter],
    };

    updateJobInStorage(updatedJob);
    if (selectedJob?.id === jobId) {
      setSelectedJob(updatedJob);
    }
  };

  const handleAppendToJobNotes = (jobId: string, textToAppend: string) => {
    const targetJob = activeDisplayJobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const currentNotes = targetJob.notes || '';
    const newNotes = currentNotes ? `${currentNotes}\n\n${textToAppend}` : textToAppend;

    const updatedJob: JobApplication = {
      ...targetJob,
      notes: newNotes,
      updatedAt: new Date().toISOString(),
    };

    updateJobInStorage(updatedJob);
    if (selectedJob?.id === jobId) {
      setSelectedJob(updatedJob);
    }
  };

  const handleResetData = () => {
    localStorage.removeItem(`${USER_JOBS_PREFIX}${currentAccountId}`);
    const defaultData = getInitialJobsForUser(currentAccountId);
    setJobs(defaultData);
    setSelectedJob(null);
    setIsDetailDrawerOpen(false);
  };

  const handleImportJobs = (importedJobs: JobApplication[]) => {
    const tagged = importedJobs.map((j) => ({
      ...j,
      accountId: currentAccountId,
      accountName: currentAccount.name,
    }));
    const updated = [...tagged, ...jobs];
    setJobs(updated);
    try {
      localStorage.setItem(`${USER_JOBS_PREFIX}${currentAccountId}`, JSON.stringify(updated));
    } catch {}
  };

  const handleExportSelected = (selectedJobs: JobApplication[]) => {
    exportToCSV(selectedJobs, `${currentAccount.name.toLowerCase().replace(/\s+/g, '-')}-selected-jobs.csv`);
  };

  const handleOpenImportExport = (tab: 'import' | 'export') => {
    setImportExportTab(tab);
    setIsImportExportOpen(true);
  };

  const handleAuthLogin = (accountId: string) => {
    handleSelectAccount(accountId);
  };

  const handleAuthRegister = (
    accountData: Omit<UserAccount, 'id' | 'createdAt'>
  ) => {
    handleCreateAccount(accountData);
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
        totalJobsCount={activeDisplayJobs.length}
        jobs={activeDisplayJobs}
        onSelectJob={handleSelectJob}
        currentAccount={currentAccount}
        accounts={accounts}
        onSelectAccount={handleSelectAccount}
        onOpenAccountManager={() => setIsAccountManagerOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        adminScope={adminScope}
        onAdminScopeChange={setAdminScope}
        onOpenSystemAdmin={() => setIsSystemAdminOpen(true)}
        onOpenActivityFeed={() => setIsActivityFeedOpen(true)}
      />

      {/* Upcoming Interview Alert Banner (<24h) */}
      <UpcomingInterviewBanner jobs={activeDisplayJobs} onSelectJob={handleSelectJob} />

      {/* Main KPI Stats Bar */}
      <StatsBar
        jobs={activeDisplayJobs}
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
        totalJobsCount={activeDisplayJobs.length}
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
          Live stream of status changes, reminders, and contacts across all jobs
        </span>
      </div>

      {/* Collapsible Activity Feed directly on Dashboard layout */}
      {showDashboardFeed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <ActivityFeed
            jobs={activeDisplayJobs}
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

        {viewMode === 'analytics' && <AnalyticsView jobs={activeDisplayJobs} />}

        {viewMode === 'calendar' && (
          <CalendarView
            jobs={activeDisplayJobs}
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

      {/* Job Details Drawer with Domain Badge, Contacts, Gemini AI Assistant, Timeline, and Reminders */}
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
        currentAccount={currentAccount}
        onUpdateChecklist={handleUpdateChecklist}
        onSaveCoverLetter={handleSaveCoverLetter}
        onAppendToJobNotes={handleAppendToJobNotes}
      />

      {/* Multiple User Account Manager Modal */}
      <AccountManagerModal
        isOpen={isAccountManagerOpen}
        onClose={() => setIsAccountManagerOpen(false)}
        accounts={accounts}
        currentAccountId={currentAccountId}
        onSelectAccount={handleSelectAccount}
        onCreateAccount={handleCreateAccount}
        onUpdateAccount={handleUpdateAccount}
        onDeleteAccount={handleDeleteAccount}
        jobCountByAccount={jobCountByAccount}
      />

      {/* Superadmin System Management Console Modal */}
      <SystemAdminModal
        isOpen={isSystemAdminOpen}
        onClose={() => setIsSystemAdminOpen(false)}
        accounts={accounts}
        currentAccountId={currentAccountId}
        onSelectAccount={handleSelectAccount}
        onCreateAccount={handleCreateAccount}
        onUpdateAccount={handleUpdateAccount}
        onDeleteAccount={handleDeleteAccount}
        jobCountByAccount={jobCountByAccount}
        allSystemJobsCount={getAllSystemJobs().length}
      />

      {/* Candidate Authentication & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        accounts={accounts}
        currentAccountId={currentAccountId}
        onLogin={handleAuthLogin}
        onRegister={handleAuthRegister}
      />

      {/* CSV Import & Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        initialTab={importExportTab}
        onClose={() => setIsImportExportOpen(false)}
        jobs={activeDisplayJobs}
        onImportJobs={handleImportJobs}
      />

      {/* Activity Feed Modal / Drawer */}
      <ActivityFeed
        jobs={activeDisplayJobs}
        onSelectJob={handleSelectJob}
        isOpen={isActivityFeedOpen}
        onClose={() => setIsActivityFeedOpen(false)}
      />
    </div>
  );
}
