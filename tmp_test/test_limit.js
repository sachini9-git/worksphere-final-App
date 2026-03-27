import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyAqBK6autlcv4RBP7fUz3_XItpz2JUrDLw'; // from .env
const ai = new GoogleGenAI({ apiKey });

async function test() {
    try {
        console.log("Testing Gemini API...");
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'Hello' });
        console.log("Success:", response.text);
    } catch (e) {
        console.log("Error Status:", e.status);
        console.log("Error Message:", e.message);
    }
}
test();
