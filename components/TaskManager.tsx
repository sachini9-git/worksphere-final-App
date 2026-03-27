
import React, { useState, useRef } from 'react';
import { Task, SubTask, TaskCategory } from '../types';
import { Plus, Calendar, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, Edit2, X, Save, LayoutList, GripVertical, Bell, Clock, ArrowUpDown } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../utils/sounds';

interface TaskManagerProps {
    tasks: Task[];
    addTask: (title: string, date: string, priority: 'high' | 'medium' | 'low', category: TaskCategory, reminder: string) => void;
    updateTask: (task: Task) => void;
    deleteTask: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ tasks, addTask, updateTask, deleteTask }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskReminder, setNewTaskReminder] = useState('');
    const [showReminderInput, setShowReminderInput] = useState(false);
    const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

    // Category State
    const [selectedCategory, setSelectedCategory] = useState<string>('Study');
    const [customCategory, setCustomCategory] = useState('');

    const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'done'>('all');
    const [sortBy, setSortBy] = useState<'priority' | 'date' | 'created'>('priority');

    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        title: string;
        date: string;
        priority: 'high' | 'medium' | 'low';
        category: TaskCategory;
        reminder: string;
    }>({ title: '', date: '', priority: 'medium', category: 'Study', reminder: '' });

    // Drag and Drop State
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        // Determine final category
        const finalCategory = selectedCategory === 'Other' ? (customCategory.trim() || 'General') : selectedCategory;

        addTask(newTaskTitle, newTaskDate, newTaskPriority, finalCategory, newTaskReminder);
        sounds.playClick();

        // Reset fields
        setNewTaskTitle('');
        setNewTaskDate('');
        setNewTaskReminder('');
        setShowReminderInput(false);
        if (selectedCategory === 'Other') setCustomCategory('');
        setSelectedCategory('Study');
    };

    const handleStartEdit = (task: Task) => {
        setEditingTaskId(task.id);
        setEditForm({
            title: task.title,
            date: task.due_date || '',
            priority: task.priority,
            category: task.category,
            reminder: task.reminder || ''
        });
        setExpandedTaskId(null);
    };

    const handleSaveEdit = () => {
        if (!editingTaskId) return;
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            updateTask({
                ...task,
                title: editForm.title,
                due_date: editForm.date,
                priority: editForm.priority,
                category: editForm.category,
                reminder: editForm.reminder,
                reminder_fired: task.reminder !== editForm.reminder ? false : task.reminder_fired
            });
        }
        setEditingTaskId(null);
    };

    const handleAddSubtask = (taskId: string) => {
        if (!newSubtaskTitle.trim()) return;
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const newSubtask: SubTask = { id: Date.now().toString(), title: newSubtaskTitle, completed: false };
            updateTask({ ...task, subtasks: [...(task.subtasks || []), newSubtask] });
            setNewSubtaskTitle('');
        }
    };

    const toggleSubtask = (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const updatedSubtasks = task.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
            updateTask({ ...task, subtasks: updatedSubtasks });
        }
    };

    // Drag Handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('text/plain', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, priority: string) => {
        e.preventDefault();
        if (dragOverColumn !== priority) {
            setDragOverColumn(priority);
        }
    };

    const handleDrop = (e: React.DragEvent, priority: 'high' | 'medium' | 'low') => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        setDragOverColumn(null);
        setDraggedTaskId(null);

        if (taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.priority !== priority) {
                updateTask({ ...task, priority });
            }
        }
    };

    const filterTasks = (priority: string) => {
        const filtered = tasks.filter(t =>
            t.priority === priority &&
            (statusFilter === 'all' ? true : statusFilter === 'done' ? t.status === 'done' : t.status !== 'done')
        );

        return filtered.sort((a, b) => {
            if (sortBy === 'date') {
                // Sort by due date (soonest first). Null dates at the end.
                if (!a.due_date && !b.due_date) return 0;
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
            if (sortBy === 'created') {
                // Sort by created date (newest first)
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            // Default/Priority: Since we are inside a priority column, 
            // we just fallback to creation date (newest first) for consistent ordering.
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }

    // Get local date string for 'min' attribute to avoid timezone issues
    const getTodayString = () => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const setQuickReminder = (hours: number) => {
        const date = new Date();
        date.setHours(date.getHours() + hours);
        date.setMinutes(0); // Round to hour
        // Adjust for timezone offset to get local ISO string
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        setNewTaskReminder(localISOTime);
    };

    const renderTaskCard = (task: Task) => {
        if (editingTaskId === task.id) {
            return (
                <div key={task.id} className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border-2 border-violet-500 z-10 animate-in fade-in zoom-in-95 mb-4">
                    <div className="flex justify-between mb-3"><h4 className="font-display font-bold text-slate-800 text-sm">Edit Task</h4><button onClick={() => setEditingTaskId(null)}><X size={16} className="text-slate-400 hover:text-slate-600 transition-colors" /></button></div>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 mb-3 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                            <label className="text-xs text-slate-400 font-bold block mb-1">Due Date</label>
                            <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs w-full" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-bold block mb-1">Reminder</label>
                            <input type="datetime-local" value={editForm.reminder} onChange={e => setEditForm({ ...editForm, reminder: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs w-full" />
                        </div>
                    </div>
                    <div className="flex justify-end"><button onClick={handleSaveEdit} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-violet-500/20 hover:shadow-violet-500/40 transition-all"><Save size={12} /> Save</button></div>
                </div>
            )
        }

        const isCompleted = task.status === 'done';
        const isDragging = draggedTaskId === task.id;

        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
                key={task.id}
                className="mb-4"
            >
                <div
                    draggable={!editingTaskId}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`group relative bg-white/90 backdrop-blur-sm p-5 rounded-[1.5rem] border transition-all duration-300 cursor-grab active:cursor-grabbing
                      ${isCompleted 
                        ? 'border-slate-100 bg-slate-50/50 opacity-60 grayscale' 
                        : `border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-${task.priority === 'high' ? 'rose' : task.priority === 'medium' ? 'amber' : 'emerald'}-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)]`}
                      ${isDragging ? 'opacity-40 ring-2 ring-violet-400 rotate-2 scale-95 shadow-xl' : 'hover:-translate-y-1.5'}
                  `}
                >
                    <div className="flex items-start gap-4">
                        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-300">
                            <GripVertical size={14} />
                        </div>

                        <button 
                            onClick={() => {
                                const nextStatus = isCompleted ? 'todo' : 'done';
                                if (nextStatus === 'done') sounds.playChime();
                                else sounds.playClick();
                                updateTask({ ...task, status: nextStatus });
                            }} 
                            className={`mt-0.5 ml-2 flex-shrink-0 transition-all duration-300 transform hover:scale-110 ${isCompleted ? 'text-teal-500' : 'text-slate-200 hover:text-violet-500'}`}
                        >
                            {isCompleted ? <CheckCircle2 size={24} fill="currentColor" className="text-white" /> : <Circle size={24} strokeWidth={2.5} />}
                        </button>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2 gap-2">
                                <div className="flex gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block ${task.priority === 'high' ? 'bg-rose-50 text-rose-600' : task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{task.priority}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md inline-block">{task.category}</span>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleStartEdit(task)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-violet-600 transition-colors"><Edit2 size={14} /></button>
                                    <button onClick={() => deleteTask(task.id)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <h3 className={`font-display font-bold text-base text-slate-800 leading-snug mb-2 ${isCompleted ? 'line-through text-slate-400' : ''}`}>{task.title}</h3>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                                {task.due_date && (
                                    <span className={`flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg ${!isCompleted && isPast(new Date(task.due_date)) ? 'text-rose-500 bg-rose-50' : ''}`}>
                                        <Calendar size={12} /> {format(new Date(task.due_date), 'MMM d')}
                                    </span>
                                )}
                                {task.reminder && !isCompleted && (
                                    <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                                        <Bell size={12} /> {format(new Date(task.reminder), 'h:mm a')}
                                    </span>
                                )}
                                {task.subtasks.length > 0 && (
                                    <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className="flex items-center gap-1 hover:text-violet-600 transition-colors bg-slate-50 px-2 py-1 rounded-lg">
                                        <LayoutList size={12} /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                        {expandedTaskId === task.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                )}
                            </div>

                            {/* Subtasks */}
                            {expandedTaskId === task.id && (
                                <div className="mt-4 pt-3 border-t border-slate-100 animate-in slide-in-from-top-1">
                                    <div className="space-y-2 mb-3">
                                        {task.subtasks.map(st => (
                                            <div key={st.id} className="flex items-center gap-3 group/sub">
                                                <button onClick={() => toggleSubtask(task.id, st.id)} className={`transition-colors ${st.completed ? 'text-violet-500' : 'text-slate-200 group-hover/sub:text-slate-400'}`}>
                                                    {st.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                                </button>
                                                <span className={`text-xs font-medium ${st.completed ? 'line-through text-slate-400' : 'text-slate-600'}`}>{st.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add subtask..."
                                            value={newSubtaskTitle}
                                            onChange={e => setNewSubtaskTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddSubtask(task.id)}
                                            className="flex-1 bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                                        />
                                        <button onClick={() => handleAddSubtask(task.id)} className="text-xs bg-violet-600 text-white px-3 rounded-lg font-bold shadow-sm hover:bg-violet-700 transition-colors">Add</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-8">
            <style>{`
         input[type="date"]::-webkit-calendar-picker-indicator {
           cursor: pointer;
           opacity: 0.6;
           filter: invert(0.4) sepia(1) saturate(2) hue-rotate(200deg);
           transition: opacity 0.2s;
         }
         input[type="date"]::-webkit-calendar-picker-indicator:hover {
           opacity: 1;
         }
       `}</style>

            {/* Top Bar: Input & Filters */}
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-violet-500/30">
                            <LayoutList size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-extrabold text-slate-800">My Tasks</h2>
                            <p className="text-sm font-medium text-slate-500">Manage your daily goals</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-2.5 transition-all hover:border-violet-300">
                            <ArrowUpDown size={14} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer hover:text-violet-600"
                            >
                                <option value="priority">Priority (Default)</option>
                                <option value="date">Due Date</option>
                                <option value="created">Created Date</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex p-1.5 bg-slate-100/80 rounded-2xl">
                            {['all', 'todo', 'done'].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s as any)} className={`px-5 py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-300 ${statusFilter === s ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* New Task Input */}
                <form onSubmit={handleSubmit} className="relative group">
                    <div className="relative bg-slate-50/50 p-2.5 rounded-[1.5rem] border border-slate-200 focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10 transition-all duration-300 flex flex-col xl:flex-row xl:items-center gap-3 shadow-inner">
                        <div className="flex-1 flex items-center px-4">
                            <Plus className="text-violet-500 mr-3 flex-shrink-0" size={24} strokeWidth={3} />
                            <input
                                type="text"
                                placeholder="What needs to be done?"
                                className="w-full py-3 outline-none text-slate-800 placeholder-slate-400 font-medium text-lg bg-transparent"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 px-3 pb-2 xl:pb-0">

                            {/* Categories with Custom Option */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        if (e.target.value !== 'Other') setCustomCategory('');
                                    }}
                                    className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 py-3 outline-none cursor-pointer hover:border-violet-400 focus:border-violet-500 transition-colors shadow-sm"
                                >
                                    <option value="Study">Study</option>
                                    <option value="Coursework">Coursework</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Other">Other...</option>
                                </select>
                                {selectedCategory === 'Other' && (
                                    <input
                                        type="text"
                                        placeholder="Category..."
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                        className="w-32 bg-white border border-violet-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-3 outline-none focus:border-violet-500 animate-in fade-in slide-in-from-left-2 shadow-sm"
                                        autoFocus
                                    />
                                )}
                            </div>

                            <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as any)} className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 py-3 outline-none cursor-pointer hover:border-violet-400 focus:border-violet-500 transition-colors shadow-sm">
                                <option value="high">High Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>

                            {/* Native Date Input */}
                            <div className="relative flex items-center">
                                <input
                                    type="date"
                                    value={newTaskDate}
                                    onChange={e => setNewTaskDate(e.target.value)}
                                    min={getTodayString()}
                                    className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-3 py-3 outline-none cursor-text hover:border-violet-400 focus:border-violet-500 transition-colors shadow-sm min-w-[130px]"
                                />
                            </div>

                            {/* Reminder Toggle */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowReminderInput(!showReminderInput)}
                                    className={`p-3 rounded-xl transition-all duration-200 ${newTaskReminder ? 'bg-amber-100 text-amber-600' : 'bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300'}`}
                                    title="Set Reminder"
                                >
                                    {newTaskReminder ? <Bell size={20} fill="currentColor" /> : <Bell size={20} />}
                                </button>
                                {showReminderInput && (
                                    <div className="absolute top-14 right-0 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 w-72">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12} /> Reminder</label>
                                            {newTaskReminder && <button type="button" onClick={() => { setNewTaskReminder(''); setShowReminderInput(false); }} className="text-[10px] font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg">Clear</button>}
                                        </div>

                                        <input
                                            type="datetime-local"
                                            value={newTaskReminder}
                                            onChange={(e) => setNewTaskReminder(e.target.value)}
                                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 mb-4 transition-all"
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <button type="button" onClick={() => setQuickReminder(1)} className="bg-slate-50 hover:bg-violet-50 text-slate-500 hover:text-violet-600 text-[10px] font-bold py-2 rounded-lg transition-colors">In 1 Hour</button>
                                            <button type="button" onClick={() => setQuickReminder(3)} className="bg-slate-50 hover:bg-violet-50 text-slate-500 hover:text-violet-600 text-[10px] font-bold py-2 rounded-lg transition-colors">In 3 Hours</button>
                                            <button type="button" onClick={() => setQuickReminder(24)} className="bg-slate-50 hover:bg-violet-50 text-slate-500 hover:text-violet-600 text-[10px] font-bold py-2 rounded-lg transition-colors">Tomorrow</button>
                                            <button type="button" onClick={() => setShowReminderInput(false)} className="bg-violet-600 text-white text-[10px] font-bold py-2 rounded-lg shadow-sm hover:bg-violet-700 transition-colors">Done</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-3 rounded-xl hover:shadow-violet-500/40 transition-all shadow-lg shadow-violet-500/20 active:scale-95 flex-shrink-0 hover:rotate-90 duration-300">
                                <Plus size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Kanban Columns */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full min-w-[900px] md:min-w-0">

                    <div
                        className={`flex flex-col h-full group transition-colors duration-200 ${dragOverColumn === 'high' ? 'bg-rose-50/50 rounded-2xl ring-2 ring-rose-200' : ''}`}
                        onDragOver={(e) => handleDragOver(e, 'high')}
                        onDrop={(e) => handleDrop(e, 'high')}
                    >
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <h3 className="font-display font-bold text-slate-700 uppercase tracking-wider text-xs">High Priority</h3>
                            <span className="ml-auto bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-xs font-bold">{filterTasks('high').length}</span>
                        </div>
                        <div className="flex-1 bg-gradient-to-b from-rose-50/60 to-slate-50/60 backdrop-blur-xl rounded-[2rem] p-3 border border-rose-100/60 shadow-[inset_0_2px_20px_rgba(255,255,255,0.7)] overflow-y-auto transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-300/20 rounded-full blur-[40px] pointer-events-none animate-blob"></div>
                            <div className="relative z-10 w-full h-full flex flex-col pt-1">
                                {filterTasks('high').length === 0 && <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold opacity-80">No tasks</div>}
                                <AnimatePresence>
                                    {filterTasks('high').map(task => renderTaskCard(task))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`flex flex-col h-full group transition-colors duration-200 ${dragOverColumn === 'medium' ? 'bg-amber-50/50 rounded-2xl ring-2 ring-amber-200' : ''}`}
                        onDragOver={(e) => handleDragOver(e, 'medium')}
                        onDrop={(e) => handleDrop(e, 'medium')}
                    >
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <h3 className="font-display font-bold text-slate-700 uppercase tracking-wider text-xs">Medium Priority</h3>
                            <span className="ml-auto bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-xs font-bold">{filterTasks('medium').length}</span>
                        </div>
                        <div className="flex-1 bg-gradient-to-b from-amber-50/60 to-slate-50/60 backdrop-blur-xl rounded-[2rem] p-3 border border-amber-100/60 shadow-[inset_0_2px_20px_rgba(255,255,255,0.7)] overflow-y-auto transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/20 rounded-full blur-[40px] pointer-events-none animate-blob animation-delay-2000"></div>
                            <div className="relative z-10 w-full h-full flex flex-col pt-1">
                                {filterTasks('medium').length === 0 && <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold opacity-80">No tasks</div>}
                                <AnimatePresence>
                                    {filterTasks('medium').map(task => renderTaskCard(task))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`flex flex-col h-full group transition-colors duration-200 ${dragOverColumn === 'low' ? 'bg-emerald-50/50 rounded-2xl ring-2 ring-emerald-200' : ''}`}
                        onDragOver={(e) => handleDragOver(e, 'low')}
                        onDrop={(e) => handleDrop(e, 'low')}
                    >
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <h3 className="font-display font-bold text-slate-700 uppercase tracking-wider text-xs">Low Priority</h3>
                            <span className="ml-auto bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-xs font-bold">{filterTasks('low').length}</span>
                        </div>
                        <div className="flex-1 bg-gradient-to-b from-emerald-50/60 to-slate-50/60 backdrop-blur-xl rounded-[2rem] p-3 border border-emerald-100/60 shadow-[inset_0_2px_20px_rgba(255,255,255,0.7)] overflow-y-auto transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/20 rounded-full blur-[40px] pointer-events-none animate-blob animation-delay-4000"></div>
                            <div className="relative z-10 w-full h-full flex flex-col pt-1">
                                {filterTasks('low').length === 0 && <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold opacity-80">No tasks</div>}
                                <AnimatePresence>
                                    {filterTasks('low').map(task => renderTaskCard(task))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
