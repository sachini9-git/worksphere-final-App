import { Document } from "../types";

const getApiUrl = () => {
  if (import.meta.env.PROD) return '/api';
  return import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
};

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  documentId: string;
  createdAt: string;
  difficulty: "easy" | "medium" | "hard";
}

export const generateFlashcards = async (
  document: Document,
  count: number = 5
): Promise<Flashcard[]> => {
  try {
    // Validate that document has content
    if (!document || !document.content || document.content.trim().length < 20) {
      console.warn('Flashcard generation skipped: document content is empty or too short.');
      alert('This document does not have enough study content. Please open the document, click "Edit", and paste your actual study notes before generating flashcards.');
      return [];
    }

    const response = await fetch(`${getApiUrl()}/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document, count })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server error');
    }

    return data.cards || [];
  } catch (e: any) {
    console.error('Flashcard generation error:', e.message);
    if (e.message?.toLowerCase().includes('quota')) {
      alert('🛑 Google API Quota Exceeded. Please generate a new key using a DIFFERENT Google Account.');
      return [];
    }
    if (e.message?.includes('503') || e.message?.toLowerCase().includes('high demand') || e.message?.includes('UNAVAILABLE')) {
      alert('⏳ The AI model is currently experiencing high demand. Please try again in a few moments.');
      return [];
    }
    
    // Attempt to parse out ugly JSON if present
    let cleanMessage = e.message;
    try {
        if (cleanMessage.startsWith('{')) {
            const parsed = JSON.parse(cleanMessage);
            if (parsed.message) cleanMessage = parsed.message;
            else if (parsed.error && parsed.error.message) cleanMessage = parsed.error.message;
        }
    } catch (_) {}

    alert(`Could not generate flashcards: ${cleanMessage}`);
    return [];
  }
};

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const generateQuiz = async (
  documents: Document[],
  questionCount: number = 5
): Promise<QuizQuestion[]> => {
  try {
    // Validate that we have at least one document with content
    if (!documents || documents.length === 0) {
      console.warn('Quiz generation skipped: no documents provided.');
      alert('Please select at least one document before generating a quiz.');
      return [];
    }

    const validDocs = documents.filter(doc => doc.content && doc.content.trim().length > 20);
    if (validDocs.length === 0) {
      console.warn('Quiz generation skipped: no documents with sufficient content.');
      alert('The selected document(s) do not have enough study content. Please open the document, click "Edit", and paste your actual study notes before generating a quiz.');
      return [];
    }

    const response = await fetch(`${getApiUrl()}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: validDocs, questionCount })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server error');
    }

    return data.questions || [];
  } catch (e: any) {
    console.error('Quiz generation error:', e.message);
    if (e.message?.toLowerCase().includes('quota')) {
      alert('🛑 Google API Quota Exceeded. Please generate a new key using a DIFFERENT Google Account.');
      return [];
    }
    if (e.message?.includes('503') || e.message?.toLowerCase().includes('high demand') || e.message?.includes('UNAVAILABLE')) {
      alert('⏳ The AI model is currently experiencing high demand. Please try again in a few moments.');
      return [];
    }
    
    // Attempt to parse out ugly JSON if present
    let cleanMessage = e.message;
    try {
        if (cleanMessage.startsWith('{')) {
            const parsed = JSON.parse(cleanMessage);
            if (parsed.message) cleanMessage = parsed.message;
            else if (parsed.error && parsed.error.message) cleanMessage = parsed.error.message;
        }
    } catch (_) {}

    alert(`Could not generate quiz: ${cleanMessage}`);
    return [];
  }
};
