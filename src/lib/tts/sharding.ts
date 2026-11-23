import type { ShardPlan, ShardingStrategy, TtsItem } from '@/types';

export const MAX_SHARDS = 16;

export function planShards(items: TtsItem[], requested: number, strategy: ShardingStrategy): ShardPlan {
  const count = Math.max(1, Math.min(MAX_SHARDS, Math.floor(requested) || 1, items.length || 1));
  const groups: TtsItem[][] = Array.from({ length: count }, () => []);

  if (strategy === 'round-robin') {
    items.forEach((item, i) => groups[i % count]!.push(item));
  } else {
    const size = Math.ceil(items.length / count);
    items.forEach((item, i) => groups[Math.min(count - 1, Math.floor(i / size))]!.push(item));
  }

  const order: Record<string, number> = {};
  items.forEach((item, index) => {
    order[item.filename] = index;
  });

  return {
    shards: groups.map((group, index) => ({ index, items: group })),
    order,
    strategy,
  };
}

export function shardToActionItems(shard: ShardPlan['shards'][number]): string {
  return JSON.stringify(
    shard.items.map(({ text, voice, speed, filename }) => ({ text, voice, speed, filename })),
  );
}

export function estimateRuntimeSeconds(items: TtsItem[], shards: number): number {
  const chars = items.reduce((total, item) => total + item.text.length, 0);
  // ~0.5-2s per sentence on CPU + model setup (~40s warm, ~180s cold) per shard.
  const synth = (chars / 90) * 0.9;
  const setup = 45 * Math.max(1, shards);
  return Math.round(synth + setup);
}
