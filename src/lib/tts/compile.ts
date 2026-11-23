import type { Block, CompiledScript, SilenceMarker, TtsItem } from '@/types';
import { DEFAULT_VOICE, isValidVoice } from './voices';

export const MAX_SPEED = 2;
export const MIN_SPEED = 0.5;
export const MAX_ITEM_CHARS = 240;

export function slugify(input: string, maxLength = 42): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .slice(0, maxLength);
  return slug || 'line';
}

export function clampSpeed(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(value * 100) / 100));
}

export function compileScript(
  blocks: Block[],
  batchId: string,
  defaults: { voice: string; speed: number; outputDir: string },
): CompiledScript {
  const items: TtsItem[] = [];
  const silences: SilenceMarker[] = [];
  const warnings: string[] = [];
  const usedNames = new Set<string>();
  let estimatedCharacters = 0;

  blocks.forEach((block, sourceIndex) => {
    if (!block.enabled) return;

    if (block.type === 'silence') {
      const seconds = Math.max(0.1, Math.min(30, block.duration ?? 0.5));
      silences.push({ afterIndex: Math.max(0, items.length - 1), seconds });
      return;
    }

    if (block.type !== 'line') return;

    const text = block.text.replace(/\s+/g, ' ').trim();
    if (!text) return;

    const voice = block.voice && isValidVoice(block.voice) ? block.voice : defaults.voice;
    const speed = clampSpeed(block.speed ?? defaults.speed);

    if (text.length > MAX_ITEM_CHARS) {
      warnings.push(`Line ${sourceIndex + 1} is ${text.length} chars. Under ~${MAX_ITEM_CHARS} sounds best.`);
    }
    if (block.voice && !isValidVoice(block.voice)) {
      warnings.push(`Line ${sourceIndex + 1} uses unknown voice "${block.voice}" — falling back to ${voice}.`);
    }

    const prefix = String(items.length + 1).padStart(4, '0');
    const base = block.filename?.trim() ? slugify(block.filename, 42) : slugify(text, 32);
    let filename = `${prefix}-${base}`;
    let suffix = 2;
    while (usedNames.has(filename)) {
      filename = `${prefix}-${base}-${suffix++}`;
    }
    usedNames.add(filename);

    items.push({ text, voice, speed, filename, sourceIndex });
    estimatedCharacters += text.length;
  });

  if (items.length === 0) {
    warnings.push('No spoken lines are enabled. Add at least one line before generating.');
  }
  if (!isValidVoice(defaults.voice)) {
    warnings.push(`Default voice "${defaults.voice}" is not in the catalog — using ${DEFAULT_VOICE}.`);
  }

  return { batchId, items, silences, warnings, estimatedCharacters };
}

export function compileToActionItems(compiled: CompiledScript): string {
  return JSON.stringify(
    compiled.items.map(({ text, voice, speed, filename }) => ({ text, voice, speed, filename })),
  );
}
