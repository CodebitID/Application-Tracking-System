import { JobApplication, ApplicationReminder } from '../types';

export interface NotificationItem {
  id: string;
  type: 'interview' | 'reminder';
  jobId: string;
  companyName: string;
  jobTitle: string;
  title: string;
  message: string;
  dateTime: string;
  isUrgent: boolean;
  timeRemainingLabel: string;
}

const NOTIFIED_STORAGE_KEY = 'career_tracker_notified_alerts_v1';

export const isBrowserNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isBrowserNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isBrowserNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Failed to request notification permission', e);
    return 'denied';
  }
};

export const getUpcomingAlerts = (jobs: JobApplication[]): NotificationItem[] => {
  const alerts: NotificationItem[] = [];
  const now = new Date();
  const nowTime = now.getTime();
  const twentyFourHoursFromNow = nowTime + 24 * 60 * 60 * 1000;

  jobs.forEach((job) => {
    // 1. Check interview dates
    if (job.interviewDate) {
      try {
        const interviewDate = new Date(job.interviewDate);
        if (!isNaN(interviewDate.getTime())) {
          const interviewTime = interviewDate.getTime();
          // Check if today or within next 24 hours
          const isToday =
            interviewDate.getDate() === now.getDate() &&
            interviewDate.getMonth() === now.getMonth() &&
            interviewDate.getFullYear() === now.getFullYear();

          const diffHours = (interviewTime - nowTime) / (1000 * 60 * 60);

          // If interview is within 24 hours, or happening today, or within 48h
          if ((diffHours >= -6 && diffHours <= 24) || isToday) {
            let timeRemainingLabel = 'Upcoming today';
            if (isToday) {
              timeRemainingLabel = 'Today';
            } else if (diffHours > 0) {
              timeRemainingLabel = `In ${Math.max(1, Math.round(diffHours))} hours`;
            } else {
              timeRemainingLabel = 'Happening today';
            }

            alerts.push({
              id: `interview-${job.id}-${job.interviewDate}`,
              type: 'interview',
              jobId: job.id,
              companyName: job.companyName,
              jobTitle: job.jobTitle,
              title: `Interview Alert: ${job.companyName}`,
              message: `Your interview for ${job.jobTitle} is scheduled for ${job.interviewDate}. Prepare your portfolio and key questions!`,
              dateTime: job.interviewDate,
              isUrgent: true,
              timeRemainingLabel,
            });
          }
        }
      } catch (e) {
        console.error('Error parsing interview date for alerts', e);
      }
    }

    // 2. Check application reminders
    if (job.reminders && Array.isArray(job.reminders)) {
      job.reminders.forEach((reminder: ApplicationReminder) => {
        if (!reminder.isCompleted && reminder.dateTime) {
          try {
            const reminderDate = new Date(reminder.dateTime);
            if (!isNaN(reminderDate.getTime())) {
              const reminderTime = reminderDate.getTime();
              const diffHours = (reminderTime - nowTime) / (1000 * 60 * 60);

              if (diffHours <= 24 && diffHours >= -48) {
                alerts.push({
                  id: `reminder-${reminder.id}`,
                  type: 'reminder',
                  jobId: job.id,
                  companyName: job.companyName,
                  jobTitle: job.jobTitle,
                  title: `Application Reminder: ${job.companyName}`,
                  message: reminder.note || `Follow up on your application for ${job.jobTitle}`,
                  dateTime: reminder.dateTime,
                  isUrgent: diffHours <= 6,
                  timeRemainingLabel: diffHours < 0 ? 'Overdue' : `In ${Math.max(1, Math.round(diffHours))}h`,
                });
              }
            }
          } catch (e) {
            console.error('Error parsing reminder date for alerts', e);
          }
        }
      });
    }
  });

  return alerts.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
};

/**
 * Triggers native browser notifications for alerts that haven't been shown in this browser session yet.
 */
export const triggerBrowserNotifications = (alerts: NotificationItem[]): void => {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  let notifiedIds: string[] = [];
  try {
    const saved = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    if (saved) {
      notifiedIds = JSON.parse(saved);
    }
  } catch {
    notifiedIds = [];
  }

  const urgentAlerts = alerts.filter((a) => !notifiedIds.includes(a.id));

  urgentAlerts.forEach((alert) => {
    try {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      notifiedIds.push(alert.id);
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  });

  try {
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(notifiedIds));
  } catch {}
};
