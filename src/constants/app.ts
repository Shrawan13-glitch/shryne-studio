export const APP_NAME = 'Shryne Studio';
export const STUDIO_REPO_NAME = 'shryne-studio-audio';
export const SCRIPT_DIR = 'scripts';
export const ACTION_REF = 'v1';
export const MIN_SHARDS = 1;
export const MAX_SHARDS = 16;
export const MAX_SPEED = 2;
export const MIN_SPEED = 0.5;
export const POLL_FAST_MS = 2500;
export const POLL_SLOW_MS = 12000;
export const MAX_POLL_MINUTES = 90;

export const TEMPLATES = [
  {
    id: 'podcast',
    name: 'Podcast episode',
    description: 'Alternating host voices with intro and outro.',
    blocks: [
      { type: 'line', text: 'Welcome back to the show.', voice: 'af_bella' },
      { type: 'line', text: 'Today we have a great topic for you.', voice: 'am_adam' },
      { type: 'line', text: 'Let us get straight into it.', voice: 'af_bella' },
    ],
  },
  {
    id: 'audiobook',
    name: 'Audiobook chapter',
    description: 'Slow narration with chapter headings.',
    blocks: [
      { type: 'heading', text: 'CHAPTER ONE' },
      { type: 'line', text: 'It was the best of times, it was the worst of times.', voice: 'am_michael', speed: 0.85 },
      { type: 'silence', text: '', duration: 0.8 },
      { type: 'line', text: 'The age of wisdom, the age of foolishness.', voice: 'am_michael', speed: 0.85 },
    ],
  },
  {
    id: 'explainer',
    name: 'Product explainer',
    description: 'Crisp narrator with emphasis markers as directions.',
    blocks: [
      { type: 'direction', text: 'Upbeat music fades in' },
      { type: 'line', text: 'Meet the fastest way to turn words into speech.', voice: 'af_sky', speed: 1.1 },
      { type: 'line', text: 'Write your script. Pick your voices. Press generate.', voice: 'af_sky', speed: 1.05 },
    ],
  },
  {
    id: 'multilingual',
    name: 'Multilingual reel',
    description: 'One line each in five languages.',
    blocks: [
      { type: 'line', text: 'Hello and welcome.', voice: 'af_bella' },
      { type: 'line', text: 'Bonjour et bienvenue.', voice: 'ff_siwis' },
      { type: 'line', text: 'Hola y bienvenidos.', voice: 'ef_dora' },
      { type: 'line', text: 'Ciao e benvenuti.', voice: 'if_sara' },
      { type: 'line', text: 'नमस्ते और स्वागत है।', voice: 'hf_alpha' },
    ],
  },
] as const;
export const SAMPLE_SCRIPT_ID = 'sample-voice-preview';
