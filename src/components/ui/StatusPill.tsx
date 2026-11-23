import { View, Text } from 'react-native';
import type { RunState } from '@/types';

const STYLES: Record<RunState, { dot: string; text: string; label: string }> = {
  queued: { dot: 'bg-zinc-400', text: 'text-zinc-400', label: 'Queued' },
  in_progress: { dot: 'bg-amber-400', text: 'text-amber-300', label: 'Generating' },
  success: { dot: 'bg-mint-500', text: 'text-mint-400', label: 'Ready' },
  failure: { dot: 'bg-red-400', text: 'text-red-300', label: 'Failed' },
  cancelled: { dot: 'bg-zinc-500', text: 'text-zinc-400', label: 'Cancelled' },
  timed_out: { dot: 'bg-red-400', text: 'text-red-300', label: 'Timed out' },
  skipped: { dot: 'bg-zinc-500', text: 'text-zinc-400', label: 'Skipped' },
};

export function StatusPill({ state }: { state: RunState }) {
  const style = STYLES[state];
  return (
    <View className="flex-row items-center gap-2 rounded-full bg-ink-800 px-3 py-1.5">
      <View className={`h-2 w-2 rounded-full ${style.dot}`} />
      <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
    </View>
  );
}
