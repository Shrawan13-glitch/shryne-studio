import { ActivityIndicator, Pressable, Text } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-brand-500',
  secondary: 'bg-ink-800 border border-ink-700',
  ghost: 'bg-transparent',
  danger: 'bg-red-500/15 border border-red-500/40',
};

const TEXT: Record<NonNullable<Props['variant']>, string> = {
  primary: 'text-white',
  secondary: 'text-zinc-100',
  ghost: 'text-brand-300',
  danger: 'text-red-300',
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, className = '' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-12 items-center justify-center rounded-2xl px-5 ${VARIANTS[variant]} ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={`text-[15px] font-semibold ${TEXT[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
