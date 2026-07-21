import type { ConnectorItem } from "@meminios/connectors";
import {
  chunkText,
  extractEdges,
  extractEntities,
  hashRawContent,
  sanitizeUntrustedContent,
  type ExtractionDictionary,
} from "@meminios/extraction";

export interface IngestJob {
  tenantId: string;
  connectorId: string;
  item: ConnectorItem;
  dictionary?: ExtractionDictionary;
}

export interface PreparedIngest {
  source: {
    tenantId: string;
    connectorId: string;
    externalId: string;
    sourceSystem: string;
    title: string;
    permalink: string;
    rawContentHash: string;
    sanitizedContent: string;
    injectionFlags: readonly string[];
    acl: ConnectorItem["acl"];
  };
  chunks: ReturnType<typeof chunkText>;
  entities: ReturnType<typeof extractEntities>;
  edges: ReturnType<typeof extractEdges>;
  enqueueEnrichment: true;
}

/** No model route is imported here: this handler is safe for the synchronous write path. */
export async function prepareIngest(job: IngestJob): Promise<PreparedIngest> {
  const sanitized = sanitizeUntrustedContent(job.item.rawContent);
  return {
    source: {
      tenantId: job.tenantId,
      connectorId: job.connectorId,
      externalId: job.item.externalId,
      sourceSystem: job.item.sourceSystem,
      title: job.item.title,
      permalink: job.item.permalink,
      rawContentHash: await hashRawContent(job.item.rawContent),
      sanitizedContent: sanitized.content,
      injectionFlags: sanitized.suspiciousLines.map((line) => `instruction-like-line:${line}`),
      acl: job.item.acl,
    },
    chunks: chunkText(sanitized.content),
    entities: extractEntities(sanitized.content, job.dictionary),
    edges: extractEdges(sanitized.content),
    enqueueEnrichment: true,
  };
}
