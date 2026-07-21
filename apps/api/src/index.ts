import { app } from "./app";
import type { Env } from "./env";

export { TenantRealtime } from "./realtime";

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Env, execution: ExecutionContext) {
    execution.waitUntil(
      env.DREAM_QUEUE.send({ kind: "nightly", scheduledAt: new Date().toISOString() }),
    );
  },
} satisfies ExportedHandler<Env>;
