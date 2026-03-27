import React, { useEffect, useState, useRef } from "react";
import { AlertTriangle, Clock, Bell, X, CheckCircle } from "lucide-react";
import {
  getTasksNeedingReminders,
  saveNotificationTimestamp,
  playUrgencyAlert,
  getUrgencyColor,
} from "../services/taskReminderService";
import { Task } from "../types";

interface TaskRemindersProps {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}

export const TaskReminders: React.FC<TaskRemindersProps> = ({
  tasks,
  onTaskClick,
}) => {
  const [reminders, setReminders] = useState<ReturnType<typeof getTasksNeedingReminders>>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(
    null
  );
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Check for reminders every minute
    const checkReminders = () => {
      const tasksNeedingReminders = getTasksNeedingReminders(tasks);
      
      // Filter out dismissed reminders
      const activeReminders = tasksNeedingReminders.filter(
        (r) => !dismissedIds.has(r.taskId)
      );
      
      setReminders(activeReminders);

      // Play alert for critical reminders and save notification timestamp
      activeReminders.forEach((reminder) => {
        if (
          reminder.urgencyLevel === "critical" ||
          reminder.urgencyLevel === "overdue"
        ) {
          // Initialize audio context
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext ||
              (window as any).webkitAudioContext)();
          }
          if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
          }

          // Play alert
          playUrgencyAlert(reminder.urgencyLevel, audioCtxRef.current);

          // Save timestamp to prevent duplicate alerts
          saveNotificationTimestamp(reminder.taskId);
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks, dismissedIds]);

  const handleDismiss = (taskId: string) => {
    setDismissedIds((prev) => new Set([...prev, taskId]));
    setReminders((prev) => prev.filter((r) => r.taskId !== taskId));
    saveNotificationTimestamp(taskId); // Save so we don't remind again this frequency
  };

  const handleTaskClick = (taskId: string) => {
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  if (reminders.length === 0) return null;

  // Group by urgency level for better UX
  const criticalReminders = reminders.filter(
    (r) => r.urgencyLevel === "critical" || r.urgencyLevel === "overdue"
  );
  const highReminders = reminders.filter((r) => r.urgencyLevel === "high");
  const otherReminders = reminders.filter(
    (r) => r.urgencyLevel === "medium" || r.urgencyLevel === "low"
  );

  const ReminderCard = ({ reminder }: { reminder: ReturnType<typeof getTasksNeedingReminders>[0] }) => {
    const colors = getUrgencyColor(reminder.urgencyLevel);
    const isExpanded = expandedReminderId === reminder.taskId;

    return (
      <div
        key={reminder.taskId}
        className={`p-4 rounded-xl border-2 transition-all duration-300 ${colors.bg} ${colors.border}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{reminder.icon}</span>
              <div>
                <p className={`font-bold text-sm ${colors.text}`}>
                  {reminder.urgencyLevel.toUpperCase()}
                </p>
                {reminder.daysUntilDue >= 0 && (
                  <p className={`text-xs font-medium ${colors.text} opacity-75`}>
                    {reminder.daysUntilDue === 0
                      ? "Due TODAY"
                      : `${reminder.daysUntilDue} ${reminder.daysUntilDue === 1 ? "day" : "days"} left`}
                  </p>
                )}
              </div>
            </div>
            <p className={`text-sm font-bold ${colors.text} leading-relaxed`}>
              {reminder.message}
            </p>
          </div>

          <button
            onClick={() => handleDismiss(reminder.taskId)}
            className={`p-2 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0 ${colors.text}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-current border-opacity-10">
          <button
            onClick={() => handleTaskClick(reminder.taskId)}
            className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg transition-all ${colors.bg} border border-current border-opacity-20 hover:border-opacity-40 ${colors.text}`}
          >
            Work on Task
          </button>
          <button
            onClick={() => handleDismiss(reminder.taskId)}
            className="text-xs font-bold py-2 px-3 rounded-lg transition-all bg-white/30 hover:bg-white/50"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto space-y-3 z-40 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <Bell size={18} className="text-amber-600 animate-bounce" />
        <h3 className="font-display font-bold text-slate-800">
          Task Reminders ({reminders.length})
        </h3>
      </div>

      {/* Critical section (highest priority) */}
      {criticalReminders.length > 0 && (
        <div className="space-y-2">
          {criticalReminders.map((reminder) => (
            <ReminderCard key={reminder.taskId} reminder={reminder} />
          ))}
        </div>
      )}

      {/* High priority section */}
      {highReminders.length > 0 && (
        <>
          {criticalReminders.length > 0 && (
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-2">
              Upcoming
            </div>
          )}
          <div className="space-y-2">
            {highReminders.map((reminder) => (
              <ReminderCard key={reminder.taskId} reminder={reminder} />
            ))}
          </div>
        </>
      )}

      {/* Other reminders (collapsed by default) */}
      {otherReminders.length > 0 && (
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-2">
          Other ({otherReminders.length})
        </div>
      )}
    </div>
  );
};
