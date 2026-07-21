import { describe, expect, it } from "vitest";
import { GovernedDefinitionsRegistry, effectiveTrustLevel, trustRequirementsMet } from "./index";

describe("skill governance", () => {
  it("requires both steward and admin for autonomous trust", () => {
    expect(
      trustRequirementsMet("autonomous", [
        { role: "steward", principalId: "p1", approvedAt: new Date() },
      ]),
    ).toBe(false);
    expect(
      trustRequirementsMet("autonomous", [
        { role: "steward", principalId: "p1", approvedAt: new Date() },
        { role: "admin", principalId: "p2", approvedAt: new Date() },
      ]),
    ).toBe(true);
  });

  it("auto-demotes stale skills", () => {
    expect(
      effectiveTrustLevel({
        desired: "autonomous",
        expiresAt: new Date("2026-01-01"),
        lastVerifiedAt: new Date("2025-12-01"),
        provenanceMateriallyChanged: false,
        now: new Date("2026-07-21"),
      }),
    ).toBe("reference");
  });

  it("hard-blocks inference for undefined governed terms", () => {
    const registry = new GovernedDefinitionsRegistry([]);
    expect(() => registry.resolve("ARR")).toThrow(/free-form inference is blocked/);
  });
});
