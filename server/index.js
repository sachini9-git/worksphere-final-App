import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure it reads the .env from the root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.SERVER_PORT || 4000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const apiKeySource = process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : (process.env.VITE_GEMINI_API_KEY ? 'VITE_GEMINI_API_KEY' : (process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'NEXT_PUBLIC_GEMINI_API_KEY' : null));

const app = express();
app.use(cors()); // Allow all origins for local development routing
app.use(express.json());

if (!apiKey) {
  console.warn('AI proxy: No Gemini API key found. Set GEMINI_API_KEY in .env (server) to enable AI features.');
} else {
  console.log(`AI proxy: Gemini API key loaded from ${apiKeySource || 'unknown source'}.`);
}

const getAI = () => {
  // Dynamically reload the .env file on every request so developers don't have to restart the server
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
  const freshKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || apiKey;
  
  if (!freshKey) {
    throw new Error("No Gemini API key found in .env");
  }
  return new GoogleGenAI({ apiKey: freshKey });
};

app.post('/api/summarize', async (req, res) => {
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'No content provided' });
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following study notes in concise bullet points, highlighting key concepts and definitions:\n\n${content}`
    });
    res.json({ text: response.text || null });
  } catch (e) {
    console.error('Summarize error:', e.message);
    console.error(e.stack);
    res.status(500).json({ error: 'AI error', details: e.message });
  }
});

app.post('/api/generate', async (req, res) => {
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const { prompt, contextDocuments } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
  try {
    const ai = getAI();
    const contextText = Array.isArray(contextDocuments) && contextDocuments.length > 0
      ? contextDocuments.map(d => `[Document: ${d.title}]\n${d.content}`).join('\n\n')
      : 'No specific documents provided.';

    const systemInstruction = `You are WorkSphere AI, an intelligent and friendly study assistant.\n\nCONTEXT:\n${contextText}\n\nINSTRUCTIONS:\n1. Answer primarily from the documents when possible.\n2. If not found, answer using general knowledge but note that it's outside the provided notes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction }
    });

    res.json({ text: response.text || null });
  } catch (e) {
    console.error('Generate error', e.message);
    res.status(500).json({ error: e.message || 'AI error' });
  }
});

// Flashcards endpoint
app.post('/api/flashcards', async (req, res) => {
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const { document, count } = req.body;
  if (!document) return res.status(400).json({ error: 'No document provided' });
  try {
    const ai = getAI();
    const prompt = `Generate exactly ${count || 5} flashcards from the following study material. Return ONLY a JSON array with no markdown formatting. Each flashcard must have \"question\", \"answer\", and \"difficulty\" (easy/medium/hard) properties. Material:\n\n${document.content}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });

    // Clean markdown code blocks if the model accidentally returns them
    let rawText = response.text || '[]';
    if (rawText.startsWith('```json')) rawText = rawText.replace('```json', '').replace('```', '');
    else if (rawText.startsWith('```')) rawText = rawText.replace(/```/g, '');

    const parsed = JSON.parse(rawText.trim());
    const cards = Array.isArray(parsed) ? parsed.map((card, idx) => ({
      id: `${document.id}-${Date.now()}-${idx}`,
      question: card.question || '',
      answer: card.answer || '',
      documentId: document.id,
      createdAt: new Date().toISOString(),
      difficulty: card.difficulty || 'medium'
    })) : [];
    res.json({ cards });
  } catch (e) {
    console.error('Flashcards error', e.message);
    res.status(500).json({ error: e.message || 'AI error' });
  }
});

// Quiz endpoint
app.post('/api/quiz', async (req, res) => {
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const { documents, questionCount } = req.body;
  if (!Array.isArray(documents) || documents.length === 0) return res.status(400).json({ error: 'No documents provided' });
  try {
    const ai = getAI();
    const contextText = documents.map(d => `[${d.title}]\n${d.content}`).join('\n\n');
    const prompt = `Generate exactly ${questionCount || 5} multiple choice quiz questions from the following study materials. Return ONLY a JSON array with no markdown. Materials:\n\n${contextText}`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });

    // Clean markdown code blocks
    let rawText = response.text || '[]';
    if (rawText.startsWith('```json')) rawText = rawText.replace('```json', '').replace('```', '');
    else if (rawText.startsWith('```')) rawText = rawText.replace(/```/g, '');

    const parsed = JSON.parse(rawText.trim());
    const questions = Array.isArray(parsed) ? parsed.map((q, idx) => ({
      id: `quiz-${Date.now()}-${idx}`,
      question: q.question || '',
      options: q.options || ['', '', '', ''],
      correctAnswer: q.correctAnswer || 0,
      explanation: q.explanation || ''
    })) : [];
    res.json({ questions });
  } catch (e) {
    console.error('Quiz error', e.message);
    res.status(500).json({ error: e.message || 'AI error' });
  }
});

// Schedule endpoints
app.post('/api/optimize-schedule', async (req, res) => {
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const { unscheduledTasks, formattedSchedule, currentTime } = req.body;
  if (!unscheduledTasks || !formattedSchedule) return res.status(400).json({ error: 'Missing schedule data' });
  try {
    const ai = getAI();
    const prompt = `Act as an expert productivity coach. Analyze my daily schedule.

    UNSCHEDULED BACKLOG TASKS: ${JSON.stringify(unscheduledTasks)}
    TODAY'S TIMELINE: ${JSON.stringify(formattedSchedule)}
    CURRENT TIME: ${currentTime || new Date().toLocaleTimeString()}
    
    RULES FOR CRITIQUE:
    1. Provide exactly 2 short, practical sentences.
    2. Be highly specific and mention my actual task names.
    3. If I have High Priority tasks in my backlog but my timeline is empty or full of Low Priority tasks, sternly advise me to switch them.
    4. If my timeline has 3+ tasks back-to-back with no gaps, warn me about cognitive fatigue and suggest a break time.
    5. If everything looks balanced and High Priority tasks are scheduled, give me a highly encouraging hype message.
    DO NOT give generic advice.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: "You are an expert productivity coach." }
    });
    
    res.json({ text: response.text || "Your schedule looks solid!" });
  } catch (e) {
    console.error('Optimize schedule error', e.message);
    res.status(500).json({ error: e.message || 'AI error' });
  }
});

app.post('/api/auto-schedule', async (req, res) => {
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const { relevantTasks } = req.body;
  if (!relevantTasks) return res.status(400).json({ error: 'Missing task data' });
  try {
    const ai = getAI();
    const prompt = `Generate a highly productive daily schedule for today starting at 09:00 and ending by 18:00 using these tasks: ${JSON.stringify(relevantTasks)}.
    
    Return EXACTLY a raw JSON array. DO NOT wrap the array in markdown backticks or \`\`\`json. ONLY return the raw array.
    Each object in the array MUST have these exact string keys:
    "taskId": the exact string id of the task.
    "startTime": a string like "09:00". Always map to the top of the hour (e.g., "10:00", "14:00").
    "endTime": a string like "10:00". Exactly 1 hour after startTime.
    
    Do not schedule multiple tasks for the exact same hour slot. Leave a 1-hour gap for lunch around 12:00.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: "You are a JSON-only return bot. Never output markdown." }
    });
    
    let cleanText = response.text ? response.text.trim() : '[]';
    if (cleanText.startsWith('```json')) {
       cleanText = cleanText.substring(7);
    }
    if (cleanText.startsWith('```')) {
       cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
       cleanText = cleanText.substring(0, cleanText.length - 3);
    }

    const parsed = JSON.parse(cleanText.trim());
    res.json({ schedule: parsed });
  } catch (e) {
    console.error('Auto schedule error', e.message);
    res.status(500).json({ error: e.message || 'AI error' });
  }
});

app.post('/api/proactive-tutor', async (req, res) => {
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });
  const { tasks, level, userName } = req.body;
  
  if (!tasks) return res.status(400).json({ error: 'Missing task data' });
  
  try {
    const ai = getAI();
    const prompt = `Act as an encouraging and highly proactive study tutor. 
    USER NAME: ${userName || "Student"}
    USER LEVEL: ${level || 1}
    CURRENT TASKS: ${JSON.stringify(tasks.filter((t)=> t.status !== 'done'))}
    CURRENT TIME: ${new Date().toLocaleTimeString()}

    RULES:
    1. Output EXACTLY 2-3 short, punchy sentences.
    2. Greet the user by their name warmly.
    3. Analyze their undone tasks and suggest a specific strategy (e.g., "Knock out the high priority [Task Name] first!").
    4. Mention their current Level to hype them up.
    5. Be energetic and friendly! Do not use markdown backticks, just plain text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: "You are a proactive, friendly AI tutor widget." }
    });
    
    res.json({ message: response.text || "Hello! Let's get to work and crush some tasks today!" });
  } catch (e) {
    console.error('Proactive tutor error', e.message);
    res.status(500).json({ error: e.message || 'AI error' });
  }
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// The Vite frontend runs on 5173 on localhost natively...
app.listen(PORT, () => console.log(`AI proxy & Frontend listening on ${PORT}, allowed origin ${ALLOWED_ORIGIN}`));
