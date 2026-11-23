export const WORKFLOW_PATH = '.github/workflows/tts-studio.yml';
export const WORKFLOW_FILE = 'tts-studio.yml';

export const WORKFLOW_YAML = `name: ShryneTTS Studio

on:
  workflow_dispatch:
    inputs:
      batch_id:
        description: 'Unique batch id (correlates the app run to this run)'
        required: true
        type: string
      script_path:
        description: 'Path to the committed script JSON'
        required: true
        type: string
      shards:
        description: 'Number of parallel shards (1-16)'
        required: false
        type: string
        default: '1'
      strategy:
        description: 'contiguous or round-robin'
        required: false
        type: string
        default: 'contiguous'
      default_voice:
        description: 'Fallback voice'
        required: false
        type: string
        default: 'af_sky'
      default_speed:
        description: 'Fallback speed'
        required: false
        type: string
        default: '1.0'
      retention_days:
        description: 'Artifact retention in days'
        required: false
        type: string
        default: '1'
      shard_indices:
        description: 'Optional JSON array of shard indices to re-run'
        required: false
        type: string
        default: ''

permissions:
  contents: read
  actions: write

concurrency:
  group: shryne-\${{ inputs.batch_id }}
  cancel-in-progress: false

jobs:
  warm-cache:
    runs-on: ubuntu-latest
    steps:
      - name: Restore Kokoro model cache
        uses: actions/cache@v4
        id: model-cache
        with:
          path: ~/.kokoro-tts
          key: kokoro-models-v1
      - name: Download model files (cold cache only)
        if: steps.model-cache.outputs.cache-hit != 'true'
        run: |
          set -euo pipefail
          mkdir -p ~/.kokoro-tts
          curl -fsSL -o ~/.kokoro-tts/kokoro-v1.0.onnx \\
            https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
          curl -fsSL -o ~/.kokoro-tts/voices-v1.0.bin \\
            https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
          echo "Model files cached"

  prepare:
    needs: warm-cache
    runs-on: ubuntu-latest
    outputs:
      matrix: \${{ steps.split.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4
      - name: Build shard matrix
        id: split
        env:
          SCRIPT_PATH: \${{ inputs.script_path }}
          SHARDS: \${{ inputs.shards }}
          STRATEGY: \${{ inputs.strategy }}
          INDICES: \${{ inputs.shard_indices }}
        run: |
          set -euo pipefail
          MATRIX=$(python3 - <<'PY'
          import json, os
          items = json.load(open(os.environ['SCRIPT_PATH'], encoding='utf-8'))
          if not isinstance(items, list) or not items:
              raise SystemExit('Script JSON must be a non-empty array')
          try:
              requested = int(os.environ.get('SHARDS') or '1')
          except ValueError:
              requested = 1
          count = max(1, min(requested, len(items), 16))
          strategy = (os.environ.get('STRATEGY') or 'contiguous').strip()
          groups = [[] for _ in range(count)]
          if strategy == 'round-robin':
              for i, item in enumerate(items):
                  groups[i % count].append(item)
          else:
              size = (len(items) + count - 1) // count
              for i, item in enumerate(items):
                  groups[min(count - 1, i // size)].append(item)
          raw = (os.environ.get('INDICES') or '').strip()
          indices = json.loads(raw) if raw else list(range(count))
          indices = sorted({int(i) for i in indices if 0 <= int(i) < count})
          os.makedirs('.tts-shards', exist_ok=True)
          for i in indices:
              with open(f'.tts-shards/{i}.json', 'w', encoding='utf-8') as handle:
                  json.dump(groups[i], handle, ensure_ascii=False)
          print(json.dumps({'include': [{'shard': i} for i in indices]}, separators=(',', ':')))
          PY
          )
          echo "matrix=$MATRIX" >> "$GITHUB_OUTPUT"
          echo "Prepared $MATRIX"
      - uses: actions/upload-artifact@v4
        with:
          name: tts-shards-\${{ inputs.batch_id }}
          path: .tts-shards/
          retention-days: \${{ inputs.retention_days }}
          if-no-files-found: error

  synthesize:
    needs: prepare
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      max-parallel: 12
      matrix: \${{ fromJSON(needs.prepare.outputs.matrix) }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: tts-shards-\${{ inputs.batch_id }}
          path: .tts-shards
      - name: Load shard items
        id: shard
        run: |
          set -euo pipefail
          echo "items=$(jq -c . .tts-shards/\${{ matrix.shard }}.json)" >> "$GITHUB_OUTPUT"
      - name: Generate speech
        uses: Shrawan13-glitch/tts-action@v1
        with:
          items: \${{ steps.shard.outputs.items }}
          voice: \${{ inputs.default_voice }}
          speed: \${{ inputs.default_speed }}
          output-dir: tts-output
      - uses: actions/upload-artifact@v4
        with:
          name: tts-\${{ inputs.batch_id }}-shard-\${{ matrix.shard }}
          path: tts-output/
          retention-days: \${{ inputs.retention_days }}
          if-no-files-found: error

  finalize:
    needs: synthesize
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Write run summary
        run: |
          {
            echo "### ShryneTTS Studio"
            echo "Batch: \${{ inputs.batch_id }}"
            echo "Shards: \${{ inputs.shards }} (\${{ inputs.strategy }})"
            echo "Synthesis result: \${{ needs.synthesize.result }}"
          } >> "$GITHUB_STEP_SUMMARY"
`;
