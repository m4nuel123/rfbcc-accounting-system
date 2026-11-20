import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'rfb-db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'RFB Construction System' });
  });

  // Load persisted ERP state
  app.get('/api/state', (_req, res) => {
    try {
      ensureDataDir();
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        res.json({ exists: true, state: JSON.parse(raw) });
        return;
      }
      res.json({ exists: false, state: null });
    } catch (err) {
      console.error('Failed to read ERP state:', err);
      res.status(500).json({ error: 'Failed to read persisted state' });
    }
  });

  // Persist ERP state
  app.put('/api/state', (req, res) => {
    try {
      ensureDataDir();
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        res.status(400).json({ error: 'Invalid state payload' });
        return;
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      res.json({ ok: true, savedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to save ERP state:', err);
      res.status(500).json({ error: 'Failed to save state' });
    }
  });

  // Reset ERP state (removes saved file so client restores defaults)
  app.post('/api/reset', (_req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to reset ERP state:', err);
      res.status(500).json({ error: 'Failed to reset state' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RFB Construction System listening on http://localhost:${PORT}`);
  });
}

startServer();
