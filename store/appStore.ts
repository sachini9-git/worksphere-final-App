import { create } from 'zustand';
import { User, Task, Document, Folder, FocusSession, ChatMessage, TimeBlock } from '../types';

interface AppState {
    // User Auth & Gamification
    user: User | null;
    setUser: (user: User | null) => void;
    userXP: number;
    setUserXP: (xp: number) => void;
    userLevel: number;
    addXP: (amount: number) => void;

    // Data
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    documents: Document[];
    setDocuments: (docs: Document[]) => void;
    folders: Folder[];
    setFolders: (folders: Folder[]) => void;
    sessions: FocusSession[];
    setSessions: (sessions: FocusSession[]) => void;
    schedule: TimeBlock[];
    setSchedule: (schedule: TimeBlock[]) => void;

    // UI State
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onboardingComplete: boolean;
    setOnboardingComplete: (complete: boolean) => void;
    loadingSession: boolean;
    setLoadingSession: (loading: boolean) => void;

    // API Caching
    dashboardAiTip: string | null;
    setDashboardAiTip: (tip: string | null) => void;

    // Chat History
    chatHistory: ChatMessage[];
    setChatHistory: (history: ChatMessage[]) => void;
    addChatMessage: (msg: ChatMessage) => void;
}

export const calculateLevel = (xp: number) => {
    // RequiredXP = (Level ^ 1.5) * 100
    // Level = (RequiredXP / 100) ^ (1/1.5)
    return Math.max(1, Math.floor(Math.pow(xp / 100, 1 / 1.5)) + 1);
};

export const MathConstants = {
    XP_PER_MINUTE_FOCUS: 2,
    XP_TASK_LOW: 10,
    XP_TASK_MED: 25,
    XP_TASK_HIGH: 50,
    XP_FLASHCARD: 5
};

export const useAppStore = create<AppState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    userXP: 0,
    setUserXP: (userXP) => set({ userXP, userLevel: calculateLevel(userXP) }),
    userLevel: 1,
    addXP: (amount) => set((state) => {
        const newXP = state.userXP + amount;
        const newLevel = calculateLevel(newXP);
        return { userXP: newXP, userLevel: newLevel };
    }),

    tasks: [],
    setTasks: (tasks) => set({ tasks }),

    documents: [],
    setDocuments: (documents) => set({ documents }),

    folders: [],
    setFolders: (folders) => set({ folders }),

    sessions: [],
    setSessions: (sessions) => set({ sessions }),

    schedule: [],
    setSchedule: (schedule) => set({ schedule }),

    activeTab: 'dashboard',
    setActiveTab: (activeTab) => set({ activeTab }),

    onboardingComplete: false,
    setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),

    loadingSession: true,
    setLoadingSession: (loadingSession) => set({ loadingSession }),

    dashboardAiTip: null,
    setDashboardAiTip: (dashboardAiTip) => set({ dashboardAiTip }),

    chatHistory: [],
    setChatHistory: (chatHistory) => set({ chatHistory }),
    addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
}));
