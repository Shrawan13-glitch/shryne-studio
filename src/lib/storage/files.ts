import * as FileSystem from 'expo-file-system';
import { unzip } from 'fflate';
import type { AudioAsset, CompiledScript, SilenceMarker, TtsItem } from '@/types';
import { joinWavs, parseWav } from '@/lib/tts/wav';
import { uid } from '@/lib/utils/id';

export const OUTPUT_ROOT = `${FileSystem.documentDirectory ?? ''}audio/`;

export async function ensureOutputDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(OUTPUT_ROOT);
  if (!info.exists) await FileSystem.makeDirectoryAsync(OUTPUT_ROOT, { intermediates: true });
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function unzipToFiles(zip: Uint8Array, prefix: string): Promise<Array<{ filename: string; uri: string; bytes: Uint8Array }>> {
  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(zip, (error, result) => (error ? reject(error) : resolve(result)));
  });
  await ensureOutputDir();
  const written: Array<{ filename: string; uri: string; bytes: Uint8Array }> = [];
  for (const [path, bytes] of Object.entries(entries)) {
    if (bytes.length === 0) continue;
    const filename = path.split('/').pop();
    if (!filename || !filename.toLowerCase().endsWith('.wav')) continue;
    const uri = `${OUTPUT_ROOT}${prefix}-${uid('a')}-${filename}`;
    await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), { encoding: FileSystem.EncodingType.Base64 });
    written.push({ filename, uri, bytes });
  }
  return written;
}

export function buildAssetsFromShard(
  files: Array<{ filename: string; uri: string; bytes: Uint8Array }>,
  compiled: CompiledScript,
  silences: SilenceMarker[],
  batchId: string,
  scriptId: string,
): AudioAsset[] {
  const itemByFilename = new Map<string, TtsItem>(compiled.items.map((item) => [item.filename, item]));
  return files
    .map((file) => {
      const base = file.filename.replace(/\.wav$/i, '');
      const item = itemByFilename.get(base);
      if (!item) return null;
      let duration: number | null = null;
      try {
        duration = parseWav(file.bytes).data.length / 48000;
      } catch {
        duration = null;
      }
      return {
        id: uid('asset'),
        batchId,
        scriptId,
        index: item.sourceIndex,
        filename: file.filename,
        text: item.text,
        voice: item.voice,
        speed: item.speed,
        uri: file.uri,
        size: file.bytes.byteLength,
        durationSeconds: duration,
        favorite: false,
        tags: [item.voice],
        createdAt: Date.now(),
      } satisfies AudioAsset;
    })
    .filter((asset): asset is AudioAsset => asset !== null)
    .sort((a, b) => a.index - b.index);
}

export async function exportMergedWav(assets: AudioAsset[], silences: SilenceMarker[], targetName: string): Promise<string> {
  if (assets.length === 0) throw new Error('Nothing to export');
  const wavs: ReturnType<typeof parseWav>[] = [];
  for (const asset of assets) {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    wavs.push(parseWav(bytes));
  }
  const merged = joinWavs(wavs, silences);
  await ensureOutputDir();
  const uri = `${OUTPUT_ROOT}${uid('mix')}-${targetName.replace(/[^\w.-]/g, '_')}.wav`;
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(merged), { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}

export async function exportZip(assets: AudioAsset[], zipName: string): Promise<string> {
  const { zipSync, strToU8 } = await import('fflate');
  const files: Record<string, Uint8Array> = {};
  for (const asset of assets) {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    files[asset.filename] = bytes;
  }
  files['manifest.json'] = strToU8(JSON.stringify(assets.map((a) => ({
    index: a.index, filename: a.filename, text: a.text, voice: a.voice, speed: a.speed,
  })), null, 2));
  const zipped = zipSync(files, { level: 1 });
  await ensureOutputDir();
  const uri = `${OUTPUT_ROOT}${zipName.replace(/[^\w.-]/g, '_')}.zip`;
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(zipped), { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}

export async function deleteUri(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // best effort
  }
}
