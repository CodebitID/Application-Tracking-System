import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Save,
  RotateCcw,
  Loader2,
  Wand2,
  Building,
  Briefcase,
  Sliders,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { JobApplication, UserAccount, CoverLetterRecord } from '../types';

interface CoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobApplication | null;
  currentAccount?: UserAccount;
  onSaveCoverLetter?: (jobId: string, record: CoverLetterRecord) => void;
  onAppendToJobNotes?: (jobId: string, text: string) => void;
}

const TONE_OPTIONS = [
  { id: 'Professional & Impactful', label: 'Professional & Impactful', desc: 'Balanced, confident, outcome-focused' },
  { id: 'Enthusiastic & High-Energy', label: 'Enthusiastic & High-Energy', desc: 'Passionate about mission & culture' },
  { id: 'Technical & Analytical', label: 'Technical & Analytical', desc: 'Emphasizes architecture, metrics & stack' },
  { id: 'Executive & Strategic', label: 'Executive & Strategic', desc: 'Leadership, vision & business value' },
  { id: 'Concise & Direct', label: 'Concise & Direct', desc: 'Brief, crisp, highly scannable' },
];

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  isOpen,
  onClose,
  job,
  currentAccount,
  onSaveCoverLetter,
  onAppendToJobNotes,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [userHighlights, setUserHighlights] = useState('');
  const [selectedTone, setSelectedTone] = useState(TONE_OPTIONS[0].id);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'saved'>('generator');

  // Initialize fields whenever a job or account opens
  useEffect(() => {
    if (job) {
      setJobTitle(job.jobTitle || '');
      setCompanyName(job.companyName || '');
      setCompanyDescription(
        job.notes || `${job.companyName} is an industry leader hiring for the ${job.jobTitle} position (${job.location}).`
      );
      setUserHighlights(
        currentAccount?.resumeHighlights ||
          `• Experienced ${currentAccount?.targetRole || job.jobTitle} with track record of high-impact delivery\n• Led cross-functional initiatives improving reliability and velocity\n• Strong background in problem solving, design alignment, and clean execution`
      );
      setGeneratedLetter('');
      setIsCopied(false);
      setIsSaved(false);
    }
  }, [job, currentAccount, isOpen]);

  if (!isOpen || !job) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setIsCopied(false);
    setIsSaved(false);

    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cover_letter',
          job: {
            ...job,
            jobTitle,
            companyName,
          },
          companyDescription,
          userHighlights,
          tone: selectedTone,
          candidateName: currentAccount?.name || 'Applicant',
          candidateRole: currentAccount?.targetRole || jobTitle,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate cover letter');

      const data = await res.json();
      setGeneratedLetter(data.result || 'No response generated.');
    } catch (err: any) {
      console.error(err);
      setGeneratedLetter(
        `Dear Hiring Team at ${companyName},\n\n` +
          `I am writing to express my strong enthusiasm for the ${jobTitle} position at ${companyName}. ` +
          `With a solid background in ${currentAccount?.targetRole || jobTitle}, I bring proven expertise in delivering high-value outcomes.\n\n` +
          `${userHighlights ? `Key achievements:\n${userHighlights}\n\n` : ''}` +
          `I am particularly drawn to ${companyName} because of your commitment to excellence and high quality. ` +
          `I would welcome the opportunity to discuss how my skill set aligns with your upcoming goals.\n\n` +
          `Sincerely,\n${currentAccount?.name || 'Applicant'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedLetter) return;
    const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${companyName.replace(/\s+/g, '_')}_Cover_Letter_${jobTitle.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToLibrary = () => {
    if (!generatedLetter || !onSaveCoverLetter) return;

    const newRecord: CoverLetterRecord = {
      id: `cl-${Date.now()}`,
      title: `${companyName} - ${jobTitle} (${selectedTone.split(' ')[0]})`,
      body: generatedLetter,
      tone: selectedTone,
      userHighlights,
      createdAt: new Date().toISOString(),
    };

    onSaveCoverLetter(job.id, newRecord);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveToNotes = () => {
    if (!generatedLetter || !onAppendToJobNotes) return;
    const textToAppend = `\n\n--- AI COVER LETTER (${new Date().toLocaleDateString()}) ---\n${generatedLetter}`;
    onAppendToJobNotes(job.id, textToAppend);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const savedLetters = job.coverLetters || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-[#0D0D10] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-[#0F0F12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-xs">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  AI Cover Letter Generator
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Gemini 2.5
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tailor a personalized, high-converting cover letter for{' '}
                <span className="text-slate-200 font-medium">{job.companyName}</span> ({job.jobTitle})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-white/5 bg-[#0D0D10] flex gap-4">
          <button
            onClick={() => setActiveTab('generator')}
            className={`pb-2.5 text-xs font-semibold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'generator'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate & Edit</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2.5 text-xs font-semibold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Saved Drafts ({savedLetters.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'generator' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Context Inputs */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-[#141418] border border-white/5 space-y-3.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Target Parameters
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Job Position Title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tone & Style
                    </label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#1C1C22] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    >
                      {TONE_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#141418] border border-white/5 space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Company Mission & Role Context</span>
                      <span className="text-[10px] text-slate-500">Why this team?</span>
                    </label>
                    <textarea
                      rows={2}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      placeholder="Brief notes about what the company does, why you want to work there, or key job requirements..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Candidate Highlights & Achievements</span>
                      <span className="text-[10px] text-indigo-400 font-medium">User Profile Data</span>
                    </label>
                    <textarea
                      rows={4}
                      value={userHighlights}
                      onChange={(e) => setUserHighlights(e.target.value)}
                      placeholder="Key achievements, metrics, core technologies, leadership examples..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed font-mono"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Crafting Tailored Cover Letter...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Cover Letter Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Output & Controls */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Cover Letter Document
                  </span>

                  {generatedLetter && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCopy}
                        className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors flex items-center gap-1"
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDownload}
                        className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors flex items-center gap-1"
                        title="Download as .txt"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export</span>
                      </button>

                      <button
                        onClick={handleSaveToLibrary}
                        className="px-2.5 py-1 text-xs text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-1 font-semibold"
                        title="Save to Application Library"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaved ? 'Saved!' : 'Save Draft'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex-1 min-h-[300px] p-8 text-center bg-[#09090C] rounded-xl border border-indigo-500/30 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
                    <h4 className="text-sm font-bold text-white">
                      Analyzing {job.companyName} requirements...
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Synthesizing candidate achievements with the {job.jobTitle} position using Gemini intelligence.
                    </p>
                  </div>
                ) : generatedLetter ? (
                  <div className="flex-1 flex flex-col space-y-2">
                    <textarea
                      rows={14}
                      value={generatedLetter}
                      onChange={(e) => setGeneratedLetter(e.target.value)}
                      className="w-full flex-1 p-4 bg-[#09090C] border border-white/10 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed font-sans"
                    />

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Editable in place • {generatedLetter.split(/\s+/).filter(Boolean).length} words</span>
                      <button
                        onClick={handleSaveToNotes}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                      >
                        Append letter to Job Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[300px] p-8 text-center bg-[#09090C]/50 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center">
                    <Wand2 className="w-8 h-8 text-indigo-400/60 mb-3" />
                    <h4 className="text-sm font-bold text-white">
                      No cover letter generated yet
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Review parameters on the left and click "Generate Cover Letter Draft" to produce an ATS-tailored cover letter with Gemini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Saved Drafts List */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Saved Cover Letters for this Application ({savedLetters.length})
                </span>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  + Generate New Variation
                </button>
              </div>

              {savedLetters.length === 0 ? (
                <div className="p-8 text-center bg-[#09090C]/50 rounded-xl border border-dashed border-white/10">
                  <p className="text-xs text-slate-500">
                    No saved cover letters yet. Generate a letter and click "Save Draft" to keep multiple versions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedLetters.map((cl) => (
                    <div
                      key={cl.id}
                      className="p-4 rounded-xl bg-[#141418] border border-white/5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white">{cl.title}</h4>
                          <span className="text-[10px] text-slate-500">
                            Created {new Date(cl.createdAt).toLocaleDateString()} • Tone: {cl.tone || 'Standard'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cl.body);
                              alert('Cover letter copied to clipboard!');
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-300 hover:text-white flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                          <button
                            onClick={() => {
                              setGeneratedLetter(cl.body);
                              setActiveTab('generator');
                            }}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-semibold"
                          >
                            Load in Editor
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-[#0A0A0C] rounded-lg border border-white/5 text-xs text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                        {cl.body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#0F0F12] flex items-center justify-between text-xs text-slate-400">
          <span>AI-generated drafts can be refined and saved directly to your profile.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
