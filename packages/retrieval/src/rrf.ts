export interface RankedItem {
  id: string;
  score?: number;
}

export interface FusedItem<T extends RankedItem> {
  item: T;
  score: number;
  ranks: readonly number[];
}

export function reciprocalRankFusion<T extends RankedItem>(
  rankings: readonly (readonly T[])[],
  k = 60,
): FusedItem<T>[] {
  if (k <= 0) throw new Error("RRF k must be positive");
  const accumulator = new Map<string, { item: T; score: number; ranks: number[] }>();
  rankings.forEach((ranking) => {
    const seen = new Set<string>();
    ranking.forEach((item, index) => {
      if (seen.has(item.id)) return;
      seen.add(item.id);
      const current = accumulator.get(item.id) ?? { item, score: 0, ranks: [] };
      current.score += 1 / (k + index + 1);
      current.ranks.push(index + 1);
      accumulator.set(item.id, current);
    });
  });
  return [...accumulator.values()].sort(
    (left, right) => right.score - left.score || left.item.id.localeCompare(right.item.id),
  );
}
