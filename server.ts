import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/summary', async (req, res) => {
  try {
    const { location, phase } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a weather preparedness assistant for Monsoon Ready. Generate a calm, one-paragraph plain-language risk summary for a user in ${location} during the ${phase} phase of a monsoon. Be concise and reassuring.`,
    });
    res.json({ summary: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.post('/api/plan', async (req, res) => {
  try {
    const { profile } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a monsoon preparedness checklist for a household in ${profile.location} with this context: ${profile.context.join(', ')}. Return EXACTLY a JSON array of objects with this structure: [{ "id": "uuid", "task": "Task description", "completed": false, "phase": "Before" | "During" | "After" }]. Make sure there are 2-3 items per phase. Do not use markdown blocks, just raw JSON.`,
    });
    let dataText = response.text || "[]";
    dataText = dataText.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json({ plan: JSON.parse(dataText) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }));
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'system', parts: [{ text: 'You are a helpful, calm, and reassuring monsoon preparedness assistant named Monsoon Ready.' }] },
        ...formattedMessages
      ]
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to chat' });
  }
});

app.post('/api/travel', async (req, res) => {
  try {
    const { destination } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a brief travel advisory for a trip to ${destination} during monsoon season. Provide a calm, realistic assessment assuming current typical monsoon conditions.`,
    });
    res.json({ advisory: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate advisory' });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
