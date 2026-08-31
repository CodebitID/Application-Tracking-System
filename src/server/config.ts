import dotenv from 'dotenv';
dotenv.config();

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const PORT = Number(process.env.PORT) || 3000;
export const APP_URL = process.env.APP_URL || (IS_PRODUCTION ? '' : 'http://localhost:3000');
export const TRACKER_API_TOKEN = (process.env.TRACKER_API_TOKEN || '').trim();
export const DATABASE_URL = (process.env.DATABASE_URL || '').trim();
export const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

// Production startup safety check
if (IS_PRODUCTION && !TRACKER_API_TOKEN) {
  console.error('FATAL: TRACKER_API_TOKEN environment variable is required in production.');
  process.exit(1);
} else if (!TRACKER_API_TOKEN) {
  console.warn('⚠️ WARNING: TRACKER_API_TOKEN is not set. REST API requests without a valid token will receive 401 Unauthorized.');
}
