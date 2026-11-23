import { describe, expect, it } from 'vitest';
import { joinWavs, parseWav, silenceBytes, wavDurationSeconds } from '@/lib/tts/wav';

function makeWav(seconds: number, sampleRate = 24000): Uint8Array {
  const frames = Math.round(seconds * sampleRate);
  const bytes = new Uint8Array(44 + frames * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
  ascii(0, 'RIFF'); view.setUint32(4, 36 + frames * 2, true); ascii(8, 'WAVE');
  ascii(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, 'data'); view.setUint32(40, frames * 2, true);
  return bytes;
}

describe('wav utilities', () => {
  it('parses sample rate and duration', () => {
    const parsed = parseWav(makeWav(2));
    expect(parsed.sampleRate).toBe(24000);
    expect(parsed.channels).toBe(1);
    expect(wavDurationSeconds(parsed)).toBeCloseTo(2, 2);
  });

  it('joins clips and inserts silence in the right position', () => {
    const merged = joinWavs([parseWav(makeWav(1)), parseWav(makeWav(1))], [{ afterIndex: 0, seconds: 1 }]);
    expect(wavDurationSeconds(parseWav(merged))).toBeCloseTo(3, 2);
    expect(silenceBytes(1, 24000, 1, 16)).toHaveLength(48000);
  });

  it('rejects invalid input', () => {
    expect(() => parseWav(new Uint8Array(10))).toThrow('Not a valid WAV');
  });
});
