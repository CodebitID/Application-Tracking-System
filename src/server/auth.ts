import { Request, Response, NextFunction } from 'express';
import { TRACKER_API_TOKEN } from './config';

/**
 * Authentication Middleware for protected API and Webhook routes.
 * Supports:
 * - Authorization: Bearer <token>
 * - X-API-Key: <token>
 *
 * Strict security guarantees:
 * - Requires process.env.TRACKER_API_TOKEN to be set in environment.
 * - Absolutely no hard-coded fallbacks or default tokens.
 * - Standardized 401 (Unauthorized) and 403 (Forbidden) JSON error responses.
 * - Never returns, echoes, or logs raw secret tokens.
 */
export function requireApiAuth(req: Request, res: Response, next: NextFunction) {
  // Check if TRACKER_API_TOKEN is configured in environment
  const configuredToken = (process.env.TRACKER_API_TOKEN || TRACKER_API_TOKEN || '').trim();

  if (!configuredToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Server authentication is unconfigured. TRACKER_API_TOKEN environment variable must be set in server environment.',
    });
  }

  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];

  let providedToken = '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.substring(7).trim();
  } else if (typeof apiKeyHeader === 'string') {
    providedToken = apiKeyHeader.trim();
  }

  if (!providedToken) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing authentication credentials. Provide "Authorization: Bearer <token>" or "X-API-Key: <token>" header.',
    });
  }

  if (providedToken !== configuredToken) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid API token provided.',
    });
  }

  return next();
}

