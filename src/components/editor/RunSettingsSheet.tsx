import { useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import type { RunConfig, ShardingStrategy } from '@/types';
import { MAX_SHARDS } from '@/constants/app';
import { Field } from '@/components/ui/Field';

interface Props {
  visible: boolean;
  initial: RunConfig;
  itemCount: number;
  onClose: () => void;
  onApply: (config: RunConfig) => void;
}

export function RunSettingsSheet({ visible, initial, itemCount, onClose, onApply }: Props) {
  const [config, setConfig] = useState(initial);
  const safeShards = Math.min(config.shards, Math.max(1, Math.min(MAX_SHARDS, itemCount || 1)));
  const patch = (values: Partial<RunConfig>) => setConfig((current) => ({ ...current, ...values }));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-ink-950 px-5 pt-6">
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-zinc-50">Generate</Text>
          <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-ink-800">
            <X size={18} color="#a1a1aa" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Field label="Parallel shards" hint={`${itemCount} spoken line${itemCount === 1 ? '' : 's'} · GitHub Free allows 20 concurrent jobs. Each shard downloads the model once (cached after the first).`}>
            <View className="flex-row flex-wrap gap-2">
              {[1, 2, 4, 8, 12, 16].map((count) => (
                <Pressable
                  key={count}
                  onPress={() => patch({ shards: count })}
                  className={`h-10 min-w-[52px] items-center justify-center rounded-xl px-3 ${safeShards === count ? 'bg-brand-500' : 'border border-ink-700 bg-ink-850'}`}
                >
                  <Text className="text-sm font-semibold text-white">{count}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Shard strategy" hint="Contiguous keeps lines in narrative order across shards. Round-robin balances runtime when voices differ.">
            <View className="flex-row gap-2">
              {(['contiguous', 'round-robin'] as ShardingStrategy[]).map((strategy) => (
                <Pressable
                  key={strategy}
                  onPress={() => patch({ strategy })}
                  className={`flex-1 rounded-xl px-3 py-3 ${config.strategy === strategy ? 'bg-brand-500' : 'border border-ink-700 bg-ink-850'}`}
                >
                  <Text className="text-center text-xs font-semibold text-white">{strategy}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Artifact retention" hint="Public repo artifacts are deleted after this many days. Keep it short.">
            <View className="flex-row gap-2">
              {[1, 3, 7].map((days) => (
                <Pressable
                  key={days}
                  onPress={() => patch({ retentionDays: days })}
                  className={`flex-1 rounded-xl py-3 ${config.retentionDays === days ? 'bg-brand-500' : 'border border-ink-700 bg-ink-850'}`}
                >
                  <Text className="text-center text-xs font-semibold text-white">{days} day{days > 1 ? 's' : ''}</Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Toggle label="Delete public artifacts after download" value={config.cleanupAfterDownload} onChange={(v) => patch({ cleanupAfterDownload: v })} />
          <Toggle label="Notify me when ready" value={config.notifyOnFinish} onChange={(v) => patch({ notifyOnFinish: v })} />
          <Toggle label="Stop on first failed shard" value={config.cancelOnFailure} onChange={(v) => patch({ cancelOnFailure: v })} />

          <Pressable onPress={() => onApply({ ...config, shards: safeShards })} className="mb-8 mt-4 items-center justify-center rounded-2xl bg-brand-500 py-4">
            <Text className="text-base font-bold text-white">Start generation</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-ink-700 bg-ink-850 px-4 py-3">
      <Text className="flex-1 pr-4 text-sm text-zinc-200">{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#7c3aed', false: '#3f3f46' }} thumbColor="#fff" />
    </View>
  );
}
