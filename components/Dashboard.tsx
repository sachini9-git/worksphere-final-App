
import React, { useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Task, FocusSession } from '../types';
import { generateAIResponse } from '../services/geminiService';
import { CheckCircle, Clock, Award, TrendingUp, Calendar, Mail, FileText, HardDrive, ExternalLink, ArrowUpRight, Sparkles, AlertTriangle, Zap, Coffee, Flame, Trophy, X, Activity } from 'lucide-react';
import { isSameDay, startOfWeek, addDays, isWithinInterval, endOfDay, startOfDay, format } from 'date-fns';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../store/appStore';
import { ProactiveTutor } from './ProactiveTutor';

interface DashboardProps {
    tasks: Task[];
    sessions: FocusSession[];
    onNavigate: (tab: 'dashboard' | 'tasks' | 'focus' | 'documents' | 'ai') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, sessions, onNavigate }) => {
    const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week

    const selectedWeekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
    const selectedWeekEnd = endOfDay(addDays(selectedWeekStart, 6));
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const pendingTasks = tasks.filter(t => t.status !== 'done').length;
    const totalFocusMinutes = sessions.reduce((acc, curr) => acc + (Number(curr.duration_minutes) || 0), 0);
    const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

    const sessionsThisWeek = sessions.filter(s => {
        const dt = new Date(s.completed_at);
        return isWithinInterval(dt, { start: startOfDay(selectedWeekStart), end: endOfDay(selectedWeekEnd) });
    });

    const totalFocusMinutesThisWeek = sessionsThisWeek.reduce((acc, curr) => acc + (Number(curr.duration_minutes) || 0), 0);
    const totalFocusHoursThisWeek = (totalFocusMinutesThisWeek / 60).toFixed(1);

    // Calculate dynamic streak based on consecutive days with at least one completed session
    let streak = 0;
    const now = new Date();
    const sortedUniqueDays = Array.from(new Set(
        sessions.map(s => {
            const dt = new Date(s.completed_at);
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        })
    )).map(dateStr => {
        const [y, m, d] = dateStr.split('-');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }).sort((a, b) => b.getTime() - a.getTime());

    if (sortedUniqueDays.length > 0) {
        // Check if there's a session today or yesterday to start the streak
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

        const firstDayStr = `${sortedUniqueDays[0].getFullYear()}-${String(sortedUniqueDays[0].getMonth() + 1).padStart(2, '0')}-${String(sortedUniqueDays[0].getDate()).padStart(2, '0')}`;

        if (firstDayStr === todayStr || firstDayStr === yesterdayStr) {
            streak = 1;
            for (let i = 1; i < sortedUniqueDays.length; i++) {
                const prev = sortedUniqueDays[i - 1];
                const curr = sortedUniqueDays[i];
                // Check if curr is exactly one day before prev
                const diffTime = Math.abs(prev.getTime() - curr.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }

    // Build focus data for selected week (Mon-Sun)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const focusData = dayNames.map((d, i) => ({ name: d, minutes: 0 }));

    sessionsThisWeek.forEach(session => {
        const dateObj = new Date(session.completed_at);
        const day = dateObj.getDay(); // 0 is Sunday, 1 is Monday
        const index = day === 0 ? 6 : day - 1;
        if (focusData[index]) {
            focusData[index].minutes += (Number(session.duration_minutes) || 0);
        }
    });

    const maxFocusMinutes = Math.max(...focusData.map(d => d.minutes));
    // Provide a scale that always has room for bars even if max is 0
    const yAxisDomain = [0, maxFocusMinutes === 0 ? 60 : maxFocusMinutes + 10];

    console.log("Dashboard Chart Data:", {
        sessionsTotal: sessions.length,
        sessionsThisWeek: sessionsThisWeek.length,
        focusData: focusData
    });

    // BUG FIX: Display real task data even if it is 0. Do not use mock data when user has 0 tasks.
    // Task data for selected week (completed this week vs pending overall)
    const completedTasksThisWeek = tasks.filter(t => {
        const comp = (t as any).completed_at || null;
        if (!comp) return false;
        const dt = new Date(comp);
        return isWithinInterval(dt, { start: startOfDay(selectedWeekStart), end: endOfDay(selectedWeekEnd) });
    }).length;

    const taskData = [
        { name: 'Done', value: completedTasksThisWeek },
        { name: 'To Do', value: pendingTasks },
    ];

    // Weekly Task Logic: Include tasks due this week OR completed this week OR overdue undone tasks
    const tasksForThisWeek = tasks.filter(t => {
        const status = t.status || 'todo';
        const targetDate = t.scheduled_date || t.due_date;
        if (!targetDate) return false;
        const dt = new Date(targetDate);
        
        // 1. Is it scheduled/due within the week interval?
        const inInterval = isWithinInterval(dt, { start: startOfDay(selectedWeekStart), end: endOfDay(selectedWeekEnd) });
        
        // 2. Was it completed within the week interval?
        const comp = (t as any).completed_at || null;
        const compInInterval = comp ? isWithinInterval(new Date(comp), { start: startOfDay(selectedWeekStart), end: endOfDay(selectedWeekEnd) }) : false;
        
        // 3. Is it an undone task from a PREVIOUS week (Backlog)?
        // We only show backlog in the 'current' week view (weekOffset >= 0) to avoid cluttering historical weeks.
        const isBacklog = status !== 'done' && dt < startOfDay(selectedWeekStart) && weekOffset >= 0;

        return inInterval || compInInterval || isBacklog;
    });

    const completedTasksThisWeekActual = tasksForThisWeek.filter(t => t.status === 'done').length;

    // We only use the explicitly scheduled tasks as the denominator target.
    const scheduledThisWeek = tasksForThisWeek.filter(t => {
        const targetDate = t.scheduled_date || t.due_date;
        if (!targetDate) return false;
        return isWithinInterval(new Date(targetDate), { start: startOfDay(selectedWeekStart), end: endOfDay(selectedWeekEnd) });
    });

    // If no tasks scheduled, but some completed (from backlog), denominator becomes what was completed so it shows 100%
    const weeklyDenominator = scheduledThisWeek.length > 0 ? scheduledThisWeek.length : Math.max(1, completedTasksThisWeekActual);
    
    const weeklyCompletionPercentageRaw = Math.round((completedTasksThisWeekActual / weeklyDenominator) * 100);
    const weeklyCompletionPercentage = Math.min(100, weeklyCompletionPercentageRaw);

    // Productivity Ring Logic: Use the weekly percentage
    const todayCompletionPercentage = weeklyCompletionPercentage;
    const completedTasksToday = completedTasksThisWeekActual; // Rename for UI compatibility or update UI
    const tasksDueToday = tasksForThisWeek; 


    const COLORS = ['#8b5cf6', '#e2e8f0'];

    // Dynamic Smart Suggestion Logic
    const suggestion = useMemo(() => {
        const pendingHigh = tasks.filter(t => t.priority === 'high' && t.status !== 'done');
        const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done');

        // Calculate today's focus
        const now = new Date();
        const todaySessions = sessions.filter(s => isSameDay(new Date(s.completed_at), now));
        const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration_minutes, 0);

        const nearingDeadline = tasks.filter(t => {
            if (t.status === 'done' || !t.due_date) return false;
            const dueDate = new Date(t.due_date);
            const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            return diffHours > 0 && diffHours <= 24;
        });
        const highPriorityNearing = nearingDeadline.filter(t => t.priority === 'high');

        if (overdue.length > 0) {
            return {
                title: "Attention Needed",
                description: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}. Prioritizing "${overdue[0].title}" might be a good start to get back on track.`,
                icon: AlertTriangle,
                style: "bg-rose-50/80 border-rose-100 text-rose-900",
                iconStyle: "bg-rose-100 text-rose-600",
                buttonText: "View Tasks",
                action: () => onNavigate('tasks')
            };
        }

        if (highPriorityNearing.length > 0) {
            return {
                title: "Urgent Deadline Approaching",
                description: `Your high priority task "${highPriorityNearing[0].title}" is due within 24 hours. Focus on this now!`,
                icon: AlertTriangle,
                style: "bg-rose-50/80 border-rose-100 text-rose-900",
                iconStyle: "bg-rose-100 text-rose-600",
                buttonText: "Focus Now",
                action: () => onNavigate('focus')
            };
        }

        if (pendingHigh.length > 0) {
            return {
                title: "High Priority",
                description: `You have ${pendingHigh.length} high priority tasks pending. Tackle "${pendingHigh[0].title}" while your energy is high.`,
                icon: Zap,
                style: "bg-orange-50/80 border-orange-100 text-orange-900",
                iconStyle: "bg-orange-100 text-orange-600",
                buttonText: "Focus Now",
                action: () => onNavigate('focus')
            };
        }

        if (todayMinutes === 0 && tasks.length > 0) {
            return {
                title: "Start Your Engine",
                description: "You haven't logged any focus time today. Try a short 25-minute Pomodoro session to get momentum!",
                icon: Clock,
                style: "bg-violet-50/80 border-violet-100 text-violet-900",
                iconStyle: "bg-violet-100 text-violet-600",
                buttonText: "Start Timer",
                action: () => onNavigate('focus')
            };
        }

        if (todayMinutes > 120) {
            return {
                title: "Well Done!",
                description: `You've focused for over ${Math.floor(todayMinutes / 60)} hours today. Remember to stay hydrated and take regular breaks to maintain peak performance.`,
                icon: Coffee,
                style: "bg-teal-50/80 border-teal-100 text-teal-900",
                iconStyle: "bg-teal-100 text-teal-600",
                buttonText: "Take a Break",
                action: () => onNavigate('focus')
            }
        }

        return {
            title: "Smart Tip",
            description: "Breaking large assignments into smaller, manageable subtasks can reduce procrastination. Check your task details to add subtasks.",
            icon: Sparkles,
            style: "bg-indigo-50/80 border-indigo-100 text-indigo-900",
            iconStyle: "bg-indigo-100 text-indigo-600",
            buttonText: "Organize",
            action: () => onNavigate('tasks')
        };

    }, [tasks, sessions, onNavigate]);



    const { dashboardAiTip, setDashboardAiTip } = useAppStore();
    const [aiTipText, setAiTipText] = React.useState<string | null>(dashboardAiTip);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [isTipOpen, setIsTipOpen] = React.useState(false);
    const tipRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        let mounted = true;
        const fetchTip = async () => {
            // Only fetch if we don't have a tip in the store, to prevent 429 Too Many Requests
            if (dashboardAiTip) {
                setAiTipText(dashboardAiTip);
                return;
            }

            setAiLoading(true);
            const avgSession = sessionsThisWeek.length ? Math.round(totalFocusMinutesThisWeek / sessionsThisWeek.length) : 0;
            const prompt = `You are a study coach. Analyze the following user weekly metrics and provide personalized guidance in this EXACT markdown format:

**Summary:** [One encouraging sentence about their progress]

**3 Recommendations:**
- [First recommendation with emoji and brief insight]
- [Second recommendation with emoji and brief insight]  
- [Third recommendation with emoji and brief insight]

**Your Next Step:** [One specific, actionable task for tomorrow]

User metrics:
- Focus minutes this week: ${totalFocusMinutesThisWeek}
- Focus sessions this week: ${sessionsThisWeek.length}
- Avg session minutes: ${avgSession}
- Tasks completed: ${completedTasksThisWeek}
- Pending tasks: ${pendingTasks}

Keep recommendations brief (max 100 chars each). Be encouraging and specific.`;
            try {
                const resp = await generateAIResponse(prompt, []);
                if (!mounted) return;
                setAiTipText(resp);
                // Even on error, cache it so we don't endlessly retry and hammer the API
                setDashboardAiTip(resp.includes("429") ? "You're doing great! (AI Tips temporarily rate limited)" : resp);
            } catch (e) {
                console.error('AI tip error', e);
            } finally {
                if (mounted) setAiLoading(false);
            }
        };
        fetchTip();
        return () => { mounted = false; };
    }, [weekOffset, totalFocusMinutesThisWeek, sessionsThisWeek.length, completedTasksThisWeek, pendingTasks, dashboardAiTip, setDashboardAiTip]);

    // Close modal on Escape
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsTipOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="space-y-8 pb-10">



            {/* AI Tip Modal */}
            {isTipOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTipOpen(false)} />
                    
                    <div ref={tipRef} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
                        
                        {/* Decorative Premium Header Graphic */}
                        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-violet-600/10 via-fuchsia-600/5 to-transparent pointer-events-none"></div>
                        <div className="absolute -top-20 -right-20 w-56 h-56 bg-violet-400/20 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="p-8 pb-6 relative z-10 flex items-start justify-between gap-4 border-b border-slate-100/50">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[1.25rem] flex flex-shrink-0 items-center justify-center shadow-lg shadow-violet-500/30">
                                    <Sparkles size={26} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Strategy Insights</h3>
                                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-2 mt-1">
                                       <Activity size={14} className="text-violet-500 animate-pulse"/> Behavior analysis for the selected week
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsTipOpen(false)} className="w-10 h-10 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors shadow-sm border border-slate-200/50 flex-shrink-0">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 pt-6 overflow-y-auto custom-scrollbar relative z-10 flex-1">
                            {aiLoading ? (
                                <div className="space-y-5 animate-pulse pt-2">
                                    <div className="flex items-center gap-3 mb-4">
                                       <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping"></div>
                                       <div className="h-5 bg-slate-200 rounded-lg w-1/2"></div>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
                                    <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
                                    <div className="h-4 bg-slate-100 rounded-lg w-4/5"></div>
                                    <div className="h-4 bg-slate-100 rounded-lg w-full mt-4"></div>
                                    <div className="h-4 bg-slate-100 rounded-lg w-3/4"></div>
                                </div>
                            ) : (
                                aiTipText ? (
                                    <div className="prose prose-slate max-w-none 
                                        prose-headings:text-slate-800 prose-headings:font-display prose-headings:font-bold
                                        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-3
                                        prose-li:text-slate-700 prose-li:leading-relaxed prose-li:mb-2 
                                        prose-li:before:text-violet-500 prose-li:before:font-bold
                                        prose-strong:text-violet-700 prose-strong:font-bold
                                        prose-ul:my-3 prose-ul:space-y-2.5
                                        ">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiTipText}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                        <Sparkles size={40} className="mb-4 opacity-30"/>
                                        <p className="font-semibold text-lg text-slate-500">No recommendations right now.</p>
                                    </div>
                                )
                            )}
                        </div>
                        
                        {/* Footer Action */}
                        <div className="p-6 bg-slate-50/80 border-t border-slate-100 backdrop-blur-md relative z-10 flex justify-end">
                            <button onClick={() => setIsTipOpen(false)} className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-lg shadow-md shadow-violet-500/20 active:scale-95 transition-all">
                                Got it, thanks
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Tasks Completed Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} onClick={() => onNavigate('tasks')} className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(13,148,136,0.15)] hover:border-teal-200 transition-all duration-500 cursor-pointer flex flex-col justify-between">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-400/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-teal-400/20 transition-colors duration-500 animate-blob"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <p className="text-sm font-bold text-slate-500 group-hover:text-teal-600 transition-colors">Tasks Done</p>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100/50 flex items-center justify-center text-teal-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm">
                                <CheckCircle size={22} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-display font-black text-slate-800 mb-2 group-hover:transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-emerald-500 transition-all">{completedTasksThisWeek}</h3>
                            <div className="flex items-center gap-1.5 text-teal-700 text-xs font-black tracking-wide bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 px-3 py-1.5 rounded-xl w-fit drop-shadow-sm">
                                KEEP IT UP!
                            </div>
                        </div>
                    </motion.div>

                    {/* Focus Time Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} onClick={() => onNavigate('focus')} className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] hover:border-violet-200 transition-all duration-500 cursor-pointer flex flex-col justify-between">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-400/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-violet-400/20 transition-colors duration-500 animate-blob animation-delay-2000"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <p className="text-sm font-bold text-slate-500 group-hover:text-violet-600 transition-colors">Focus Time</p>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100/50 flex items-center justify-center text-violet-600 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-sm">
                                <Clock size={22} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-display font-black text-slate-800 mb-2 group-hover:transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-500 transition-all">{totalFocusHoursThisWeek}<span className="text-lg text-slate-400 font-bold ml-1">h</span></h3>
                            <div className="flex items-center gap-1.5 text-violet-700 text-xs font-black tracking-wide bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 px-3 py-1.5 rounded-xl w-fit drop-shadow-sm">
                                {sessionsThisWeek.length} SESSIONS
                            </div>
                        </div>
                    </motion.div>

                    {/* Study Streak Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)] hover:border-rose-200 transition-all duration-500 flex flex-col justify-between">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-400/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-rose-400/20 transition-colors duration-500 animate-blob animation-delay-4000"></div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <p className="text-sm font-bold text-slate-500 group-hover:text-rose-600 transition-colors">Focus Streak</p>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100/50 flex items-center justify-center text-rose-600 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-sm">
                                <Flame size={22} className={streak >= 3 ? "animate-pulse" : ""} />
                            </div>
                        </div>
                        <div className="relative z-10">
                             <h3 className="text-4xl font-display font-black text-slate-800 mb-2 group-hover:transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-pink-500 transition-all">{streak}<span className="text-lg text-slate-400 font-bold ml-1">days</span></h3>
                             {streak >= 3 ? (
                                <div className="flex items-center gap-1.5 text-rose-700 text-xs font-black tracking-wide bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200 px-3 py-1.5 rounded-xl w-fit drop-shadow-sm shadow-inner overflow-hidden relative">
                                    <div className="absolute inset-0 bg-white/40 h-full w-4 skew-x-12 translate-x-[-200%] group-hover:animate-[shimmer_2s_infinite]"></div>
                                    🔥 ON FIRE!
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-pink-700 text-xs font-black tracking-wide bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 px-3 py-1.5 rounded-xl w-fit drop-shadow-sm">
                                    KEEP IT GOING
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* AI Tip Card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 animate-gradient-shift bg-[length:200%_200%] p-6 rounded-[2rem] shadow-lg shadow-violet-500/30 text-white border border-fuchsia-400/50 relative flex flex-col justify-between group hover:-translate-y-2 hover:shadow-2xl hover:shadow-fuchsia-500/40 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-[50px] transform translate-x-1/2 -translate-y-1/2 pointer-events-none animate-blob"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/30 rounded-full blur-[40px] transform -translate-x-1/2 translate-y-1/2 pointer-events-none animate-blob animation-delay-2000"></div>
                        <div className="relative z-10">
                             <h4 className="font-display font-black text-sm mb-3 flex items-center gap-2 opacity-90 uppercase tracking-widest"><TrendingUp size={18} className="animate-pulse" /> AI Insight</h4>
                             <p className="text-violet-50 text-sm font-semibold leading-relaxed relative z-10 drop-shadow-sm">
                                {aiLoading ? 'Analyzing metrics...' : (
                                    aiTipText
                                        ? (() => {
                                            const cleanText = aiTipText.replace(/[*_#`~]+/g, '');
                                            return cleanText.length > 90 ? cleanText.slice(0, 90) + '...' : cleanText;
                                        })()
                                        : 'Try the Pomodoro technique with the Focus Timer to maximize retention.'
                                )}
                            </p>
                        </div>
                        <button onClick={() => setIsTipOpen(true)} className="relative z-10 mt-5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all w-fit backdrop-blur-md shadow-sm hover:scale-105 active:scale-95">
                             Read Full
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Smart Suggestions */}
            <section className={`p-8 rounded-[2rem] border transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${suggestion.style}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                    <div className={`p-4 rounded-2xl shadow-sm flex-shrink-0 ${suggestion.iconStyle}`}>
                        <suggestion.icon size={28} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-extrabold mb-1">{suggestion.title}</h3>
                        <p className="text-sm font-medium opacity-90 leading-relaxed max-w-3xl">
                            {suggestion.description}
                        </p>
                    </div>
                    <button
                        onClick={suggestion.action}
                        className="hidden md:block px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                        {suggestion.buttonText}
                    </button>
                </div>
            </section>

            {/* Charts Row */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-display font-black text-slate-800">Weekly Activity</h3>
                            {weekOffset === 0 && (
                                <span className="bg-emerald-100/80 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-200 shadow-sm backdrop-blur-sm">
                                    This Week
                                </span>
                            )}
                            {streak > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-200">
                                    {streak} Day Streak
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setWeekOffset(weekOffset - 1)} className="px-2 py-1 rounded-md bg-white/50 hover:bg-white text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">◀</button>
                            <div className="bg-white px-3 py-1.5 rounded-xl text-xs font-black text-slate-500 border border-slate-100 shadow-sm">
                                {format(selectedWeekStart, 'MMM d')} - {format(selectedWeekEnd, 'MMM d')}
                            </div>
                            <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-2 py-1 rounded-md bg-white/50 hover:bg-white text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">▶</button>
                        </div>
                    </div>
                    <div className="h-72 relative z-10 outline-none focus:outline-none">
                        <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none" style={{ outline: 'none' }}>
                            <BarChart data={focusData} style={{ outline: 'none' }}>
                                <defs>
                                    <linearGradient id="activeBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                                        <stop offset="50%" stopColor="#d946ef" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="normalBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.6} />
                                        <stop offset="100%" stopColor="#c084fc" stopOpacity={0.15} />
                                    </linearGradient>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    domain={yAxisDomain}
                                    allowDataOverflow={true}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/90 backdrop-blur-xl border border-slate-100 p-3 rounded-2xl shadow-[0_10px_25px_rgb(0,0,0,0.1)]">
                                                    <p className="text-xs font-black text-slate-400 uppercase mb-1">{payload[0].payload.name}</p>
                                                    <p className="text-lg font-black text-indigo-600">{payload[0].value} <span className="text-sm font-bold text-slate-500">mins</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="minutes"
                                    radius={[12, 12, 12, 12]}
                                    barSize={20}
                                    animationDuration={1500}
                                >
                                    {focusData.map((entry, index) => {
                                        const now = new Date();
                                        const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
                                        const isActiveDay = index === todayIndex && weekOffset === 0;
                                        return (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={isActiveDay ? "url(#activeBar)" : "url(#normalBar)"}
                                                filter={isActiveDay ? "url(#glow)" : ""}
                                            />
                                        );
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-400/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-display font-black text-slate-800">Weekly Progress</h3>
                                {weeklyCompletionPercentage === 100 && (
                                    <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-rose-200 flex items-center gap-1">
                                        <Trophy size={10} /> Champion
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-bold text-slate-400">Target: {weeklyDenominator} tasks this week</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>
                                <span className="text-xs font-bold text-slate-500">Done ({completedTasksThisWeekActual})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                                <span className="text-xs font-bold text-slate-500">Goal ({weeklyDenominator})</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-6 relative z-10" style={{ minHeight: '300px' }}>
                        {/* Left: Progress Ring */}
                        <div className="flex flex-col items-center justify-center flex-shrink-0">
                            <div className="relative flex items-center justify-center w-[160px] h-[160px]">
                                {weeklyCompletionPercentage === 100 && tasksForThisWeek.length >= 3 && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0, y: 20 }}
                                        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1], y: 0 }}
                                        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                                        className="absolute -top-5 text-4xl z-20 drop-shadow-md"
                                    >
                                        👑
                                    </motion.div>
                                )}
                                <svg width="160" height="160" className="transform -rotate-90 drop-shadow-xl z-10">
                                    <defs>
                                        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#f43f5e" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                        <filter id="glowRing2" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="6" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    <circle
                                        cx="80" cy="80" r="65"
                                        stroke="rgba(241, 245, 249, 0.4)" strokeWidth="14" fill="transparent"
                                    />
                                    <motion.circle
                                        cx="80" cy="80" r="65"
                                        stroke="url(#ringGradient)" strokeWidth="14" fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 65}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 65 }}
                                        animate={{ strokeDashoffset: (2 * Math.PI * 65) - ((todayCompletionPercentage / 100) * (2 * Math.PI * 65)) }}
                                        transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                                        filter={todayCompletionPercentage > 0 ? "url(#glowRing2)" : ""}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 1, duration: 0.5 }}
                                        className="text-4xl font-display font-black text-slate-800"
                                    >
                                        {todayCompletionPercentage}<span className="text-lg text-slate-400 font-bold">%</span>
                                    </motion.span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Weekly Goal</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Task List */}
                        <div className="flex-1 min-w-0 flex flex-col">
                            {tasksDueToday.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                                        <Calendar size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">No tasks for this week</p>
                                    <p className="text-xs text-slate-300 mt-1">Add tasks to see your progress</p>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar" style={{ maxHeight: '300px' }}>
                                    {tasksDueToday.map((task, idx) => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                                                task.status === 'done'
                                                    ? 'bg-emerald-50/60 border-emerald-100'
                                                    : 'bg-white/60 border-slate-100 hover:border-violet-200 hover:bg-violet-50/30'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                task.status === 'done'
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'border-2 border-slate-200'
                                            }`}>
                                                {task.status === 'done' && <CheckCircle size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm font-bold truncate ${
                                                        task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'
                                                    }`}>
                                                        {task.title}
                                                    </p>
                                                    {task.status !== 'done' && (task.scheduled_date || task.due_date) && new Date(task.scheduled_date || task.due_date!) < startOfDay(selectedWeekStart) && (
                                                        <span className="flex-shrink-0 bg-rose-50 text-[9px] font-black text-rose-500 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">Backlog</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 ${
                                                task.priority === 'high'
                                                    ? 'bg-rose-100 text-rose-600'
                                                    : task.priority === 'medium'
                                                        ? 'bg-amber-100 text-amber-600'
                                                        : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Floating Proactive AI Widget */}
            <ProactiveTutor />
        </div>
    );
};
