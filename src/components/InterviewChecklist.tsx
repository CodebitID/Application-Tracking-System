import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Video,
  FileCheck,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { JobApplication, PrepChecklistItem } from '../types';

export const DEFAULT_PREP_CHECKLIST: PrepChecklistItem[] = [
  {
    id: 'prep-std-1',
    task: 'Research company values, mission, and recent news',
    category: 'Research',
    isCompleted: false,
  },
  {
    id: 'prep-std-2',
    task: 'Prepare STAR stories (Situation, Task, Action, Result) for key projects',
    category: 'STAR Stories',
    isCompleted: false,
  },
  {
    id: 'prep-std-3',
    task: 'Draft questions for recruiters and hiring managers',
    category: 'Questions',
    isCompleted: false,
  },
  {
    id: 'prep-std-4',
    task: 'Review job description requirements and align resume bullet points',
    category: 'Technical',
    isCompleted: false,
  },
  {
    id: 'prep-std-5',
    task: 'Prepare compensation anchor & salary negotiation range',
    category: 'Research',
    isCompleted: false,
  },
  {
    id: 'prep-std-6',
    task: 'Test audio, video, microphone, and quiet interview space',
    category: 'Logistics',
    isCompleted: false,
  },
  {
    id: 'prep-std-7',
    task: 'Prepare post-interview 24h thank-you and follow-up notes',
    category: 'Logistics',
    isCompleted: false,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Research: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'STAR Stories': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Questions: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Technical: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Logistics: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Custom: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

interface InterviewChecklistProps {
  job: JobApplication;
  onUpdateChecklist: (jobId: string, checklist: PrepChecklistItem[]) => void;
}

export const InterviewChecklist: React.FC<InterviewChecklistProps> = ({
  job,
  onUpdateChecklist,
}) => {
  const checklist =
    job.prepChecklist && job.prepChecklist.length > 0
      ? job.prepChecklist
      : DEFAULT_PREP_CHECKLIST;

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<
    'Research' | 'STAR Stories' | 'Questions' | 'Technical' | 'Logistics' | 'Custom'
  >('Custom');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const completedCount = checklist.filter((item) => item.isCompleted).length;
  const totalCount = checklist.length;
  const percentReady = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (itemId: string) => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    onUpdateChecklist(job.id, updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newItem: PrepChecklistItem = {
      id: `prep-custom-${Date.now()}`,
      task: newTaskText.trim(),
      category: newTaskCategory,
      isCompleted: false,
      isCustom: true,
    };

    onUpdateChecklist(job.id, [...checklist, newItem]);
    setNewTaskText('');
    setIsAdding(false);
  };

  const handleDeleteTask = (itemId: string) => {
    const updated = checklist.filter((item) => item.id !== itemId);
    onUpdateChecklist(job.id, updated);
  };

  const handleReset = () => {
    if (confirm('Reset preparation checklist to standard tasks?')) {
      onUpdateChecklist(job.id, DEFAULT_PREP_CHECKLIST);
    }
  };

  const handleGenerateAiTasks = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checklist_suggest',
          job,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate checklist tasks');

      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        // Merge without duplicate task strings
        const existingTasks = new Set(checklist.map((c) => c.task.toLowerCase()));
        const newUniqueTasks: PrepChecklistItem[] = [];

        data.tasks.forEach((t: any) => {
          if (!existingTasks.has(t.task.toLowerCase())) {
            newUniqueTasks.push({
              id: t.id || `prep-ai-${Date.now()}-${Math.random()}`,
              task: t.task,
              category: t.category || 'Research',
              isCompleted: false,
              isCustom: true,
            });
          }
        });

        onUpdateChecklist(job.id, [...checklist, ...newUniqueTasks]);
      }
    } catch (err) {
      console.error(err);
      // Fallback custom tasks
      const fallbackTasks: PrepChecklistItem[] = [
        {
          id: `prep-fb-1-${Date.now()}`,
          task: `Deep dive into ${job.companyName}'s product line and technical blogs`,
          category: 'Research',
          isCompleted: false,
          isCustom: true,
        },
        {
          id: `prep-fb-2-${Date.now()}`,
          task: `Prepare response to: "Why do you want to join ${job.companyName} as ${job.jobTitle}?"`,
          category: 'STAR Stories',
          isCompleted: false,
          isCustom: true,
        },
      ];
      onUpdateChecklist(job.id, [...checklist, ...fallbackTasks]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[#16161A] border border-white/5 space-y-4">
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Interview Prep Checklist
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  percentReady === 100
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : percentReady >= 50
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-white/5 text-slate-400 border-white/5'
                }`}
              >
                {completedCount} / {totalCount} Done ({percentReady}%)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tick off research, STAR stories, and interviewer questions
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={handleGenerateAiTasks}
            disabled={isAiLoading}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-600/15 hover:bg-indigo-600/25 rounded-lg border border-indigo-500/30 transition-colors"
            title="Generate custom AI prep tasks tailored to this company"
          >
            {isAiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>AI Suggest Tasks</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'Add Task'}</span>
          </button>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
        <div
          className={`h-full transition-all duration-300 ${
            percentReady === 100
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          }`}
          style={{ width: `${percentReady}%` }}
        />
      </div>

      {/* Add Custom Task Form */}
      {isAdding && (
        <form
          onSubmit={handleAddTask}
          className="p-3.5 rounded-xl bg-[#0D0D10] border border-white/10 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <span className="text-xs font-semibold text-white">Add Custom Preparation Item</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-3">
              <input
                type="text"
                required
                placeholder="e.g. Review GraphQL caching & microfrontend case studies..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <select
                value={newTaskCategory}
                onChange={(e: any) => setNewTaskCategory(e.target.value)}
                className="w-full px-2 py-1.5 bg-[#16161A] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="Research">Research</option>
                <option value="STAR Stories">STAR Stories</option>
                <option value="Questions">Questions</option>
                <option value="Technical">Technical</option>
                <option value="Logistics">Logistics</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Add Item
            </button>
          </div>
        </form>
      )}

      {/* Checklist Items List */}
      <div className="space-y-2">
        {checklist.map((item) => {
          const categoryClass =
            CATEGORY_COLORS[item.category || 'Custom'] || CATEGORY_COLORS.Custom;

          return (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer group select-none ${
                item.isCompleted
                  ? 'bg-[#0A0A0C]/40 border-white/5 opacity-60'
                  : 'bg-[#0D0D10] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`mt-0.5 p-0.5 rounded transition-colors flex items-center justify-center flex-shrink-0 ${
                    item.isCompleted
                      ? 'bg-indigo-600 text-white'
                      : 'border border-white/20 group-hover:border-white/40 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-medium leading-relaxed ${
                        item.isCompleted
                          ? 'line-through text-slate-500'
                          : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {item.task}
                    </span>

                    {item.category && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${categoryClass}`}
                      >
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {item.isCustom && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(item.id);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Remove custom task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Tools */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-white/5">
        <span>Click any task to toggle status</span>
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset checklist</span>
        </button>
      </div>
    </div>
  );
};
