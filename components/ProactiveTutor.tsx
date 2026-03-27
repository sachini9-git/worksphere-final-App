import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { fetchProactiveTutor } from '../services/geminiService';
import { Sparkles, X } from 'lucide-react';

export const ProactiveTutor: React.FC = () => {
    const { tasks, userLevel } = useAppStore();
    const [message, setMessage] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (isDismissed) return;

        let isMounted = true;

        const generateGreeting = async () => {
            try {
                const response = await fetchProactiveTutor(tasks, userLevel, "Student");
                if (isMounted) {
                    setMessage(response);
                    setIsVisible(true);
                }
            } catch (error) {
                console.error("Failed to generate proactive tutor message", error);
            }
        };

        // Wait 3 seconds after dashboard load to not overwhelm the user
        const timeout = setTimeout(() => {
            generateGreeting();
        }, 3000);

        return () => {
            isMounted = false;
            clearTimeout(timeout);
        };
    }, [tasks, userLevel, isDismissed]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => setIsDismissed(true), 500); // Wait for exit animation
    };

    if (isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && message && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="fixed bottom-8 right-8 z-50 max-w-sm w-full p-1"
                >
                    {/* Animated glowing border backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 rounded-3xl blur-md opacity-30 animate-pulse"></div>

                    <div className="relative bg-white/90 backdrop-blur-xl border border-white rounded-[1.5rem] p-5 shadow-2xl flex gap-4">
                        <button 
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="shrink-0 mt-1">
                            <div className="w-10 h-10 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Sparkles size={20} className="text-white" />
                            </div>
                        </div>

                        <div className="flex-1 pr-6 flex flex-col justify-center">
                            <h4 className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">AI Tutor</h4>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
