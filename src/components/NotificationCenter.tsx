import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { JobApplication } from '../types';
import {
  NotificationItem,
  getUpcomingAlerts,
  isBrowserNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerBrowserNotifications,
} from '../utils/notifications';
import { formatDate, formatDateTime, getCompanyColor } from '../utils/formatters';

interface NotificationCenterProps {
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  jobs,
  onSelectJob,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Compute active alerts
  const allAlerts = getUpcomingAlerts(jobs);
  const activeAlerts = allAlerts.filter((a) => !dismissedIds.includes(a.id));
  const urgentCount = activeAlerts.length;

  // Trigger native browser notifications on load or when new alerts appear
  useEffect(() => {
    if (activeAlerts.length > 0) {
      triggerBrowserNotifications(activeAlerts);
    }
  }, [jobs, activeAlerts]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      triggerBrowserNotifications(activeAlerts);
    }
  };

  const handleTestNotification = () => {
    if (permission === 'granted' && isBrowserNotificationSupported()) {
      new Notification('CareerNode Interview Alert Test', {
        body: 'Your browser notifications are working! You will be alerted for interviews within 24 hours.',
        icon: '/favicon.ico',
      });
    } else {
      handleRequestPermission();
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleAlertClick = (jobId: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob) {
      onSelectJob(targetJob);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Interview & application reminders"
        className="relative p-2 text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-xs font-medium flex items-center justify-center"
      >
        <Bell className={`w-4 h-4 ${urgentCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
        {urgentCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
            {urgentCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#16161A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-[#0D0D10] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Interview Alerts & Reminders
              </h3>
            </div>

            <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {urgentCount} active
            </span>
          </div>

          {/* Browser Permission Banner if not granted */}
          {permission !== 'granted' && isBrowserNotificationSupported() && (
            <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between gap-2">
              <div className="text-[11px] text-indigo-200">
                <span className="font-semibold block text-white">Enable Desktop Alerts</span>
                Get notified when interview dates are within 24h
              </div>
              <button
                onClick={handleRequestPermission}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-xs"
              >
                Allow
              </button>
            </div>
          )}

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {activeAlerts.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
                <p className="text-xs font-semibold text-white">All caught up!</p>
                <p className="text-[11px] text-slate-500">
                  No upcoming interviews in the next 24 hours or pending reminders.
                </p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert.jobId)}
                  className="p-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getCompanyColor(
                        alert.companyName
                      )} text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      {alert.companyName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {alert.companyName}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            alert.type === 'interview'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {alert.timeRemainingLabel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(alert.dateTime)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDismiss(alert.id, e)}
                    title="Dismiss alert"
                    className="p-1 text-slate-500 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 border-t border-white/5 bg-[#0D0D10] flex items-center justify-between text-xs">
            <button
              onClick={handleTestNotification}
              className="text-[11px] text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" />
              <span>Test Notification</span>
            </button>

            {activeAlerts.length > 0 && (
              <button
                onClick={() => setDismissedIds(allAlerts.map((a) => a.id))}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const UpcomingInterviewBanner: React.FC<{
  jobs: JobApplication[];
  onSelectJob: (job: JobApplication) => void;
}> = ({ jobs, onSelectJob }) => {
  const [dismissed, setDismissed] = useState(false);
  const alerts = getUpcomingAlerts(jobs).filter((a) => a.type === 'interview');

  if (dismissed || alerts.length === 0) return null;

  const firstAlert = alerts[0];
  const targetJob = jobs.find((j) => j.id === firstAlert.jobId);

  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-indigo-950/40 to-[#16161A] border-b border-amber-500/30 px-4 sm:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
          <p className="text-slate-200 truncate">
            <strong className="text-white font-semibold">{firstAlert.title}:</strong>{' '}
            Interview within 24 hours ({firstAlert.timeRemainingLabel}) for {firstAlert.jobTitle}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {targetJob && (
            <button
              onClick={() => onSelectJob(targetJob)}
              className="px-2.5 py-1 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors text-xs flex items-center gap-1 shadow-xs"
            >
              <span>View Prep Details</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
