import { describe, expect, it } from 'vitest';
import type { TtsItem } from '@/types';
import { planShards } from '@/lib/tts/sharding';

const items: TtsItem[] = Array.from({ length: 10 }, (_, i) => ({
  text: `line ${i}`, voice: 'af_sky', speed: 1, filename: `00${i}-line`, sourceIndex: i,
}));

describe('planShards', () => {
  it('keeps contiguous shards in order and covers every item exactly once', () => {
    const plan = planShards(items, 3, 'contiguous');
    expect(plan.shards).toHaveLength(3);
    const flat = plan.shards.flatMap((shard) => shard.items);
    expect(flat).toHaveLength(10);
    expect(new Set(flat.map((item) => item.filename)).size).toBe(10);
    expect(flat.every((item, i) => item.sourceIndex === i)).toBe(true);
  });

  it('round-robin distributes items evenly', () => {
    const plan = planShards(items, 2, 'round-robin');
    expect(plan.shards[0]!.items.map((i) => i.sourceIndex)).toEqual([0, 2, 4, 6, 8]);
    expect(plan.shards[1]!.items.map((i) => i.sourceIndex)).toEqual([1, 3, 5, 7, 9]);
  });

  it('clamps shard count and builds a filename order map', () => {
    const plan = planShards(items, 999, 'contiguous');
    expect(plan.shards).toHaveLength(10);
    expect(plan.order['005-line']).toBe(5);
  });
});
