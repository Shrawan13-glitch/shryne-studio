import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Check, Search, X } from 'lucide-react-native';
import { LANGUAGES, VOICES, voiceLabel } from '@/lib/tts/voices';
import type { Voice } from '@/types';

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (voiceId: string) => void;
  onClose: () => void;
}

export function VoicePicker({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<string>('All');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return VOICES.filter((voice) => {
      const languageMatch = language === 'All' || voice.language === language;
      const textMatch = !needle || `${voice.id} ${voice.name} ${voice.region} ${voice.language}`.toLowerCase().includes(needle);
      return languageMatch && textMatch;
    });
  }, [query, language]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-ink-950 px-5 pt-6">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-zinc-50">Choose a voice</Text>
          <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-ink-800">
            <X size={18} color="#a1a1aa" />
          </Pressable>
        </View>

        <View className="mb-3 flex-row items-center gap-2 rounded-2xl border border-ink-700 bg-ink-850 px-4">
          <Search size={18} color="#71717a" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search 52 voices…"
            placeholderTextColor="#71717a"
            className="h-12 flex-1 text-base text-zinc-100"
            autoCorrect={false}
          />
        </View>

        <FlashList
          horizontal
          data={['All', ...LANGUAGES]}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setLanguage(item)}
              className={`mr-2 rounded-full px-4 py-2 ${language === item ? 'bg-brand-500' : 'bg-ink-850 border border-ink-700'}`}
            >
              <Text className={`text-xs font-semibold ${language === item ? 'text-white' : 'text-zinc-400'}`}>{item}</Text>
            </Pressable>
          )}
          keyExtractor={(item) => item}
          className="mb-3"
          showsHorizontalScrollIndicator={false}
        />

        <FlashList<Voice>
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { onSelect(item.id); onClose(); }}
              className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3 ${selected === item.id ? 'border-brand-500 bg-brand-500/10' : 'border-ink-700 bg-ink-850'}`}
            >
              <View>
                <Text className="text-base font-semibold text-zinc-100">{item.name}</Text>
                <Text className="mt-0.5 text-xs text-zinc-500">{voiceLabel(item.id)} · {item.gender}</Text>
              </View>
              {selected === item.id ? <Check size={18} color="#a78bfa" /> : <Text className="font-mono text-[10px] text-zinc-600">{item.id}</Text>}
            </Pressable>
          )}
          ListEmptyComponent={<Text className="py-10 text-center text-sm text-zinc-500">No voices match that search.</Text>}
        />
      </View>
    </Modal>
  );
}
