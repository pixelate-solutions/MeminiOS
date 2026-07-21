import { describe, expect, it } from "vitest";
import { CommitmentOpenDetector, DuplicateWorkDetector, runDetectors } from "./index";

const now = new Date("2026-07-21T12:00:00Z");

describe("signal detectors", () => {
  it("finds overdue commitments deterministically", async () => {
    const results = await new CommitmentOpenDetector().detect({
      tenantId: "t1",
      now,
      closedCommitmentFingerprints: new Set(),
      sources: [
        {
          id: "s1",
          tenantId: "t1",
          author: "Maya",
          title: "Orbit thread",
          content: "I’ll send the revised timeline by Friday.",
          createdAt: new Date("2026-07-13T10:00:00Z"),
          updatedAt: new Date("2026-07-13T10:00:00Z"),
        },
      ],
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.type).toBe("commitment_open");
  });

  it("finds similar active work across teams", async () => {
    const body =
      "canonical telemetry event schema durable capture replay service robotics field data";
    const results = await new DuplicateWorkDetector(0.4).detect({
      tenantId: "t1",
      now,
      closedCommitmentFingerprints: new Set(),
      sources: [
        {
          id: "s1",
          tenantId: "t1",
          author: "A",
          title: "Atlas",
          content: body,
          team: "Product",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "s2",
          tenantId: "t1",
          author: "B",
          title: "Replay RFC",
          content: `${body} api`,
          team: "Platform",
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
    expect(results[0]?.type).toBe("duplicate_work");
  });

  it("auto-throttles a noisy detector after enough feedback", async () => {
    const detector = new CommitmentOpenDetector();
    const results = await runDetectors(
      { tenantId: "t1", now, closedCommitmentFingerprints: new Set(), sources: [] },
      [detector],
      { [detector.id]: { useful: 3, dismissed: 7 } },
    );
    expect(results).toEqual([]);
  });
});
