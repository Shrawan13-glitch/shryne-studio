import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-3xl border border-ink-700 bg-ink-850 p-4 ${className}`}>{children}</View>;
}
