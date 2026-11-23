import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Play, Star } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { LANGUAGES, VOICES, voiceLabel } from '@/lib/tts/voices';
import { compileScript } from '@/lib/tts/compile';
import { SAMPLE_SCRIPT_ID } from '@/constants/app';
import { newBatchId, startRun } from '@/lib/run/engine';
import { useAppStore } from '@/stores/useAppStore';
import { getPref, setPref } from '@/lib/storage/db';
import { useQueryClient } from '@tanstack/react-query';
import type { Voice } from '@/types';

export default function VoicesScreen() {
  const studio = useAppStore((state) => state.studio);
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [previewing, setPreviewing] = useState<string | null>(null);

  useEffect(() => {
    void getPref('favorite-voices').then((raw) => setFavorites(raw ? (JSON.parse(raw) as string[]) : []));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return VOICES.filter((voice) =>
      (language === 'All' || voice.language === language || favorites.includes(voice.id)) &&
      (!needle || `${voice.id} ${voice.name} ${voice.region}`.toLowerCase().includes(needle)),
    );
  }, [query, language, favorites]);

  const toggleFavorite = async (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    await setPref('favorite-voices', JSON.stringify(next));
  };

  const preview = async (voice: Voice) => {
    if (!studio || previewing) return;
    setPreviewing(voice.id);
    try {
      const text = voice.language === 'Hindi' ? 'नमस्ते, ये श्रवण स्टूडियो है।'
        : voice.language === 'Japanese' ? 'こんにちは、シュラインスタジオです。'
        : voice.language === 'Chinese' ? '你好，这里是 Shryne Studio。'
        : `Hi, this is ${voice.name}, speaking for Shryne Studio.`;
      const compiled = compileScript(
        [{ id: 'preview', type: 'line', text, voice: voice.id, speed: 1, enabled: true }],
        newBatchId(),
        { voice: voice.id, speed: 1, outputDir: 'tts-output' },
      );
      const { run } = await startRun(studio, SAMPLE_SCRIPT_ID, `${voice.name} preview`, compiled, {
        batchId: compiled.batchId, scriptId: SAMPLE_SCRIPT_ID, scriptTitle: `${voice.name} preview`,
        shards: 1, strategy: 'contiguous', defaultVoice: voice.id, defaultSpeed: 1,
        outputDir: 'tts-output', retentionDays: 1, cleanupAfterDownload: true,
        notifyOnFinish: false, cancelOnFailure: false,
      });
      await queryClient.invalidateQueries({ queryKey: ['runs'] });
      router.push({ pathname: '/(app)/run/[id]', params: { id: run.id } });
    } finally {
      setPreviewing(null);
    }
  };

  return (
    <Screen>
      <Text className="mb-1 mt-6 text-3xl font-black tracking-tight text-zinc-50">Voices</Text>
      <Text className="mb-5 text-sm text-zinc-400">All {VOICES.length} Kokoro voices · preview any of them.</Text>

      <View className="mb-3 flex-row items-center gap-2 rounded-2xl border border-ink-700 bg-ink-850 px-4">
        <TextInput value={query} onChangeText={setQuery} placeholder="Search voices" placeholderTextColor="#71717a" className="h-12 flex-1 text-sm text-zinc-100" />
      </View>
      <FlashList
        horizontal
        data={['All', 'Favorites', ...LANGUAGES]}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        className="mb-3"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setLanguage(item)}
            className={`mr-2 rounded-full px-4 py-2 ${language === item ? 'bg-brand-500' : 'border border-ink-700 bg-ink-850'}`}
          >
            <Text className={`text-xs font-semibold ${language === item ? 'text-white' : 'text-zinc-400'}`}>{item}</Text>
          </Pressable>
        )}
      />

      <FlashList<Voice>
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-3">
            <Pressable onPress={() => void toggleFavorite(item.id)} className="p-1">
              <Star size={17} color={favorites.includes(item.id) ? '#fbbf24' : '#52525b'} fill={favorites.includes(item.id) ? '#fbbf24' : 'transparent'} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-base font-semibold text-zinc-100">{item.name}</Text>
              <Text className="mt-0.5 text-xs text-zinc-500">{voiceLabel(item.id)} · {item.gender} · {item.id}</Text>
            </View>
            <Pressable
              onPress={() => void preview(item)}
              disabled={!studio || previewing !== null}
              className="h-10 w-10 items-center justify-center rounded-full bg-brand-500 disabled:opacity-40"
            >
              <Play size={16} color="#fff" fill="#fff" />
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
