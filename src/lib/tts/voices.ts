import type { Voice } from '@/types';

type Seed = [id: string, name: string, gender: 'female' | 'male', language: string, region: string, localeCode: string];

/**
 * Complete Kokoro-82M voice catalog as shipped by the ShryneTTS action.
 * Voice id convention: [locale][gender]_[name]
 *   a=American English, b=British English, e=Spanish, f=French, h=Hindi,
 *   i=Italian, j=Japanese, p=Portuguese, z=Chinese
 */
const SEEDS: Seed[] = [
  ['af_alloy', 'Alloy', 'female', 'English', 'United States', 'en-US'],
  ['af_aoede', 'Aoede', 'female', 'English', 'United States', 'en-US'],
  ['af_bella', 'Bella', 'female', 'English', 'United States', 'en-US'],
  ['af_heart', 'Heart', 'female', 'English', 'United States', 'en-US'],
  ['af_jessica', 'Jessica', 'female', 'English', 'United States', 'en-US'],
  ['af_kore', 'Kore', 'female', 'English', 'United States', 'en-US'],
  ['af_nicole', 'Nicole', 'female', 'English', 'United States', 'en-US'],
  ['af_nova', 'Nova', 'female', 'English', 'United States', 'en-US'],
  ['af_river', 'River', 'female', 'English', 'United States', 'en-US'],
  ['af_sarah', 'Sarah', 'female', 'English', 'United States', 'en-US'],
  ['af_sky', 'Sky', 'female', 'English', 'United States', 'en-US'],
  ['am_adam', 'Adam', 'male', 'English', 'United States', 'en-US'],
  ['am_echo', 'Echo', 'male', 'English', 'United States', 'en-US'],
  ['am_eric', 'Eric', 'male', 'English', 'United States', 'en-US'],
  ['am_fenrir', 'Fenrir', 'male', 'English', 'United States', 'en-US'],
  ['am_liam', 'Liam', 'male', 'English', 'United States', 'en-US'],
  ['am_michael', 'Michael', 'male', 'English', 'United States', 'en-US'],
  ['am_onyx', 'Onyx', 'male', 'English', 'United States', 'en-US'],
  ['am_puck', 'Puck', 'male', 'English', 'United States', 'en-US'],
  ['am_santa', 'Santa', 'male', 'English', 'United States', 'en-US'],
  ['bf_alice', 'Alice', 'female', 'English', 'United Kingdom', 'en-GB'],
  ['bf_emma', 'Emma', 'female', 'English', 'United Kingdom', 'en-GB'],
  ['bf_isabella', 'Isabella', 'female', 'English', 'United Kingdom', 'en-GB'],
  ['bf_lily', 'Lily', 'female', 'English', 'United Kingdom', 'en-GB'],
  ['bm_daniel', 'Daniel', 'male', 'English', 'United Kingdom', 'en-GB'],
  ['bm_fable', 'Fable', 'male', 'English', 'United Kingdom', 'en-GB'],
  ['bm_george', 'George', 'male', 'English', 'United Kingdom', 'en-GB'],
  ['bm_lewis', 'Lewis', 'male', 'English', 'United Kingdom', 'en-GB'],
  ['ff_siwis', 'Siwis', 'female', 'French', 'France', 'fr-FR'],
  ['ef_dora', 'Dora', 'female', 'Spanish', 'Spain', 'es-ES'],
  ['em_alex', 'Alex', 'male', 'Spanish', 'Spain', 'es-ES'],
  ['em_santa', 'Santa', 'male', 'Spanish', 'Spain', 'es-ES'],
  ['pf_dora', 'Dora', 'female', 'Portuguese', 'Portugal', 'pt-PT'],
  ['pm_alex', 'Alex', 'male', 'Portuguese', 'Portugal', 'pt-PT'],
  ['pm_santa', 'Santa', 'male', 'Portuguese', 'Portugal', 'pt-PT'],
  ['hf_alpha', 'Alpha', 'female', 'Hindi', 'India', 'hi-IN'],
  ['hf_beta', 'Beta', 'female', 'Hindi', 'India', 'hi-IN'],
  ['if_sara', 'Sara', 'female', 'Italian', 'Italy', 'it-IT'],
  ['im_nicola', 'Nicola', 'male', 'Italian', 'Italy', 'it-IT'],
  ['jf_alpha', 'Alpha', 'female', 'Japanese', 'Japan', 'ja-JP'],
  ['jf_gongitsune', 'Gongitsune', 'female', 'Japanese', 'Japan', 'ja-JP'],
  ['jf_nezumi', 'Nezumi', 'female', 'Japanese', 'Japan', 'ja-JP'],
  ['jf_tebukuro', 'Tebukuro', 'female', 'Japanese', 'Japan', 'ja-JP'],
  ['jm_kumo', 'Kumo', 'male', 'Japanese', 'Japan', 'ja-JP'],
  ['zf_xiaobei', 'Xiaobei', 'female', 'Chinese', 'China', 'zh-CN'],
  ['zf_xiaoni', 'Xiaoni', 'female', 'Chinese', 'China', 'zh-CN'],
  ['zf_xiaoxiao', 'Xiaoxiao', 'female', 'Chinese', 'China', 'zh-CN'],
  ['zf_xiaoyi', 'Xiaoyi', 'female', 'Chinese', 'China', 'zh-CN'],
  ['zm_yunjian', 'Yunjian', 'male', 'Chinese', 'China', 'zh-CN'],
  ['zm_yunxi', 'Yunxi', 'male', 'Chinese', 'China', 'zh-CN'],
  ['zm_yunxia', 'Yunxia', 'male', 'Chinese', 'China', 'zh-CN'],
  ['zm_yunyang', 'Yunyang', 'male', 'Chinese', 'China', 'zh-CN'],
];

export const VOICES: Voice[] = SEEDS.map(([id, name, gender, language, region, localeCode]) => ({
  id,
  name,
  gender,
  language,
  region,
  localeCode,
  prefix: id.slice(0, 1),
  tags: [language.toLowerCase(), localeCode.toLowerCase(), region.toLowerCase().replace(/\s/g, '-')],
}));

export const VOICE_BY_ID: Record<string, Voice> = Object.fromEntries(VOICES.map((v) => [v.id, v]));
export const DEFAULT_VOICE = 'af_sky';

export const LANGUAGES: string[] = Array.from(new Set(VOICES.map((v) => v.language))).sort();

export function voiceLabel(id: string): string {
  const voice = VOICE_BY_ID[id];
  return voice ? `${voice.name} · ${voice.region}` : id;
}

export function voicesForLanguage(language: string): Voice[] {
  return VOICES.filter((v) => v.language === language);
}

export function isValidVoice(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(VOICE_BY_ID, id);
}
