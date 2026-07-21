import { reciprocalRankFusion, type FusedItem, type RankedItem } from "./rrf";

export interface RetrievalCandidate extends RankedItem {
  sourceRecordId: string;
  content: string;
  vectorScore?: number;
  textScore?: number;
}

export type Reranker<T extends RetrievalCandidate> = (
  query: string,
  candidates: readonly FusedItem<T>[],
) => Promise<readonly FusedItem<T>[]>;

export async function hybridRank<T extends RetrievalCandidate>(options: {
  query: string;
  vectorResults: readonly T[];
  textResults: readonly T[];
  limit?: number;
  rerank?: Reranker<T>;
}): Promise<FusedItem<T>[]> {
  const fused = reciprocalRankFusion([options.vectorResults, options.textResults]);
  const reranked = options.rerank ? await options.rerank(options.query, fused) : fused;
  return [...reranked].slice(0, options.limit ?? 8);
}
