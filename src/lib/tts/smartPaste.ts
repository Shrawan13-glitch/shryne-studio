import type { Block, CharacterProfile } from '@/types';
import { slugify } from './compile';

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SPEAKER_LINE = /^\s*([A-Z][A-Za-z0-9 .'-]{0,28})\s*(?::|\s[-–—]\s)\s*(.+)$/;
const HEADING = /^\s*(SCENE|ACT|CHAPTER|INT\.|EXT\.|#)\b/i;

/** Turn a large pasted script into editor blocks, detecting speaker cues and splitting long paragraphs. */
export function smartPaste(raw: string, characters: CharacterProfile[] = []): Block[] {
  const paragraphs = raw
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const byName = new Map(characters.map((c) => [c.name.toLowerCase(), c]));
  const blocks: Block[] = [];

  for (const paragraph of paragraphs) {
    const headingMatch = paragraph.match(HEADING);
    if (headingMatch && paragraph.length < 120) {
      blocks.push({ id: newId('blk'), type: 'heading', text: paragraph, enabled: true });
      continue;
    }

    const speakerMatch = paragraph.match(SPEAKER_LINE);
    let text = paragraph;
    let voice: string | undefined;
    let speed: number | undefined;

    if (speakerMatch?.[1] && speakerMatch[2]) {
      const name = speakerMatch[1].trim();
      text = speakerMatch[2].trim();
      const profile = byName.get(name.toLowerCase());
      if (profile) {
        voice = profile.voice;
        speed = profile.speed;
      } else {
        text = `${name}: ${text}`;
      }
    }

    for (const piece of splitLongText(text)) {
      blocks.push({
        id: newId('blk'),
        type: 'line',
        text: piece,
        voice,
        speed,
        filename: slugify(piece, 28),
        enabled: true,
      });
    }
  }
  return blocks;
}

export function splitLongText(text: string, maxChars = 220): string[] {
  if (text.length <= maxChars) return [text];
  const sentences = text.match(/[^.!?।。！？]+[.!?।。！？]*\s*/g) ?? [text];
  const result: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars && current) {
      result.push(current.trim());
      current = '';
    }
    current += sentence;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}
