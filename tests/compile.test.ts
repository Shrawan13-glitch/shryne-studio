import { describe, expect, it } from 'vitest';
import type { Block } from '@/types';
import { clampSpeed, compileScript, compileToActionItems, slugify } from '@/lib/tts/compile';

const block = (overrides: Partial<Block> = {}): Block => ({
  id: Math.random().toString(36),
  type: 'line',
  text: 'Hello world',
  speed: 1,
  enabled: true,
  ...overrides,
});

describe('compileScript', () => {
  it('skips non-spoken and disabled blocks but keeps silences', () => {
    const compiled = compileScript([
      block({ type: 'heading', text: 'SCENE 1' }),
      block({ type: 'line', text: 'Spoken', enabled: false }),
      block(),
      block({ type: 'silence', text: '', duration: 1.5 }),
    ], 'b1', { voice: 'af_sky', speed: 1, outputDir: 'tts-output' });

    expect(compiled.items).toHaveLength(1);
    expect(compiled.silences).toHaveLength(1);
    expect(compiled.silences[0]!.seconds).toBe(1.5);
  });

  it('generates stable, ordered, unique filenames', () => {
    const compiled = compileScript([block({ text: 'Hello' }), block({ text: 'Hello' }), block({ filename: 'intro' })], 'b2', {
      voice: 'af_sky', speed: 1, outputDir: 'tts-output',
    });
    expect(compiled.items.map((i) => i.filename)).toEqual(['0001-Hello', '0002-Hello-2', '0003-intro']);
  });

  it('clamps speed and warns about long lines', () => {
    expect(clampSpeed(9)).toBe(2);
    expect(clampSpeed(0.1)).toBe(0.5);
    const compiled = compileScript([block({ text: 'x'.repeat(300) })], 'b3', { voice: 'af_sky', speed: 1, outputDir: 'x' });
    expect(compiled.warnings.some((w) => w.includes('300 chars'))).toBe(true);
  });

  it('produces action-compatible JSON without internal fields', () => {
    const compiled = compileScript([block()], 'b4', { voice: 'af_sky', speed: 1, outputDir: 'x' });
    const parsed = JSON.parse(compileToActionItems(compiled)) as Array<Record<string, unknown>>;
    expect(parsed[0]).toEqual({ text: 'Hello world', voice: 'af_sky', speed: 1, filename: '0001-Hello_world' });
  });

  it('slugifies unicode and punctuation safely', () => {
    expect(slugify('Namaste, duniya!')).toBe('Namaste_duniya');
    expect(slugify('***')).toBe('line');
  });
});
