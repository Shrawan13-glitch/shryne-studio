import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Plus, Search, Trash2 } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDeleteScript, useSaveScript, useScripts } from '@/hooks/useScripts';
import { emptyScript, useAppStore } from '@/stores/useAppStore';
import { TEMPLATES } from '@/constants/app';
import { relativeTime } from '@/lib/utils/format';
import type { BlockType } from '@/types';
import { uid } from '@/lib/utils/id';

export default function ScriptsScreen() {
  const { data: scripts = [] } = useScripts();
  const [query, setQuery] = useState('');
  const save = useSaveScript();
  const remove = useDeleteScript();
  const setActive = useAppStore((state) => state.setActiveScript);

  const create = async (title: string, template?: (typeof TEMPLATES)[number]) => {
    const script = emptyScript();
    script.title = title;
    if (template) {
      script.title = template.name;
      script.blocks = template.blocks.map((block) => ({
        id: uid('blk'),
        type: block.type as BlockType,
        text: 'text' in block ? block.text : '',
        voice: 'voice' in block ? block.voice : undefined,
        speed: 'speed' in block ? block.speed : undefined,
        duration: 'duration' in block ? block.duration : undefined,
        enabled: true,
      }));
    }
    await save.mutateAsync(script);
    setActive(script);
    router.push({ pathname: '/(app)/editor/[id]', params: { id: script.id } });
  };

  const filtered = scripts.filter((script) => script.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen>
      <Text className="mb-1 mt-6 text-3xl font-black tracking-tight text-zinc-50">Scripts</Text>
      <Text className="mb-5 text-sm text-zinc-400">Drafts save automatically on this device.</Text>

      <Button label="Blank script" onPress={() => void create('Untitled script')} className="mb-5" loading={save.isPending} />

      <View className="mb-5 flex-row items-center gap-2 rounded-2xl border border-ink-700 bg-ink-850 px-4">
        <Search size={17} color="#71717a" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search scripts" placeholderTextColor="#71717a" className="h-12 flex-1 text-sm text-zinc-100" />
      </View>

      <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Templates</Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {TEMPLATES.map((template) => (
          <Pressable key={template.id} onPress={() => void create(template.name, template)} className="rounded-full border border-ink-700 bg-ink-850 px-4 py-2">
            <Text className="text-xs font-semibold text-zinc-300">{template.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Your scripts</Text>
      {filtered.length === 0 ? (
        <Card><Text className="py-6 text-center text-sm text-zinc-500">Nothing here yet.</Text></Card>
      ) : (
        filtered.map((script) => (
          <Pressable
            key={script.id}
            onPress={() => { setActive(script); router.push({ pathname: '/(app)/editor/[id]', params: { id: script.id } }); }}
            className="mb-3 flex-row items-center justify-between rounded-2xl border border-ink-700 bg-ink-850 p-4"
          >
            <View className="flex-1 pr-3">
              <Text className="text-base font-semibold text-zinc-100" numberOfLines={1}>{script.title}</Text>
              <Text className="mt-1 text-xs text-zinc-500">
                {script.blocks.filter((b) => b.type === 'line').length} lines · edited {relativeTime(script.updatedAt)}
              </Text>
            </View>
            <Pressable onPress={() => void remove.mutateAsync(script.id)} className="p-2"><Trash2 size={16} color="#f87171" /></Pressable>
          </Pressable>
        ))
      )}
      <View className="h-24" />
    </Screen>
  );
}
