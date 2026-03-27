import React, { useState, useEffect } from "react";
import { X, Lightbulb, Bell } from "lucide-react";
import {
  generateDailyStudyTip,
  StudyTip,
  shouldShowReminder,
  getNextReminderTime,
} from "../services/studyTipsService";
import { Document } from "../types";

interface StudyTipsReminderProps {
  documents: Document[];
  userStats?: { studyStreak: number; totalMinutesStudied: number };
  reminderHour?: number; // 0-23, default 9 (9 AM)
}

export const StudyTipsReminder: React.FC<StudyTipsReminderProps> = ({
  documents,
  userStats,
  reminderHour = 9,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tip, setTip] = useState<StudyTip | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if reminder should show on mount
    const checkReminder = async () => {
      const lastReminderTime = localStorage.getItem("lastReminderTime");

      if (shouldShowReminder(lastReminderTime, reminderHour)) {
        setIsLoading(true);
        const dailyTip = await generateDailyStudyTip(documents, userStats);
        setTip(dailyTip);
        setIsVisible(true);
        localStorage.setItem("lastReminderTime", new Date().toISOString());
        setIsLoading(false);
      }
    };

    const timer = setTimeout(checkReminder, 1000); // Delay slightly to avoid blocking UI
    return () => clearTimeout(timer);
  }, [documents, userStats, reminderHour]);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleGetNewTip = async () => {
    setIsLoading(true);
    const newTip = await generateDailyStudyTip(documents, userStats);
    setTip(newTip);
    setIsLoading(false);
  };

  if (!isVisible || !tip) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Lightbulb size={20} fill="currentColor" />
            </div>
            <h3 className="font-display font-extrabold text-lg">Daily Study Tip</h3>
          </div>
          <p className="text-xs text-white/80 font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-display font-extrabold text-slate-800 text-lg mb-2">
              {tip.title}
            </h4>
            <p className="text-slate-600 leading-relaxed font-medium text-sm">
              {tip.content}
            </p>
          </div>

          {/* Topics */}
          {tip.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tip.topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-lg font-bold"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Category badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Category:
            </span>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                tip.category === "motivation"
                  ? "bg-purple-100 text-purple-700"
                  : tip.category === "productivity"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {tip.category}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
          <button
            onClick={handleGetNewTip}
            disabled={isLoading}
            className="flex-1 bg-violet-100 text-violet-700 py-2 px-4 rounded-lg font-bold hover:bg-violet-200 disabled:opacity-50 transition-all text-sm"
          >
            {isLoading ? "Loading..." : "Another Tip"}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-slate-800 text-white py-2 px-4 rounded-lg font-bold hover:bg-slate-900 transition-all text-sm flex items-center justify-center gap-2"
          >
            <span>Got it!</span>
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-all"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
