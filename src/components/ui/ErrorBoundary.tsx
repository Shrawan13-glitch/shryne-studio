import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';

interface State {
  error: Error | null;
}

/** Shows a readable diagnostic instead of exiting to the launcher when a render throws. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[shryne-studio] render error', error.message, info.componentStack ?? '');
  }

  render(): ReactNode {
    const error = this.state.error;
    if (!error) return this.props.children;
    return (
      <View className="flex-1 bg-ink-950 px-6 pt-20">
        <Text className="text-2xl font-black text-zinc-50">Something went wrong</Text>
        <Text className="mt-2 text-sm text-zinc-400">
          The app hit a runtime error. Details below — please share this when reporting.
        </Text>
        <ScrollView className="mt-6 rounded-2xl bg-ink-850 p-4">
          <Text className="font-mono text-xs leading-5 text-red-300">{error.message}</Text>
        </ScrollView>
        <Pressable
          onPress={() => {
            this.setState({ error: null });
            router.replace('/');
          }}
          className="mt-6 items-center rounded-2xl bg-brand-500 py-4"
        >
          <Text className="font-semibold text-white">Restart</Text>
        </Pressable>
      </View>
    );
  }
}
