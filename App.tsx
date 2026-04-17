
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TaskManager } from './components/TaskManager';
import { FocusTimer } from './components/FocusTimer';
import { Documents } from './components/Documents';
import { AIAssistant } from './components/AIAssistant';
import { Flashcards } from './components/Flashcards';
import { Quiz } from './components/Quiz';
import { StudyTipsReminder } from './components/StudyTipsReminder';
import { TaskReminders } from './components/TaskReminders';
import { Planner } from './components/Planner';
import { Onboarding } from './components/Onboarding';
import { Auth } from './components/Auth';
import { supabase } from './services/supabaseClient';
import { User, Task, Document, FocusSession, OnboardingData, ChatMessage, TaskCategory, Folder, DocumentType, TaskPriority, SubTask } from './types';
import { BookOpen, ArrowRight } from 'lucide-react';
import localforage from 'localforage';
import { useAppStore } from './store/appStore';
import { sounds } from './utils/sounds';

// Mock Data for Initial State
const MOCK_USER: User = { id: '1', name: 'Student', email: 'student@university.ac.uk', created_at: new Date().toISOString() };

const App: React.FC = () => {
    const {
        user, setUser, loadingSession, setLoadingSession,
        onboardingComplete, setOnboardingComplete, activeTab, setActiveTab,
        tasks, setTasks, documents, setDocuments, folders, setFolders,
        sessions, setSessions, chatHistory, setChatHistory, addChatMessage,
        userXP, setUserXP, schedule, setSchedule
    } = useAppStore();

    // Focus Timer State (Lifted)
    const [focusConfig, setFocusConfig] = useState({
        focusDuration: 25,
        breakDuration: 5,
        sound: 'bell' as 'bell' | 'digital' | 'chime'
    });
    const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
    const [isFocusActive, setIsFocusActive] = useState(false);
    const [focusMode, setFocusMode] = useState<'focus' | 'break'>('focus');
    const [focusSessionCount, setFocusSessionCount] = useState(0);
    const [focusEndTime, setFocusEndTime] = useState<number | null>(null);

    // Focus Zone State
    const [focusZoneDuration, setFocusZoneDuration] = useState(0); // in minutes
    const [isFocusZoneActive, setIsFocusZoneActive] = useState(false);
    const [focusZoneTimeLeft, setFocusZoneTimeLeft] = useState(0);
    const [focusZoneEndTime, setFocusZoneEndTime] = useState<number | null>(null);

    // Audio Context Ref for App-level sound
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playMelody = (type: 'bell' | 'digital' | 'chime') => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;

        const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        if (type === 'bell') {
            playNote(523.25, now, 3, 'sine');
            playNote(659.25, now + 0.5, 3, 'sine');
            playNote(783.99, now + 1.0, 4, 'sine');
            playNote(1046.50, now + 1.5, 5, 'sine');
        } else if (type === 'digital') {
            for (let i = 0; i < 4; i++) {
                playNote(880, now + (i * 0.8), 0.1, 'square');
                playNote(880, now + (i * 0.8) + 0.2, 0.1, 'square');
            }
        } else {
            const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
            scale.forEach((freq, i) => playNote(freq, now + (i * 0.15), 1.5, 'triangle'));
        }
    };

    // Request Permissions on mount
    useEffect(() => {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    // Supabase Auth Listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.name || 'Student',
                    created_at: session.user.created_at
                });
            }
            setLoadingSession(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.name || 'Student',
                    created_at: session.user.created_at
                });
            } else {
                setUser(null);
            }
            setLoadingSession(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const [dataLoadedForUserId, setDataLoadedForUserId] = useState<string | null>(null);

    // Load Data on User Login
    useEffect(() => {
        if (user && dataLoadedForUserId !== user.id) {
            const loadData = async () => {
                try {
                    // Fetch Tasks
                    const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id);
                    if (tasksData) {
                        const parsedTasks = tasksData.map(t => {
                            let category: TaskCategory = 'Study';
                            let subtasks: SubTask[] = [];
                            let completed_at: string | null = null;
                            let scheduled_date: string | undefined = undefined;
                            
                            if (t.description) {
                                try {
                                    const parsed = JSON.parse(t.description);
                                    category = parsed.category || 'Study';
                                    subtasks = parsed.subtasks || [];
                                    completed_at = parsed.completed_at || null;
                                    scheduled_date = parsed.scheduled_date || undefined;
                                } catch (e) {
                                    console.error("Error parsing task description JSON:", e);
                                }
                            }
                            // Ensure we prefer the column values for status and priority, 
                            // and the parsed values for our extended fields.
                            return { 
                                ...t, 
                                category, 
                                subtasks, 
                                completed_at, 
                                scheduled_date 
                            } as Task;
                        });
                        setTasks(parsedTasks);
                    }

                    // Fetch Documents
                    const { data: docsData } = await supabase.from('documents').select('*').eq('user_id', user.id);
                    if (docsData) setDocuments(docsData);

                    // Fetch Folders
                    const { data: foldersData } = await supabase.from('folders').select('*').eq('user_id', user.id);
                    if (foldersData) setFolders(foldersData);

                    // Fetch Sessions
                    const { data: sessionsData } = await supabase.from('focus_sessions').select('*').eq('user_id', user.id);
                    if (sessionsData) setSessions(sessionsData);

                    // Ensure user exists in public.users table (Self-healing) & Fetch XP
                    const { data: dbUser, error: fetchUserError } = await supabase.from('users').select('xp').eq('id', user.id).maybeSingle();
                    
                    if (!fetchUserError && dbUser) {
                        setUserXP(dbUser.xp || 0);
                    } else {
                        // Fallback to local storage if DB fetch fails or column missing
                        const loadedXP = localStorage.getItem(`workSphere_xp_${user.id}`);
                        if (loadedXP) {
                            const xpValue = parseInt(loadedXP, 10);
                            if (!isNaN(xpValue)) setUserXP(xpValue);
                        }
                    }

                    // Self-healing: make sure user record exists
                    await supabase.from('users').upsert({
                        id: user.id,
                        email: user.email,
                        name: user.name
                    });
                    // Fetch Onboarding
                    const { data: onboardingData, error: obError } = await supabase.from('onboarding').select('*').eq('user_id', user.id).maybeSingle();
                    if (obError) console.error("Onboarding fetch error:", obError);

                    if (onboardingData) {
                        setOnboardingComplete(true);
                    } else {
                        setOnboardingComplete(false);
                    }

                    // Chat history & XP are loaded locally
                    const loadedChat = localStorage.getItem(`workSphere_chat_${user.id}`);
                    if (loadedChat) {
                        try {
                            setChatHistory(JSON.parse(loadedChat));
                        } catch (e) {
                            console.error("Failed to parse chat history:", e);
                            setChatHistory([]);
                        }
                    }

                    const loadedSchedule = localStorage.getItem(`workSphere_schedule_${user.id}`);
                    if (loadedSchedule) {
                        try {
                            setSchedule(JSON.parse(loadedSchedule));
                        } catch (e) {
                            console.error("Failed to parse schedule:", e);
                            setSchedule([]);
                        }
                    }
                    
                    const loadedXP = localStorage.getItem(`workSphere_xp_${user.id}`);
                    if (loadedXP) {
                        const xpValue = parseInt(loadedXP, 10);
                        if (!isNaN(xpValue)) {
                            setUserXP(xpValue);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load data from Supabase", e);
                } finally {
                    setDataLoadedForUserId(user.id);
                }
            };
            loadData();
        } else if (!user) {
            setDataLoadedForUserId(null);
        }
    }, [user, dataLoadedForUserId]);

    // Save Schedule (Local)
    useEffect(() => {
        if (!user) return;
        localStorage.setItem(`workSphere_schedule_${user.id}`, JSON.stringify(schedule));
    }, [schedule, user]);

    // Save Chat History (Local) & XP (Cloud + Local)
    useEffect(() => {
        const syncXP = async () => {
            if (!user || userXP === 0) return;
            const { error } = await supabase.from('users').update({ xp: userXP }).eq('id', user.id);
            if (error) {
                // Ignore errors related to missing 'xp' column to prevent console spam
                if (!error.message.includes('column "xp" of relation "users" does not exist')) {
                    console.error("Failed to sync XP to cloud:", error.message);
                }
            }
        };

        const timeout = setTimeout(syncXP, 2000); // Debounce sync
        return () => clearTimeout(timeout);
    }, [userXP, user, supabase]);


    const handleOnboardingComplete = async (data: OnboardingData) => {
        console.log("Onboarding Data:", data);

        if (user) {
            // Save to Supabase
            const { error: obError } = await supabase.from('onboarding').upsert({
                user_id: user.id,
                study_area: data.studyArea,
                focus_time: data.focusTime,
                goals: { mainDifficulty: data.mainDifficulty }
            });
            if (obError) console.error("Failed to save onboarding:", obError);

            if (data.studentName) {
                await supabase.auth.updateUser({ data: { name: data.studentName } });
                setUser({ ...user, name: data.studentName });
            }

            let initialTaskTitle = "Plan weekly schedule";
            if (data.mainDifficulty === 'Focus & Distractions') initialTaskTitle = "Try a 25-minute Deep Work session";
            if (data.mainDifficulty === 'Understanding Topics') initialTaskTitle = "Upload lecture notes to AI Tutor";
            if (data.mainDifficulty === 'Time Management') initialTaskTitle = "Break down assignment into subtasks";

            addTask(initialTaskTitle, new Date().toISOString(), 'high', 'Study', '');
        }

        setOnboardingComplete(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setOnboardingComplete(false);
        setActiveTab('dashboard');
    }

    // Task Handlers
    const addTask = async (title: string, date: string, priority: TaskPriority, category: TaskCategory, reminder: string) => {
        if (!user) return;
        const newTask = {
            user_id: user.id,
            title,
            due_date: date || null,
            priority,
            description: JSON.stringify({ category, subtasks: [], scheduled_date: null }),
            reminder: reminder || null,
            reminder_fired: false,
            status: 'todo'
        };

        const { data, error } = await supabase.from('tasks').insert([newTask]).select().single();
        if (!error && data) {
            setTasks([...tasks, { ...data, category, subtasks: [] }]);
        } else if (error) {
            console.error("Error adding task:", error);
        }
    };

    const updateTask = async (updatedTask: Task) => {
        const { category, subtasks, scheduled_date, id, user_id, created_at, ...rest } = updatedTask;

        // Preserve completed_at or set if newly done
        const existing = tasks.find(t => t.id === updatedTask.id);
        let existingCompleted = (existing as any)?.completed_at || null;

        const descriptionObj: any = { category, subtasks, scheduled_date };
        if (updatedTask.status === 'done') {
            descriptionObj.completed_at = existingCompleted || new Date().toISOString();
        } else {
            descriptionObj.completed_at = null;
        }

        // OPTIMISTIC UI UPDATE
        const optimisticTask = { ...updatedTask, category, subtasks, scheduled_date, completed_at: descriptionObj.completed_at };
        setTasks(tasks.map(t => t.id === updatedTask.id ? optimisticTask : t));

        // Build database update with ONLY valid columns (no extra computed fields)
        const dbTask: any = {
            title: updatedTask.title,
            status: updatedTask.status,
            priority: updatedTask.priority,
            due_date: updatedTask.due_date || null,
            reminder: updatedTask.reminder || null,
            reminder_fired: updatedTask.reminder_fired || false,
            description: JSON.stringify(descriptionObj)
        };

        console.log("Saving Task to DB:", { id: updatedTask.id, status: updatedTask.status, completedAt: descriptionObj.completed_at });

        const { data, error } = await supabase.from('tasks').update(dbTask).eq('id', updatedTask.id).select().single();
        
        if (error) {
            console.error("Error updating task in Supabase:", error, dbTask);
            // Revert to previous state on error
            setTasks(tasks);
        } else if (data) {
            // Re-sync with actual DB data
            const currentTasks = useAppStore.getState().tasks;
            const reloadedTask = { 
                ...data, 
                category, 
                subtasks, 
                scheduled_date, 
                completed_at: descriptionObj.completed_at 
            } as Task;
            setTasks(currentTasks.map(t => t.id === updatedTask.id ? reloadedTask : t));
            console.log("Task saved successfully:", { id: updatedTask.id, newStatus: reloadedTask.status });
        }
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (!error) {
            setTasks(tasks.filter(t => t.id !== id));
        }
    };

    // Document Handlers
    const addDocument = async (title: string, content: string, folderId: string | null, type: DocumentType = 'note') => {
        if (!user) return null;
        const newDoc = {
            user_id: user.id,
            title,
            content,
            folder_id: folderId,
            tags: [],
            type
        };
        const { data, error } = await supabase.from('documents').insert([newDoc]).select().single();
        if (!error && data) {
            setDocuments([...documents, data]);
            return data;
        }
        return null;
    };

    const updateDocument = async (id: string, title: string, content: string) => {
        const { data, error } = await supabase.from('documents').update({ title, content, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) {
            setDocuments(documents.map(d => d.id === id ? data : d));
        }
    };

    const addFolder = async (name: string, parentId: string | null) => {
        if (!user) return;
        const newFolder = {
            user_id: user.id,
            name,
            parent_id: parentId
        };
        const { data, error } = await supabase.from('folders').insert([newFolder]).select().single();
        if (!error && data) {
            setFolders([...folders, data]);
        }
    };

    const deleteDocument = async (id: string) => {
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (!error) {
            setDocuments(documents.filter(d => d.id !== id));
            await localforage.removeItem(`worksphere-file-${id}`);
        } else {
            console.error("Failed to delete document", error);
        }
    };

    const deleteFolder = async (id: string) => {
        if (!confirm('Are you sure? This will delete the folder and all its contents permanently.')) return;
        
        const { error } = await supabase.from('folders').delete().eq('id', id);
        
        if (!error) {
            // RECURSIVE LOCAL CLEANUP
            // We need to find all descendant folders and documents to remove them from state
            const getAllDescendants = (folderId: string): { folderIds: string[], docIds: string[] } => {
                const currentDocs = useAppStore.getState().documents;
                const currentFolders = useAppStore.getState().folders;
                
                let folderIds = [folderId];
                let docIds: string[] = [];
                
                // Find direct child documents
                const childDocs = currentDocs.filter(d => d.folder_id === folderId).map(d => d.id);
                docIds = [...docIds, ...childDocs];
                
                // Find child folders and recurse
                const childFolders = currentFolders.filter(f => f.parent_id === folderId);
                childFolders.forEach(cf => {
                    const descendants = getAllDescendants(cf.id);
                    folderIds = [...folderIds, ...descendants.folderIds];
                    docIds = [...docIds, ...descendants.docIds];
                });
                
                return { folderIds, docIds };
            };

            const { folderIds, docIds } = getAllDescendants(id);
            
            setFolders(folders.filter(f => !folderIds.includes(f.id)));
            setDocuments(documents.filter(d => !docIds.includes(d.id)));
            docIds.forEach(docId => localforage.removeItem(`worksphere-file-${docId}`).catch(console.error));
        } else {
            console.error("Failed to delete folder", error);
        }
    };

    // Focus Handler
    const onSessionComplete = async (duration: number, label: string) => {
        if (!user) return;
        const session = {
            user_id: user.id,
            duration_minutes: duration,
            label: label || 'Focus Session'
        };
        const { data, error } = await supabase.from('focus_sessions').insert([session]).select().single();
        if (!error && data) {
            setSessions([...sessions, data]);
        }
    };

    const handleTimerComplete = () => {
        if (focusMode === 'focus') {
            // Focus done
            sounds.playMotivationalMusic();

            sounds.playSuccessLevelUp();
            setFocusSessionCount(prev => prev + 1);
            onSessionComplete(focusConfig.focusDuration, "Focus Session");
            if (Notification.permission === 'granted') new Notification("Focus session complete!");

            // Switch to Break
            setFocusMode('break');
            const breakTime = focusConfig.breakDuration * 60;
            setFocusTimeLeft(breakTime);

            // Auto-transition to Break automatically
            setFocusEndTime(Date.now() + breakTime * 1000);
        } else {
            // Break done
            sounds.playMotivationalMusic();

            if (Notification.permission === 'granted') new Notification("Break over! Back to work.");

            // Switch to Focus
            setFocusMode('focus');
            const focusTime = focusConfig.focusDuration * 60;
            setFocusTimeLeft(focusTime);

            // Auto-transition back to Focus automatically
            setFocusEndTime(Date.now() + focusTime * 1000);
        }
    };

    // Focus Timer Logic
    useEffect(() => {
        let interval: any;
        if ((isFocusActive && focusEndTime) || (isFocusZoneActive && focusZoneEndTime)) {
            interval = setInterval(() => {
                const now = Date.now();

                if (isFocusActive && focusEndTime) {
                    const diff = Math.ceil((focusEndTime - now) / 1000);

                    if (diff <= 0) {
                        handleTimerComplete();
                    } else {
                        setFocusTimeLeft(diff);
                    }
                }

                if (isFocusZoneActive && focusZoneEndTime) {
                    const diffZone = Math.max(0, (focusZoneEndTime - now) / 1000);
                    setFocusZoneTimeLeft(diffZone);
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isFocusActive, focusEndTime, isFocusZoneActive, focusZoneEndTime, focusMode, focusConfig]);

    // Ambient Hum Logic
    useEffect(() => {
        if (isFocusActive && focusMode === 'focus') {
            sounds.startAmbientHum();
        } else {
            sounds.stopAmbientHum();
        }
    }, [isFocusActive, focusMode]);

    // Focus Zone Victory Trigger
    useEffect(() => {
        if (isFocusZoneActive && focusZoneTimeLeft <= 0) {
            setIsFocusZoneActive(false);
            sounds.playSuccessLevelUp();
            if (Notification.permission === 'granted') {
                new Notification("🎉 Daily Focus Goal Achieved!", { body: "You are an absolute Champion! You've hit your deep work target for today." });
            }
        }
    }, [isFocusZoneActive, focusZoneTimeLeft]);

    // Focus Timer Helpers
    const toggleTimer = () => {
        sounds.playClick();
        if (isFocusActive) {
            setIsFocusActive(false);
            setFocusEndTime(null);
        } else {
            // Initialize Audio Context on user interaction
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }

            setIsFocusActive(true);
            setFocusEndTime(Date.now() + focusTimeLeft * 1000);
        }
    };

    const resetTimer = () => {
        sounds.playClick();
        setIsFocusActive(false);
        setFocusEndTime(null);
        if (focusMode === 'focus') {
            setFocusTimeLeft(focusConfig.focusDuration * 60);
        } else {
            setFocusTimeLeft(focusConfig.breakDuration * 60);
        }
    };

    const startBreakImmediately = () => {
        sounds.playClick();
        const durationSec = focusConfig.breakDuration * 60;
        setFocusMode('break');
        setFocusTimeLeft(durationSec);
        setIsFocusActive(true);
        setFocusEndTime(Date.now() + durationSec * 1000);
    };

    const skipBreak = () => {
        sounds.playClick();
        setIsFocusActive(false);
        setFocusEndTime(null);
        setFocusMode('focus');
        setFocusTimeLeft(focusConfig.focusDuration * 60);
    };

    const setPreset = (mins: number) => {
        sounds.playClick();
        const newConfig = { ...focusConfig };
        if (focusMode === 'focus') {
            newConfig.focusDuration = mins;
        } else {
            newConfig.breakDuration = mins;
        }
        setFocusConfig(newConfig);
        setIsFocusActive(false);
        setFocusEndTime(null);
        setFocusTimeLeft(mins * 60);
    };

    const setCustomTime = (mins: number) => {
        const newConfig = { ...focusConfig };
        if (focusMode === 'focus') {
            newConfig.focusDuration = mins;
        } else {
            newConfig.breakDuration = mins;
        }
        setFocusConfig(newConfig);
        setIsFocusActive(false);
        setFocusEndTime(null);
        setFocusTimeLeft(mins * 60);
    };

    const toggleFocusZone = () => {
        sounds.playClick();
        if (isFocusZoneActive) {
            setIsFocusZoneActive(false);
            setFocusZoneTimeLeft(0);
            setFocusZoneEndTime(null);
        } else {
            if (focusZoneDuration > 0) {
                setIsFocusZoneActive(true);
                setFocusZoneTimeLeft(focusZoneDuration * 60);
                setFocusZoneEndTime(Date.now() + focusZoneDuration * 60 * 1000);
                
                // Forcefully jump-start the main Pomodoro cycle immediately
                if (!isFocusActive) {
                    if (!audioCtxRef.current) {
                        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                    }
                    if (audioCtxRef.current.state === 'suspended') {
                        audioCtxRef.current.resume();
                    }
                    setIsFocusActive(true);
                    setFocusMode('focus');
                    const durationSec = focusConfig.focusDuration * 60;
                    setFocusTimeLeft(durationSec);
                    setFocusEndTime(Date.now() + durationSec * 1000);
                }
            }
        }
    };

    // Chat Handler
    const addMessage = (msg: ChatMessage) => {
        addChatMessage(msg);
    };

    // Task reminder handler
    const handleTaskReminderClick = (taskId: string) => {
        setActiveTab('tasks');
        // Scroll to task (optional - would need task manager to support this)
    };

    // Render logic
    if (loadingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Auth />;
    }

    if (user && dataLoadedForUserId !== user.id) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] relative overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-1/3 -right-32 w-96 h-96 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-6 relative z-10"></div>
                <h2 className="text-2xl font-display font-black text-slate-800 mb-2 relative z-10">Preparing your workspace...</h2>
                <p className="text-slate-500 font-medium relative z-10">We're getting things ready for {user.name || 'you'}.</p>
            </div>
        );
    }

    if (!onboardingComplete) {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    return (
        <Layout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            user={user}
            onLogout={handleLogout}
        >
            <StudyTipsReminder documents={documents} userStats={{ studyStreak: focusSessionCount, totalMinutesStudied: sessions.reduce((a, s) => a + s.duration_minutes, 0) }} />
            <TaskReminders tasks={tasks} onTaskClick={handleTaskReminderClick} />
            {activeTab === 'dashboard' && <Dashboard tasks={tasks} sessions={sessions} onNavigate={setActiveTab} />}
            {activeTab === 'planner' && <Planner tasks={tasks} updateTask={updateTask} />}
            {activeTab === 'tasks' && <TaskManager tasks={tasks} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />}
            {activeTab === 'focus' && (
                <FocusTimer
                    onSessionComplete={onSessionComplete}
                    tasks={tasks}
                    config={focusConfig}
                    setConfig={setFocusConfig}
                    timeLeft={focusTimeLeft}
                    isActive={isFocusActive}
                    mode={focusMode}
                    sessionCount={focusSessionCount}
                    toggleTimer={toggleTimer}
                    resetTimer={resetTimer}
                    startBreak={startBreakImmediately}
                    skipBreak={skipBreak}
                    setPreset={setPreset}
                    setCustomTime={setCustomTime}
                    focusZoneDuration={focusZoneDuration}
                    setFocusZoneDuration={setFocusZoneDuration}
                    isFocusZoneActive={isFocusZoneActive}
                    toggleFocusZone={toggleFocusZone}
                    focusZoneTimeLeft={focusZoneTimeLeft}
                    playMelody={playMelody}
                />
            )}
            {activeTab === 'documents' && <Documents documents={documents} folders={folders} addDocument={addDocument} updateDocument={updateDocument} addFolder={addFolder} deleteDocument={deleteDocument} deleteFolder={deleteFolder} />}
            {activeTab === 'ai' && <AIAssistant documents={documents} history={chatHistory} addMessage={addMessage} />}
            {activeTab === 'flashcards' && <Flashcards documents={documents} addDocument={addDocument} />}
            {activeTab === 'quiz' && <Quiz documents={documents} addDocument={addDocument} />}
        </Layout>
    );
};

export default App;
