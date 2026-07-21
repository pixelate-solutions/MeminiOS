import { z } from "zod";

export const roleSchema = z.enum(["admin", "steward", "member", "agent"]);
export type Role = z.infer<typeof roleSchema>;

export const viewerSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  initials: z.string().min(1).max(3),
  role: roleSchema,
  title: z.string(),
});
export type Viewer = z.infer<typeof viewerSchema>;

export const evidenceSourceSchema = z.enum([
  "slack",
  "google-drive",
  "notion",
  "github",
  "calendar",
  "linear",
]);
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;

export const evidenceSchema = z.object({
  id: z.string().uuid(),
  source: evidenceSourceSchema,
  sourceName: z.string(),
  title: z.string(),
  excerpt: z.string(),
  timestamp: z.string().datetime(),
  permalink: z.string().url(),
  author: z.string().optional(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const signalTypeSchema = z.enum([
  "commitment_open",
  "knowledge_stale",
  "customer_risk",
  "duplicate_work",
  "next_action",
]);
export const signalSeveritySchema = z.enum(["critical", "attention", "watch", "positive"]);
export const signalStateSchema = z.enum(["new", "acknowledged", "resolved", "dismissed"]);
export type SignalType = z.infer<typeof signalTypeSchema>;
export type SignalSeverity = z.infer<typeof signalSeveritySchema>;
export type SignalState = z.infer<typeof signalStateSchema>;

export const signalSchema = z.object({
  id: z.string().uuid(),
  type: signalTypeSchema,
  severity: signalSeveritySchema,
  state: signalStateSchema,
  headline: z.string().min(1),
  summary: z.string().min(1),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  occurredAt: z.string().datetime(),
  evidence: z.array(evidenceSchema).min(1),
  affectedEntities: z.array(z.string()),
  primaryAction: z.object({
    label: z.string(),
    intent: z.enum(["nudge", "resolve", "merge", "review", "open"]),
  }),
});
export type Signal = z.infer<typeof signalSchema>;

export const answerParagraphSchema = z.object({
  id: z.string(),
  text: z.string(),
  citationIds: z.array(z.string().uuid()),
});

export const answerSchema = z.object({
  id: z.string().uuid(),
  question: z.string(),
  kicker: z.string(),
  title: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  updatedAt: z.string().datetime(),
  paragraphs: z.array(answerParagraphSchema),
  evidence: z.array(evidenceSchema),
  gap: z.object({
    title: z.string(),
    body: z.string(),
    suggestedExpert: z.string(),
  }),
  followUps: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      answer: z.string(),
      citationIds: z.array(z.string().uuid()),
    }),
  ),
});
export type Answer = z.infer<typeof answerSchema>;

export const trustLevelSchema = z.enum(["reference", "draft_for_approval", "autonomous"]);
export type TrustLevel = z.infer<typeof trustLevelSchema>;

export const skillSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  domain: z.string(),
  trigger: z.string(),
  preconditions: z.array(z.string()),
  steps: z.array(z.string()),
  exceptions: z.array(z.string()),
  escalation: z.string(),
  owner: z.object({ name: z.string(), initials: z.string() }),
  trustLevel: trustLevelSchema,
  freshness: z.number().min(0).max(1),
  version: z.number().int().positive(),
  status: z.enum(["proposed", "in_review", "approved", "retired"]),
  lastVerifiedAt: z.string().datetime(),
  evidence: z.array(evidenceSchema),
});
export type Skill = z.infer<typeof skillSchema>;

export const graphNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["person", "company", "team", "process", "system", "document"]),
  label: z.string(),
  detail: z.string(),
  x: z.number(),
  y: z.number(),
  evidenceCount: z.number().int().nonnegative(),
});
export type GraphNode = z.infer<typeof graphNodeSchema>;

export const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string(),
  since: z.string(),
});
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

export const graphSchema = z.object({
  focusNodeId: z.string(),
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
});
export type Graph = z.infer<typeof graphSchema>;

export const commandSchema = z.object({
  id: z.string(),
  group: z.enum(["Navigate", "Ask", "People", "Skills", "Admin"]),
  label: z.string(),
  hint: z.string(),
  action: z.string(),
});
export type Command = z.infer<typeof commandSchema>;

export const bootstrapSchema = z.object({
  viewer: viewerSchema,
  generatedAt: z.string().datetime(),
  masthead: z.string(),
  signals: z.array(signalSchema),
  featuredAnswer: answerSchema,
  graph: graphSchema,
  skills: z.array(skillSchema),
  commands: z.array(commandSchema),
});
export type Bootstrap = z.infer<typeof bootstrapSchema>;

export const searchRequestSchema = z.object({
  query: z.string().trim().min(2).max(500),
  limit: z.number().int().min(1).max(20).default(8),
});

export const signalFeedbackSchema = z.object({
  state: z.enum(["acknowledged", "resolved", "dismissed"]),
  reason: z.string().trim().min(2).max(240).optional(),
});

export const tenantContextSchema = z.object({
  tenantId: z.string().uuid(),
  principalId: z.string().uuid(),
  role: roleSchema,
});
export type TenantContext = z.infer<typeof tenantContextSchema>;
