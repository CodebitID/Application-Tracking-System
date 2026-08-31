import { Router } from 'express';
import { db } from '../db';

export const healthRouter = Router();

healthRouter.get('/api/health', (req, res) => {
  const isDbConnected = db.isConnected();
  res.json({
    status: isDbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected',
    engine: db.getEngine(),
  });
});
