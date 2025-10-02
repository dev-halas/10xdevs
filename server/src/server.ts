import { PORT } from "./utils/config";
import { buildServer } from "./app";

async function start() {
  const app = buildServer();

  const close = async () => {
    try {
      await app.close();
      app.log.info("Server closed gracefully");
      process.exit(0);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };

  process.on("SIGINT", close);
  process.on("SIGTERM", close);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`API running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
