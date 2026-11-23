import { Pressable, Text, TextInput, View } from 'react-native';
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, Gauge, Trash2, Volume2 } from 'lucide-react-native';
import type { Block } from '@/types';
import { voiceLabel } from '@/lib/tts/voices';
import { clampSpeed } from '@/lib/tts/compile';

interface Props {
  block: Block;
  index: number;
  total: number;
  onChange: (patch: Partial<Block>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
  onPickVoice: () => void;
}

const TYPE_LABEL: Record<Block['type'], string> = {
  line: 'LINE',
  heading: 'HEADING',
  direction: 'DIRECTION',
  comment: 'NOTE',
  silence: 'PAUSE',
};

export function BlockRow({ block, index, total, onChange, onDelete, onDuplicate, onMove, onPickVoice }: Props) {
  const spoken = block.type === 'line';
  return (
    <View className={`mb-3 rounded-2xl border p-3 ${block.enabled ? 'border-ink-700 bg-ink-850' : 'border-ink-800 bg-ink-900 opacity-60'}`}>
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="font-mono text-[10px] font-bold tracking-wider text-brand-300">
            {String(index + 1).padStart(3, '0')} · {TYPE_LABEL[block.type]}
          </Text>
          {spoken ? <Text className="text-[10px] text-zinc-500">{block.text.length} chars</Text> : null}
        </View>
        <View className="flex-row items-center gap-1">
          <Pressable onPress={() => onChange({ enabled: !block.enabled })} className="p-1.5">
            {block.enabled ? <Eye size={15} color="#a1a1aa" /> : <EyeOff size={15} color="#71717a" />}
          </Pressable>
          <Pressable onPress={onDuplicate} className="p-1.5"><Copy size={15} color="#a1a1aa" /></Pressable>
          <Pressable onPress={() => onMove(-1)} disabled={index === 0} className="p-1.5"><ArrowUp size={15} color={index === 0 ? '#3f3f46' : '#a1a1aa'} /></Pressable>
          <Pressable onPress={() => onMove(1)} disabled={index === total - 1} className="p-1.5"><ArrowDown size={15} color={index === total - 1 ? '#3f3f46' : '#a1a1aa'} /></Pressable>
          <Pressable onPress={onDelete} className="p-1.5"><Trash2 size={15} color="#f87171" /></Pressable>
        </View>
      </View>

      <TextInput
        value={block.text}
        onChangeText={(text) => onChange({ text })}
        placeholder={block.type === 'silence' ? 'Pause label (optional)' : 'Write your line…'}
        placeholderTextColor="#52525b"
        multiline
        className="min-h-[46px] text-[15px] leading-6 text-zinc-100"
      />

      {spoken ? (
        <View className="mt-2 flex-row items-center gap-2">
          <Pressable onPress={onPickVoice} className="flex-1 flex-row items-center gap-2 rounded-xl bg-ink-800 px-3 py-2">
            <Volume2 size={14} color="#a78bfa" />
            <Text className="flex-1 text-xs text-zinc-300" numberOfLines={1}>{voiceLabel(block.voice ?? 'af_sky')}</Text>
          </Pressable>
          <View className="flex-row items-center gap-1 rounded-xl bg-ink-800 px-2 py-2">
            <Gauge size={14} color="#a78bfa" />
            <Pressable onPress={() => onChange({ speed: clampSpeed((block.speed ?? 1) - 0.1) })} className="px-1.5"><Text className="text-sm text-zinc-300">−</Text></Pressable>
            <Text className="w-9 text-center text-xs font-semibold text-zinc-200">{(block.speed ?? 1).toFixed(2)}</Text>
            <Pressable onPress={() => onChange({ speed: clampSpeed((block.speed ?? 1) + 0.1) })} className="px-1.5"><Text className="text-sm text-zinc-300">+</Text></Pressable>
          </View>
        </View>
      ) : null}

      {block.type === 'silence' ? (
        <View className="mt-2 flex-row items-center gap-2">
          <Text className="text-xs text-zinc-500">Pause</Text>
          {[0.5, 1, 2, 3].map((seconds) => (
            <Pressable
              key={seconds}
              onPress={() => onChange({ duration: seconds })}
              className={`rounded-lg px-3 py-1.5 ${(block.duration ?? 0.5) === seconds ? 'bg-brand-500' : 'bg-ink-800'}`}
            >
              <Text className="text-xs text-white">{seconds}s</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
