import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('erica.db');

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  );

  CREATE TABLE IF NOT EXISTS preferences (
    user_id TEXT PRIMARY KEY,
    theme TEXT DEFAULT 'dark',
    voice_enabled BOOLEAN DEFAULT 1,
    notifications_enabled BOOLEAN DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    trigger_time TEXT,
    actions TEXT,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS memory (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    key TEXT,
    value TEXT,
    importance INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'connected' });
  });

  // Example API for preferences
  app.get('/api/preferences/:userId', (req, res) => {
    const row = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(req.params.userId);
    res.json(row || { theme: 'dark', voice_enabled: true });
  });

  // Example API for memory
  app.get('/api/memory/:userId', (req, res) => {
    const rows = db.prepare('SELECT * FROM memory WHERE user_id = ?').all(req.params.userId);
    res.json(rows);
  });

  // Example API for routines
  app.get('/api/routines/:userId', (req, res) => {
    const rows = db.prepare('SELECT * FROM routines WHERE user_id = ?').all(req.params.userId);
    res.json(rows);
  });

  // Chat API for multiple providers
  app.post('/api/chat', async (req, res) => {
    const { model, messages, systemInstruction, provider } = req.body;

    try {
      if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: model,
          max_tokens: 1024,
          system: systemInstruction,
          messages: messages.map((m: any) => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts.map((p: any) => p.text).join('')
          })),
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        return res.json({ text });
      } else if (provider === 'openai') {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: systemInstruction },
            ...messages.map((m: any) => ({
              role: m.role === 'model' ? 'assistant' : 'user',
              content: m.parts.map((p: any) => p.text).join('')
            }))
          ],
        });
        return res.json({ text: response.choices[0].message.content });
      } else {
        // Default to Gemini if not specified or if provider is google
        // Note: For streaming or complex multimodal, we might still want to use the client-side SDK for Gemini
        // but for a unified API, we can implement it here too.
        res.status(400).json({ error: 'Unsupported provider for this endpoint. Use client-side SDK for Gemini or implement here.' });
      }
    } catch (error: any) {
      console.error('Chat API Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      const indexPath = path.join(__dirname, 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        const data = fs.readFileSync(indexPath, 'utf8');
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        const injectedHtml = data.replace(
          '<script>__API_KEY_SCRIPT__</script>',
          `<script>window.process = { env: { GEMINI_API_KEY: "${apiKey}" } };</script>`
        );
        res.send(injectedHtml);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
