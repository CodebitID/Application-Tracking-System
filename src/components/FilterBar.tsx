import React, { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal, ArrowUpDown, MapPin, Briefcase, Tag } from 'lucide-react';
import { FilterState, JobStatus, JobType } from '../types';
import { ALL_STATUSES, JOB_TYPES, STATUS_CONFIG } from '../utils/formatters';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableTags: string[];
  totalResultsCount: number;
  totalJobsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableTags,
  totalResultsCount,
  totalJobsCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleStatus = (status: JobStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: next });
  };

  const toggleJobType = (type: JobType) => {
    const next = filters.jobTypes.includes(type)
      ? filters.jobTypes.filter((t) => t !== type)
      : [...filters.jobTypes, type];
    onFilterChange({ ...filters, jobTypes: next });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    (filters.locationSearch && filters.locationSearch !== '') ||
    filters.statuses.length > 0 ||
    filters.jobTypes.length > 0 ||
    filters.locationFilter !== 'all' ||
    filters.tagFilter !== '';

  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      locationSearch: '',
      statuses: [],
      jobTypes: [],
      locationFilter: 'all',
      tagFilter: '',
      sortBy: 'dateApplied',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-2 space-y-3">
      {/* Search and Core Filter Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
        {/* 1. Keyword Search Input (Columns 1-5) */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="job-search-input"
            type="text"
            placeholder="Search keywords (role, company, skill, notes)..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-xs"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Location Input & Quick Location Toggle (Columns 6-9) */}
        <div className="md:col-span-4 flex items-center gap-1.5">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="job-location-input"
              type="text"
              placeholder="Location (city, state, remote)..."
              value={filters.locationSearch || ''}
              onChange={(e) => onFilterChange({ ...filters, locationSearch: e.target.value })}
              className="w-full pl-8 pr-7 py-2 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-xs"
            />
            {filters.locationSearch && (
              <button
                onClick={() => onFilterChange({ ...filters, locationSearch: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Remote / Onsite toggle */}
          <div className="inline-flex p-0.5 bg-[#0D0D10] rounded-lg border border-white/5 text-xs flex-shrink-0">
            <button
              onClick={() => onFilterChange({ ...filters, locationFilter: 'all' })}
              className={`px-2 py-1 rounded-md font-medium text-[11px] transition-colors ${
                filters.locationFilter === 'all'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, locationFilter: 'remote' })}
              className={`px-2 py-1 rounded-md font-medium text-[11px] transition-colors ${
                filters.locationFilter === 'remote'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Remote
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, locationFilter: 'onsite' })}
              className={`px-2 py-1 rounded-md font-medium text-[11px] transition-colors ${
                filters.locationFilter === 'onsite'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              On-site
            </button>
          </div>
        </div>

        {/* 3. Sort & Controls (Columns 10-12) */}
        <div className="md:col-span-3 flex items-center justify-end gap-2">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1 bg-[#16161A] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 shadow-xs flex-1 md:flex-initial">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
                onFilterChange({ ...filters, sortBy, sortOrder });
              }}
              className="bg-transparent border-none text-xs text-slate-300 focus:outline-none cursor-pointer pr-1 w-full"
            >
              <option value="dateApplied-desc" className="bg-[#16161A] text-slate-200">Applied (Newest)</option>
              <option value="dateApplied-asc" className="bg-[#16161A] text-slate-200">Applied (Oldest)</option>
              <option value="deadline-asc" className="bg-[#16161A] text-slate-200">Deadline (Soonest)</option>
              <option value="salary-desc" className="bg-[#16161A] text-slate-200">Salary (Highest)</option>
              <option value="company-asc" className="bg-[#16161A] text-slate-200">Company (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              title="Clear all active filters"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors font-medium border border-rose-500/30 flex-shrink-0"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Rows */}
      <div className="space-y-2 pt-1">
        {/* Status Chips Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {ALL_STATUSES.map((status) => {
            const isSelected = filters.statuses.includes(status);
            const config = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? `${config.bg} ${config.text} ${config.border} shadow-2xs font-semibold ring-1 ring-indigo-500/40`
                    : 'bg-[#16161A] text-slate-400 border-white/5 hover:border-white/15'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                <span>{status}</span>
              </button>
            );
          })}
        </div>

        {/* Job Type Filter Chips Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap mr-1 flex items-center gap-1">
            <Briefcase className="w-3 h-3" /> Job Type:
          </span>
          {JOB_TYPES.map((type) => {
            const isSelected = filters.jobTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleJobType(type)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-semibold'
                    : 'bg-[#16161A] text-slate-400 border-white/5 hover:border-white/15'
                }`}
              >
                {type}
              </button>
            );
          })}

          {/* Tags */}
          {availableTags.length > 0 && (
            <>
              <span className="text-white/10 mx-1">|</span>
              <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap mr-1">
                Tags:
              </span>
              {availableTags.map((tag) => {
                const isSelected = filters.tagFilter === tag;
                return (
                  <button
                    key={tag}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        tagFilter: isSelected ? '' : tag,
                      })
                    }
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold'
                        : 'bg-[#16161A] text-slate-400 border-white/5 hover:border-white/15'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </>
          )}

          {/* Result Count Badge */}
          <div className="ml-auto text-[11px] text-slate-500 whitespace-nowrap pl-2">
            Showing <span className="text-white font-semibold">{totalResultsCount}</span> of {totalJobsCount} applications
          </div>
        </div>
      </div>
    </div>
  );
};
