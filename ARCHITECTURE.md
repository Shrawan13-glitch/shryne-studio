# Architecture

## Data flow

```
Script (SQLite draft)
  -> compileScript()  -> items JSON + silence markers + warnings
  -> planShards()     -> N shards + filename -> index map
  -> commit scripts/<batchId>.json to the user's public repo
  -> POST workflow_dispatch (tiny inputs)
  -> warm-cache -> prepare (jq/python split) -> synthesize matrix -> finalize
  -> poll /actions/runs/{id} + /jobs
  -> GET artifacts -> download zip -> fflate unzip -> save WAVs -> SQLite library
  -> DELETE workflow run + script file (auto-cleanup)
```

## Key design choices

- **No server.** The PAT never leaves the device; GitHub is the backend and the compute layer.
- **Everything derived is pure.** The TTS compiler, sharder, smart-paste parser and WAV joiner have no React Native imports, so they are unit-tested in Node.
- **Immutable batch snapshot.** `GenerationRun.compiled` stores exactly what was dispatched. Downloads can be re-run days later even if the script draft changed, and ordering is reconstructed from the generated filenames.
- **Idempotent provisioning.** Repo + workflow installation is safe to run on every connect. Workflow content is rewritten to pick up app updates but stays pinned to the action's `v1` tag.
- **Cache warm-up.** A dedicated job downloads the 310 MB Kokoro model into `actions/cache` before the matrix fans out, avoiding N parallel cold downloads. A pip wheel cache is shared the same way. Keys are stable (immutable model files, pinned `kokoro-onnx==0.5.0`), so runs hit the cache instead of creating duplicates. The `finalize` job lists `/actions/caches`, sorts by `created_at`, and deletes everything after the newest 12; a job-level concurrency group serializes that pruning across concurrent batches.
- **Backoff + correlation.** Dispatch returns 204, so runs are found by matching `head_commit.message` to the generated batch id; polling backs off and honors rate-limit headers.

## Failure modes

| Situation | Behavior |
|---|---|
| Token rejected | AuthError surfaces in the connect screen with scope guidance. |
| Rate limited | RateLimitError with reset time; pollers slow down. |
| Shard fails | Per-shard state shown; `rerun-failed-jobs` available. |
| Artifact expired | Filtered out; user can re-run the batch. |
| Cleanup fails | Logged as a warning; local audio already saved. |

## Scalability notes

FlashList is used for long lists (voices, runs, library). SQLite indexes cover run and asset lookups. Draft saves are debounced. Artifact downloads stream to disk before unzipping; WAV merging is pure PCM concatenation, so no native audio stack is needed for exports. The matrix caps at 12 concurrent synthesis jobs to stay inside GitHub's 20-job Free-tier ceiling.
