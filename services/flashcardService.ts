import { Document } from "../types";
import { GoogleGenAI } from '@google/genai';

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
    let apiKey = '';

    // Safely check for import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
    } else if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    }

    if (!apiKey) {
      console.error("VITE_GEMINI_API_KEY is missing.");
      return [];
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Generate exactly ${count} flashcards from the following study material. Return ONLY a JSON array with no markdown formatting. Each flashcard must have \"question\", \"answer\", and \"difficulty\" (easy/medium/hard) properties. Material:\n\n${document.content}`;

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });

    // Clean markdown code blocks if the model accidentally returns them
    let rawText = response.text || '[]';
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace('```json', '').replace('```', '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/```/g, '');
    }

    const parsed = JSON.parse(rawText.trim());
    if (!Array.isArray(parsed)) return [];

    return parsed.map((card: any, idx: number) => ({
      id: `${document.id}-${Date.now()}-${idx}`,
      question: card.question || '',
      answer: card.answer || '',
      documentId: document.id,
      createdAt: new Date().toISOString(),
      difficulty: card.difficulty || 'medium'
    }));
  } catch (e) {
    console.error('AI flashcard generation error:', e);
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
    let apiKey = '';

    // Safely check for import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
    } else if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    }

    if (!apiKey) {
      console.error("VITE_GEMINI_API_KEY is missing.");
      return [];
    }

    const ai = new GoogleGenAI({ apiKey });

    const contextText = documents.map((doc) => `[${doc.title}]\n${doc.content}`).join('\n\n');
    const prompt = `Generate exactly ${questionCount} multiple choice quiz questions from the following study materials. Return ONLY a JSON array with no markdown. Materials:\n\n${contextText}`;

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });

    // Clean markdown code blocks
    let rawText = response.text || '[]';
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace('```json', '').replace('```', '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/```/g, '');
    }

    const parsed = JSON.parse(rawText.trim());
    if (!Array.isArray(parsed)) return [];

    return parsed.map((q: any, idx: number) => ({
      id: `quiz-${Date.now()}-${idx}`,
      question: q.question || '',
      options: q.options || ['', '', '', ''],
      correctAnswer: q.correctAnswer || 0,
      explanation: q.explanation || ''
    }));
  } catch (e) {
    console.error('AI quiz generation error:', e);
    return [];
  }
};
