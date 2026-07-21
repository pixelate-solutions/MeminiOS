export type EntityType =
  "person" | "company" | "team" | "process" | "system" | "metric" | "policy" | "deal" | "document";

export type EdgeType =
  | "works_at"
  | "reports_to"
  | "owns_process"
  | "approves"
  | "escalates_to"
  | "attended"
  | "mentions"
  | "defines_metric"
  | "supersedes";

export interface ExtractedEntity {
  type: EntityType;
  canonicalName: string;
  mention: string;
  start: number;
  end: number;
  confidence: number;
}

export interface ExtractedEdge {
  type: EdgeType;
  sourceName: string;
  targetName: string;
  confidence: number;
  evidenceText: string;
}

export interface ExtractionDictionary {
  companies?: readonly string[];
  teams?: readonly string[];
  systems?: readonly string[];
  processes?: readonly string[];
  policies?: readonly string[];
  metrics?: readonly string[];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dictionaryEntities(
  content: string,
  type: EntityType,
  values: readonly string[] | undefined,
): ExtractedEntity[] {
  if (!values?.length) return [];
  return values.flatMap((value) => {
    const expression = new RegExp(`\\b${escapeRegex(value)}\\b`, "gi");
    return [...content.matchAll(expression)].map((match) => ({
      type,
      canonicalName: value,
      mention: match[0],
      start: match.index,
      end: match.index + match[0].length,
      confidence: 0.99,
    }));
  });
}

export function extractEntities(
  content: string,
  dictionary: ExtractionDictionary = {},
): ExtractedEntity[] {
  const people = [...content.matchAll(/\b([A-Z][a-z]{1,24})\s+([A-Z][a-z]{1,30})\b/g)]
    .filter((match) => !["Google Drive", "Slack Connect", "New York"].includes(match[0]))
    .map((match) => ({
      type: "person" as const,
      canonicalName: match[0],
      mention: match[0],
      start: match.index,
      end: match.index + match[0].length,
      confidence: 0.84,
    }));
  const emails = [...content.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)].map(
    (match) => ({
      type: "person" as const,
      canonicalName: match[0].toLocaleLowerCase(),
      mention: match[0],
      start: match.index,
      end: match.index + match[0].length,
      confidence: 0.96,
    }),
  );
  const suffixCompanies = [
    ...content.matchAll(
      /\b([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*){0,3})\s+(Labs|Robotics|Systems|Inc\.?|LLC|Ltd\.?)\b/g,
    ),
  ].map((match) => ({
    type: "company" as const,
    canonicalName: match[0],
    mention: match[0],
    start: match.index,
    end: match.index + match[0].length,
    confidence: 0.93,
  }));

  const entities = [
    ...people,
    ...emails,
    ...suffixCompanies,
    ...dictionaryEntities(content, "company", dictionary.companies),
    ...dictionaryEntities(content, "team", dictionary.teams),
    ...dictionaryEntities(content, "system", dictionary.systems),
    ...dictionaryEntities(content, "process", dictionary.processes),
    ...dictionaryEntities(content, "policy", dictionary.policies),
    ...dictionaryEntities(content, "metric", dictionary.metrics),
  ];

  const unique = new Map<string, ExtractedEntity>();
  for (const entity of entities) {
    const key = `${entity.type}:${entity.canonicalName.toLocaleLowerCase()}:${entity.start}`;
    const current = unique.get(key);
    if (!current || current.confidence < entity.confidence) unique.set(key, entity);
  }
  return [...unique.values()].sort((left, right) => left.start - right.start);
}

const edgeRules: readonly { type: EdgeType; expression: RegExp }[] = [
  {
    type: "reports_to",
    expression: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+))\s+reports\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+))/g,
  },
  {
    type: "approves",
    expression: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+))\s+approves?\s+([^.;\n]{3,80})/g,
  },
  {
    type: "owns_process",
    expression: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+))\s+owns?\s+([^.;\n]{3,80})/g,
  },
  {
    type: "escalates_to",
    expression: /([^.;\n]{3,70})\s+escalates?\s+to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+))/g,
  },
  { type: "supersedes", expression: /([^.;\n]{3,70})\s+supersedes?\s+([^.;\n]{3,70})/gi },
] as const;

export function extractEdges(content: string): ExtractedEdge[] {
  return edgeRules.flatMap((rule) =>
    [...content.matchAll(rule.expression)].flatMap((match) => {
      const sourceName = match[1]?.trim();
      const targetName = match[2]?.trim();
      if (!sourceName || !targetName) return [];
      return [
        {
          type: rule.type,
          sourceName,
          targetName,
          confidence: rule.type === "supersedes" ? 0.86 : 0.92,
          evidenceText: match[0],
        },
      ];
    }),
  );
}
