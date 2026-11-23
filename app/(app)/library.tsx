import { useRef, useState } from 'react';
import { Alert, Pressable, Share, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Audio } from 'expo-av';
import { Download, Heart, Search, Share2, Trash2, Volume2 } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAssets, useDeleteAsset, useUpdateAsset } from '@/hooks/useAssets';
import { exportMergedWav, exportZip, deleteUri } from '@/lib/storage/files';
import { formatBytes, formatDuration } from '@/lib/utils/format';
import type { AudioAsset } from '@/types';

export default function LibraryScreen() {
  const { data: assets = [] } = useAssets({ limit: 2000 });
  const [query, setQuery] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [busy, setBusy] = useState(false);
  const update = useUpdateAsset();
  const remove = useDeleteAsset();

  const filtered = assets.filter((asset) =>
    `${asset.text} ${asset.filename} ${asset.voice}`.toLowerCase().includes(query.toLowerCase()),
  );

  const play = async (asset: AudioAsset) => {
    try {
      if (playing === asset.id && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlaying(null);
        return;
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: asset.uri });
      soundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void sound.unloadAsync();
          if (soundRef.current === sound) {
            soundRef.current = null;
            setPlaying(null);
          }
        }
      });
      setPlaying(asset.id);
    } catch {
      Alert.alert('Playback failed', 'This file may have been removed from disk.');
    }
  };

  const share = async (asset: AudioAsset) => {
    await Share.share({ url: asset.uri, title: asset.filename });
  };

  const exportAll = async (kind: 'zip' | 'wav') => {
    if (!filtered.length) return;
    setBusy(true);
    try {
      const uri = kind === 'zip'
        ? await exportZip(filtered, `shryne-export-${Date.now()}`)
        : await exportMergedWav(filtered, [], 'shryne-mix');
      await Share.share({ url: uri, title: kind === 'zip' ? 'Shryne audio pack' : 'Shryne merged audio' });
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const deleteAsset = (asset: AudioAsset) => {
    Alert.alert('Delete audio?', asset.filename, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void deleteUri(asset.uri); void remove.mutateAsync(asset.id); } },
    ]);
  };

  return (
    <Screen>
      <Text className="mb-1 mt-6 text-3xl font-black tracking-tight text-zinc-50">Library</Text>
      <Text className="mb-5 text-sm text-zinc-400">{assets.length} files · {formatBytes(assets.reduce((sum, a) => sum + a.size, 0))} on device</Text>

      <View className="mb-3 flex-row gap-2">
        <Button label="Export ZIP" variant="secondary" onPress={() => void exportAll('zip')} disabled={busy} className="flex-1" />
        <Button label="Merge WAV" variant="secondary" onPress={() => void exportAll('wav')} disabled={busy} className="flex-1" />
      </View>

      <View className="mb-4 flex-row items-center gap-2 rounded-2xl border border-ink-700 bg-ink-850 px-4">
        <Search size={17} color="#71717a" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search audio" placeholderTextColor="#71717a" className="h-12 flex-1 text-sm text-zinc-100" />
      </View>

      {filtered.length === 0 ? (
        <Card><Text className="py-8 text-center text-sm text-zinc-500">Generated audio will appear here.</Text></Card>
      ) : (
        <FlashList<AudioAsset>
          data={filtered}
          estimatedItemSize={92}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View className="mb-2 rounded-2xl border border-ink-700 bg-ink-850 p-3">
              <Pressable onPress={() => void play(item)} className="flex-row items-center gap-3">
                <View className={`h-11 w-11 items-center justify-center rounded-full ${playing === item.id ? 'bg-mint-500' : 'bg-ink-800'}`}>
                  <Volume2 size={18} color={playing === item.id ? '#08080d' : '#a78bfa'} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-zinc-100" numberOfLines={1}>{item.filename}</Text>
                  <Text className="mt-0.5 text-xs text-zinc-500" numberOfLines={1}>{item.text}</Text>
                  <Text className="mt-1 text-[10px] text-zinc-600">{item.voice} · {formatDuration(item.durationSeconds)} · {formatBytes(item.size)}</Text>
                </View>
              </Pressable>
              <View className="mt-2 flex-row justify-end gap-1">
                <Pressable onPress={() => void update.mutateAsync({ ...item, favorite: !item.favorite })} className="p-2">
                  <Heart size={16} color={item.favorite ? '#f87171' : '#71717a'} fill={item.favorite ? '#f87171' : 'transparent'} />
                </Pressable>
                <Pressable onPress={() => void share(item)} className="p-2"><Share2 size={16} color="#a1a1aa" /></Pressable>
                <Pressable onPress={() => void exportZip([item], item.filename.replace(/\.wav$/i, ''))} className="p-2"><Download size={16} color="#a1a1aa" /></Pressable>
                <Pressable onPress={() => deleteAsset(item)} className="p-2"><Trash2 size={16} color="#f87171" /></Pressable>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
