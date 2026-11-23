export type Gender = 'female' | 'male';

export interface Voice {
  id: string;
  name: string;
  gender: Gender;
  language: string;
  region: string;
  localeCode: string;
  prefix: string;
  tags: string[];
}

export type BlockType = 'line' | 'heading' | 'direction' | 'comment' | 'silence';

export interface Block {
  id: string;
  type: BlockType;
  text: string;
  voice?: string;
  speed?: number;
  filename?: string;
  /** seconds, only used for silence blocks */
  duration?: number;
  enabled: boolean;
}

export interface CharacterProfile {
  id: string;
  name: string;
  voice: string;
  speed: number;
  color: string;
}

export interface Script {
  id: string;
  title: string;
  blocks: Block[];
  characters: CharacterProfile[];
  defaultVoice: string;
  defaultSpeed: number;
  outputDir: string;
  createdAt: number;
  updatedAt: number;
}

export interface TtsItem {
  text: string;
  voice: string;
  speed: number;
  filename: string;
  /** original block index, used by the app to rebuild order */
  sourceIndex: number;
}

export interface SilenceMarker {
  afterIndex: number;
  seconds: number;
}

export interface CompiledScript {
  batchId: string;
  items: TtsItem[];
  silences: SilenceMarker[];
  warnings: string[];
  estimatedCharacters: number;
}

export interface Shard {
  index: number;
  items: TtsItem[];
}

export interface ShardPlan {
  shards: Shard[];
  /** filename -> global item index */
  order: Record<string, number>;
  strategy: ShardingStrategy;
}

export type ShardingStrategy = 'contiguous' | 'round-robin';

export interface RunConfig {
  batchId: string;
  scriptId: string;
  scriptTitle: string;
  shards: number;
  strategy: ShardingStrategy;
  defaultVoice: string;
  defaultSpeed: number;
  outputDir: string;
  retentionDays: number;
  cleanupAfterDownload: boolean;
  notifyOnFinish: boolean;
  cancelOnFailure: boolean;
}

export type RunState = 'queued' | 'in_progress' | 'success' | 'failure' | 'cancelled' | 'timed_out' | 'skipped';

export interface ShardRun {
  index: number;
  jobId: number | null;
  state: RunState;
  step: string;
  artifactName: string;
  downloaded: boolean;
  attempts: number;
}

export interface GenerationRun {
  id: string;
  batchId: string;
  scriptId: string;
  scriptTitle: string;
  /** Snapshot of exactly what was sent to GitHub, used to rebuild the local library. */
  compiled: CompiledScript;
  repo: string;
  runId: number | null;
  workflowName: string;
  state: RunState;
  shards: ShardRun[];
  createdAt: number;
  updatedAt: number;
  config: RunConfig;
  artifactNames: string[];
  error?: string;
}

export interface AudioAsset {
  id: string;
  batchId: string;
  scriptId: string;
  index: number;
  filename: string;
  text: string;
  voice: string;
  speed: number;
  uri: string;
  size: number;
  durationSeconds: number | null;
  favorite: boolean;
  tags: string[];
  createdAt: number;
}

export interface StudioConfig {
  token: string;
  tokenKind: 'classic' | 'fine-grained';
  login: string;
  repo: string;
  owner: string;
  defaultBranch: string;
  workflowPath: string;
  connectedAt: number;
}
