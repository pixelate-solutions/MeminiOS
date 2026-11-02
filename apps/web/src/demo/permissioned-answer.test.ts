import { describe, expect, it } from "vitest";
import { composeAnswerFor, corpus, personas, readableBy } from "./permissioned-answer";

const [cs, sales, finance] = personas as [
  (typeof personas)[number],
  (typeof personas)[number],
  (typeof personas)[number],
];

describe("permission-aware demo answers", () => {
  it("never cites a source the person cannot read", () => {
    for (const person of personas) {
      const { answer } = composeAnswerFor(person);
      for (const paragraph of answer.paragraphs) {
        for (const id of paragraph.citationIds) expect(readableBy(person, id)).toBe(true);
      }
      for (const item of answer.evidence) expect(readableBy(person, item.id)).toBe(true);
    }
  });

  it("gives each role a different, correctly scoped answer", () => {
    expect(composeAnswerFor(cs).answer.paragraphs).toHaveLength(2);
    expect(composeAnswerFor(sales).answer.paragraphs).toHaveLength(3);
    expect(composeAnswerFor(finance).answer.paragraphs).toHaveLength(4);
  });

  it("keeps restricted sources out of every answer for roles without access", () => {
    const restricted = corpus.find((record) => record.groupLabel === "People Ops")!;
    for (const person of personas) {
      const { answer } = composeAnswerFor(person);
      expect(answer.evidence.map((item) => item.id)).not.toContain(restricted.id);
    }
  });

  it("reports how many sources were excluded before synthesis", () => {
    const result = composeAnswerFor(cs);
    expect(result.readable + result.withheldSources).toBe(corpus.length);
    expect(result.withheldSources).toBe(3);
  });
});
