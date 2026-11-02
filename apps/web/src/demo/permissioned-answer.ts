/**
 * Demo-mode permission-aware retrieval.
 *
 * The fixture corpus below is fictional ("Acme Robotics"). Each source carries
 * an ACL, and answers are composed by running the real `permissionFilter` from
 * `@meminios/retrieval` for the selected person. A passage is only shown when
 * every source it cites is readable, which mirrors the server rule that a
 * Signal or skill is visible only when its complete evidence set is visible.
 * Nothing here calls a model; it is a deterministic fixture.
 */
import type { Answer, Evidence } from "@meminios/shared";
import { demoBootstrap } from "@meminios/shared/demo";
import {
  canReadRecord,
  permissionFilter,
  type AclProtectedRecord,
  type PrincipalAccess,
} from "@meminios/retrieval/permissions";

const TENANT = demoBootstrap.viewer.tenantId;
const base = demoBootstrap.featuredAnswer;
const [pricingDoc, pricingSlack, orgChart] = base.evidence as [Evidence, Evidence, Evidence];

const financeMatrix: Evidence = {
  id: "a0000000-0000-4000-8000-000000000011",
  source: "google-drive",
  sourceName: "Drive · Finance (restricted)",
  title: "FY26 deal approval matrix",
  excerpt:
    "Gross margin floor for EMEA software deals is 62%. Finance reviews anything below it within two business days.",
  timestamp: "2026-07-08T10:15:00.000Z",
  permalink: "https://drive.google.com/",
  author: "Daniel Okafor",
};

const compBands: Evidence = {
  id: "a0000000-0000-4000-8000-000000000012",
  source: "google-drive",
  sourceName: "Drive · People Ops (restricted)",
  title: "Sales compensation plan FY26",
  excerpt: "Discount approvals above 15% reduce the approving VP’s accelerator.",
  timestamp: "2026-06-30T09:00:00.000Z",
  permalink: "https://drive.google.com/",
  author: "People Ops",
};

type CorpusRecord = AclProtectedRecord & { evidence: Evidence; groupLabel: string };

const acl = (
  evidence: Evidence,
  groups: string[],
  groupLabel: string,
  minimumRole?: AclProtectedRecord["minimumRole"],
): CorpusRecord => ({
  id: evidence.id,
  tenantId: TENANT,
  allowPrincipalIds: [],
  allowGroupIds: groups,
  ...(minimumRole ? { minimumRole } : {}),
  evidence,
  groupLabel,
});

/** Sources that match "pricing exceptions in EMEA", with their access lists. */
export const corpus: CorpusRecord[] = [
  acl(pricingDoc, ["sales", "finance", "customer-success"], "Customer-facing teams"),
  acl(pricingSlack, ["sales", "finance"], "Sales, Finance"),
  acl(orgChart, ["all-staff"], "Everyone"),
  acl(financeMatrix, ["finance"], "Finance", "steward"),
  acl(compBands, ["people-ops"], "People Ops", "admin"),
];

export interface DemoPersona {
  id: string;
  name: string;
  initials: string;
  title: string;
  team: string;
  access: PrincipalAccess;
}

const persona = (
  id: string,
  name: string,
  initials: string,
  title: string,
  team: string,
  role: PrincipalAccess["role"],
  groups: string[],
): DemoPersona => ({
  id,
  name,
  initials,
  title,
  team,
  access: { tenantId: TENANT, principalId: id, role, groups: new Set(groups) },
});

export const personas: DemoPersona[] = [
  persona(
    demoBootstrap.viewer.id,
    "Maya Chen",
    "MC",
    "Operations lead",
    "Customer Success",
    "steward",
    ["all-staff", "customer-success"],
  ),
  persona(
    "10000000-0000-4000-8000-000000000003",
    "Elena Rossi",
    "ER",
    "VP, EMEA",
    "Sales",
    "steward",
    ["all-staff", "sales"],
  ),
  persona(
    "10000000-0000-4000-8000-000000000004",
    "Daniel Okafor",
    "DO",
    "Chief financial officer",
    "Finance",
    "admin",
    ["all-staff", "finance"],
  ),
];

const passages: Answer["paragraphs"] = [
  base.paragraphs[0]!,
  base.paragraphs[1]!,
  base.paragraphs[2]!,
  {
    id: "answer-4",
    text: "The current margin floor is 62% gross margin for EMEA software deals. Requests below it go to Finance, which commits to a decision within two business days.",
    citationIds: [financeMatrix.id, pricingDoc.id],
  },
];

export interface PermissionedAnswer {
  answer: Answer;
  searched: number;
  readable: number;
  withheldSources: number;
  withheldPassages: number;
}

export function composeAnswerFor(person: DemoPersona): PermissionedAnswer {
  const visible = permissionFilter(person.access, corpus);
  const visibleIds = new Set(visible.map((record) => record.id));
  const paragraphs = passages.filter((paragraph) =>
    paragraph.citationIds.every((id) => visibleIds.has(id)),
  );
  const cited = new Set(paragraphs.flatMap((paragraph) => paragraph.citationIds));
  const evidence = visible.map((record) => record.evidence).filter((item) => cited.has(item.id));
  const knowsFloor = paragraphs.some((paragraph) => paragraph.id === "answer-4");
  const answer: Answer = {
    ...base,
    confidence: paragraphs.length >= 3 ? "high" : "medium",
    paragraphs,
    evidence,
    gap: knowsFloor
      ? {
          title: "No recorded exception below the floor this year",
          body: "The matrix defines the floor, but there is no cited example of Finance approving a deal under it in FY26. A short note from Finance would make edge-case guidance safer.",
          suggestedExpert: "Daniel Okafor",
        }
      : base.gap,
    followUps: base.followUps.filter((followUp) =>
      followUp.citationIds.every((id) => visibleIds.has(id)),
    ),
  };
  return {
    answer,
    searched: corpus.length,
    readable: visible.length,
    withheldSources: corpus.length - visible.length,
    withheldPassages: passages.length - paragraphs.length,
  };
}

export function readableBy(person: DemoPersona, recordId: string): boolean {
  const record = corpus.find((item) => item.id === recordId);
  return record ? canReadRecord(person.access, record) : false;
}
