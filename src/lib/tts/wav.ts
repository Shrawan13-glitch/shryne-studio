/** Utilities for reading and joining 16-bit PCM WAV buffers. Pure JS so it runs on device and in tests. */

export interface PcmWav {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  data: Uint8Array;
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += String.fromCharCode(bytes[offset + i] ?? 0);
  return out;
}

export function parseWav(bytes: Uint8Array): PcmWav {
  if (bytes.length < 44 || readAscii(bytes, 0, 4) !== 'RIFF' || readAscii(bytes, 8, 4) !== 'WAVE') {
    throw new Error('Not a valid WAV file');
  }
  let offset = 12;
  let sampleRate = 24000;
  let channels = 1;
  let bitsPerSample = 16;
  let data: Uint8Array | null = null;

  while (offset + 8 <= bytes.length) {
    const id = readAscii(bytes, offset, 4);
    const size = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true);
    const body = offset + 8;
    if (id === 'fmt ' && body + 16 <= bytes.length) {
      channels = new DataView(bytes.buffer, bytes.byteOffset + body + 2, 2).getUint16(0, true);
      sampleRate = new DataView(bytes.buffer, bytes.byteOffset + body + 4, 4).getUint32(0, true);
      bitsPerSample = new DataView(bytes.buffer, bytes.byteOffset + body + 14, 2).getUint16(0, true);
    } else if (id === 'data') {
      data = bytes.slice(body, Math.min(bytes.length, body + size));
      break;
    }
    offset = body + size + (size % 2);
  }
  if (!data) throw new Error('WAV file has no data chunk');
  return { sampleRate, channels, bitsPerSample, data };
}

export function silenceBytes(seconds: number, sampleRate: number, channels: number, bitsPerSample: number): Uint8Array {
  const bytesPerSample = bitsPerSample / 8;
  return new Uint8Array(Math.round(seconds * sampleRate * channels * bytesPerSample));
}

export function joinWavs(wavs: PcmWav[], silences: Array<{ afterIndex: number; seconds: number }> = []): Uint8Array {
  if (wavs.length === 0) throw new Error('No audio to join');
  const first = wavs[0]!;
  for (const wav of wavs) {
    if (wav.sampleRate !== first.sampleRate || wav.channels !== first.channels || wav.bitsPerSample !== first.bitsPerSample) {
      throw new Error('Cannot join WAVs with different formats');
    }
  }

  const parts: Uint8Array[] = [];
  wavs.forEach((wav, index) => {
    parts.push(wav.data);
    silences
      .filter((s) => s.afterIndex === index)
      .forEach((s) => parts.push(silenceBytes(s.seconds, first.sampleRate, first.channels, first.bitsPerSample)));
  });

  const dataLength = parts.reduce((total, part) => total + part.length, 0);
  const out = new Uint8Array(44 + dataLength);
  const view = new DataView(out.buffer);
  const writeAscii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) out[offset + i] = value.charCodeAt(i);
  };
  const byteRate = first.sampleRate * first.channels * (first.bitsPerSample / 8);
  const blockAlign = first.channels * (first.bitsPerSample / 8);

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, first.channels, true);
  view.setUint32(24, first.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, first.bitsPerSample, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataLength, true);

  let cursor = 44;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

export function wavDurationSeconds(wav: PcmWav): number {
  return wav.data.length / (wav.sampleRate * wav.channels * (wav.bitsPerSample / 8));
}
