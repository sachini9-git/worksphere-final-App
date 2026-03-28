
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
import { CheckCircle, Clock, Award, TrendingUp, Calendar, Mail, FileText, HardDrive, ExternalLink, ArrowUpRight, Sparkles, AlertTriangle, Zap, Coffee, Flame, Trophy } from 'lucide-react';
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
            return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
        })
    )).map(dateStr => {
        const [y, m, d] = dateStr.split('-');
        return new Date(parseInt(y), parseInt(m), parseInt(d));
    }).sort((a, b) => b.getTime() - a.getTime());

    if (sortedUniqueDays.length > 0) {
        // Check if there's a session today or yesterday to start the streak
        const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = `${yesterdayDate.getFullYear()}-${yesterdayDate.getMonth()}-${yesterdayDate.getDate()}`;

        const firstDayStr = `${sortedUniqueDays[0].getFullYear()}-${sortedUniqueDays[0].getMonth()}-${sortedUniqueDays[0].getDate()}`;

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

    const todayDate = new Date();
    const tasksDueToday = tasks.filter(t => {
        // Fallback to due_date if scheduled_date hasn't been set by Planner
        const targetDate = t.scheduled_date || t.due_date;
        if (!targetDate) return false;
        return isSameDay(new Date(targetDate), todayDate);
    });

    const completedTasksToday = tasksDueToday.filter(t => t.status === 'done').length;

    const todayCompletionPercentage = tasksDueToday.length > 0
        ? Math.round((completedTasksToday / tasksDueToday.length) * 100)
        : 0;

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
            const prompt = `You are a study coach. Based on the following user weekly metrics, analyze behaviour and provide 3 concise personalized study recommendations in bullet points, plus one actionable next step. Keep each bullet short (<=120 chars):\n\n- Focus minutes this week: ${totalFocusMinutesThisWeek}\n- Focus sessions this week: ${sessionsThisWeek.length}\n- Avg session minutes this week: ${avgSession}\n- Tasks completed this week: ${completedTasksThisWeek}\n- Pending tasks: ${pendingTasks}\n\nConsider trends and encourage positive habits. Return plain text.`;
            try {
                const resp = await generateAIResponse(prompt, []);
                if (!mounted) return;
                setAiTipText(resp);
                if (!resp.includes("429") && !resp.includes("Error")) {
                    setDashboardAiTip(resp);
                }
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
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setIsTipOpen(false)} />
                    <div ref={tipRef} onClick={(e) => e.stopPropagation()} className="relative z-50 w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-lg font-display font-bold text-slate-800">Personalized AI Recommendations</h3>
                                <p className="text-sm text-slate-500">Behavior analysis for the selected week</p>
                            </div>
                            <div>
                                <button onClick={() => setIsTipOpen(false)} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg">Close</button>
                            </div>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto text-slate-700 leading-relaxed">
                            {aiLoading ? 'Analyzing your behaviour...' : (
                                aiTipText ? (
                                    <div className="prose prose-sm prose-violet max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiTipText}</ReactMarkdown>
                                    </div>
                                ) : 'No recommendations available.'
                            )}
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
                    <div className="h-72 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={focusData}>
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
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-display font-black text-slate-800">Today's Tasks</h3>
                                {todayCompletionPercentage === 100 && tasksDueToday.length > 0 && (
                                    <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-rose-200 flex items-center gap-1">
                                        <Trophy size={10} /> Champion
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-bold text-slate-400">Scheduled for today</p>
                        </div>
                    </div>
                    <div className="h-72 flex items-center justify-center relative z-10">
                        <div className="relative flex items-center justify-center w-[220px] h-[220px]">
                            {todayCompletionPercentage === 100 && tasksDueToday.length > 0 && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0, y: 20 }}
                                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1], y: 0 }}
                                    transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                                    className="absolute -top-6 text-5xl z-20 drop-shadow-md"
                                >
                                    👑
                                </motion.div>
                            )}
                            <svg width="220" height="220" className="transform -rotate-90 drop-shadow-2xl z-10">
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
                                    cx="110" cy="110" r="90"
                                    stroke="rgba(241, 245, 249, 0.4)" strokeWidth="18" fill="transparent"
                                />
                                <motion.circle
                                    cx="110" cy="110" r="90"
                                    stroke="url(#ringGradient)" strokeWidth="18" fill="transparent"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 90}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                                    animate={{ strokeDashoffset: (2 * Math.PI * 90) - ((todayCompletionPercentage / 100) * (2 * Math.PI * 90)) }}
                                    transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                                    filter={todayCompletionPercentage > 0 ? "url(#glowRing2)" : ""}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1, duration: 0.5 }}
                                    className="text-5xl font-display font-black text-slate-800"
                                >
                                    {todayCompletionPercentage}<span className="text-2xl text-slate-400 font-bold">%</span>
                                </motion.span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Productivity</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-8 mt-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
                            <span className="text-sm font-bold text-slate-600">Completed <span className="text-slate-400 font-medium">({completedTasksToday})</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-slate-200"></span>
                            <span className="text-sm font-bold text-slate-600">Pending <span className="text-slate-400 font-medium">({tasksDueToday.length - completedTasksToday})</span></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Floating Proactive AI Widget */}
            <ProactiveTutor />
        </div>
    );
};
