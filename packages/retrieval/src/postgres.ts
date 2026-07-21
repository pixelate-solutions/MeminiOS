export interface SqlConnection {
  unsafe<T extends readonly object[] = readonly Record<string, unknown>[]>(
    query: string,
    parameters?: readonly unknown[],
  ): Promise<T>;
}

export interface PostgresSearchResult {
  chunkId: string;
  sourceRecordId: string;
  content: string;
  rrfScore: number;
  vectorRank: number | null;
  textRank: number | null;
}

const HYBRID_SEARCH_SQL = `
WITH vector_ranked AS (
  SELECT id, source_record_id, content,
         row_number() OVER (ORDER BY embedding <=> $2::vector) AS rank
  FROM chunks
  WHERE tenant_id = app.current_tenant_id() AND embedding IS NOT NULL
  ORDER BY embedding <=> $2::vector
  LIMIT $3 * 4
),
text_ranked AS (
  SELECT id, source_record_id, content,
         row_number() OVER (ORDER BY ts_rank_cd(content_tsv, websearch_to_tsquery('english', $1)) DESC) AS rank
  FROM chunks
  WHERE tenant_id = app.current_tenant_id()
    AND content_tsv @@ websearch_to_tsquery('english', $1)
  ORDER BY ts_rank_cd(content_tsv, websearch_to_tsquery('english', $1)) DESC
  LIMIT $3 * 4
),
fused AS (
  SELECT coalesce(v.id, t.id) AS id,
         coalesce(v.source_record_id, t.source_record_id) AS source_record_id,
         coalesce(v.content, t.content) AS content,
         v.rank AS vector_rank,
         t.rank AS text_rank,
         coalesce(1.0 / (60 + v.rank), 0) + coalesce(1.0 / (60 + t.rank), 0) AS rrf_score
  FROM vector_ranked v
  FULL OUTER JOIN text_ranked t ON t.id = v.id
)
SELECT id AS "chunkId", source_record_id AS "sourceRecordId", content,
       rrf_score AS "rrfScore", vector_rank AS "vectorRank", text_rank AS "textRank"
FROM fused
ORDER BY rrf_score DESC, id
LIMIT $3`;

export async function searchPostgres(
  connection: SqlConnection,
  query: string,
  embedding: readonly number[],
  limit = 8,
): Promise<readonly PostgresSearchResult[]> {
  if (!query.trim()) throw new Error("Search query is required");
  if (!embedding.length) throw new Error("Search embedding is required");
  return connection.unsafe<PostgresSearchResult[]>(HYBRID_SEARCH_SQL, [
    query,
    `[${embedding.join(",")}]`,
    limit,
  ]);
}

export interface GraphTraversalResult {
  entityId: string;
  canonicalName: string;
  depth: number;
  path: readonly string[];
}

const GRAPH_TRAVERSAL_SQL = `
WITH RECURSIVE neighborhood AS (
  SELECT e.target_entity_id AS entity_id, 1 AS depth, ARRAY[e.id]::uuid[] AS path
  FROM edges e
  WHERE e.tenant_id = app.current_tenant_id() AND e.source_entity_id = $1::uuid
  UNION ALL
  SELECT e.target_entity_id, n.depth + 1, n.path || e.id
  FROM neighborhood n
  JOIN edges e ON e.tenant_id = app.current_tenant_id() AND e.source_entity_id = n.entity_id
  WHERE n.depth < $2 AND NOT e.id = ANY(n.path)
)
SELECT n.entity_id AS "entityId", en.canonical_name AS "canonicalName", n.depth, n.path
FROM neighborhood n
JOIN entities en ON en.tenant_id = app.current_tenant_id() AND en.id = n.entity_id
ORDER BY n.depth, en.canonical_name`;

/** Edges and entities remain RLS-filtered on every recursive hop. */
export function traverseGraph(
  connection: SqlConnection,
  rootEntityId: string,
  maximumDepth = 3,
): Promise<readonly GraphTraversalResult[]> {
  if (maximumDepth < 1 || maximumDepth > 6) throw new Error("Graph depth must be between 1 and 6");
  return connection.unsafe<GraphTraversalResult[]>(GRAPH_TRAVERSAL_SQL, [
    rootEntityId,
    maximumDepth,
  ]);
}

export const retrievalSql = {
  hybrid: HYBRID_SEARCH_SQL,
  graph: GRAPH_TRAVERSAL_SQL,
} as const;
