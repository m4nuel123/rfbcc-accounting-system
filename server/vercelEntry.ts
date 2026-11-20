import express, { NextFunction, Request, Response } from 'express';
import { createErpBackendRouter } from './erpBackend';

const app = express();
const router = createErpBackendRouter();

// Mount on both /api and / so Vercel rewrites work regardless of path stripping
app.use('/api', router);
app.use('/', router);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (!res.headersSent) {
    res.status(500).json({ error: message });
  }
});

export default app;
