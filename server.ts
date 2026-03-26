import app, { setupApp } from "./api/app.js";

const PORT = 3000;

async function start() {
  await setupApp();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
