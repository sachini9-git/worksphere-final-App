
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface OnboardingData {
  studentName: string;
  studyArea: string;
  focusTime: string;
  mainDifficulty: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskCategory = 'Study' | 'Assignment' | 'Exam' | 'Personal' | 'Other' | (string & {});

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TimeBlock {
  id: string;
  taskId: string; // References the Task
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  due_date?: string;
  scheduled_date?: string; // Explicit date added via Planner
  reminder?: string;
  reminder_fired?: boolean;
  completed_at?: string | null;
  subtasks: SubTask[];
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export type DocumentType = 'pdf' | 'doc' | 'note' | 'xlsx' | 'pptx' | 'csv' | 'flashcard_set' | 'quiz_set';

export interface Document {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: string; // Text content extracted or written
  type: DocumentType;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  label: string; // e.g., "Math Study"
  completed_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
