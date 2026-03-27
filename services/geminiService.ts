import { Document, Task, TimeBlock } from "../types";

const getApiUrl = () => {
  if (import.meta.env.PROD) return '/api';
  return import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
};

export const generateAIResponse = async (
  prompt: string,
  contextDocuments: Document[] = []
): Promise<string> => {
  try {
    const response = await fetch(`${getApiUrl()}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, contextDocuments })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server error');
    return data.text || "I couldn't generate a response.";
  } catch (error: any) {
    console.error('AI generate error:', error.message);
    if (error.message?.toLowerCase().includes('quota')) {
        return "🛑 Google API Quota Exceeded. Please generate a new key using a DIFFERENT Google Account.";
    }
    return `AI Proxy Error: ${error.message || 'Ensure backend server is running.'}`;
  }
};

export const summarizeDocument = async (content: string): Promise<string> => {
  try {
    const response = await fetch(`${getApiUrl()}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server error');
    return data.text || 'No summary generated.';
  } catch (e: any) {
    console.error('AI summarize error:', e.message);
    if (e.message?.toLowerCase().includes('quota')) {
        return "🛑 Google API Quota Exceeded. Please generate a new key using a DIFFERENT Google Account.";
    }
    return `Error generating summary: ${e.message || 'Ensure the backend server is running.'}`;
  }
};

export const pingOptimizeSchedule = async (tasks: Task[], schedule: TimeBlock[]): Promise<string> => {
  try {
    const unscheduledTasks = tasks
      .filter(t => t.status !== 'done' && !schedule.some(s => s.taskId === t.id))
      .map(t => ({ title: t.title, priority: t.priority }));

    const formattedSchedule = schedule.map(s => {
      const task = tasks.find(t => t.id === s.taskId);
      return { time: `${s.startTime} - ${s.endTime}`, task: task?.title, priority: task?.priority }
    });

    const response = await fetch(`${getApiUrl()}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unscheduledTasks,
        formattedSchedule,
        currentTime: new Date().toLocaleTimeString()
      })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server error');
    return data.text || "Your schedule looks solid!";
  } catch (e: any) {
    console.error('Optimize schedule error:', e.message);
    if (e.message?.toLowerCase().includes('quota')) {
        return "🛑 Google API Quota Exceeded. Please generate a new key using a DIFFERENT Google Account.";
    }
    return `Could not analyze schedule: ${e.message}`;
  }
};

export const autoGenerateSchedule = async (tasks: Task[]): Promise<{taskId: string, startTime: string, endTime: string}[] | null> => {
  try {
    const relevantTasks = tasks.filter(t => t.status !== 'done').slice(0, 10).map(t => ({ id: t.id, title: t.title, priority: t.priority }));
    
    const response = await fetch(`${getApiUrl()}/auto-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relevantTasks })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server error');
    return data.schedule || null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const fetchProactiveTutor = async (tasks: Task[], level: number, userName: string = "Student"): Promise<string> => {
  try {
    const response = await fetch(`${getApiUrl()}/proactive-tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, level, userName })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server error');
    return data.message || "Hello! Let's get to work and crush some tasks today!";
  } catch (e: any) {
    console.error('Tutor fetch error', e.message);
    if (e.message?.toLowerCase().includes('quota')) {
        return "🛑 Google API Quota Exceeded. Your API key hits limit. Generate a new key with a different Google account!";
    }
    return `AI Tutor Error: ${e.message}`;
  }
};
