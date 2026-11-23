import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</Text>
      {children}
      {hint ? <Text className="mt-2 text-xs leading-4 text-zinc-500">{hint}</Text> : null}
    </View>
  );
}
