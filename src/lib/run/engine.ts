import * as Notifications from 'expo-notifications';
import type {
  AudioAsset, CompiledScript, GenerationRun, RunConfig, ShardRun, StudioConfig,
} from '@/types';
import { listArtifacts, downloadArtifactZip } from '@/lib/github/artifacts';
import { GithubClient } from '@/lib/github/client';
import { getFileSha, putFile } from '@/lib/github/repo';
import { WORKFLOW_FILE } from '@/lib/github/workflow';
import { isTerminal, mapConclusion, type WorkflowJob, type WorkflowRun } from '@/lib/github/types';
import { SCRIPT_DIR } from '@/constants/app';
import { buildAssetsFromShard, deleteUri, unzipToFiles } from '@/lib/storage/files';
import { getRun, listAssets, saveAsset, saveRun } from '@/lib/storage/db';
import { batchId, uid } from '@/lib/utils/id';
import { logger } from '@/lib/utils/logger';

const TAG = 'engine';

function client(config: StudioConfig): GithubClient {
  return new GithubClient(config.token);
}

export interface StartRunResult {
  run: GenerationRun;
  compiled: CompiledScript;
}

/** Commit the compiled script, dispatch the workflow, and discover the resulting run id. */
export async function startRun(config: StudioConfig, scriptId: string, scriptTitle: string, compiled: CompiledScript, runConfig: RunConfig): Promise<StartRunResult> {
  const api = client(config);
  const path = `${SCRIPT_DIR}/${compiled.batchId}.json`;
  const branch = config.defaultBranch;
  const sha = await getFileSha(api, config.repo, path, branch);
  await putFile(
    api,
    config.repo,
    path,
    JSON.stringify(compiled.items),
    branch,
    `tts(batch): ${compiled.batchId}`,
    sha,
  );

  await api.request(`/repos/${config.repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({
      ref: branch,
      inputs: {
        batch_id: compiled.batchId,
        script_path: path,
        shards: String(runConfig.shards),
        strategy: runConfig.strategy,
        default_voice: runConfig.defaultVoice,
        default_speed: String(runConfig.defaultSpeed),
        retention_days: String(runConfig.retentionDays),
        shard_indices: '',
      },
    }),
  });

  const runId = await discoverRun(api, config.repo, compiled.batchId);
  const shards: ShardRun[] = Array.from({ length: runConfig.shards }, (_, index) => ({
    index,
    jobId: null,
    state: 'queued',
    step: 'Waiting',
    artifactName: `tts-${compiled.batchId}-shard-${index}`,
    downloaded: false,
    attempts: 0,
  }));

  const run: GenerationRun = {
    id: uid('run'),
    batchId: compiled.batchId,
    scriptId,
    scriptTitle,
    compiled,
    repo: config.repo,
    runId,
    workflowName: 'ShryneTTS Studio',
    state: 'queued',
    shards,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: runConfig,
    artifactNames: [],
  };
  await saveRun(run);
  return { run, compiled };
}

async function discoverRun(api: GithubClient, repo: string, id: string): Promise<number | null> {
  // POST /dispatches returns 204, so correlate via the unique commit message we just created.
  for (let attempt = 0; attempt < 8; attempt++) {
    const response = await api.request<{ workflow_runs: WorkflowRun[] }>(
      `/repos/${repo}/actions/runs?event=workflow_dispatch&per_page=30`,
    );
    const match = response.workflow_runs.find((r) =>
      r.head_commit?.message?.includes(id) || r.display_title?.includes(id),
    );
    if (match) return match.id;
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  logger.warn(TAG, 'Could not correlate dispatched run', id);
  return null;
}

export async function pollRun(config: StudioConfig, run: GenerationRun): Promise<GenerationRun> {
  if (!run.runId) return run;
  const api = client(config);
  const [detail, jobsResponse] = await Promise.all([
    api.request<WorkflowRun>(`/repos/${config.repo}/actions/runs/${run.runId}`),
    api.request<{ jobs: WorkflowJob[] }>(`/repos/${config.repo}/actions/runs/${run.runId}/jobs?per_page=100`),
  ]);

  const state = mapConclusion(detail);
  const synthesizeJobs = jobsResponse.jobs.filter((job) => job.name.startsWith('synthesize'));
  const shards: ShardRun[] = run.shards.map((shard) => {
    const job = synthesizeJobs.find((j) => j.name.includes(`(${shard.index})`) || j.name.includes(`shard-${shard.index}`));
    if (!job) return shard;
    const activeStep = job.steps.find((step) => step.status === 'in_progress');
    return {
      ...shard,
      jobId: job.id,
      state: mapConclusion({ ...detail, status: job.status, conclusion: job.conclusion } as WorkflowRun),
      step: activeStep?.name ?? (job.status === 'completed' ? 'Done' : 'Queued'),
      attempts: job.run_attempt ?? shard.attempts,
    };
  });

  const updated: GenerationRun = {
    ...run,
    state,
    shards,
    updatedAt: Date.now(),
    error: state === 'failure' ? 'One or more shards failed. Retry from the run screen.' : run.error,
  };
  await saveRun(updated);

  if (isTerminal(state) && state === 'success') {
    await notify(config, `Batch ${run.batchId} is ready`, `${shards.length} shard(s) finished. Open Shryne Studio to download.`);
  } else if (isTerminal(state) && (state === 'failure' || state === 'cancelled')) {
    await notify(config, `Batch ${run.batchId} ${state}`, 'Open Shryne Studio for details.');
  }
  return updated;
}

/** Download succeeded shards, unpack WAVs, persist assets, then optionally delete the public run. */
export async function downloadOutputs(config: StudioConfig, run: GenerationRun, compiled: CompiledScript): Promise<GenerationRun> {
  if (!run.runId) return run;
  const api = client(config);
  const artifacts = await listArtifacts(api, config.repo, run.runId);
  const audioArtifacts = artifacts.filter((a) => a.name.startsWith(`tts-${run.batchId}-shard-`));
  const existing = await listAssets({ batchId: run.batchId, limit: 10000 });
  const existingUris = new Set(existing.map((a) => a.uri));
  const newAssets: AudioAsset[] = [];

  for (const artifact of audioArtifacts) {
    const zip = await downloadArtifactZip(api, artifact);
    const files = await unzipToFiles(zip, run.batchId);
    const assets = buildAssetsFromShard(files, compiled, compiled.silences, run.batchId, run.scriptId);
    for (const asset of assets) {
      if (existingUris.has(asset.uri)) continue;
      await saveAsset(asset);
      newAssets.push(asset);
    }
  }

  const shards = run.shards.map((shard) => {
    const artifact = audioArtifacts.find((a) => a.name === shard.artifactName);
    return artifact ? { ...shard, downloaded: true } : shard;
  });
  const updated: GenerationRun = {
    ...run,
    shards,
    artifactNames: audioArtifacts.map((a) => a.name),
    updatedAt: Date.now(),
  };
  await saveRun(updated);

  if (run.config.cleanupAfterDownload && newAssets.length > 0) {
    await cleanupRun(config, run);
  }
  return updated;
}

export async function retryShard(config: StudioConfig, run: GenerationRun, _compiled: CompiledScript, _shardIndices: number[]): Promise<GenerationRun> {
  if (!run.runId) return run;
  const api = client(config);
  await api.request(`/repos/${config.repo}/actions/runs/${run.runId}/rerun-failed-jobs`, { method: 'POST' });
  const refreshed = await getRun(run.id) ?? run;
  return refreshed;
}

export async function cancelRun(config: StudioConfig, run: GenerationRun): Promise<void> {
  if (!run.runId) return;
  const api = client(config);
  await api.request(`/repos/${config.repo}/actions/runs/${run.runId}/cancel`, { method: 'POST' });
  await saveRun({ ...run, state: 'cancelled', updatedAt: Date.now() });
}

export async function cleanupRun(config: StudioConfig, run: GenerationRun): Promise<void> {
  if (!run.runId) return;
  const api = client(config);
  try {
    await api.request(`/repos/${config.repo}/actions/runs/${run.runId}`, { method: 'DELETE' });
    const path = `${SCRIPT_DIR}/${run.batchId}.json`;
    const sha = await getFileSha(api, config.repo, path, config.defaultBranch);
    if (sha) {
      await putFile(api, config.repo, path, '[]', config.defaultBranch, `chore: cleanup ${run.batchId}`, sha);
    }
    logger.info(TAG, 'Cleaned up public run', run.batchId);
  } catch (error) {
    logger.warn(TAG, 'Cleanup failed', error);
  }
}

export function newBatchId(): string {
  return batchId();
}

async function notify(config: StudioConfig, title: string, body: string): Promise<void> {
  if (!(await getRunPreference())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

async function getRunPreference(): Promise<boolean> {
  const { getPref } = await import('@/lib/storage/db');
  return (await getPref('notifications')) !== 'off';
}

export async function removeLocalRun(config: StudioConfig, run: GenerationRun): Promise<void> {
  const { deleteRun, deleteBatchAssets } = await import('@/lib/storage/db');
  const assets = await listAssets({ batchId: run.batchId, limit: 10000 });
  await Promise.all(assets.map((asset) => deleteUri(asset.uri)));
  await deleteBatchAssets(run.batchId);
  await deleteRun(run.id);
  if (run.config.cleanupAfterDownload) await cleanupRun(config, run);
}
