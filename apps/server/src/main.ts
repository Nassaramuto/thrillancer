import { startServer } from "./server.ts";

const running = await startServer().catch((err) => {
  console.error("[server] failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});
const shutdown = () => void running.stop().finally(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
