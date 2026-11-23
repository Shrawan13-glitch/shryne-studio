import { describe, expect, it } from 'vitest';
import { smartPaste, splitLongText } from '@/lib/tts/smartPaste';
import type { CharacterProfile } from '@/types';

describe('smartPaste', () => {
  it('detects headings and speaker cues', () => {
    const blocks = smartPaste('SCENE 1\n\nNARRATOR: Hello there.\n\nA long paragraph that is spoken plainly.');
    expect(blocks[0]!.type).toBe('heading');
    expect(blocks[1]!.text).toBe('NARRATOR: Hello there.');
    expect(blocks[2]!.type).toBe('line');
  });

  it('assigns a cast voice to detected characters', () => {
    const cast: CharacterProfile[] = [{ id: 'c1', name: 'Narrator', voice: 'am_adam', speed: 0.9, color: '#fff' }];
    const blocks = smartPaste('NARRATOR: Welcome.', cast);
    expect(blocks[0]!.voice).toBe('am_adam');
    expect(blocks[0]!.speed).toBe(0.9);
    expect(blocks[0]!.text).toBe('Welcome.');
  });

  it('splits very long paragraphs into sentences', () => {
    const pieces = splitLongText('First sentence. Second sentence! Third sentence?', 20);
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.join(' ').replace(/\s+/g, ' ').trim()).toContain('Second sentence');
  });
});
