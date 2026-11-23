import { useEffect, type ReactNode } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { ArrowRight, AudioLines, FileText, Plus, Radio, Layers } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { useAssets } from '@/hooks/useAssets';
import { useRuns, useRunPoller } from '@/hooks/useRuns';
import { useScripts } from '@/hooks/useScripts';
import { useAppStore } from '@/stores/useAppStore';
import { POLL_FAST_MS } from '@/constants/app';
import { isTerminal } from '@/lib/github/types';
import { relativeTime } from '@/lib/utils/format';
import { emptyScript } from '@/stores/useAppStore';
import { useSaveScript } from '@/hooks/useScripts';

export default function HomeScreen() {
  const studio = useAppStore((state) => state.studio);
  const { data: runs = [], refetch, isRefetching } = useRuns();
  const { data: scripts = [] } = useScripts();
  const { data: assets = [] } = useAssets({ limit: 1 });
  const poll = useRunPoller(studio);
  const saveScript = useSaveScript();
  const active = runs.filter((run) => !isTerminal(run.state));

  useEffect(() => {
    if (active.length === 0) return;
    const timer = setInterval(() => {
      active.forEach((run) => void poll(run));
    }, POLL_FAST_MS);
    return () => clearInterval(timer);
  }, [active.map((run) => run.id).join(','), poll]);

  const newScript = async () => {
    const script = emptyScript();
    await saveScript.mutateAsync(script);
    router.push({ pathname: '/(app)/editor/[id]', params: { id: script.id } });
  };

  return (
    <Screen>
      <View className="mb-6 mt-6 flex-row items-start justify-between">
        <View>
          <Text className="text-3xl font-black tracking-tight text-zinc-50">Studio</Text>
          <Text className="mt-1 text-sm text-zinc-400">{studio ? `Connected to ${studio.repo}` : 'Not connected'}</Text>
        </View>
        <View className="flex-row items-center gap-2 rounded-full border border-mint-500/30 bg-mint-500/10 px-3 py-1.5">
          <View className="h-2 w-2 rounded-full bg-mint-500" />
          <Text className="text-[11px] font-bold text-mint-400">{active.length ? `${active.length} live` : 'Ready'}</Text>
        </View>
      </View>

      <View className="mb-5 flex-row gap-3">
        <Stat icon={<FileText size={18} color="#a78bfa" />} value={scripts.length} label="Scripts" />
        <Stat icon={<Radio size={18} color="#fbbf24" />} value={runs.length} label="Runs" />
        <Stat icon={<AudioLines size={18} color="#34d399" />} value={assets.length} label="Audio files" />
      </View>

      <Button label="New script" onPress={newScript} loading={saveScript.isPending} className="mb-6" />

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-zinc-100">Recent runs</Text>
        <Pressable onPress={() => void refetch()} className="flex-row items-center gap-1">
          <Text className="text-xs text-brand-300">Refresh</Text>
          <ArrowRight size={13} color="#a78bfa" />
        </Pressable>
      </View>

      {runs.length === 0 ? (
        <Card>
          <View className="items-center py-6">
            <Layers size={28} color="#52525b" />
            <Text className="mt-3 text-sm text-zinc-400">No runs yet. Write a script and hit generate.</Text>
          </View>
        </Card>
      ) : (
        <FlashList
          data={runs.slice(0, 20)}
          estimatedItemSize={92}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor="#a78bfa" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/(app)/run/[id]', params: { id: item.id } })}
              className="mb-3 rounded-2xl border border-ink-700 bg-ink-850 p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 pr-3 text-base font-semibold text-zinc-100" numberOfLines={1}>{item.scriptTitle}</Text>
                <StatusPill state={item.state} />
              </View>
              <Text className="mt-2 text-xs text-zinc-500">
                {item.batchId} · {item.shards.length} shard{item.shards.length === 1 ? '' : 's'} · {relativeTime(item.createdAt)}
              </Text>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </Screen>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-ink-700 bg-ink-850 p-3">
      {icon}
      <Text className="mt-2 text-2xl font-black text-zinc-50">{value}</Text>
      <Text className="text-[11px] text-zinc-500">{label}</Text>
    </View>
  );
}
