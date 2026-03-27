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

const getAI = () => {
  let apiKey = '';
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
  } else if (typeof process !== 'undefined' && process.env) {
    apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  }
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateDailyStudyTip = async (
  documents: Document[],
  userStats?: { studyStreak: number; totalMinutesStudied: number }
): Promise<StudyTip> => {
  const ai = getAI();
  if (!ai) {
    return {
      id: "default-1",
      title: "Keep Going!",
      content: "Consistency is key. Even 15 minutes of focused study beats 2 hours of distracted work.",
      category: "motivation",
      topics: [],
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const docSummary = documents.map((d) => d.title).join(", ");
    const streakInfo = userStats
      ? `User has a ${userStats.studyStreak} day streak and has studied ${userStats.totalMinutesStudied} minutes total.`
      : "New user starting their study journey.";

    const prompt = `Generate ONE motivational and actionable study tip based on these contexts:
    Topics: ${docSummary}
    ${streakInfo}
    
    Return ONLY a JSON object with no markdown, no code blocks:
    {"title": "Short title (3-5 words)", "content": "Detailed tip (2-3 sentences)", "category": "topic-specific", "topics": ["topic1", "topic2"]}
    
    Make it specific to the study materials mentioned, encouraging, and practical.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let text = response.text || "{}";
    if (text.startsWith('```json')) {
      text = text.replace('```json', '').replace('```', '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```/g, '');
    }
    const parsed = JSON.parse(text.trim());

    return {
      id: `tip-${Date.now()}`,
      title: parsed.title || "Study Success Tip",
      content:
        parsed.content ||
        "Focus on one topic at a time for better retention and understanding.",
      category: parsed.category || "motivation",
      topics: parsed.topics || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Study Tip Generation Error:", error);
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
  // 1. No reminder shown today, OR
  // 2. Reminder time hasn't passed yet today
  if (!lastReminderTime) return currentHour >= reminderHour;

  const lastReminder = new Date(lastReminderTime);
  const today = new Date();

  // Different day = should show
  if (lastReminder.toDateString() !== today.toDateString()) {
    return currentHour >= reminderHour;
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
