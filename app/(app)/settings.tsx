import { useEffect, useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Github, Shield } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/stores/useAppStore';
import { useDisconnectStudio } from '@/hooks/useStudio';
import { getPref, setPref, totalAssetBytes } from '@/lib/storage/db';
import { formatBytes } from '@/lib/utils/format';

export default function SettingsScreen() {
  const studio = useAppStore((state) => state.studio);
  const setStudio = useAppStore((state) => state.setStudio);
  const disconnect = useDisconnectStudio();
  const [notifications, setNotifications] = useState(true);
  const [bytes, setBytes] = useState(0);

  useEffect(() => {
    void getPref('notifications').then((value) => setNotifications(value !== 'off'));
    void totalAssetBytes().then(setBytes);
  }, []);

  return (
    <Screen>
      <Text className="mb-6 mt-6 text-3xl font-black tracking-tight text-zinc-50">Settings</Text>

      <Card className="mb-4">
        <View className="mb-3 flex-row items-center gap-2">
          <Github size={18} color="#a78bfa" />
          <Text className="text-base font-bold text-zinc-100">GitHub connection</Text>
        </View>
        <Text className="text-sm text-zinc-400">Account</Text>
        <Text className="mb-3 font-mono text-sm text-zinc-200">{studio?.login ?? 'Not connected'}</Text>
        <Text className="text-sm text-zinc-400">Audio repo (public)</Text>
        <Text className="mb-3 font-mono text-sm text-zinc-200">{studio?.repo ?? '—'}</Text>
        <Text className="text-sm text-zinc-400">Token type</Text>
        <Text className="font-mono text-sm text-zinc-200">{studio?.tokenKind ?? '—'}</Text>
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 text-sm font-bold text-zinc-100">Preferences</Text>
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-sm text-zinc-300">Completion notifications</Text>
          <Button
            label={notifications ? 'On' : 'Off'}
            variant="secondary"
            onPress={() => {
              const next = !notifications;
              setNotifications(next);
              void setPref('notifications', next ? 'on' : 'off');
            }}
            className="h-9 px-4"
          />
        </View>
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-sm text-zinc-300">Audio stored locally</Text>
          <Text className="text-sm text-zinc-400">{formatBytes(bytes)}</Text>
        </View>
      </Card>

      <Card className="mb-4">
        <View className="mb-2 flex-row items-center gap-2">
          <Shield size={16} color="#34d399" />
          <Text className="text-sm font-bold text-zinc-100">Privacy</Text>
        </View>
        <Text className="text-xs leading-5 text-zinc-500">
          Scripts and generated audio live in a public repo until auto-cleanup removes them after download. Your PAT stays in the device keychain and is never used inside the workflow.
        </Text>
        <PressableLink label="Revoke token on GitHub" url="https://github.com/settings/tokens" />
      </Card>

      <Button
        label="Disconnect & clear stored credentials"
        variant="danger"
        onPress={() => {
          Alert.alert('Disconnect?', 'Your token and local connection settings will be removed.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Disconnect', style: 'destructive', onPress: () => { void disconnect.mutateAsync().then(() => { setStudio(null); router.replace('/(auth)/connect'); }); } },
          ]);
        }}
      />
      <View className="h-8" />
    </Screen>
  );
}

function PressableLink({ label, url }: { label: string; url: string }) {
  return (
    <Button label={label} variant="ghost" onPress={() => void Linking.openURL(url)} className="mt-3" />
  );
}
