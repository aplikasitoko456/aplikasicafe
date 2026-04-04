import app, { setupApp } from "./app.js";

// Temporary comment to force Git re-detection
export default async (req: any, res: any) => {
  await setupApp();
  return app(req, res);
};
