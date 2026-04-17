import { GoogleGenAI } from "@google/genai";
import { Document } from "../types";

export interface StudyTip {
  id: string;
  title: string;
  content: string;
  category: "productivity" | "topic-specific" | "motivation";
  topics: string[];
  timestamp: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const generateDailyStudyTip = async (
  documents: Document[],
  userStats?: { studyStreak: number; totalMinutesStudied: number }
): Promise<StudyTip> => {
  try {
    const response = await fetch(`${API_URL}/studytips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents, userStats }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.tip;
  } catch (error) {
    console.error("Study Tip API Error:", error);
    // Fallback exactly as before to give users a seamless experience
    return {
      id: `tip-${Date.now()}`,
      title: "Daily Study Reminder",
      content:
        "Break your study materials into smaller chunks. Spaced repetition helps long-term retention.",
      category: "productivity",
      topics: [],
      timestamp: new Date().toISOString(),
    };
  }
};

export const shouldShowReminder = (lastReminderTime: string | null, reminderHour: number): boolean => {
  const now = new Date();
  const currentHour = now.getHours();

  // Show reminder if:
  // 1. No reminder shown today
  if (!lastReminderTime) return true;

  const lastReminder = new Date(lastReminderTime);
  const today = new Date();

  // Different day = should show
  if (lastReminder.toDateString() !== today.toDateString()) {
    return true;
  }

  return false;
};

export const getNextReminderTime = (reminderHour: number): Date => {
  const now = new Date();
  const nextReminder = new Date(now);
  nextReminder.setHours(reminderHour, 0, 0, 0);

  if (nextReminder <= now) {
    nextReminder.setDate(nextReminder.getDate() + 1);
  }

  return nextReminder;
};
