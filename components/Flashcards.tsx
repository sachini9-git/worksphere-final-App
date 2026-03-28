import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { generateFlashcards, Flashcard } from "../services/flashcardService";
import { Document, DocumentType } from "../types";
import { motion } from "framer-motion";

interface FlashcardsProps {
  documents: Document[];
  addDocument: (title: string, content: string, folderId: string | null, type?: DocumentType) => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ documents, addDocument }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string>(documents.filter(d => d.type !== 'flashcard_set' && d.type !== 'quiz_set')[0]?.id || "");
  const [cardCount, setCardCount] = useState(5);
  const [viewMode, setViewMode] = useState<'create' | 'saved'>('create');

  const generateCards = async () => {
    if (!selectedDoc) return;

    setIsLoading(true);
    const doc = documents.find((d) => d.id === selectedDoc);
    if (doc) {
      const cards = await generateFlashcards(doc, cardCount);
      setFlashcards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
    setIsLoading(false);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-8 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-violet-500/10 border border-violet-100/50"
    >
      <div className="flex items-center gap-4 mb-8 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-slate-800 text-3xl tracking-tight">
              Flashcard Study
            </h2>
            <p className="text-slate-500 text-sm font-medium">Master your documents rapidly</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl">
          <button onClick={() => setViewMode('create')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'create' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}>Create</button>
          <button onClick={() => setViewMode('saved')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'saved' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}>Saved Sets</button>
        </div>
      </div>

      {viewMode === 'saved' ? (
        <div className="space-y-4 animate-in fade-in">
          {documents.filter(d => d.type === 'flashcard_set').length === 0 ? (
            <p className="text-center text-slate-500 py-12 font-medium bg-slate-50 rounded-2xl border border-slate-100">No saved flashcard sets yet.</p>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {documents.filter(d => d.type === 'flashcard_set').map(doc => (
                 <div key={doc.id} onClick={() => {
                   try {
                     const parsed = JSON.parse(doc.content);
                     setFlashcards(parsed);
                     setViewMode('create');
                     setCurrentIndex(0);
                     setIsFlipped(false);
                   } catch(e) { alert("Failed to load flashcards."); }
                 }} className="p-5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-violet-400 hover:shadow-md transition-all group shadow-sm">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-violet-50 rounded-lg text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors"><BookOpen size={18} /></div>
                     <h3 className="font-bold text-slate-800 line-clamp-1">{doc.title}</h3>
                   </div>
                   <p className="text-xs text-slate-500 font-medium">Saved on {new Date(doc.created_at).toLocaleDateString()}</p>
                 </div>
               ))}
             </div>
          )}
        </div>
      ) : flashcards.length === 0 ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Select Document
              </label>
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white text-slate-800"
              >
                {documents.filter(d => d.type !== 'flashcard_set' && d.type !== 'quiz_set').map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Number of Cards: {cardCount}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateCards}
            disabled={isLoading || !selectedDoc}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-violet-500/20 disabled:opacity-50 transition-all text-lg flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Cards...
              </span>
             ) : "Generate Flashcards"}
          </motion.button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card */}
          <div
            className="h-80 w-full cursor-pointer relative"
            style={{ perspective: "1000px" }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front of card */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow border-2 border-violet-200"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-center flex flex-col justify-center items-center h-full">
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-3">
                    Question
                  </p>
                  <p className="text-2xl font-bold text-slate-800 leading-relaxed overflow-y-auto max-h-[160px] custom-scrollbar">
                    {currentCard?.question}
                  </p>
                </div>
                <p className="text-xs text-slate-400 absolute bottom-6 font-medium">Click to flip</p>
              </div>

              {/* Back of card */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow border-2 border-indigo-200"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="text-center flex flex-col justify-center items-center h-full">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
                    Answer
                  </p>
                  <p className="text-2xl font-bold text-slate-800 leading-relaxed overflow-y-auto max-h-[160px] custom-scrollbar">
                    {currentCard?.answer}
                  </p>
                </div>
                <p className="text-xs text-slate-400 absolute bottom-6 font-medium">Click to flip back</p>
              </div>
            </motion.div>
          </div>

          {/* Progress and difficulty */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-600">
              Card {currentIndex + 1} of {flashcards.length}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${currentCard?.difficulty === "easy"
                  ? "bg-green-100 text-green-700"
                  : currentCard?.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
            >
              {currentCard?.difficulty}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-xl font-bold hover:bg-violet-200 transition-all"
            >
            <RotateCcw size={18} />
              Restart
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="p-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  const content = JSON.stringify(flashcards);
                  const docTitle = documents.find(d => d.id === selectedDoc)?.title || 'Custom';
                  addDocument(`Flashcards: ${docTitle}`, content, null, 'flashcard_set');
                  alert('Flashcards saved to Library!');
                  setViewMode('saved');
                }}
                className="flex-1 bg-violet-600 text-white py-3 rounded-2xl font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20"
              >
              Save to Library
            </button>
            <button
              onClick={() => setFlashcards([])}
              className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-2xl font-bold hover:bg-slate-300 transition-all"
            >
              Create New Set
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
