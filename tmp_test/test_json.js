import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyAqBK6autlcv4RBP7fUz3_XItpz2JUrDLw'; // from .env
const ai = new GoogleGenAI({ apiKey });

async function test() {
    try {
        const prompt = `Generate exactly 2 flashcards.`;
        // testing if fall-back to 1.5-flash circumvents quota limits
        const response = await ai.models.generateContent({ model: 'gemini-1.5-flash', contents: prompt });
        console.log("Success! Text:", response.text);
    } catch (e) {
        console.error("Caught Error:");
        console.log("Status:", e.status);
    }
}
test();
