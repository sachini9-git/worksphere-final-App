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

/**
 * Checks whether the document content is actually useful study material
 * rather than a placeholder, extraction-failure message, or too-short text.
 */
const isContentUsable = (content: string): boolean => {
  if (!content || content.trim().length < 50) return false;

  const placeholderPatterns = [
    'File attached perfectly',
    'Click "Edit" above and paste',
    'Click Edit above and paste',
    'paste your own study notes',
    'text extraction failed',
    'original PDF content is not available',
    'File attached safely',
    'so the AI Tutor can read them',
  ];

  const lowerContent = content.toLowerCase();
  return !placeholderPatterns.some(pattern => lowerContent.includes(pattern.toLowerCase()));
};

export const generateFlashcards = async (
  document: Document,
  count: number = 5
): Promise<Flashcard[]> => {
  try {
    // Validate that the document has real study content
    if (!isContentUsable(document.content)) {
      console.warn('Flashcard generation skipped: document content is placeholder or too short.');
      alert('This document does not have enough study content. Please open the document, click "Edit", and paste your actual study notes before generating flashcards.');
      return [];
    }

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

    const prompt = `You are an expert educator. Generate exactly ${count} high-quality study flashcards based STRICTLY on the educational content provided below.

CRITICAL RULES:
- Each flashcard must test knowledge of a SPECIFIC fact, concept, or idea found in the material.
- Questions must be clear, direct, and educational — NOT about the format, source, or metadata of the material itself.
- Do NOT generate questions about file types, text extraction, PDFs, or the study material's structure.
- Do NOT reference "the provided study material", "the text", "the document", or "the passage" in your questions. Ask about the SUBJECT MATTER directly.
- Answers must be accurate and concise, drawn directly from the content.
- Vary difficulty levels across easy, medium, and hard.

Return ONLY a valid JSON array with no markdown formatting, no code fences, no extra text. Each object must have exactly these keys: "question", "answer", "difficulty" (one of: "easy", "medium", "hard").

Study Material:
${document.content}`;

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
