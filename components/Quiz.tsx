import React, { useState } from "react";
import { CheckCircle, XCircle, RotateCcw, Brain, Lock, Unlock, BookOpen } from "lucide-react";
import { generateQuiz, QuizQuestion } from "../services/flashcardService";
import { Document, DocumentType } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, MathConstants } from "../store/appStore";
import { sounds } from "../utils/sounds";

interface QuizProps {
  documents: Document[];
  addDocument: (title: string, content: string, folderId: string | null, type?: DocumentType) => void;
}

export const Quiz: React.FC<QuizProps> = ({ documents, addDocument }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedDoc, setSelectedDoc] = useState<string>(documents.filter(d => d.type !== 'flashcard_set' && d.type !== 'quiz_set')[0]?.id || "");
  const [viewMode, setViewMode] = useState<'create' | 'saved'>('create');
  const { addXP } = useAppStore();

  const generateNewQuiz = async () => {
    if (!selectedDoc) return;

    setIsLoading(true);
    const doc = documents.find(d => d.id === selectedDoc);
    if (doc) {
      const newQuestions = await generateQuiz([doc], questionCount);
      setQuestions(newQuestions);
      setCurrentIndex(0);
      setSelectedAnswers(new Array(newQuestions.length).fill(null));
      setShowResults(false);
    }
    setIsLoading(false);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    setShowResults(true);
    
    // Calculate correct answers
    const correct = selectedAnswers.reduce((acc: number, answer: number | null, idx: number) => {
      return answer === questions[idx]?.correctAnswer ? acc + 1 : acc;
    }, 0);

    if (correct > 0) {
      addXP(correct * MathConstants.XP_FLASHCARD);
      sounds.playSuccessLevelUp(); // Optional: A nice sound for submitting
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = selectedAnswers[currentIndex];
  const isAnswered = currentAnswer !== null;

  // Calculate score
  const correctAnswers = selectedAnswers.reduce((acc: number, answer: number | null, idx: number) => {
    return answer === questions[idx]?.correctAnswer ? acc + 1 : acc;
  }, 0);

  const score = Math.round((correctAnswers / questions.length) * 100);

  if (questions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto p-8 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-violet-500/10 border border-violet-100/50"
      >
      <div className="flex items-center gap-4 mb-8 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-slate-800 text-3xl tracking-tight">
              Quiz Generator
            </h2>
            <p className="text-slate-500 text-sm font-medium">Test your knowledge and earn XP!</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl">
          <button onClick={() => setViewMode('create')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'create' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}>Create</button>
          <button onClick={() => setViewMode('saved')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'saved' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}>Saved Quizzes</button>
        </div>
      </div>

      {viewMode === 'saved' ? (
        <div className="space-y-4 animate-in fade-in">
          {documents.filter(d => d.type === 'quiz_set').length === 0 ? (
            <p className="text-center text-slate-500 py-12 font-medium bg-slate-50 rounded-2xl border border-slate-100">No saved quizzes yet.</p>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {documents.filter(d => d.type === 'quiz_set').map(doc => (
                 <div key={doc.id} onClick={() => {
                   try {
                     const parsed = JSON.parse(doc.content);
                     setQuestions(parsed);
                     setViewMode('create');
                     setCurrentIndex(0);
                     setSelectedAnswers(new Array(parsed.length).fill(null));
                     setShowResults(false);
                   } catch(e) { alert("Failed to load quiz."); }
                 }} className="p-5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-violet-400 hover:shadow-md transition-all group shadow-sm">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-violet-50 rounded-lg text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors"><Brain size={18} /></div>
                     <h3 className="font-bold text-slate-800 line-clamp-1">{doc.title}</h3>
                   </div>
                   <p className="text-xs text-slate-500 font-medium">Saved on {new Date(doc.created_at).toLocaleDateString()}</p>
                 </div>
               ))}
             </div>
          )}
        </div>
      ) : (
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
                Number of Questions: {questionCount}
              </label>
              <input
                type="range"
                min="3"
                max="15"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateNewQuiz}
            disabled={isLoading || !selectedDoc}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-bold shadow-xl shadow-violet-500/20 disabled:opacity-50 transition-all text-lg flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Questions...
              </span>
             ) : "Start Quiz"}
          </motion.button>

          {documents.filter(d => d.type !== 'flashcard_set' && d.type !== 'quiz_set').length === 0 && (
            <p className="text-center text-slate-500 text-sm font-medium bg-slate-50 p-4 rounded-xl">
              Please add some study documents first to generate quizzes.
            </p>
          )}
        </div>
      )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto p-8 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-violet-500/10 border border-violet-100/50"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
            <Brain size={24} />
          </div>
          <h2 className="font-display font-extrabold text-slate-800 text-3xl tracking-tight">
            Quiz Mode
          </h2>
        </div>
        <span className="text-sm font-bold text-slate-600">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {!showResults ? (
        <div className="space-y-6">
          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-violet-50 to-indigo-50 p-6 rounded-2xl border-2 border-violet-200"
            >
              <h3 className="font-bold text-lg text-slate-800 mb-4">
                {currentQuestion?.question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion?.options.map((option, idx) => {
                  const isCorrect = idx === currentQuestion.correctAnswer;
                  const isSelected = idx === currentAnswer;

                  let bgColor = "bg-white hover:bg-slate-50";
                  let borderColor = "border-slate-200";
                  let textColor = "text-slate-700";

                  if (isSelected && !showResults) {
                    bgColor = "bg-violet-100 hover:bg-violet-150";
                    borderColor = "border-violet-400";
                    textColor = "text-violet-700";
                  }

                  return (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={showResults}
                      className={`w-full p-4 rounded-xl border-2 font-bold transition-all text-left ${bgColor} ${borderColor} ${textColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {option}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition-all"
            >
              ← Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={selectedAnswers.some((a) => a === null)}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2 px-4 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all"
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Next →
              </button>
            )}
          </div>

          {/* Answer status */}
          <div className="flex justify-between text-sm font-bold text-slate-600">
            <span>
              Answered: {selectedAnswers.filter((a) => a !== null).length}/
              {questions.length}
            </span>
            <span>
              {isAnswered ? (
                <span className="text-violet-600 flex items-center gap-1">
                  <Unlock size={14} /> Answered
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <Lock size={14} /> Not answered
                </span>
              )}
            </span>
          </div>
        </div>
      ) : (
        // Results view
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Score card */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-8 rounded-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">
              Your Score
            </p>
            <p className="text-5xl font-display font-extrabold mb-2">{score}%</p>
            <p className="text-base font-medium">
              {correctAnswers} out of {questions.length} correct
            </p>
            <p className="text-sm font-medium mt-4 opacity-90">
              {score >= 80
                ? "🎉 Excellent work!"
                : score >= 60
                  ? "👍 Good job!"
                  : "📚 Keep studying!"}
            </p>
          </div>

          {/* Review answers */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4">Review Your Answers</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {questions.map((q, idx) => {
                const isCorrect = selectedAnswers[idx] === q.correctAnswer;
                return (
                  <div key={q.id} className="border-l-4 border-slate-200 pl-4 py-3">
                    <div className="flex items-start gap-3">
                      <div>
                        {isCorrect ? (
                          <CheckCircle size={20} className="text-green-600" />
                        ) : (
                          <XCircle size={20} className="text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 mb-2">
                          Q{idx + 1}: {q.question}
                        </p>
                        <p className="text-xs text-slate-600">
                          <span className="font-bold">Your answer:</span>{" "}
                          {q.options[selectedAnswers[idx]!] || "Not answered"}
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-green-600 font-bold">
                            Correct: {q.options[q.correctAnswer]}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-2 italic">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                const content = JSON.stringify(questions);
                const docTitle = documents.find(d => d.id === selectedDoc)?.title || 'Custom';
                addDocument(`Quiz: ${docTitle}`, content, null, 'quiz_set');
                alert('Quiz questions saved to Library!');
                setViewMode('saved');
              }}
              className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20 flex justify-center items-center gap-2"
            >
              <BookOpen size={18} /> Save Questions
            </button>
            <button
              onClick={() => {
                setQuestions([]);
                setSelectedAnswers([]);
                setCurrentIndex(0);
              }}
              className="flex-1 bg-slate-200 text-slate-800 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Try Another Quiz
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
