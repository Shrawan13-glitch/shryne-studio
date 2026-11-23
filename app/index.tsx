import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { useStudioConfig } from '@/hooks/useStudio';
import { useAppStore } from '@/stores/useAppStore';

export default function Index() {
  const { data: studio, isLoading } = useStudioConfig();
  const setStudio = useAppStore((state) => state.setStudio);

  useEffect(() => {
    if (isLoading) return;
    setStudio(studio ?? null);
    router.replace(studio ? '/(app)/home' : '/(auth)/connect');
  }, [isLoading, studio, setStudio]);

  return (
    <View className="flex-1 items-center justify-center bg-ink-950">
      <ActivityIndicator color="#a78bfa" />
    </View>
  );
}
