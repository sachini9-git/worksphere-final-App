
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Flame, ArrowLeft, Save, Edit3, Coffee, Brain, Check, Bell, Smartphone, Music, SkipForward, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';

interface FocusTimerProps {
    onSessionComplete: (duration: number, label: string) => void;
    tasks?: Task[];
    config: { focusDuration: number; breakDuration: number; sound: 'bell' | 'digital' | 'chime' };
    setConfig: (config: any) => void;
    timeLeft: number;
    isActive: boolean;
    mode: 'focus' | 'break';
    sessionCount: number;
    toggleTimer: () => void;
    resetTimer: () => void;
    startBreak: () => void;
    skipBreak: () => void;
    setPreset: (mins: number) => void;
    setCustomTime: (mins: number) => void;
    focusZoneDuration: number;
    setFocusZoneDuration: (mins: number) => void;
    isFocusZoneActive: boolean;
    toggleFocusZone: () => void;
    focusZoneTimeLeft: number;
    playMelody: (type: 'bell' | 'digital' | 'chime') => void;
}

type SoundType = 'bell' | 'digital' | 'chime';

export const FocusTimer: React.FC<FocusTimerProps> = ({
    onSessionComplete,
    tasks = [],
    config,
    setConfig,
    timeLeft,
    isActive,
    mode,
    sessionCount,
    toggleTimer,
    resetTimer,
    startBreak,
    skipBreak,
    setPreset,
    setCustomTime,
    focusZoneDuration,
    setFocusZoneDuration,
    isFocusZoneActive,
    toggleFocusZone,
    focusZoneTimeLeft,
    playMelody
}) => {
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [customMinutes, setCustomMinutes] = useState(config.focusDuration.toString());
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [tempConfig, setTempConfig] = useState(config);

    // Update customMinutes when config changes externally (e.g. preset)
    useEffect(() => {
        if (mode === 'focus') {
            setCustomMinutes(config.focusDuration.toString());
        } else {
            setCustomMinutes(config.breakDuration.toString());
        }
    }, [config.focusDuration, config.breakDuration, mode]);

    const handleCustomTimeSubmit = () => {
        const mins = parseInt(customMinutes);
        if (!isNaN(mins) && mins > 0 && mins <= 180) {
            setCustomTime(mins);
            // Also persist back to standard lengths so it saves if we just edited standard length
            setConfig({ ...config, [mode === 'focus' ? 'focusDuration' : 'breakDuration']: mins });
            setIsEditingTime(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Settings View
    if (isSettingsOpen) {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto animate-in fade-in zoom-in-95">
                <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white/20 w-full">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                        <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3"><Settings size={24} className="text-blue-600" /> Settings</h2>
                        <button onClick={() => setIsSettingsOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors"><ArrowLeft size={24} className="text-slate-400" /></button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 block">Break Duration</label>
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                                <input type="range" min="1" max="30" value={tempConfig.breakDuration} onChange={(e) => setTempConfig({ ...tempConfig, breakDuration: parseInt(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                <span className="text-xl font-bold text-emerald-600 w-16 text-right">{tempConfig.breakDuration}m</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 block">Alarm Tone</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'bell', label: 'Zen Bell', icon: Bell },
                                    { id: 'digital', label: 'Digital', icon: Smartphone },
                                    { id: 'chime', label: 'Chime', icon: Music },
                                ].map((sound) => (
                                    <button
                                        key={sound.id}
                                        onClick={() => {
                                            setTempConfig({ ...tempConfig, sound: sound.id as SoundType });
                                            playMelody(sound.id as SoundType);
                                        }}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${tempConfig.sound === sound.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                                            : 'border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <sound.icon size={24} className={tempConfig.sound === sound.id ? 'animate-bounce' : ''} />
                                        <span className="text-xs font-bold">{sound.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button onClick={() => { setConfig(tempConfig); setIsSettingsOpen(false); }} className="w-full mt-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-lg"><Save size={20} /> Save Changes</button>
                </div>
            </div>
        );
    }

    // Dynamic Styles for Ultimate Premium Feel (Light Glassmorphism)
    const isFocus = mode === 'focus';
    const themeColor = 'text-slate-800'; // Always dark text for light theme
    const accentColor = isFocus ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500';
    
    // Sleek Light Glassmorphism Container
    const containerBg = 'bg-white/50 backdrop-blur-xl border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

    // SVG Progress Circle Calculations
    const radius = 160;
    const circumference = 2 * Math.PI * radius;
    const maxTime = isFocus ? config.focusDuration * 60 : config.breakDuration * 60;
    const progress = Math.max(0, Math.min(1, 1 - (timeLeft / maxTime)));
    const strokeDashoffset = circumference - (progress * circumference);

    // Custom Lightweight Particle Engine (Light Theme Adjusted)
    const renderParticles = () => {
        return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[3rem] z-0">
                {/* Light breathing auras */}
                {isFocus ? (
                    <>
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6], rotate: [0, 90, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-20%] right-[-10%] w-[30rem] h-[30rem] bg-rose-400/40 rounded-full blur-[80px]" />
                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5], rotate: [0, -90, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-20%] left-[-10%] w-[35rem] h-[35rem] bg-violet-400/40 rounded-full blur-[90px]" />
                    </>
                ) : (
                    <>
                        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-20%] right-[-10%] w-[25rem] h-[25rem] bg-emerald-400/40 rounded-full blur-[80px]" />
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-[-20%] left-[-10%] w-[25rem] h-[25rem] bg-sky-400/40 rounded-full blur-[80px]" />
                    </>
                )}

                {/* Generate 20 floating particles */}
                {isActive && [...Array(25)].map((_, i) => (
                    <motion.div
                        key={`${mode}-${i}`}
                        className={`absolute rounded-full ${isFocus ? 'bg-fuchsia-400' : 'bg-emerald-400'}`}
                        initial={{
                            x: Math.random() * 800 - 400,
                            y: Math.random() * 800 - 400,
                            scale: Math.random() * 0.5 + 0.5,
                            opacity: 0,
                        }}
                        animate={{
                            y: isFocus ? [Math.random() * 800 - 400, Math.random() * -800 - 400] : [Math.random() * 800 - 400, Math.random() * -400 - 200],
                            x: isFocus ? (Math.random() > 0.5 ? "+=100" : "-=100") : (Math.random() > 0.5 ? "+=50" : "-=50"),
                            opacity: [0, Math.random() * 0.6 + 0.4, 0],
                        }}
                        transition={{
                            duration: isFocus ? (Math.random() * 5 + 5) : (Math.random() * 10 + 10),
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5,
                        }}
                        style={{
                            width: Math.random() * 8 + 4 + "px",
                            height: Math.random() * 8 + 4 + "px",
                            left: "50%",
                            top: "50%",
                            filter: "blur(0.5px)",
                            boxShadow: isFocus ? "0 0 15px rgba(192, 38, 211, 0.8)" : "0 0 15px rgba(52, 211, 153, 0.8)",
                        }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto px-4 relative perspective-1000">
            {renderParticles()}
            <div className={`rounded-[3rem] w-full overflow-hidden transition-all duration-1000 ${containerBg} relative z-10 border shadow-2xl`}>

                {/* Header */}
                <div className={`p-4 flex justify-between items-center border-b transition-colors duration-1000 ${isFocus ? 'bg-violet-50/50 border-violet-100/50' : 'bg-emerald-50/50 border-emerald-100/50'} backdrop-blur-md`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${isActive ? 'animate-pulse' : ''} ${isFocus ? 'bg-violet-500 shadow-violet-500/50' : 'bg-emerald-500'}`}></div>
                        {isFocus ? (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-violet-100 shadow-sm backdrop-blur-md">
                                <Brain size={14} className="text-violet-600" />
                                <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Deep Work</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-emerald-100 shadow-sm backdrop-blur-md">
                                <Coffee size={14} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Rest Mode</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border shadow-sm transition-colors duration-1000 ${isFocus ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/10' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                            <Flame size={14} fill="currentColor" /> {sessionCount}
                        </div>
                        {sessionCount > 0 && (
                            <div className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black tracking-widest bg-violet-50 text-violet-600 border border-violet-100 shadow-sm">
                                ✨ {sessionCount * 10} XP
                            </div>
                        )}
                    </div>
                </div>

                {/* Focus Zone UI & Timer Display Compacted */}
                <div className="px-6 pt-6 pb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-2 relative">
                    
                    {/* Floating Zone Goal Config */}
                    <div className={`absolute top-6 left-6 flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-500 shadow-sm backdrop-blur-md z-30 ${isFocusZoneActive
                        ? isFocus ? 'bg-violet-50 border-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'bg-emerald-50 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                        : 'bg-white/60 border-slate-100/60 hover:bg-white'
                        }`}>
                        <div className={`p-1.5 rounded-lg transition-all duration-500 ${isFocusZoneActive
                            ? isFocus ? 'bg-violet-500 text-white shadow-md' : 'bg-emerald-500 text-white shadow-md'
                            : 'bg-slate-100 text-slate-400'
                            }`}>
                            <Zap size={14} fill={isFocusZoneActive ? "currentColor" : "none"} />
                        </div>
                        <div className="flex flex-col">
                            {isFocusZoneActive ? (
                                <span className={`text-xs font-black tabular-nums ${isFocus ? 'text-violet-700' : 'text-emerald-700'}`}>
                                    {Math.floor(focusZoneTimeLeft / 3600)}h {Math.floor((focusZoneTimeLeft % 3600) / 60)}m left
                                </span>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        className={`w-12 rounded bg-transparent px-1 py-0 text-xs font-black border-b outline-none text-center transition-all ${isFocus ? 'border-violet-200 text-violet-700 focus:border-violet-500' : 'border-emerald-200 text-emerald-700 focus:border-emerald-500'}`}
                                        placeholder="300"
                                        value={focusZoneDuration || ''}
                                        onChange={(e) => setFocusZoneDuration(parseInt(e.target.value) || 0)}
                                    />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MIN GOAL</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={toggleFocusZone}
                            className={`ml-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${isFocusZoneActive
                                ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                                : isFocus ? 'bg-violet-600 text-white shadow-violet-500/30' : 'bg-emerald-500 text-white shadow-emerald-500/30'
                                }`}
                        >
                            {isFocusZoneActive ? 'STOP' : 'START'}
                        </button>
                    </div>
                
                    {isFocus && !isActive && (
                        <div className="absolute top-6 right-6 w-48 animate-in fade-in slide-in-from-top-2 z-30">
                            <select
                                value={selectedTaskId || ''}
                                onChange={(e) => setSelectedTaskId(e.target.value || null)}
                                className={`w-full bg-white/60 backdrop-blur-md rounded-2xl px-3 py-2 text-xs font-black border border-slate-100/60 shadow-sm focus:ring-2 focus:ring-violet-500/30 outline-none appearance-none cursor-pointer transition-colors text-slate-600 hover:bg-white`}
                            >
                                <option value="">-- Focus Task --</option>
                                {tasks.filter(t => t.status !== 'done').map(task => (
                                    <option key={task.id} value={task.id}>{task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Timer SVG Stack */}
                    <div className="mt-20 flex flex-col items-center">
                        {isEditingTime ? (
                            <div className="flex items-center gap-4 animate-in fade-in scale-95 h-[320px] mb-8">
                                <input
                                    type="number"
                                    value={customMinutes}
                                    onChange={(e) => setCustomMinutes(e.target.value)}
                                    className={`text-7xl font-display font-black ${themeColor} w-48 text-center bg-transparent border-b-4 ${isFocus ? 'border-violet-500 shadow-[0_4px_10px_-4px_rgba(139,92,246,0.5)]' : 'border-emerald-500'} focus:outline-none`}
                                    autoFocus
                                />
                                <span className="text-2xl font-bold text-slate-400">min</span>
                                <button
                                    onClick={handleCustomTimeSubmit}
                                    className={`p-4 rounded-3xl text-white shadow-lg shadow-violet-500/20 transition-transform hover:scale-110 ${accentColor}`}
                                >
                                    <Check size={32} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative mb-8 group cursor-pointer flex items-center justify-center p-4 w-[320px] h-[320px]" onDoubleClick={() => !isActive && setIsEditingTime(true)}>
                                {/* New Inline SVG Gamified Ring */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-xl z-10" viewBox="0 0 320 320">
                                    <defs>
                                        <linearGradient id="focusGradient" x1="1" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f43f5e" />   {/* rose-500 */}
                                            <stop offset="100%" stopColor="#8b5cf6" /> {/* violet-500 */}
                                        </linearGradient>
                                        <linearGradient id="breakGradient" x1="1" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34d399" />   {/* emerald-400 */}
                                            <stop offset="100%" stopColor="#0ea5e9" /> {/* sky-500 */}
                                        </linearGradient>
                                        <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="8" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    
                                    {/* Ghost Track */}
                                    <circle
                                        cx="160" cy="160" r="140"
                                        fill="none"
                                        stroke={isFocus ? "rgba(139, 92, 246, 0.08)" : "rgba(16, 185, 129, 0.08)"}
                                        strokeWidth="16"
                                    />
                                    
                                    {/* Primary Progress */}
                                    <motion.circle
                                        cx="160" cy="160" r="140"
                                        fill="none"
                                        stroke={isFocus ? "url(#focusGradient)" : "url(#breakGradient)"}
                                        strokeWidth="16"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 140}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 140 }}
                                        animate={{ strokeDashoffset: (2 * Math.PI * 140) - (progress * (2 * Math.PI * 140)) }}
                                        transition={{ duration: isActive ? 1 : 0.5, ease: "linear" }}
                                    />
                                    
                                    {/* Optical Glow over Progress */}
                                    {isActive && (
                                        <motion.circle
                                            cx="160" cy="160" r="140"
                                            fill="none"
                                            stroke={isFocus ? "url(#focusGradient)" : "url(#breakGradient)"}
                                            strokeWidth="16"
                                            strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 140}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 140 }}
                                            animate={{ strokeDashoffset: (2 * Math.PI * 140) - (progress * (2 * Math.PI * 140)) }}
                                            transition={{ duration: 1, ease: "linear" }}
                                            filter="url(#ringGlow)"
                                            style={{ opacity: 0.6 }}
                                        />
                                    )}
                                </svg>
                                
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`text-6xl font-display font-black tracking-tighter tabular-nums transition-colors duration-500 select-none ${themeColor}`}
                                    >
                                        {formatTime(timeLeft)}
                                    </motion.div>
                                    {!isActive && (
                                        <span className={`text-[10px] font-black uppercase tracking-widest mt-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isFocus ? 'text-violet-500 hover:text-violet-600' : 'text-emerald-500 hover:text-emerald-600'}`} onClick={() => setIsEditingTime(true)}>
                                            <Edit3 size={12} /> Double-Tap
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Presets Row Compacted */}
                        {!isActive && !isEditingTime && (
                            <div className="flex flex-wrap justify-center gap-2 mb-8 z-20 bg-white/60 p-1.5 rounded-3xl border border-white/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] backdrop-blur-md">
                                {isFocus ? (
                                    [25, 45, 60].map(mins => (
                                        <button key={mins} onClick={() => setPreset(mins)} className={`px-4 py-2 rounded-[1.25rem] text-sm font-black transition-all ${config.focusDuration === mins ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>{mins}m</button>
                                    ))
                                ) : (
                                    [5, 10, 15].map(mins => (
                                        <button key={mins} onClick={() => setPreset(mins)} className={`px-4 py-2 rounded-[1.25rem] text-sm font-black transition-all ${config.breakDuration === mins ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>{mins}m</button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Controls Strip Compacted */}
                        <div className="flex items-center gap-3 w-full max-w-[340px] relative z-20">
                            <button
                                onClick={toggleTimer}
                                className={`flex-[2] flex items-center justify-center gap-3 py-5 rounded-[1.5rem] text-white font-black text-lg shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 relative overflow-hidden group ${isActive ? 'bg-amber-500 shadow-amber-500/30' : `${accentColor} ${isFocus ? 'shadow-violet-600/30' : 'shadow-emerald-500/20'}`}`}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity w-full h-full"></div>
                                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                {isActive ? "PAUSE" : (isFocus ? "START FOCUS" : "START BREAK")}
                            </button>

                            {!isActive && isFocus && (
                                <button
                                    onClick={startBreak}
                                    className="flex-1 flex justify-center py-5 rounded-[1.5rem] bg-white text-violet-400 hover:bg-violet-50 hover:text-violet-600 transition-all border border-violet-100/50 shadow-sm shadow-violet-500/5 group"
                                    title="Start Break Immediately"
                                >
                                    <Coffee size={24} className="group-hover:rotate-12 transition-transform" />
                                </button>
                            )}
                            
                            {!isActive && !isFocus && (
                                <button
                                    onClick={skipBreak}
                                    className="flex-1 flex justify-center py-5 rounded-[1.5rem] bg-white text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-emerald-100/50 shadow-sm shadow-emerald-500/5 group"
                                    title="Skip Break"
                                >
                                    <SkipForward size={24} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}

                            <button
                                onClick={resetTimer}
                                className="flex-1 flex justify-center py-5 rounded-[1.5rem] transition-all border shadow-sm bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600 group"
                                title="Reset Timer"
                            >
                                <RotateCcw size={24} className="group-hover:-rotate-90 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <button onClick={() => { setTempConfig(config); setIsSettingsOpen(true); }} className={`absolute bottom-6 right-6 p-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 z-30 ${isFocus ? 'bg-violet-600 text-white shadow-violet-600/30 hover:shadow-violet-600/50' : 'bg-emerald-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50'}`}>
                <Settings size={22} className="group-hover:rotate-90 transition-transform duration-700" />
            </button>
            
        </div>
    );
};
