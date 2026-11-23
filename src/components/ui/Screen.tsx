import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, className = '', style }: Props) {
  const insets = useSafeAreaInsets();
  const wrapper = `flex-1 bg-ink-950 px-5 ${className}`;
  if (!scroll) {
    return (
      <View style={[{ paddingTop: insets.top, paddingBottom: insets.bottom }, style]} className={wrapper}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      style={[{ paddingTop: insets.top, paddingBottom: insets.bottom }, style]}
      className={wrapper}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
