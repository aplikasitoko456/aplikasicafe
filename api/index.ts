import app, { setupApp } from "../app";

export default async (req: any, res: any) => {
  await setupApp();
  return app(req, res);
};
