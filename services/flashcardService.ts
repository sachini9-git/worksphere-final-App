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
 * STRICT validation: rejects any content containing major placeholder phrases.
 */
const isContentUsable = (content: string): boolean => {
  if (!content || content.trim().length < 100) return false;

  const lowerContent = content.toLowerCase();
  
  // CRITICAL: Reject any content that contains placeholder phrases
  // These indicate file extraction failed or user hasn't added real content
  const placeholderPhrases = [
    'click "edit" and paste',
    'click edit and paste',
    'click "edit" above and paste',
    'click edit above and paste',
    'file attached perfectly',
    'file attached safely',
    'paste your own study notes',
    'paste your actual study notes',
    'so the ai tutor can read',
    'text extraction failed',
    'original pdf content is not available',
  ];

  const hasPlaceholder = placeholderPhrases.some(phrase => 
    lowerContent.includes(phrase.toLowerCase())
  );

  if (hasPlaceholder) {
    return false;
  }

  // Content must be substantial (more than just a filename)
  // Reject if it's mostly just the filename/header line
  const lines = content.trim().split('\n');
  const substantialContent = lines.filter(line => line.trim().length > 0).slice(1).join('\n');
  
  if (substantialContent.trim().length < 150) {
    return false;
  }

  return true;
};

export const generateFlashcards = async (
  document: Document,
  count: number = 5,
  showAlert: boolean = true
): Promise<Flashcard[]> => {
  try {
    // Validate that the document has real study content
    if (!isContentUsable(document.content)) {
      console.warn('Flashcard generation skipped: document content is placeholder or too short.');
      if (showAlert) {
        alert('This document does not have enough study content. Please open the document, click "Edit", and paste your actual study notes before generating flashcards.');
      }
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

    let rawText = response.text || '[]';
    const jsonMatch = rawText.match(/\[([\s\S]*)\]/);
    if (jsonMatch) {
      rawText = jsonMatch[0];
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
    // Filter out documents with placeholder/empty content
    const usableDocs = documents.filter(doc => isContentUsable(doc.content));

    if (usableDocs.length === 0) {
      console.warn('Quiz generation skipped: no documents with usable study content.');
      alert('The selected document(s) do not have enough study content. Please open the document, click "Edit", and paste your actual study notes before generating a quiz.');
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

    const contextText = usableDocs.map((doc) => `[${doc.title}]\n${doc.content}`).join('\n\n');
    const prompt = `You are an expert educator creating a multiple-choice quiz. Generate exactly ${questionCount} high-quality quiz questions based STRICTLY on the educational content below.

CRITICAL RULES:
- Each question must test knowledge of a SPECIFIC fact, concept, or idea from the material.
- Questions must be clear, direct, and educational — NOT about the format, source, or metadata of the material.
- Do NOT generate questions about file types, text extraction, PDFs, or the study material's structure.
- Do NOT reference "the provided study material", "the text", "the document", or "the passage" in questions. Ask about the SUBJECT MATTER directly.
- Each question must have exactly 4 options (A, B, C, D) with only ONE correct answer.
- Include a brief explanation for WHY the correct answer is right.
- Vary difficulty across the questions.

Return ONLY a valid JSON array with no markdown formatting, no code fences, no extra text. Each object must have exactly these keys: "question" (string), "options" (array of 4 strings), "correctAnswer" (index 0-3 of correct option), "explanation" (string).

Study Materials:
${contextText}`;

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });

    let rawText = response.text || '[]';
    const jsonMatch = rawText.match(/\[([\s\S]*)\]/);
    if (jsonMatch) {
      rawText = jsonMatch[0];
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
