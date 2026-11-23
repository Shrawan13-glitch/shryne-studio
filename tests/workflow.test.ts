import { describe, expect, it } from 'vitest';
import { WORKFLOW_FILE, WORKFLOW_PATH, WORKFLOW_YAML } from '@/lib/github/workflow';

describe('installed TTS workflow', () => {
  it('uses stable cache keys for the model and pip wheels', () => {
    expect(WORKFLOW_YAML).toContain('MODEL_CACHE_KEY: kokoro-models-v1');
    expect(WORKFLOW_YAML).toContain('PIP_CACHE_KEY: linux-pip-kokoro-0.5.0-soundfile-v1');
    expect(WORKFLOW_YAML).toContain('path: ~/.kokoro-tts');
    expect(WORKFLOW_YAML).toContain('path: ~/.cache/pip');
    expect(WORKFLOW_YAML).toContain("if: steps.model-cache.outputs.cache-hit != 'true'");
  });

  it('prunes caches down to the newest 12 at the end of the job', () => {
    expect(WORKFLOW_YAML).toContain("MAX_CACHES: '12'");
    expect(WORKFLOW_YAML).toContain('/actions/caches');
    expect(WORKFLOW_YAML).toContain('sort_by(.created_at) | reverse | .[$max:]');
    expect(WORKFLOW_YAML).toContain('-X DELETE');
    expect(WORKFLOW_YAML).toContain('group: shryne-cache-prune');
  });

  it('keeps the action pinned and the workflow file name stable', () => {
    expect(WORKFLOW_YAML).toContain('uses: Shrawan13-glitch/tts-action@v1');
    expect(WORKFLOW_PATH).toBe(`.github/workflows/${WORKFLOW_FILE}`);
  });
});
