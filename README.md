# Shryne Studio

A production-minded mobile studio for turning scripts into speech using the
[ShryneTTS GitHub Action](https://github.com/marketplace/actions/shrynetts). Built with Expo, React Native and TypeScript.

## What it does

- **Block-based script editor** — lines, headings, stage directions, notes and pauses. Reorder, duplicate, disable, bulk-edit.
- **Smart paste** — drop in a whole script; blank lines become blocks, `NAME:` cues are detected and long paragraphs are split.
- **Voice casting** — map character names to any of the **52 Kokoro voices** across 9 locale prefixes.
- **Smart sharding** — 1–16 parallel shards, `contiguous` or `round-robin`, with a model cache warm-up job so shards don't each re-download 310 MB.
- **Live run status** — polls GitHub Actions, shows per-shard job progress, supports cancel, retry and re-run.
- **Output manager** — downloads artifact zips on device, unpacks WAVs, rebuilds narrative order from the script snapshot, and stores a searchable local library.
- **Exports** — single WAV, merged WAV (with inserted pauses), ZIP pack with a JSON manifest.
- **Auto-cleanup** — deletes the public workflow run and script file after audio has been downloaded.
- **Preflight check** — validates speed range, character counts, unknown voices and filename collisions before spending a run.

## Why scripts are committed instead of sent as inputs

`workflow_dispatch` accepts at most **65,535 characters** of inputs. Large scripts cannot fit. Shryne Studio commits the compiled `items` JSON to `<your-account>/shryne-studio-audio/scripts/<batchId>.json`, then dispatches the workflow with only a handful of small inputs. The unique commit message (`tts(batch): <batchId>`) is used to correlate the 204 dispatch response to the resulting run.

## Setup

1. Create a **fine-grained PAT** scoped to the audio repo with `Contents: read/write` and `Actions: read/write`, or a classic PAT with `repo` + `workflow`.
2. Open the app and paste the token.
3. The app idempotently creates the public repo and installs `.github/workflows/tts-studio.yml` on the default branch.
4. Write a script, choose shards and strategy, generate, watch, download.

The PAT is stored in the device Keychain / Keystore only. It is never written into the workflow and never logged. Public repo content (scripts + artifacts) is visible until auto-cleanup runs, so keep `cleanupAfterDownload` on for sensitive scripts.

## GitHub limits honored

| Limit | How the app handles it |
|---|---|
| 65,535-char dispatch payload | Scripts are committed as files; inputs are tiny. |
| 500 MB artifact storage (Free) | Per-shard artifacts, `retention-days: 1`, auto-cleanup. |
| 20 concurrent jobs (Free) | Shards capped at 16; `max-parallel: 12` in the matrix. |
| 6-hour job limit | Runs are capped at ~90 minutes of polling. |
| API rate limits | Exponential backoff using `X-RateLimit-Reset`. |

## Development

```bash
npm install
npm run typecheck
npm run lint
npm test
npm start
```

No backend is required. All state lives on-device (SQLite + secure storage).

## Repository layout

- `app/` — Expo Router screens
- `src/lib/tts/` — voice catalog, compiler, sharding, smart paste, WAV joining (pure, unit-tested)
- `src/lib/github/` — REST client, auth, repo provisioning, workflow template, artifacts
- `src/lib/run/` — run orchestration (dispatch, discover, poll, download, cleanup)
- `src/lib/storage/` — SQLite schema, filesystem/unzip/export helpers
- `src/hooks/`, `src/stores/` — React Query + Zustand state
- `tests/` — Vitest unit tests
- `.github/workflows/` — CI and manual EAS build

## License

MIT
