import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please update your API key in the App Settings.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post('/api/generate', async (req, res) => {
    try {
      const { model = 'gemini-3.5-flash', contents, config } = req.body;
      const ai = getAi();
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Generation error:', error);
      let errorMessage = error.message || 'Internal Server Error';
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key')) {
        errorMessage = 'Invalid Gemini API Key. Please update your API key in the App Settings.';
      }
      res.status(500).json({ error: { message: errorMessage } });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { history, message } = req.body;
      const ai = getAi();
      const chat = ai.chats.create({
        model: 'gemini-3.5-flash',
        config: {
          systemInstruction: 'You are sohdAI.com, an advanced AI assistant capable of helping with text, images, video, games, and animation. You are helpful, creative, and concise.',
        },
        history: history || []
      });
      
      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Chat error:', error);
      let errorMessage = error.message || 'Internal Server Error';
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key')) {
        errorMessage = 'Invalid Gemini API Key. Please update your API key in the App Settings.';
      }
      res.status(500).json({ error: { message: errorMessage } });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
