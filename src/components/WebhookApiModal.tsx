import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Code2,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Zap,
  Terminal,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  X,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  Globe,
} from 'lucide-react';
import { WebhookLog, JobApplication } from '../types';

interface WebhookApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobImported?: (newJob: JobApplication) => void;
}

export const WebhookApiModal: React.FC<WebhookApiModalProps> = ({
  isOpen,
  onClose,
  onJobImported,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'test' | 'logs' | 'architecture'>('docs');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState<string>('tracker_secret_token_2026');
  const [isTokenHidden, setIsTokenHidden] = useState<boolean>(true);

  // Testing & Simulation State
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testPayloadType, setTestPayloadType] = useState<'wordpress' | 'fullstack' | 'custom'>('wordpress');
  
  // Custom JSON editor state
  const [customPayloadText, setCustomPayloadText] = useState<string>(
    JSON.stringify(
      {
        title: "Senior WordPress Developer",
        company: "Automattic Ecosystem Partner",
        source: "We Work Remotely",
        source_url: "https://weworkremotely.com/remote-jobs/senior-wordpress-dev",
        location: "Worldwide",
        remote: true,
        employment_type: "Full-time",
        salary_min: 75000,
        salary_max: 95000,
        currency: "USD",
        eligibility: "Remote from Indonesia",
        fit_score: 92,
        recommendation: "HIGH PRIORITY",
        technical_fit: 94,
        experience_fit: 95,
        location_fit: 100,
        main_risk: "Requires 4-hour US timezone overlap",
        matched_skills: [
          "WordPress",
          "PHP",
          "REST API",
          "WooCommerce",
          "Technical SEO"
        ],
        missing_skills: [
          "GraphQL"
        ],
        status: "new",
        external_job_id: "wwr-wordpress-001"
      },
      null,
      2
    )
  );

  // Logs State
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/webhook/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch webhook logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, activeTab]);

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Trigger test webhook call
  const handleSendTestWebhook = async (forceDuplicate: boolean = false) => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      let payloadToSubmit: any;

      if (testPayloadType === 'custom') {
        try {
          payloadToSubmit = JSON.parse(customPayloadText);
        } catch (e: any) {
          setTestResult({
            success: false,
            error: `Invalid JSON syntax: ${e.message}`,
          });
          setIsSendingTest(false);
          return;
        }
      } else if (testPayloadType === 'wordpress') {
        payloadToSubmit = {
          title: "Senior WordPress Developer",
          company: "Automattic Partner Network",
          source: "We Work Remotely",
          source_url: "https://weworkremotely.com/remote-jobs/senior-wordpress-dev",
          location: "Worldwide",
          remote: true,
          employment_type: "Full-time",
          salary_min: 75000,
          salary_max: 95000,
          currency: "USD",
          eligibility: "Remote from Indonesia",
          fit_score: 92,
          recommendation: "HIGH PRIORITY",
          technical_fit: 94,
          experience_fit: 95,
          location_fit: 100,
          main_risk: "Requires 4-hour US timezone overlap",
          matched_skills: ["WordPress", "PHP", "REST API", "WooCommerce", "Technical SEO"],
          missing_skills: ["GraphQL"],
          status: "new",
          external_job_id: forceDuplicate ? "wp-fixed-duplicate-key-101" : `wp-${Date.now()}`,
        };
      } else {
        payloadToSubmit = {
          title: "Senior React & TypeScript Engineer",
          company: "Global Scale Labs",
          source: "RemoteOK",
          source_url: "https://remoteok.com/remote-jobs/senior-react-ts-dev",
          location: "Worldwide / APAC",
          remote: true,
          employment_type: "Full-time",
          salary_min: 85000,
          salary_max: 115000,
          currency: "USD",
          eligibility: "Remote from Indonesia (100% OK)",
          fit_score: 88,
          recommendation: "APPLY",
          technical_fit: 90,
          experience_fit: 88,
          location_fit: 100,
          main_risk: "Requires fast turnaround for live client incidents",
          matched_skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker"],
          missing_skills: ["Kubernetes"],
          status: "new",
          external_job_id: forceDuplicate ? "ts-fixed-duplicate-key-202" : `ts-${Date.now()}`,
        };
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify(payloadToSubmit),
      });

      const data = await response.json();
      setTestResult({
        httpStatus: response.status,
        ...data,
      });

      // Refresh logs
      fetchLogs();

      // If job was imported and not duplicate, callback to update dashboard state
      if (data.success && !data.duplicate && data.job && onJobImported) {
        onJobImported(data.job);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Network request failed',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://your-tracker-site.com';
  const apiEndpointUrl = `${currentHost}/api/jobs`;

  const sampleCurl = `curl -X POST "${apiEndpointUrl}" \\
  -H "Authorization: Bearer ${apiToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Senior WordPress Developer",
    "company": "Example Company",
    "source": "We Work Remotely",
    "source_url": "https://weworkremotely.com/remote-jobs/...",
    "location": "Worldwide",
    "remote": true,
    "employment_type": "Full-time",
    "salary_min": 70000,
    "salary_max": 90000,
    "currency": "USD",
    "eligibility": "Remote from Indonesia",
    "fit_score": 88,
    "recommendation": "APPLY",
    "technical_fit": 92,
    "experience_fit": 95,
    "location_fit": 100,
    "main_risk": "Requires 4-hour US timezone overlap",
    "matched_skills": ["WordPress", "PHP", "REST API", "WooCommerce", "Technical SEO"],
    "missing_skills": ["GraphQL"],
    "status": "new",
    "external_job_id": "wwr-12345"
  }'`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#121216] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#0D0D10] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">REST API & Webhook Ingestion Hub</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live REST Endpoint
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automate opportunity ingestion from Daily Job Collectors, ChatGPT Workers, and custom scrapers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#16161C] border-b border-white/5 overflow-x-auto scrollbar-none flex-shrink-0">
          {[
            { id: 'docs', label: 'API Specification & cURL', icon: Code2 },
            { id: 'test', label: 'Test Webhook & Simulator', icon: Send },
            { id: 'logs', label: 'Ingestion Audit Logs', icon: Terminal, count: logs.length },
            { id: 'architecture', label: 'Recommended Architecture', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: API Docs & cURL */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Endpoint Card */}
              <div className="p-4 rounded-xl bg-[#16161C] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      POST
                    </span>
                    <span className="text-sm font-mono font-medium text-white select-all">
                      /api/jobs
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(apiEndpointUrl, 'endpoint')}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copiedSection === 'endpoint' ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="w-3 h-3" /> Copied URL
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copy Full URL
                      </span>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-400">
                  Full Endpoint URL: <code className="text-indigo-300 font-mono select-all">{apiEndpointUrl}</code>
                </div>
              </div>

              {/* Authentication Credentials Bar */}
              <div className="p-4 rounded-xl bg-[#181820] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Authentication Header</h4>
                  </div>
                  <span className="text-[11px] text-slate-400">Bearer Token / X-API-Key</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-slate-300">
                    <span className="text-slate-400">Authorization:</span>
                    <span className="text-indigo-400">Bearer</span>
                    <span className="text-white">
                      {isTokenHidden ? '••••••••••••••••••••••••••••••••' : apiToken}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsTokenHidden(!isTokenHidden)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white"
                  >
                    {isTokenHidden ? 'Reveal' : 'Hide'}
                  </button>
                  <button
                    onClick={() => handleCopy(apiToken, 'token')}
                    className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 flex items-center gap-1.5"
                  >
                    {copiedSection === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSection === 'token' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* cURL Example */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">cURL Command</h4>
                  </div>
                  <button
                    onClick={() => handleCopy(sampleCurl, 'curl')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copiedSection === 'curl' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Copied to Clipboard
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5" /> Copy cURL
                      </span>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto max-h-60">
                  <pre>{sampleCurl}</pre>
                </div>
              </div>

              {/* Ingestion Contract Specification */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Payload Schema & Duplicate Protection Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#16161C] border border-white/5 space-y-1.5">
                    <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      Duplicate Prevention
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Unique composite key calculated from <code className="text-white font-mono">source + external_job_id</code> or <code className="text-white font-mono">company + title + source_url</code>.
                      Existing vacancies will return <code className="text-amber-300 font-mono">{`"duplicate": true`}</code> without polluting your dashboard.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#16161C] border border-white/5 space-y-1.5">
                    <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Automated Fit Classification
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Accepts <code className="text-white font-mono">fit_score</code> (85-100 → HIGH PRIORITY, 75-84 → APPLY, 65-74 → SELECTIVELY), eligibility for Indonesia/Worldwide, and technical/experience fit breakdowns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Live Test & Simulator */}
          {activeTab === 'test' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-3">
                <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Interactive Ingestion Simulator:</span> Send a test payload to your live backend endpoint right now. Test new opportunity creation and observe instant duplicate suppression.
                </div>
              </div>

              {/* Preset Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Sample Opportunities:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTestPayloadType('wordpress')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      testPayloadType === 'wordpress'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    WordPress Specialist (92% Fit)
                  </button>
                  <button
                    onClick={() => setTestPayloadType('fullstack')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      testPayloadType === 'fullstack'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    React/TypeScript (88% Fit)
                  </button>
                  <button
                    onClick={() => setTestPayloadType('custom')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      testPayloadType === 'custom'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Custom JSON
                  </button>
                </div>
              </div>

              {/* JSON Payload Preview/Editor */}
              {testPayloadType === 'custom' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Custom JSON Payload</label>
                  <textarea
                    rows={10}
                    value={customPayloadText}
                    onChange={(e) => setCustomPayloadText(e.target.value)}
                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto">
                  <pre>
                    {testPayloadType === 'wordpress'
                      ? JSON.stringify(
                          {
                            title: 'Senior WordPress Developer',
                            company: 'Automattic Partner Network',
                            source: 'We Work Remotely',
                            source_url: 'https://weworkremotely.com/remote-jobs/senior-wordpress-dev',
                            location: 'Worldwide',
                            remote: true,
                            salary_min: 75000,
                            salary_max: 95000,
                            currency: 'USD',
                            eligibility: 'Remote from Indonesia',
                            fit_score: 92,
                            recommendation: 'HIGH PRIORITY',
                            technical_fit: 94,
                            experience_fit: 95,
                            location_fit: 100,
                            main_risk: 'Requires 4-hour US timezone overlap',
                            matched_skills: ['WordPress', 'PHP', 'REST API', 'WooCommerce', 'Technical SEO'],
                            missing_skills: ['GraphQL'],
                            status: 'new',
                          },
                          null,
                          2
                        )
                      : JSON.stringify(
                          {
                            title: 'Senior React & TypeScript Engineer',
                            company: 'Global Scale Labs',
                            source: 'RemoteOK',
                            source_url: 'https://remoteok.com/remote-jobs/senior-react-ts-dev',
                            location: 'Worldwide / APAC',
                            remote: true,
                            salary_min: 85000,
                            salary_max: 115000,
                            currency: 'USD',
                            eligibility: 'Remote from Indonesia (100% OK)',
                            fit_score: 88,
                            recommendation: 'APPLY',
                            technical_fit: 90,
                            experience_fit: 88,
                            location_fit: 100,
                            main_risk: 'Requires fast turnaround for live client incidents',
                            matched_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
                            missing_skills: ['Kubernetes'],
                            status: 'new',
                          },
                          null,
                          2
                        )}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleSendTestWebhook(false)}
                  disabled={isSendingTest}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
                  <span>{isSendingTest ? 'Ingesting Opportunity...' : 'Send Test Opportunity'}</span>
                </button>

                <button
                  onClick={() => handleSendTestWebhook(true)}
                  disabled={isSendingTest}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
                  title="Sends fixed key payload to verify that duplicate detection rejects re-insertion"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Duplicate Rejection (Same Key)</span>
                </button>
              </div>

              {/* Test Response Window */}
              {testResult && (
                <div className="mt-4 p-4 rounded-xl bg-[#16161C] border border-white/10 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Server Response</span>
                      {testResult.duplicate ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Duplicate Detected (Safe)
                        </span>
                      ) : testResult.success ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          201 Created & Tracked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Error
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      HTTP {testResult.httpStatus || 200}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium">
                    {testResult.message || testResult.error}
                  </p>

                  <div className="p-3 bg-black/60 border border-white/5 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto">
                    <pre>{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Audit Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recent Ingestion Audit Trail ({logs.length} events)
                  </h4>
                </div>
                <button
                  onClick={fetchLogs}
                  disabled={isLoadingLogs}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Terminal className="w-8 h-8 mx-auto text-slate-400 opacity-40" />
                  <p className="text-xs">No webhook requests logged yet</p>
                  <p className="text-[11px] text-slate-400">
                    Send a test payload or configure your collector to start receiving requests.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log) => {
                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-[#16161C] border border-white/5 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.statusCode >= 200 && log.statusCode < 300
                                  ? log.status === 'duplicate_skipped'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {log.method} {log.statusCode}
                            </span>
                            <span className="font-mono text-white text-[11px]">{log.endpoint}</span>
                            {log.source && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                                {log.source}
                              </span>
                            )}
                          </div>

                          <p className="text-slate-300 text-xs truncate">
                            {log.companyName && <span className="font-semibold text-white">{log.companyName}: </span>}
                            {log.jobTitle || log.message}
                          </p>

                          {log.message && log.companyName && (
                            <p className="text-[11px] text-slate-400">{log.message}</p>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Architecture Diagram & Guide */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-[#16161C] border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-white">Daily Remote Job Pipeline</h4>
                
                {/* Pipeline Flow Diagram */}
                <div className="p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] text-indigo-300 space-y-1.5">
                  <div className="text-slate-400">Remote Job Sources (WWR, RemoteOK, HackerNews, LinkedIn)</div>
                  <div className="text-slate-400">        ↓</div>
                  <div className="text-white">Daily Job Collector & Discovery Engine</div>
                  <div className="text-slate-400">        ↓</div>
                  <div className="text-amber-300">Fit & Eligibility Filter (Remote Indonesia / APAC / Tech Stack)</div>
                  <div className="text-slate-400">        ↓</div>
                  <div className="text-emerald-300">High-Fit Opportunities (Score ≥ 75)</div>
                  <div className="text-slate-400">        ↓</div>
                  <div className="text-indigo-400">POST /api/jobs (Authorization: Bearer YOUR_TOKEN)</div>
                  <div className="text-slate-400">        ↓</div>
                  <div className="text-white font-bold">Your Tracking Dashboard & Status Board (Saved / Not Started)</div>
                </div>
              </div>

              {/* Step by step implementation advice */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#16161C] border border-white/5 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">1</span>
                    Discovery & Scraper
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Set up your cron script, ChatGPT / n8n workflow, or serverless worker to scan remote sources every morning.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#16161C] border border-white/5 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
                    Fit Qualification
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Calculate fit score, verify Indonesia remote clearance, check timezone overlap, and tag matched/missing skills.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#16161C] border border-white/5 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">3</span>
                    Auto-Track
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    POST to <code className="text-white font-mono">/api/jobs</code>. Duplicate detection prevents redundant cards, and high-fit jobs appear instantly on your board.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0D0D10] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Duplicate Protection & API Key Auth Enabled</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
