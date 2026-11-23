import { useEffect } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Download, ExternalLink, Loader2, RefreshCw, Trash2, XCircle } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAppStore } from '@/stores/useAppStore';
import { useCancelRun, useDownloadOutputs, useRemoveRun, useRetryShard, useRuns, useRunPoller } from '@/hooks/useRuns';
import { useAssets } from '@/hooks/useAssets';
import { isTerminal } from '@/lib/github/types';
import { POLL_FAST_MS, POLL_SLOW_MS } from '@/constants/app';
import { relativeTime } from '@/lib/utils/format';

export default function RunScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: runs = [] } = useRuns();
  const run = runs.find((item) => item.id === id);
  const studio = useAppStore((state) => state.studio);
  const poll = useRunPoller(studio);
  const download = useDownloadOutputs(studio);
  const cancel = useCancelRun(studio);
  const retry = useRetryShard(studio);
  const remove = useRemoveRun(studio);
  const { data: assets = [] } = useAssets({ batchId: run?.batchId ?? '', limit: 10000 });

  useEffect(() => {
    if (!run || !studio || isTerminal(run.state) || !run.runId) return;
    const timer = setInterval(() => void poll(run), POLL_FAST_MS);
    return () => clearInterval(timer);
  }, [run?.id, run?.state, studio, poll]);

  if (!run) {
    return (
      <Screen>
        <Text className="mt-10 text-center text-sm text-zinc-400">Run not found.</Text>
      </Screen>
    );
  }

  const downloaded = run.shards.filter((shard) => shard.downloaded).length;
  const canDownload = run.state === 'success' && downloaded < run.shards.length;
  const runUrl = `https://github.com/${run.repo}/actions/runs/${run.runId}`;

  return (
    <Screen>
      <View className="mb-5 mt-4 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-ink-850">
          <ArrowLeft size={18} color="#a1a1aa" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-zinc-50" numberOfLines={1}>{run.scriptTitle}</Text>
          <Text className="font-mono text-[10px] text-zinc-500">{run.batchId}</Text>
        </View>
        <StatusPill state={run.state} />
      </View>

      <Card className="mb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-zinc-400">Started {relativeTime(run.createdAt)}</Text>
          {run.runId ? (
            <Pressable onPress={() => void Linking.openURL(runUrl)} className="flex-row items-center gap-1">
              <Text className="text-xs text-brand-300">View on GitHub</Text>
              <ExternalLink size={12} color="#a78bfa" />
            </Pressable>
          ) : null}
        </View>
        <View className="mt-4 h-2 overflow-hidden rounded-full bg-ink-800">
          <View
            className={`h-full rounded-full ${run.state === 'failure' ? 'bg-red-400' : run.state === 'success' ? 'bg-mint-500' : 'bg-amber-400'}`}
            style={{ width: `${progressPercent(run.state, run.shards.filter((s) => s.downloaded).length, run.shards.length)}%` }}
          />
        </View>
        <Text className="mt-2 text-[11px] text-zinc-500">
          {run.state === 'in_progress' ? 'Generating on GitHub-hosted runners…' : `${downloaded}/${run.shards.length} shards downloaded`}
        </Text>
      </Card>

      <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Shards</Text>
      {run.shards.map((shard) => (
        <View key={shard.index} className="mb-2 flex-row items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-3">
          <View className={`h-9 w-9 items-center justify-center rounded-full ${shard.downloaded ? 'bg-mint-500/20' : 'bg-ink-800'}`}>
            {shard.downloaded ? <CheckCircle2 size={17} color="#34d399" /> :
              shard.state === 'failure' ? <XCircle size={17} color="#f87171" /> :
              shard.state === 'in_progress' ? <Loader2 size={17} color="#fbbf24" /> :
              <Text className="text-xs font-bold text-zinc-400">{shard.index + 1}</Text>}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-zinc-200">Shard {shard.index + 1}</Text>
            <Text className="text-[11px] text-zinc-500">{shard.step} · {shard.state}</Text>
          </View>
          <Text className="text-[10px] text-zinc-600">{shard.attempts > 1 ? `try ${shard.attempts}` : ''}</Text>
        </View>
      ))}

      {run.error ? (
        <View className="mb-4 mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3">
          <Text className="text-xs leading-5 text-red-200">{run.error}</Text>
        </View>
      ) : null}

      <View className="mt-5 gap-2">
        {canDownload ? (
          <Button
            label={download.isPending ? 'Downloading…' : `Download ${run.shards.length} shard${run.shards.length === 1 ? '' : 's'}`}
            onPress={() => void download.mutateAsync({ run, compiled: run.compiled })}
            loading={download.isPending}
          />
        ) : null}
        {!isTerminal(run.state) ? (
          <Button label="Cancel run" variant="danger" onPress={() => void cancel.mutateAsync(run)} loading={cancel.isPending} />
        ) : null}
        {run.state === 'failure' ? (
          <Button
            label="Retry failed shards"
            variant="secondary"
            onPress={() => void retry.mutateAsync({ run, compiled: run.compiled, indices: run.shards.filter((s) => s.state === 'failure').map((s) => s.index) })}
            loading={retry.isPending}
          />
        ) : null}
        {!isTerminal(run.state) ? (
          <Button label="Refresh status" variant="ghost" onPress={() => void poll(run)} />
        ) : null}
        <Button label="Open library" variant="secondary" onPress={() => router.push('/(app)/library')} />
        <Button
          label={remove.isPending ? 'Removing…' : 'Remove run & audio'}
          variant="ghost"
          onPress={() => void remove.mutateAsync(run)}
          loading={remove.isPending}
        />
      </View>

      {run.config.cleanupAfterDownload && downloaded > 0 ? (
        <View className="mt-4 flex-row items-center gap-2 rounded-2xl border border-ink-700 bg-ink-850 p-3">
          <RefreshCw size={14} color="#34d399" />
          <Text className="flex-1 text-[11px] leading-4 text-zinc-500">
            Public artifacts and the script file are deleted automatically once audio is downloaded. {assets.length} file(s) saved locally.
          </Text>
        </View>
      ) : null}
      <View className="h-16" />
    </Screen>
  );
}

function progressPercent(state: string, downloaded: number, total: number): number {
  if (state === 'success') return 100;
  if (state === 'failure' || state === 'cancelled') return 60;
  if (state === 'in_progress') return 45;
  if (total > 0 && downloaded > 0) return (downloaded / total) * 100;
  return 12;
}
