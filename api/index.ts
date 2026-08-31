import app, { initializeServer } from '../server';

export default async function handler(req: any, res: any) {
  await initializeServer();
  return app(req, res);
}
