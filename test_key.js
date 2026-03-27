import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyDiuqtwXIF0k9tdemxFBsuLAVh5ANdBOJY' });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello'
    });
    console.log("SUCCESS:", response.text);
  } catch(e) {
    console.error("FAIL:", e.message);
  }
}
run();
