import { Router } from 'express';
import { TRACKER_API_TOKEN, APP_URL } from '../config';
import { db } from '../db';

export const webhookRouter = Router();

/**
 * Webhook and API System Configuration
 * GET /api/webhook/config
 */
webhookRouter.get('/api/webhook/config', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = APP_URL || `${protocol}://${host}`;

  res.json({
    status: 'active',
    baseUrl,
    endpoints: {
      ingestJob: `${baseUrl}/api/jobs`,
      checkDuplicate: `${baseUrl}/api/jobs/check-duplicate`,
      chatgptBridge: `${baseUrl}/api/integrations/chatgpt/jobs`,
      health: `${baseUrl}/api/health`,
    },
    isTokenConfigured: Boolean(TRACKER_API_TOKEN),
    database: {
      status: db.isConnected() ? 'connected' : 'degraded',
      engine: db.getEngine(),
    },
    supportedMethods: ['POST'],
    supportedAuthHeaders: ['Authorization: Bearer <TRACKER_API_TOKEN>', 'X-API-Key: <TRACKER_API_TOKEN>'],
    serverTime: new Date().toISOString(),
  });
});

/**
 * Ingestion and System Audit Logs
 * GET /api/webhook/logs
 */
webhookRouter.get('/api/webhook/logs', async (req, res) => {
  try {
    const logs = await db.getWebhookLogs(100);
    // Normalize format for frontend
    const mappedLogs = logs.map((l) => ({
      id: l.id,
      timestamp: l.created_at,
      created_at: l.created_at,
      method: l.method,
      endpoint: l.endpoint,
      source: l.source || undefined,
      companyName: l.company_name || undefined,
      jobTitle: l.job_title || undefined,
      status: l.status,
      statusCode: l.status_code,
      message: l.message,
      jobId: l.job_id || undefined,
      payloadSummary: l.payload_summary || undefined,
    }));

    res.json({
      success: true,
      count: mappedLogs.length,
      logs: mappedLogs,
    });
  } catch (error: any) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
    });
  }
});

/**
 * Clear Ingestion Logs
 * DELETE /api/webhook/logs
 */
webhookRouter.delete('/api/webhook/logs', async (req, res) => {
  try {
    await db.clearWebhookLogs();
    res.json({
      success: true,
      message: 'Audit logs cleared successfully',
    });
  } catch (error: any) {
    console.error('Error clearing webhook logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear logs',
    });
  }
});
