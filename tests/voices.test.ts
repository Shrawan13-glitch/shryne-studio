import { describe, expect, it } from 'vitest';
import { DEFAULT_VOICE, LANGUAGES, VOICES, VOICE_BY_ID, isValidVoice } from '@/lib/tts/voices';

describe('voice catalog', () => {
  it('contains the full 52-voice catalog', () => {
    expect(VOICES).toHaveLength(52);
    expect(Object.keys(VOICE_BY_ID)).toHaveLength(52);
  });

  it('covers all nine locale prefixes', () => {
    expect(new Set(VOICES.map((v) => v.prefix)).size).toBe(9);
    expect(LANGUAGES).toContain('Hindi');
    expect(LANGUAGES).toContain('Chinese');
  });

  it('exposes the default and rejects unknown voices', () => {
    expect(isValidVoice(DEFAULT_VOICE)).toBe(true);
    expect(isValidVoice('xx_nope')).toBe(false);
  });
});
