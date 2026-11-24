import * as FileSystem from 'expo-file-system';
import { unzip } from 'fflate';
import type { AudioAsset, CompiledScript, SilenceMarker, TtsItem } from '@/types';
import { joinWavs, parseWav, wavDurationSeconds, type PcmWav } from '@/lib/tts/wav';
import { uid } from '@/lib/utils/id';

// expo-file-system v19 (SDK 54+) uses the new File/Directory API. The legacy
// documentDirectory + EncodingType constants no longer exist.
// Computed on demand so importing this module never touches the native filesystem.
export function outputRoot(): string {
  return `${FileSystem.Paths.document.uri}audio/`;
}

export async function ensureOutputDir(): Promise<void> {
  const directory = new FileSystem.Directory(outputRoot());
  if (!directory.exists) directory.create({ intermediates: true });
}

async function writeBytes(uri: string, bytes: Uint8Array): Promise<void> {
  new FileSystem.File(uri).write(bytes);
}

async function readBytes(uri: string): Promise<Uint8Array> {
  return new FileSystem.File(uri).bytes();
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
    const uri = `${outputRoot()}${prefix}-${uid('a')}-${filename}`;
    await writeBytes(uri, bytes);
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
    .map((file): AudioAsset | null => {
      const base = file.filename.replace(/\.wav$/i, '');
      const item = itemByFilename.get(base);
      if (!item) return null;
      let duration: number | null = null;
      try {
        duration = wavDurationSeconds(parseWav(file.bytes));
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
      };
    })
    .filter((asset): asset is AudioAsset => asset !== null)
    .sort((a, b) => a.index - b.index);
}

export async function exportMergedWav(assets: AudioAsset[], silences: SilenceMarker[], targetName: string): Promise<string> {
  if (assets.length === 0) throw new Error('Nothing to export');
  const wavs: PcmWav[] = [];
  for (const asset of assets) {
    wavs.push(parseWav(await readBytes(asset.uri)));
  }
  const merged = joinWavs(wavs, silences);
  await ensureOutputDir();
  const uri = `${outputRoot()}${uid('mix')}-${targetName.replace(/[^\w.-]/g, '_')}.wav`;
  await writeBytes(uri, merged);
  return uri;
}

export async function exportZip(assets: AudioAsset[], zipName: string): Promise<string> {
  const { zipSync, strToU8 } = await import('fflate');
  const files: Record<string, Uint8Array> = {};
  for (const asset of assets) {
    files[asset.filename] = await readBytes(asset.uri);
  }
  files['manifest.json'] = strToU8(JSON.stringify(assets.map((a) => ({
    index: a.index, filename: a.filename, text: a.text, voice: a.voice, speed: a.speed,
  })), null, 2));
  const zipped = zipSync(files, { level: 1 });
  await ensureOutputDir();
  const uri = `${outputRoot()}${zipName.replace(/[^\w.-]/g, '_')}.zip`;
  await writeBytes(uri, zipped);
  return uri;
}

export async function deleteUri(uri: string): Promise<void> {
  try {
    new FileSystem.File(uri).delete();
  } catch {
    // best effort
  }
}
