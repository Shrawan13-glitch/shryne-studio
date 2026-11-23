import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { ExternalLink, ShieldCheck, Sparkles, Volume2 } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { useConnectStudio } from '@/hooks/useStudio';
import { useAppStore } from '@/stores/useAppStore';

export default function ConnectScreen() {
  const [token, setToken] = useState('');
  const [stage, setStage] = useState('');
  const connect = useConnectStudio();
  const setStudio = useAppStore((state) => state.setStudio);

  const submit = async () => {
    if (!token.trim()) return;
    try {
      const config = await connect.mutateAsync({ token: token.trim(), onProgress: setStage });
      setStudio(config);
      router.replace('/(app)/home');
    } catch {
      setStage('');
    }
  };

  return (
    <Screen>
      <View className="mb-8 mt-6 items-center">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-[28px] bg-brand-500">
          <Volume2 size={38} color="#fff" />
        </View>
        <Text className="text-3xl font-black tracking-tight text-zinc-50">Shryne Studio</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-zinc-400">
          Write a script. Cast voices. Generate studio-quality speech with GitHub Actions.
        </Text>
      </View>

      <Card className="mb-5">
        <View className="mb-3 flex-row items-center gap-2">
          <Sparkles size={16} color="#a78bfa" />
          <Text className="text-sm font-bold text-zinc-100">What the app sets up for you</Text>
        </View>
        <Text className="text-sm leading-6 text-zinc-400">
          • A dedicated public repo in your account{'\n'}• The ShryneTTS workflow, pinned to @v1{'\n'}• Automatic cleanup of public audio after download
        </Text>
      </Card>

      <Field
        label="GitHub personal access token"
        hint="Fine-grained: this repo only, Contents read/write + Actions read/write. Classic: repo + workflow scopes."
      >
        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="github_pat_… or ghp_…"
          placeholderTextColor="#71717a"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          className="h-[52px] rounded-2xl border border-ink-700 bg-ink-850 px-4 font-mono text-sm text-zinc-100"
        />
      </Field>

      <Pressable
        onPress={() => void Linking.openURL('https://github.com/settings/personal-access-tokens/new')}
        className="mb-6 flex-row items-center gap-2 self-start"
      >
        <ExternalLink size={14} color="#a78bfa" />
        <Text className="text-sm text-brand-300">Create a fine-grained token</Text>
      </Pressable>

      {connect.isError ? (
        <Text className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          Could not connect. Check that the token is valid and has the scopes above.
        </Text>
      ) : null}
      {stage ? <Text className="mb-4 text-sm text-brand-300">{stage}…</Text> : null}

      <Button label={connect.isPending ? 'Connecting…' : 'Connect GitHub'} onPress={submit} disabled={!token.trim()} loading={connect.isPending} />

      <View className="mt-6 flex-row items-start gap-2">
        <ShieldCheck size={16} color="#34d399" />
        <Text className="flex-1 text-xs leading-5 text-zinc-500">
          Your token is stored in the device keychain, never in our servers, and is never passed into the workflow.
        </Text>
      </View>
    </Screen>
  );
}
