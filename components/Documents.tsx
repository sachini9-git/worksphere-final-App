import React, { useState, useRef } from 'react';
import { Document, Folder, DocumentType } from '../types';
import { FileText, Plus, Search, Upload, Tag, FolderOpen, MoreHorizontal, ChevronRight, LayoutGrid, List, CornerDownRight, Mic, StopCircle, Edit3, Trash2, Bot, Download } from 'lucide-react';
import { summarizeDocument } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import localforage from 'localforage';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocumentsProps {
    documents: Document[];
    folders: Folder[];
    addDocument: (title: string, content: string, folderId: string | null, type?: DocumentType) => void;
    updateDocument: (id: string, title: string, content: string) => void;
    addFolder: (name: string, parentId: string | null) => void;
    deleteDocument: (id: string) => void;
    deleteFolder: (id: string) => void;
}

export const Documents: React.FC<DocumentsProps> = ({ documents, folders, addDocument, updateDocument, addFolder, deleteDocument, deleteFolder }) => {
    const [search, setSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [activeDoc, setActiveDoc] = useState<Document | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Voice Input State
    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summarizedText, setSummarizedText] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const displayedFolders = folders
        .filter(f => f.parent_id === (currentFolderId || null))
        .filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    const displayedDocs = documents
        .filter(d => (d.folder_id === (currentFolderId || null)) || (!d.folder_id && !currentFolderId))
        .filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

    const currentFolder = folders.find(f => f.id === currentFolderId);

    const handleSave = () => {
        if (!newTitle.trim()) return;

        if (isEditing && activeDoc) {
            updateDocument(activeDoc.id, newTitle, newContent);
            setActiveDoc({ ...activeDoc, title: newTitle, content: newContent });
            setIsEditing(false);
        } else {
            addDocument(newTitle, newContent, currentFolderId);
            setIsCreating(false);
        }
        setNewTitle('');
        setNewContent('');
    };

    const handleEdit = () => {
        if (!activeDoc) return;
        setNewTitle(activeDoc.title);
        setNewContent(activeDoc.content);
        setIsEditing(true);
    };

    const handleCreateFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        addFolder(newFolderName, currentFolderId);
        setNewFolderName('');
        setIsCreatingFolder(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const mime = file.type;

        const isBinary = (
            mime === 'application/pdf' ||
            mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mime === 'application/msword' ||
            mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mime === 'application/vnd.ms-excel' ||
            mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            mime === 'application/vnd.ms-powerpoint' ||
            ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'].includes(ext)
        );

        if (isBinary) {
            let docType: DocumentType = 'doc';
            let label = 'Document';
            if (ext === 'pdf' || mime === 'application/pdf') { docType = 'pdf'; label = 'PDF'; }
            else if (['docx', 'doc'].includes(ext)) { docType = 'doc'; label = 'Word Document'; }
            else if (['xlsx', 'xls'].includes(ext)) { docType = 'xlsx'; label = 'Excel Spreadsheet'; }
            else if (['pptx', 'ppt'].includes(ext)) { docType = 'pptx'; label = 'PowerPoint Presentation'; }

            let extractedText = `[${label} — ${file.name}]\n\nFile attached perfectly! 🚀 Click "Edit" above and paste your own study notes here so the AI Tutor can read them.`;

            try {
                if (docType === 'pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                    }
                    if (fullText.trim()) extractedText = fullText;
                } else if (['doc', 'docx'].includes(ext)) {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    if (result.value.trim()) extractedText = result.value;
                } else {
                    extractedText = `[${label} — ${file.name}]\n\nFile attached safely! 🚀 Click "Edit" to paste your own notes here so the AI Tutor can read them.`;
                }
            } catch (err) {
                console.error("Text extraction failed:", err);
            }

            try {
                // Save binary file blob for native downloading later
                await localforage.setItem(`worksphere-file-${file.name}`, file);
            } catch (err) {
                console.error("Failed to store file blob in localforage", err);
            }

            addDocument(file.name, extractedText, currentFolderId, docType);
        } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const text = ev.target?.result as string;
                const type: DocumentType = ext === 'csv' ? 'csv' : 'doc';
                addDocument(file.name, text, currentFolderId, type);
            };
            reader.readAsText(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Voice Dictation Logic
    const startListening = () => {
        setVoiceError(null);

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech Recognition Error:", event.error);
                setVoiceError(event.error === 'not-allowed' ? 'Mic access denied' : 'Error listening');
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
                    setNewContent(prev => {
                        const prefix = prev && !prev.endsWith(' ') ? ' ' : '';
                        return prev + prefix + finalTranscript;
                    });
                }
            };

            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch (e) {
                console.error("Failed to start recognition", e);
                setVoiceError("Failed to start");
            }
        } else {
            alert("Your browser does not support speech recognition. Please try Chrome or Edge.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const handleSummarize = async () => {
        if (!activeDoc) return;
        setIsSummarizing(true);
        try {
            let summary = await summarizeDocument(activeDoc.content);
            summary = summary.replace(/\*\*/g, '');
            summary = summary.replace(/^\s*\*/gm, '•');
            setSummarizedText(summary);
        } catch (error) {
            console.error('Summarization error:', error);
            setSummarizedText('Failed to generate summary. Please try again.');
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="flex h-full gap-8">
            <div className={`flex flex-col h-full transition-all duration-500 ease-in-out ${activeDoc || isCreating ? 'w-4/12' : 'w-full'} bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden relative z-0`}>
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-400/15 rounded-full blur-[100px] pointer-events-none animate-blob -z-10"></div>
                {/* Header / Toolbar */}
                <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-display font-extrabold text-slate-800">Library</h2>
                        <div className="flex gap-1 bg-slate-100/80 p-1.5 rounded-xl">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50/80 border border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-bold hover:shadow-violet-500/40 transition-all shadow-lg shadow-violet-500/20 hover:scale-105 active:scale-95 flex items-center gap-2">
                            <Plus size={20} /> New
                        </button>
                    </div>
                </div>

                {/* Breadcrumbs & Tools */}
                <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center text-sm font-bold text-slate-500">
                        <button onClick={() => setCurrentFolderId(null)} className="hover:text-violet-600 transition-colors">Home</button>
                        {currentFolder && (
                            <>
                                <ChevronRight size={14} className="mx-2 text-slate-300" />
                                <span className="text-slate-800">{currentFolder.name}</span>
                            </>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsCreatingFolder(true)} className="text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
                            + Folder
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors">
                            + Upload
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.md,.json" />
                </div>

                {/* New Folder Input */}
                {isCreatingFolder && (
                    <div className="px-6 py-4 bg-violet-50/50 border-b border-violet-100 animate-in slide-in-from-top-2">
                        <form onSubmit={handleCreateFolder} className="flex gap-3">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Subject Name"
                                className="flex-1 px-4 py-2 text-sm font-medium rounded-xl border border-violet-200 outline-none focus:ring-2 focus:ring-violet-500"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                            />
                            <button type="submit" className="bg-violet-600 text-white px-4 rounded-xl text-sm font-bold shadow-md shadow-violet-500/20 hover:bg-violet-700 transition-colors">Create</button>
                            <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-slate-500 px-2 text-sm font-medium hover:text-slate-700">Cancel</button>
                        </form>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 perspective-[2000px]">
                            <AnimatePresence>
                                {displayedFolders.map((folder, idx) => (
                                    <motion.div key={folder.id} 
                                        onClick={() => setCurrentFolderId(folder.id)}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4, delay: idx * 0.05, type: "spring" }}
                                        whileHover={{ scale: 1.02 }}
                                        className="group relative p-6 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center gap-4"
                                    >
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if (confirm('Delete this folder?')) deleteFolder(folder.id); }}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Folder"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                                            <FolderOpen size={32} className="text-violet-600" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-violet-700">{folder.name}</span>
                                    </motion.div>
                                ))}
                                {displayedDocs.map((doc, idx) => (
                                    <motion.div key={doc.id} 
                                        onClick={() => { setActiveDoc(doc); setIsCreating(false); setIsEditing(false); }}
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.4, delay: (displayedFolders.length + idx) * 0.05, type: "spring" }}
                                        whileHover={{ scale: 1.02 }}
                                        className={`group p-5 bg-white border rounded-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 relative ${activeDoc?.id === doc.id ? 'border-violet-400 ring-2 ring-violet-500/10 shadow-md' : 'border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300'}`}
                                    >
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if (confirm('Delete this document?')) { deleteDocument(doc.id); if (activeDoc?.id === doc.id) setActiveDoc(null); } }}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Document"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <div className="p-2.5 bg-slate-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
                                                <FileText size={20} />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-display font-bold text-slate-800 text-sm line-clamp-2 mb-2 leading-tight group-hover:text-indigo-700">{doc.title}</h4>
                                            <p className="text-[11px] text-slate-500 font-semibold bg-slate-50 inline-block px-2 py-1 rounded-md">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {displayedFolders.map(folder => (
                                <div key={folder.id} onClick={() => setCurrentFolderId(folder.id)}
                                    className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm hover:bg-violet-50/50 rounded-2xl cursor-pointer border border-transparent hover:border-violet-100 transition-all group shadow-sm relative"
                                >
                                    <FolderOpen size={20} className="text-violet-500" />
                                    <span className="flex-1 font-bold text-slate-700">{folder.name}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete this folder?')) deleteFolder(folder.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                                </div>
                            ))}
                            {displayedDocs.map(doc => (
                                <div key={doc.id} onClick={() => { setActiveDoc(doc); setIsCreating(false); setIsEditing(false); }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all shadow-sm relative group ${activeDoc?.id === doc.id ? 'bg-violet-50 border-violet-200' : 'bg-white/80 backdrop-blur-sm border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                                >
                                    <FileText size={20} className="text-indigo-500" />
                                    <span className="flex-1 font-bold text-slate-800">{doc.title}</span>
                                    <span className="text-xs font-medium text-slate-400 mr-2">{new Date(doc.created_at).toLocaleDateString()}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete this document?')) { deleteDocument(doc.id); if (activeDoc?.id === doc.id) setActiveDoc(null); } }}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {displayedFolders.length === 0 && displayedDocs.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full text-center relative z-10"
                        >
                            {/* Animated Mascot popping up */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                                className="relative mb-6"
                            >
                                {/* "Hi!" Speech Bubble */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 0, x: -20, rotate: -15 }}
                                    animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 300, delay: 0.8 }}
                                    className="absolute -top-12 -right-16 bg-white px-4 py-2 rounded-2xl rounded-bl-sm shadow-xl border border-violet-100 font-bold text-violet-600 z-20"
                                >
                                    Hi! 👋
                                </motion.div>

                                <div className="w-24 h-24 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/40 relative group cursor-pointer overflow-hidden transform hover:-translate-y-2 transition-transform">
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                    
                                    {/* Mascot Face */}
                                    <motion.div
                                        animate={{ y: [-2, 2, -2] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                    >
                                        <Bot size={48} className="text-white drop-shadow-md" />
                                    </motion.div>
                                    
                                    {/* Bouncing particles */}
                                    <motion.div animate={{ y: [-10, 10, -10], rotate: 10 }} transition={{ repeat: Infinity, duration: 4 }} className="absolute -top-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg border border-slate-100 z-10">
                                        <FileText size={14} className="text-indigo-400" />
                                    </motion.div>
                                </div>
                            </motion.div>

                            <h3 className="text-2xl font-display font-extrabold text-slate-800 mb-2">This space is empty</h3>
                            <p className="text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
                                I'm ready to help! Upload your files or create a new note to start building your library and generating AI flashcards.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white text-violet-600 border border-violet-100 hover:border-violet-300 font-bold rounded-2xl shadow-sm hover:shadow-xl hover:shadow-violet-200 transition-all hover:-translate-y-1">
                                    Upload File
                                </button>
                                <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all">
                                    Create Note
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Right Panel: Editor / Viewer */}
            {(activeDoc || isCreating || isEditing) && (
                <div className="w-8/12 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-500 z-10 relative">
                    <div className="absolute -bottom-32 left-[20%] w-[500px] h-[500px] bg-fuchsia-400/10 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-4000 z-0"></div>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md relative z-10">
                        <button onClick={() => { setActiveDoc(null); setIsCreating(false); setIsEditing(false); stopListening(); }} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                            Close Panel
                        </button>
                        {activeDoc && !isEditing && (
                            <div className="flex gap-2 items-center">
                                <button onClick={async () => {
                                    try {
                                        const file = await localforage.getItem<File>(`worksphere-file-${activeDoc.title}`);
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = activeDoc.title;
                                            a.click();
                                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                                        } else {
                                            alert('Original file blob not found. Please re-upload this file if you need to download it natively.');
                                        }
                                    } catch (e) { alert('Failed to retrieve file.'); }
                                }} className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full font-bold flex items-center gap-1 border border-emerald-100 hover:bg-emerald-100 transition-colors">
                                    <Download size={12} /> Open / Download
                                </button>
                                <button onClick={handleEdit} className="px-3 py-1 bg-violet-50 text-violet-600 text-xs rounded-full font-bold flex items-center gap-1 border border-violet-100 hover:bg-violet-100 transition-colors">
                                    <Edit3 size={12} /> Edit
                                </button>
                                <button
                                    onClick={handleSummarize}
                                    disabled={isSummarizing}
                                    className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full font-bold flex items-center gap-1 border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSummarizing ? '✓ Generating...' : '✨ Summarize'}
                                </button>
                                <button
                                    onClick={() => { if (confirm('Delete this document?')) { deleteDocument(activeDoc.id); setActiveDoc(null); } }}
                                    className="px-3 py-1 bg-rose-50 text-rose-600 text-xs rounded-full font-bold flex items-center gap-1 border border-rose-100 hover:bg-rose-100 transition-colors"
                                    title="Delete Document"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                                <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs rounded-full font-bold flex items-center gap-1 border border-slate-100"><Tag size={12} /> Notes</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-10 overflow-y-auto relative z-10">
                        {isCreating || isEditing ? (
                            <div className="h-full flex flex-col">
                                <input
                                    type="text"
                                    placeholder="Untitled Note"
                                    className="text-4xl font-display font-extrabold text-slate-800 placeholder-slate-300 outline-none border-none bg-transparent mb-8"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    autoFocus
                                />

                                {/* Editor Toolbar with Voice Mode */}
                                <div className="flex items-center gap-2 mb-4 bg-slate-50/80 p-2 rounded-xl w-fit border border-slate-100">
                                    <button
                                        onClick={isListening ? stopListening : startListening}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isListening
                                                ? 'bg-rose-500 text-white animate-pulse'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm'
                                            }`}
                                        title="Voice Dictation"
                                    >
                                        {isListening ? <StopCircle size={14} /> : <Mic size={14} />}
                                        {isListening ? 'Listening...' : voiceError || 'Dictate'}
                                    </button>
                                </div>

                                <textarea
                                    className="flex-1 w-full resize-none outline-none border-none text-lg text-slate-600 leading-relaxed bg-transparent font-medium p-2 focus:bg-slate-50/50 rounded-xl transition-colors"
                                    placeholder="Start typing or click 'Dictate' to speak..."
                                    value={newContent}
                                    onChange={e => setNewContent(e.target.value)}
                                />
                                <div className="flex justify-end pt-6 border-t border-slate-100">
                                    <button onClick={handleSave} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all">
                                        Save Document
                                    </button>
                                </div>
                            </div>
                        ) : activeDoc && (
                            <div className="prose prose-violet max-w-none">
                                <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2 leading-tight">{activeDoc.title}</h1>
                                <div className="flex items-center gap-3 text-sm text-slate-400 mb-10 pb-6 border-b border-slate-100 font-medium">
                                    <span>Created {new Date(activeDoc.created_at).toLocaleDateString()}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>{activeDoc.content.length} characters</span>
                                </div>
                                {summarizedText && (
                                    <div className="mb-8 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                                        <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                            <span>✨ AI Summary</span>
                                        </h3>
                                        <div className="text-sm text-indigo-800 leading-relaxed whitespace-pre-wrap">
                                            {summarizedText}
                                        </div>
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg font-medium">
                                    {activeDoc.content}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
