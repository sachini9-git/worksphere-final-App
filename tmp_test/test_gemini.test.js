import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const apiKey = process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.error("No API key found in .env");
            return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello',
        });

        console.log("Success! Response:", response.text);
    } catch (e) {
        console.error("API Error:");
        console.error(e);
    }
}
test();
