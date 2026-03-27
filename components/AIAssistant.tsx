
import React, { useState, useRef, useEffect } from 'react';
import { generateAIResponse } from '../services/geminiService';
import { Document, ChatMessage } from '../types';
import { Send, Bot, User as UserIcon, Loader2, Mic, StopCircle, FileText, Check, X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIAssistantProps {
    documents: Document[];
    history: ChatMessage[];
    addMessage: (msg: ChatMessage) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ documents, history, addMessage }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [history, isLoading, input]); // Auto-scroll on input changes too for dictation

    const startListening = () => {
        setVoiceError(null);

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => {
                // If we wanted to keep listening indefinitely, we'd restart here. 
                // But for now, let's respect the engine stopping (e.g. silence).
                setIsListening(false);
            };
            recognition.onerror = (event: any) => {
                console.error("Mic Error:", event.error);
                if (event.error === 'not-allowed') {
                    setVoiceError("Mic Access Denied");
                } else {
                    setVoiceError("Error: " + event.error);
                }
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setInput(prev => {
                        // Add space if needed
                        const prefix = prev && !prev.endsWith(' ') ? ' ' : '';
                        return prev + prefix + finalTranscript;
                    });
                }
            };

            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch (e) {
                console.error("Start failed", e);
                setVoiceError("Failed to start microphone");
            }
        } else {
            alert("Speech API not supported in this browser.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isLoading) return;

        stopListening(); // Ensure mic stops when sending

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: textToSend,
            timestamp: new Date().toISOString()
        };
        addMessage(userMsg);
        setInput('');
        setIsLoading(true);

        const contextDocs = documents.filter(d => selectedDocIds.includes(d.id));
        const responseText = await generateAIResponse(textToSend, contextDocs);

        const modelMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date().toISOString()
        };
        addMessage(modelMsg);
        setIsLoading(false);
    };

    const toggleDocSelection = (id: string) => {
        setSelectedDocIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    };

    return (
        <div className="flex h-full gap-8">
            {/* Sidebar: Document Context */}
            <div className="w-80 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden hidden lg:flex">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-indigo-50/80 backdrop-blur-md">
                    <h3 className="font-display font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-2 flex items-center gap-2"><FileText size={16} className="text-violet-600" /> Study Context</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Select notes to personalize the AI's answers.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                    {documents.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-2xl">
                            No notes found.<br />Create notes in the Library to use them here.
                        </div>
                    ) : documents.map(doc => (
                        <div
                            key={doc.id}
                            onClick={() => toggleDocSelection(doc.id)}
                            className={`p-4 rounded-2xl cursor-pointer border transition-all duration-200 flex items-start gap-3 group ${selectedDocIds.includes(doc.id) ? 'bg-white border-violet-500 shadow-md ring-1 ring-violet-500' : 'bg-white/50 border-slate-200/60 hover:border-slate-300 hover:bg-white shadow-sm'}`}
                        >
                            <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${selectedDocIds.includes(doc.id) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                                {selectedDocIds.includes(doc.id) ? <Check size={12} strokeWidth={3} /> : <FileText size={12} />}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-bold truncate ${selectedDocIds.includes(doc.id) ? 'text-violet-700' : 'text-slate-700'}`}>{doc.title}</p>
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-medium">{doc.content?.substring(0, 40) || ''}...</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-violet-200/40 border border-white/60 overflow-hidden relative">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 animate-gradient-shift bg-[length:200%_200%] rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] relative">
                             <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl animate-blob"></div>
                            <Sparkles size={24} fill="currentColor" className="relative z-10" />
                        </div>
                        <div>
                            <h3 className="font-display font-extrabold text-slate-800 text-lg">AI Tutor</h3>
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                                </span>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Ready to help</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30">
                    {history.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-80 animate-in fade-in zoom-in-95 duration-500 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-400/10 rounded-full blur-[80px] pointer-events-none animate-blob"></div>
                            <div className="w-24 h-24 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-600 animate-gradient-shift bg-[length:200%_200%] rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(139,92,246,0.3)] relative z-10">
                                <Bot size={48} className="text-white drop-shadow-md" />
                            </div>
                            <h2 className="text-2xl font-display font-extrabold text-slate-800 mb-3">Your Personal Study Partner</h2>
                            <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
                                I can quiz you, summarize your notes, or explain complex topics simply. Just ask!
                            </p>
                        </div>
                    )}

                    {history.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`flex max-w-[85%] lg:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-100 border border-slate-200 text-slate-500' : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/30'}`}>
                                    {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(139,92,246,0.2)]'
                                        : 'bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-200/60 rounded-tl-sm prose prose-sm prose-violet max-w-none shadow-[0_4px_20px_rgb(0,0,0,0.03)]'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                                    ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start animate-in fade-in">
                            <div className="bg-white border border-slate-200/60 px-5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-3 text-violet-600 shadow-sm ml-11">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm font-bold animate-pulse">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white/50 backdrop-blur-md border-t border-slate-100 z-20">
                    {selectedDocIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-2 mt-1.5">Context:</span>
                            {documents.filter(d => selectedDocIds.includes(d.id)).map(d => (
                                <span key={d.id} className="text-xs bg-indigo-50/80 backdrop-blur-sm text-indigo-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-indigo-100 font-bold shadow-sm">
                                    <FileText size={10} /> {d.title} <button onClick={() => toggleDocSelection(d.id)} className="hover:text-indigo-900"><X size={12} /></button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className={`relative flex items-end gap-3 bg-white p-2 rounded-2xl border transition-all duration-300 shadow-sm ${isListening ? 'border-rose-400 ring-4 ring-rose-50' : 'border-slate-200/80 focus-within:ring-4 focus-within:ring-violet-500/10 focus-within:border-violet-400'}`}>
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`p-3 rounded-xl transition-all duration-300 ${isListening ? 'bg-rose-50 text-rose-600 animate-pulse scale-105' : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                            title="Dictate Prompt"
                        >
                            {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                        </button>

                        {voiceError && <span className="absolute -top-8 left-4 text-xs bg-rose-100 text-rose-600 px-2 py-1 rounded-md font-bold animate-bounce">{voiceError}</span>}

                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder={isListening ? "Listening..." : "Ask your tutor anything..."}
                            disabled={isListening && !input} // Allow editing while listening if needed, but typically locking is safer
                            rows={1}
                            className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-2 text-slate-800 placeholder-slate-400 font-medium text-sm resize-none max-h-32"
                        />

                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || (!input.trim() && !isListening)}
                            className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-0.5 shadow-sm focus:ring-2 focus:ring-violet-500/50 outline-none"
                        >
                            <Send size={18} fill="currentColor" className="ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
