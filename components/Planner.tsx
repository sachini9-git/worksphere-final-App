import React, { useState } from 'react';
import { Task, TimeBlock } from '../types';
import { useAppStore } from '../store/appStore';
import { pingOptimizeSchedule, autoGenerateSchedule } from '../services/geminiService';
import { Calendar, Wand2, ArrowRight, CheckSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlannerProps {
    tasks: Task[];
    updateTask: (task: Task) => void;
}

// Generate hourly time slots from 8 AM to 10 PM
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); 

export const Planner: React.FC<PlannerProps> = ({ tasks, updateTask }) => {
    const { schedule, setSchedule } = useAppStore();
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationText, setOptimizationText] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    // Filter to only show pending tasks
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    
    // Find tasks that are not yet in today's schedule
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysBlocks = schedule.filter(b => b.date === todayStr);
    
    const unscheduledTasks = pendingTasks.filter(t => !todaysBlocks.some(b => b.taskId === t.id));

    // Simple HTML5 Drag & Drop state
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, hour: number) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

        // Check if task is already in schedule, if so, move it. If not, add it.
        const existingBlock = schedule.find(b => b.taskId === taskId && b.date === todayStr);

        let newSchedule;
        if (existingBlock) {
            newSchedule = schedule.map(b => 
                b.id === existingBlock.id ? { ...b, startTime, endTime } : b
            );
        } else {
            newSchedule = [...schedule, {
                id: Math.random().toString(36).substr(2, 9),
                taskId,
                date: todayStr,
                startTime,
                endTime
            }];
        }
        
        setSchedule(newSchedule);
        setDraggedTaskId(null);

        // Persist to database
        const droppedTask = tasks.find(t => t.id === taskId);
        if (droppedTask) {
             updateTask({ ...droppedTask, scheduled_date: todayStr });
        }
    };

    const handleRemoveFromSchedule = (blockId: string) => {
        setSchedule(schedule.filter(b => b.id !== blockId));
    };

    const handleOptimize = async () => {
        setIsThinking(true);
        const suggestion = await pingOptimizeSchedule(pendingTasks, todaysBlocks);
        setOptimizationText(suggestion);
        setIsThinking(false);
    };

    const handleAutoSchedule = async () => {
        setIsOptimizing(true);
        const newBlocks = await autoGenerateSchedule(unscheduledTasks);
        if (newBlocks && newBlocks.length > 0) {
            const mappedBlocks = newBlocks.map(nb => ({
                id: Math.random().toString(36).substr(2, 9),
                taskId: nb.taskId,
                date: todayStr,
                startTime: nb.startTime,
                endTime: nb.endTime
            }));
            setSchedule([...schedule, ...mappedBlocks]);
            
            // Persist all auto-scheduled tasks to database
            newBlocks.forEach(nb => {
                const autoTask = tasks.find(t => t.id === nb.taskId);
                if (autoTask) {
                    updateTask({ ...autoTask, scheduled_date: todayStr });
                }
            });
        }
        setIsOptimizing(false);
    };

    return (
        <div className="h-full flex gap-6 overflow-hidden">
            {/* LEFT COLUMN: Backlog */}
            <div className="w-80 bg-white/60 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                        <CheckSquare size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Task Backlog</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {unscheduledTasks.length === 0 ? (
                        <div className="text-center p-6 text-slate-400 text-sm">No unscheduled tasks left for today!</div>
                    ) : (
                        <AnimatePresence>
                            {unscheduledTasks.map(task => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e as any, task.id)}
                                    className={`p-4 rounded-2xl border border-slate-100 bg-white shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedTaskId === task.id ? 'opacity-50 ring-2 ring-violet-500' : ''}`}
                                >
                                    <h3 className="font-bold text-slate-700 text-sm mb-2">{task.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-rose-100 text-rose-600' : task.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* CENTER COLUMN: The Timeline */}
            <div className="flex-1 bg-white/60 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 flex flex-col shadow-sm relative">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Today's Timeline</h2>
                            <p className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
                    {/* Time slots */}
                    <div className="space-y-0">
                        {HOURS.map(hour => {
                            const formattedHour = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                            const blocksInHour = todaysBlocks.filter(b => b.startTime.startsWith(hour.toString().padStart(2, '0')));

                            return (
                                <div 
                                    key={hour} 
                                    className="flex gap-4 min-h-[100px] border-b border-slate-100 group"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, hour)}
                                >
                                    {/* Time Label */}
                                    <div className="w-16 py-4 flex flex-col items-end border-r border-slate-100 pr-4">
                                        <span className="text-sm font-bold text-slate-400 group-hover:text-violet-500 transition-colors">{formattedHour}</span>
                                    </div>
                                    
                                    {/* Drop Zone */}
                                    <div className={`flex-1 p-2 transition-colors ${draggedTaskId ? 'hover:bg-violet-50/50' : ''}`}>
                                        <AnimatePresence>
                                            {blocksInHour.map(block => {
                                                const task = tasks.find(t => t.id === block.taskId);
                                                if (!task) return null;
                                                return (
                                                    <motion.div
                                                        layout
                                                        key={block.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e as any, task.id)}
                                                        className="mb-2 p-3 bg-white border border-indigo-100 shadow-sm shadow-indigo-500/10 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group/card relative"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <span className="font-bold text-slate-700 text-sm">{task.title}</span>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveFromSchedule(block.id); }}
                                                                className="opacity-0 group-hover/card:opacity-100 text-slate-300 hover:text-rose-500 transition-all font-black text-xs px-2"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-wider">
                                                            {block.startTime} - {block.endTime}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                        
                                        {/* Empty state hint */}
                                        {blocksInHour.length === 0 && draggedTaskId && (
                                            <div className="h-full border-2 border-dashed border-violet-200 rounded-xl flex items-center justify-center bg-violet-50/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Drop Here</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: AI Coach */}
            <div className="w-80 bg-white/60 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 flex flex-col shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Wand2 size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Smart Coach</h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6">
                    <div className="flex flex-col items-center text-center p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                            <Wand2 size={24} className="text-indigo-500" />
                        </div>
                        <h3 className="font-bold text-slate-700 mb-2">Optimize My Day</h3>
                        <p className="text-sm text-slate-500 mb-6">Let AI scan your schedule, workload, and priorities to generate the perfect achievable timeline.</p>
                        
                        <div className="w-full flex flex-col gap-3">
                            <button 
                                onClick={handleAutoSchedule}
                                disabled={isOptimizing}
                                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all group ${isOptimizing ? 'opacity-70 cursor-not-allowed' : 'shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]'}`}
                            >
                                {isOptimizing ? <span className="animate-spin">🌀</span> : <Wand2 size={16} />}
                                {isOptimizing ? "Scheduling..." : "Auto-Schedule"}
                            </button>

                            <button 
                                onClick={handleOptimize}
                                disabled={isThinking}
                                className={`w-full flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-200 font-bold py-3 px-4 rounded-xl transition-all ${isThinking ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
                            >
                                {isThinking ? <span className="animate-spin">⏳</span> : <Sparkles size={16} />}
                                Critique Schedule
                            </button>
                        </div>
                    </div>

                    {optimizationText && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl relative"
                        >
                            <span className="absolute -top-3 left-4 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-emerald-200">AI Advice</span>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed mt-2">{optimizationText}</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
