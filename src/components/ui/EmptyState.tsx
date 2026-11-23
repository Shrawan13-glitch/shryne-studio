import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function EmptyState({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <View className="items-center justify-center px-6 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-ink-850">{icon}</View>
      <Text className="text-lg font-bold text-zinc-100">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-zinc-400">{message}</Text>
      {action ? <View className="mt-5 w-full">{action}</View> : null}
    </View>
  );
}
