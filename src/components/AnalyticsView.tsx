import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Award, DollarSign, Target, Globe, Layers } from 'lucide-react';
import { JobApplication } from '../types';
import { ALL_STATUSES, formatCurrency, STATUS_CONFIG } from '../utils/formatters';

interface AnalyticsViewProps {
  jobs: JobApplication[];
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#64748b', // slate
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ jobs }) => {
  // Status breakdown data
  const statusData = ALL_STATUSES.map((status) => ({
    name: status,
    count: jobs.filter((j) => j.status === status).length,
    color: STATUS_CONFIG[status].dot.replace('bg-', '#').replace('500', ''),
  })).filter((d) => d.count > 0);

  // Job Type breakdown
  const jobTypeCounts: Record<string, number> = {};
  jobs.forEach((j) => {
    jobTypeCounts[j.jobType] = (jobTypeCounts[j.jobType] || 0) + 1;
  });
  const jobTypeData = Object.entries(jobTypeCounts).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  // Remote vs Onsite
  const remoteCount = jobs.filter((j) => j.isRemote).length;
  const onsiteCount = jobs.length - remoteCount;
  const locationData = [
    { name: 'Remote', value: remoteCount, color: '#6366f1' },
    { name: 'On-Site / Hybrid', value: onsiteCount, color: '#0ea5e9' },
  ];

  // Salary comparison
  const salaryJobs = jobs
    .filter((j) => j.salaryNumeric && j.salaryNumeric > 0)
    .sort((a, b) => (b.salaryNumeric || 0) - (a.salaryNumeric || 0))
    .slice(0, 8); // Top 8 highest paying

  const salaryChartData = salaryJobs.map((j) => ({
    name: `${j.companyName}`,
    role: j.jobTitle,
    salary: j.salaryNumeric,
    formatted: j.salary,
  }));

  // Compute key statistics
  const total = jobs.length;
  const inPipeline = jobs.filter((j) => ['Applied', 'Screening', 'Interviewing', 'Interview Scheduled', 'Interviewed'].includes(j.status)).length;
  const interviews = jobs.filter((j) => ['Interviewing', 'Screening', 'Interview Scheduled', 'Interviewed'].includes(j.status)).length;
  const offers = jobs.filter((j) => ['Offer Extended', 'Offer Received'].includes(j.status)).length;
  const interviewRate = total > 0 ? Math.round(((interviews + offers) / Math.max(1, total - jobs.filter(j => j.status === 'Not Started').length)) * 100) : 0;
  const responseRate = total > 0 ? Math.round(((total - jobs.filter(j => j.status === 'Applied' || j.status === 'Not Started').length) / Math.max(1, total)) * 100) : 0;

  const validSalaries = jobs
    .map((j) => j.salaryNumeric)
    .filter((s): s is number => typeof s === 'number' && s > 0);
  const avgSalary = validSalaries.length ? Math.round(validSalaries.reduce((a, b) => a + b, 0) / validSalaries.length) : 0;
  const maxSalary = validSalaries.length ? Math.max(...validSalaries) : 0;
  const minSalary = validSalaries.length ? Math.min(...validSalaries) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <span>Interview Rate</span>
          </div>
          <div className="text-3xl font-bold text-white font-sans">
            {interviewRate}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {interviews} interview stages from {total} submissions
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Response Rate</span>
          </div>
          <div className="text-3xl font-bold text-white font-sans">
            {responseRate}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Companies that engaged / gave status
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Target Salary Range</span>
          </div>
          <div className="text-xl font-bold text-white font-sans">
            {minSalary > 0 ? formatCurrency(minSalary) : '$0'} - {formatCurrency(maxSalary)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Average: <span className="font-semibold text-emerald-400">{formatCurrency(avgSalary)}</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <span>Remote Ratio</span>
          </div>
          <div className="text-3xl font-bold text-white font-sans">
            {total > 0 ? Math.round((remoteCount / total) * 100) : 0}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {remoteCount} remote vs {onsiteCount} location-based
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Funnel Bar Chart */}
        <div className="p-6 bg-[#16161A] border border-white/5 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Application Funnel & Pipeline Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Distribution of jobs across all pipeline phases
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16161A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  formatter={(value: any) => [`${value} applications`, 'Count']}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highest Paying Target Roles Chart */}
        <div className="p-6 bg-[#16161A] border border-white/5 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            Top Annual Salary Opportunities
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Comparing compensation across top listed positions
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16161A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${item.payload.formatted} (${item.payload.role})`,
                    'Annual Salary',
                  ]}
                />
                <Bar dataKey="salary" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Type Donut Chart */}
        <div className="p-6 bg-[#16161A] border border-white/5 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-white mb-1">
            Employment Type Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Full-time, contract, freelance, and internships
          </p>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {jobTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16161A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {jobTypeData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span>
                  {item.name}: <strong className="text-slate-200">{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Workplace Model Distribution */}
        <div className="p-6 bg-[#16161A] border border-white/5 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold text-white mb-1">
            Workplace Model
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Remote flexibility vs physical office locations
          </p>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-loc-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16161A',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {locationData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span>
                  {item.name}: <strong className="text-slate-200">{item.value}</strong> ({Math.round((item.value / Math.max(1, total)) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
