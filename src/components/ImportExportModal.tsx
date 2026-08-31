import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, Check, AlertCircle, FileText } from 'lucide-react';
import { JobApplication } from '../types';
import { exportToCSV, parseCSV } from '../utils/csvHelper';

interface ImportExportModalProps {
  isOpen: boolean;
  initialTab?: 'import' | 'export';
  onClose: () => void;
  jobs: JobApplication[];
  onImportJobs: (newJobs: Partial<JobApplication>[], mode: 'append' | 'replace') => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  initialTab = 'export',
  onClose,
  jobs,
  onImportJobs,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab);
  const [pastedCSV, setPastedCSV] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<JobApplication>[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvData = exportToCSV(jobs);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `job_tracker_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setErrorMsg('No valid job rows found in the CSV. Ensure headers match.');
        } else {
          setParsedPreview(parsed);
          setPastedCSV(text);
        }
      } catch (err: any) {
        setErrorMsg(`Failed to parse CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleParseText = () => {
    setErrorMsg(null);
    if (!pastedCSV.trim()) {
      setErrorMsg('Please paste CSV text or select a file');
      return;
    }
    const parsed = parseCSV(pastedCSV);
    if (parsed.length === 0) {
      setErrorMsg('Could not detect job records in the pasted text.');
    } else {
      setParsedPreview(parsed);
    }
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImportJobs(parsedPreview, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#16161A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0D0D10]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Import & Export Data
              </h2>
              <p className="text-xs text-slate-500">
                Seamlessly transfer spreadsheet data to and from Job Tracker
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/5 bg-[#0D0D10]/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV ({jobs.length} items)
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Export Applications Spreadsheet
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Download all {jobs.length} tracked jobs with full metadata (Company, Link, Title, Dates, Salary, Contacts, Location, Status, Notes, Tags).
                </p>
              </div>

              <button
                id="modal-confirm-export-csv-btn"
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download .CSV File</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File upload input */}
              <div className="p-5 border-2 border-dashed border-white/10 rounded-2xl text-center bg-white/5 hover:border-white/20 transition-colors">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer inline-flex flex-col items-center gap-1.5"
                >
                  <Upload className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs font-semibold text-white">
                    Click to upload a .CSV spreadsheet
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Compatible with BeamJobs and custom templates
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px bg-white/5 flex-1" />
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Or Paste Raw CSV</span>
                <div className="h-px bg-white/5 flex-1" />
              </div>

              <textarea
                rows={4}
                value={pastedCSV}
                onChange={(e) => setPastedCSV(e.target.value)}
                placeholder="Company Name,Job Link,Job Title,Date Applied,Deadline,Type of Job,Salary (Annual)..."
                className="w-full p-2.5 font-mono text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-lg border border-white/5 transition-colors"
                >
                  Preview CSV Content
                </button>

                {/* Mode toggle */}
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-indigo-600 focus:ring-0"
                    />
                    <span>Add to existing</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-indigo-600 focus:ring-0"
                    />
                    <span>Replace all</span>
                  </label>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Preview table */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span>Detected {parsedPreview.length} Applications</span>
                    <button
                      onClick={handleConfirmImport}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-xs transition-colors"
                    >
                      Import Now
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto border border-white/5 bg-[#0D0D10] rounded-xl text-xs divide-y divide-white/5">
                    {parsedPreview.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {item.companyName}
                        </span>
                        <span className="text-slate-400">{item.jobTitle}</span>
                        <span className="text-slate-500 text-[11px]">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
