import { Task } from "../types";

export type TaskUrgencyLevel = "low" | "medium" | "high" | "critical" | "overdue";

export interface TaskReminder {
  taskId: string;
  urgencyLevel: TaskUrgencyLevel;
  daysUntilDue: number;
  shouldNotify: boolean;
  notificationFrequency: "once" | "every-6-hours" | "every-2-hours" | "hourly";
  message: string;
  icon: string;
}

/**
 * Calculate how many days until a task is due
 */
export const calculateDaysUntilDue = (dueDate: string | null): number | null => {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  const now = new Date();
  
  // Set time to start of day for accurate day calculation
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Determine urgency level based on days until due and completion status
 */
export const getUrgencyLevel = (
  task: Task,
  daysUntilDue: number | null
): TaskUrgencyLevel => {
  if (!daysUntilDue && !task.due_date) return "low";
  
  if (daysUntilDue === null) return "low";
  
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue === 0) return "critical"; // Due today
  if (daysUntilDue <= 1) return "critical";
  if (daysUntilDue <= 3) return "high";
  if (daysUntilDue <= 7) return "medium";
  
  return "low";
};

/**
 * Determine notification frequency based on urgency
 */
export const getNotificationFrequency = (urgency: TaskUrgencyLevel): "once" | "every-6-hours" | "every-2-hours" | "hourly" => {
  switch (urgency) {
    case "overdue":
      return "hourly"; // Every hour for overdue
    case "critical":
      return "every-2-hours"; // Every 2 hours for due today/tomorrow
    case "high":
      return "every-6-hours"; // Every 6 hours for 3-7 days out
    case "medium":
    case "low":
    default:
      return "once"; // Just one reminder for low priority
  }
};

/**
 * Generate reminder message based on task and urgency
 */
export const generateReminderMessage = (
  task: Task,
  urgency: TaskUrgencyLevel,
  daysUntilDue: number | null
): string => {
  const taskName = task.title;
  
  switch (urgency) {
    case "overdue":
      return `⚠️ OVERDUE: "${taskName}" is past its due date. Prioritize now!`;
    case "critical":
      if (daysUntilDue === 0) {
        return `🚨 DUE TODAY: "${taskName}" is due by end of day. Focus on this now!`;
      }
      return `⏰ URGENT: "${taskName}" is due tomorrow. Start working on it!`;
    case "high":
      return `📌 IMPORTANT: "${taskName}" is due in ${daysUntilDue} days. Plan your time!`;
    case "medium":
      return `📅 REMINDER: "${taskName}" is due in ${daysUntilDue} days. Don't forget!`;
    case "low":
    default:
      return `📝 UPCOMING: "${taskName}" is scheduled for ${daysUntilDue} days from now.`;
  }
};

/**
 * Check if enough time has passed since last notification
 */
export const shouldSendNotification = (
  lastNotificationTime: string | null,
  frequency: "once" | "every-6-hours" | "every-2-hours" | "hourly"
): boolean => {
  if (!lastNotificationTime) return true; // First time, always send
  
  const lastNotif = new Date(lastNotificationTime);
  const now = new Date();
  const minutesSinceLastNotif = (now.getTime() - lastNotif.getTime()) / (1000 * 60);
  
  const frequencyMap: { [key: string]: number } = {
    once: Infinity, // Once means never again today
    "every-6-hours": 360,
    "every-2-hours": 120,
    hourly: 60,
  };
  
  return minutesSinceLastNotif >= frequencyMap[frequency];
};

/**
 * Get notification tracking key from localStorage
 */
export const getNotificationKey = (taskId: string): string => {
  return `taskReminder_${taskId}_lastNotification`;
};

/**
 * Save notification timestamp to localStorage
 */
export const saveNotificationTimestamp = (taskId: string): void => {
  localStorage.setItem(getNotificationKey(taskId), new Date().toISOString());
};

/**
 * Get last notification time from localStorage
 */
export const getLastNotificationTime = (taskId: string): string | null => {
  return localStorage.getItem(getNotificationKey(taskId));
};

/**
 * Determine icon/emoji based on urgency
 */
export const getUrgencyIcon = (urgency: TaskUrgencyLevel): string => {
  switch (urgency) {
    case "overdue":
      return "⚠️";
    case "critical":
      return "🚨";
    case "high":
      return "📌";
    case "medium":
      return "📅";
    case "low":
    default:
      return "📝";
  }
};

/**
 * Calculate urgency color for UI
 */
export const getUrgencyColor = (
  urgency: TaskUrgencyLevel
): { bg: string; border: string; text: string } => {
  switch (urgency) {
    case "overdue":
      return {
        bg: "bg-red-50",
        border: "border-red-300",
        text: "text-red-700",
      };
    case "critical":
      return {
        bg: "bg-orange-50",
        border: "border-orange-300",
        text: "text-orange-700",
      };
    case "high":
      return {
        bg: "bg-yellow-50",
        border: "border-yellow-300",
        text: "text-yellow-700",
      };
    case "medium":
      return {
        bg: "bg-blue-50",
        border: "border-blue-300",
        text: "text-blue-700",
      };
    case "low":
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-300",
        text: "text-slate-700",
      };
  }
};

/**
 * Get all tasks that need reminders right now
 */
export const getTasksNeedingReminders = (
  tasks: Task[]
): TaskReminder[] => {
  return tasks
    .filter((task) => {
      // Don't remind for completed tasks
      if (task.status === "done") return false;
      // Only for tasks with due dates
      if (!task.due_date) return false;
      return true;
    })
    .map((task) => {
      const daysUntilDue = calculateDaysUntilDue(task.due_date || null);
      const urgency = getUrgencyLevel(task, daysUntilDue!);
      const frequency = getNotificationFrequency(urgency);
      const lastNotification = getLastNotificationTime(task.id);
      const shouldNotify = shouldSendNotification(lastNotification, frequency);
      
      return {
        taskId: task.id,
        urgencyLevel: urgency,
        daysUntilDue: daysUntilDue!,
        shouldNotify,
        notificationFrequency: frequency,
        message: generateReminderMessage(task, urgency, daysUntilDue),
        icon: getUrgencyIcon(urgency),
      };
    })
    .filter((reminder) => reminder.shouldNotify);
};

/**
 * Generate sound alert based on urgency (for Web Audio API)
 */
export const playUrgencyAlert = (
  urgency: TaskUrgencyLevel,
  audioContext?: AudioContext
): void => {
  if (!audioContext) return;
  
  const ctx = audioContext;
  const now = ctx.currentTime;
  
  const playBeep = (freq: number, duration: number, volume: number = 0.3) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  };
  
  switch (urgency) {
    case "overdue":
      // Urgent triple beep: high alert
      playBeep(800, 0.3);
      playBeep(1000, 0.3, 0.4);
      playBeep(800, 0.3, 0.5);
      break;
    case "critical":
      // Double beep: high priority
      playBeep(700, 0.25, 0.3);
      playBeep(700, 0.25, 0.3);
      break;
    case "high":
      // Single beep: medium priority
      playBeep(600, 0.2, 0.25);
      break;
    case "medium":
    case "low":
    default:
      // Soft single beep
      playBeep(500, 0.15, 0.15);
      break;
  }
};
