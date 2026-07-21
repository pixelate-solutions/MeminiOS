export type DreamTask =
  | "consolidate"
  | "citation_repair"
  | "staleness_sweep"
  | "acl_resync"
  | "index_maintenance"
  | "digest";

export interface DreamJob {
  tenantId: string;
  runId: string;
  tasks: readonly DreamTask[];
  checkpoint?: { taskIndex: number };
}

export interface DreamTaskRunner {
  run(tenantId: string, task: DreamTask, idempotencyKey: string): Promise<void>;
}

export async function runDreamCycle(
  job: DreamJob,
  runner: DreamTaskRunner,
): Promise<{ complete: boolean; checkpoint: { taskIndex: number } }> {
  let taskIndex = job.checkpoint?.taskIndex ?? 0;
  for (; taskIndex < job.tasks.length; taskIndex += 1) {
    const task = job.tasks[taskIndex];
    if (!task) continue;
    await runner.run(job.tenantId, task, `${job.runId}:${task}`);
  }
  return { complete: true, checkpoint: { taskIndex } };
}
